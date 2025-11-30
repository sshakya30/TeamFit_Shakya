"""
Materials router
Handles file uploads, storage, and team materials management
"""

import os
from typing import List, Dict
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.utils.supabase_client import get_supabase_service_client
from app.services.file_service import FileService
from app.services.ai_service import AIService
from app.config import get_settings

settings = get_settings()
router = APIRouter()
security = HTTPBearer()


def get_user_id_from_token(credentials: HTTPAuthorizationCredentials, supabase) -> str:
    """Extract user ID from Clerk JWT token by looking up clerk_user_id in users table."""
    import jwt

    token = credentials.credentials
    try:
        # Decode without verification to get the 'sub' claim (Clerk user ID)
        # The token has already been validated by Clerk on the frontend
        decoded = jwt.decode(token, options={"verify_signature": False})
        clerk_user_id = decoded.get('sub')

        if not clerk_user_id:
            raise HTTPException(401, "Invalid token: missing user ID")

        # Look up the user in our database
        user_response = supabase.table('users')\
            .select('id')\
            .eq('clerk_user_id', clerk_user_id)\
            .single()\
            .execute()

        if not user_response.data:
            raise HTTPException(401, "User not found")

        return user_response.data['id']
    except jwt.DecodeError:
        raise HTTPException(401, "Invalid token format")


@router.post("/upload")
async def upload_material(
    team_id: str = Form(...),
    organization_id: str = Form(...),
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict:
    """
    Upload a team material file (paid subscription only)
    - Validates subscription
    - Checks storage limits
    - Validates file type and size
    - Extracts text content
    - Uploads to Supabase Storage
    - Creates database record
    - Generates summary
    """
    print(f"📤 Uploading material for team {team_id}")

    supabase = get_supabase_service_client()

    # Get the actual user ID from the JWT token
    user_id = get_user_id_from_token(credentials, supabase)
    print(f"👤 Authenticated user: {user_id}")

    # 1. Validate subscription (paid only)
    sub_response = supabase.table('subscriptions')\
        .select('plan_type, status')\
        .eq('organization_id', organization_id)\
        .single()\
        .execute()

    if not sub_response.data or sub_response.data.get('plan_type') == 'free' or sub_response.data.get('status') != 'active':
        raise HTTPException(403, "File upload requires paid subscription")

    # 2. Validate file
    file_ext, file_size = FileService.validate_file(file)

    # 3. Check team storage limit (50MB per team)
    storage_response = supabase.table('uploaded_materials')\
        .select('file_size_bytes')\
        .eq('team_id', team_id)\
        .execute()

    total_size = sum([m['file_size_bytes'] for m in storage_response.data]) if storage_response.data else 0
    max_size = settings.max_team_storage_mb * 1024 * 1024

    if total_size + file_size > max_size:
        raise HTTPException(
            400,
            f"Team storage limit ({settings.max_team_storage_mb}MB) exceeded. Current: {total_size // (1024*1024)}MB, Uploading: {file_size // (1024*1024)}MB"
        )

    # 4. Save to temp location
    temp_path = await FileService.save_temp_file(file)

    try:
        # Extract text content
        print(f"📄 Extracting text from {file.filename}")
        text_content = await FileService.extract_text(temp_path, file_ext)

        if not text_content or len(text_content.strip()) < 50:
            raise HTTPException(400, "File appears to be empty or has insufficient content")

        # Generate summary
        print(f"🤖 Generating content summary")
        ai_service = AIService()
        content_summary = await ai_service.summarize_content(text_content, max_length=500)

        # Upload to Supabase Storage
        storage_path = f"{organization_id}/{team_id}/{file.filename}"

        print(f"☁️ Uploading to Supabase Storage: {storage_path}")
        with open(temp_path, 'rb') as f:
            file_bytes = f.read()

        storage_response = supabase.storage.from_(settings.storage_bucket_name).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )

        # Get public URL
        public_url = supabase.storage.from_(settings.storage_bucket_name).get_public_url(storage_path)

        # Generate the public URL for the file
        file_url = f"{settings.supabase_url}/storage/v1/object/public/team-materials/{storage_path}"
        
    
        
        # Create database record
        material_data = {
            "team_id": team_id,
            "organization_id": organization_id,
            "file_name": file.filename,
            "file_type": file_ext.lstrip('.'),
            "file_size_bytes": file_size or len(file_bytes),
            "storage_path": storage_path,
            "file_url": file_url,
            "content_summary": content_summary,
            "uploaded_by": user_id,
            "extracted_text": text_content[:10000]  # Store first 10k chars
        }

        response = supabase.table('uploaded_materials').insert(material_data).execute()

        if not response.data:
            raise HTTPException(500, "Failed to create material record")

        print(f"✅ Material uploaded successfully: {response.data[0]['id']}")

        return {
            "material_id": response.data[0]['id'],
            "file_name": file.filename,
            "content_summary": content_summary,
            "storage_url": public_url,
            "file_size_bytes": file_size or len(file_bytes)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        raise HTTPException(500, f"Upload failed: {str(e)}")
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.unlink(temp_path)


@router.get("/{team_id}")
async def get_team_materials(team_id: str) -> List[Dict]:
    """
    Get all materials for a team
    """
    print(f"📋 Fetching materials for team {team_id}")

    supabase = get_supabase_service_client()

    response = supabase.table('uploaded_materials')\
        .select('*')\
        .eq('team_id', team_id)\
        .order('created_at', desc=True)\
        .execute()

    return response.data or []


@router.delete("/{material_id}")
async def delete_material(material_id: str) -> Dict:
    """
    Delete a material file
    - Removes from Supabase Storage
    - Deletes database record
    """
    print(f"🗑️ Deleting material {material_id}")

    supabase = get_supabase_service_client()

    # Get material record
    response = supabase.table('uploaded_materials')\
        .select('*')\
        .eq('id', material_id)\
        .single()\
        .execute()

    if not response.data:
        raise HTTPException(404, "Material not found")

    material = response.data

    try:
        # Delete from storage
        print(f"☁️ Removing from storage: {material['storage_path']}")
        supabase.storage.from_(settings.storage_bucket_name).remove([material['storage_path']])

        # Delete database record
        supabase.table('uploaded_materials').delete().eq('id', material_id).execute()

        print(f"✅ Material deleted successfully")

        return {"message": "Material deleted successfully"}

    except Exception as e:
        print(f"❌ Deletion failed: {str(e)}")
        raise HTTPException(500, f"Deletion failed: {str(e)}")
