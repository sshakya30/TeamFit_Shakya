"""
Activities router
Handles AI-powered activity customization and custom generation
"""

from typing import List, Dict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException
import uuid
from app.models.schemas import (
    CustomizeActivityRequest,
    GenerateCustomRequest,
    ActivityResponse,
    UpdateActivityStatusRequest,
    CreateTeamProfileRequest,
    TeamProfileResponse,
    CustomizedActivityResponse
)
from app.utils.supabase_client import get_supabase_service_client
from app.services.ai_service import AIService
from app.services.quota_service import QuotaService
from app.services.trust_service import TrustService

router = APIRouter()


@router.post("/customize", response_model=CustomizedActivityResponse)
async def customize_public_activity(request: CustomizeActivityRequest) -> Dict:
    """
    Customize a public activity for a specific team (real-time)
    - Checks quota availability
    - Checks trust score / verification
    - Fetches source activity and team profile
    - Generates customized activity via AI
    - Saves to customized_activities table
    - Increments quota
    """
    print(f"🎨 Customizing activity {request.public_activity_id} for team {request.team_id}")

    supabase = get_supabase_service_client()

    # Check trust score and verification
    requires_verification, v_type = await TrustService.check_verification_required(request.organization_id)

    if requires_verification:
        raise HTTPException(
            403,
            f"Organization requires {v_type} verification before using AI features. Please verify your account."
        )

    # Check quota
    has_quota, quota_info = await QuotaService.check_quota_available(
        request.organization_id,
        'public'
    )

    if not has_quota:
        raise HTTPException(
            429,
            f"Monthly customization limit reached ({quota_info['public_customizations_limit']}). Upgrade for more."
        )

    # Fetch source activity
    print(f"📚 Fetching public activity")
    activity_response = supabase.table('public_activities')\
        .select('*')\
        .eq('id', request.public_activity_id)\
        .single()\
        .execute()

    if not activity_response.data:
        raise HTTPException(404, "Public activity not found")

    source_activity = activity_response.data

    # Fetch team profile
    print(f"👥 Fetching team profile")
    team_response = supabase.table('team_profiles')\
        .select('*')\
        .eq('team_id', request.team_id)\
        .single()\
        .execute()

    if not team_response.data:
        raise HTTPException(
            404,
            "Team profile not found. Create a team profile first using POST /api/activities/team-profile"
        )

    team_profile = team_response.data

    # Check if paid tier (has active subscription)
    subscription_response = supabase.table('subscriptions')\
        .select('plan_type, status')\
        .eq('organization_id', request.organization_id)\
        .eq('status', 'active')\
        .execute()

    is_paid_tier = bool(subscription_response.data) and subscription_response.data[0].get('plan_type') != 'free'

    # Generate customization
    print(f"🤖 Generating AI customization (paid={is_paid_tier})")
    ai_service = AIService()

    try:
        ai_result = await ai_service.customize_public_activity(
            source_activity=source_activity,
            team_profile=team_profile,
            duration=request.duration_minutes,
            is_paid_tier=is_paid_tier
        )
    except Exception as e:
        print(f"❌ AI generation failed: {str(e)}")
        raise HTTPException(500, f"AI customization failed: {str(e)}")

    # Save to customized_activities table
    activity_data = {
        "team_id": request.team_id,
        "organization_id": request.organization_id,
        "created_by": "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
        "customization_type": "public_customized",
        "source_public_activity_id": request.public_activity_id,
        "status": "suggested",
        "title": ai_result['title'],
        "description": ai_result['description'],
        "category": ai_result['category'],
        "duration_minutes": ai_result['duration_minutes'],
        "complexity": ai_result['complexity'],
        "required_tools": ai_result['required_tools'],
        "instructions": ai_result['instructions'],
        "customization_notes": ai_result.get('customization_notes', ''),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    }

    print(f"💾 Saving customized activity")
    response = supabase.table('customized_activities').insert(activity_data).execute()

    if not response.data:
        raise HTTPException(500, "Failed to save activity")

    # Increment quota
    await QuotaService.increment_quota(request.organization_id, 'public')

    # Get updated quotas
    updated_quotas = await QuotaService.get_quota_status(request.organization_id)

    print(f"✅ Activity customized successfully: {response.data[0]['id']}")

    return {
        "success": True,
        "activity_id": response.data[0]['id'],
        "activity": response.data[0],
        "quotas_remaining": {
            "public_used": updated_quotas['public_customizations_used'],
            "public_limit": updated_quotas['public_customizations_limit'],
            "custom_used": updated_quotas['custom_generations_used'],
            "custom_limit": updated_quotas['custom_generations_limit']
        }
    }


@router.post("/generate-custom")
async def generate_custom_activities(
    request: GenerateCustomRequest
) -> Dict:
    """
    Generate 3 custom activities based on team materials (async job - paid only)
    - Checks subscription (paid only)
    - Checks quota availability
    - Checks trust score
    - Creates job record
    - Launches background task
    - Returns job_id for status polling
    """
    print(f"🎯 Starting custom activity generation for team {request.team_id}")

    supabase = get_supabase_service_client()

    # Check subscription (paid only)
    sub_response = supabase.table('subscriptions')\
        .select('plan_type, status')\
        .eq('organization_id', request.organization_id)\
        .single()\
        .execute()

    if not sub_response.data or sub_response.data.get('plan_type') == 'free' or sub_response.data.get('status') != 'active':
        raise HTTPException(403, "Custom activity generation requires paid subscription")

    # Check trust score
    requires_verification, v_type = await TrustService.check_verification_required(request.organization_id)

    if requires_verification:
        raise HTTPException(
            403,
            f"Organization requires {v_type} verification before using custom generation. Please verify your account."
        )

    # Check quota
    has_quota, quota_info = await QuotaService.check_quota_available(
        request.organization_id,
        'custom'
    )

    if not has_quota:
        raise HTTPException(
            429,
            f"Monthly custom generation limit reached ({quota_info['custom_generations_limit']}). Contact support."
        )

    # Fetch team materials
    print(f"📂 Fetching team materials")
    materials_response = supabase.table('uploaded_materials')\
        .select('*')\
        .eq('team_id', request.team_id)\
        .execute()

    if not materials_response.data or len(materials_response.data) == 0:
        raise HTTPException(400, "No materials uploaded for this team. Upload materials first.")

    # Combine extracted text from all materials
    materials_text = '\n\n---\n\n'.join([
        f"File: {m['file_name']}\n{m['extracted_text'][:2000]}"
        for m in materials_response.data
    ])

    # Fetch team profile
    team_response = supabase.table('team_profiles')\
        .select('*')\
        .eq('team_id', request.team_id)\
        .single()\
        .execute()

    if not team_response.data:
        raise HTTPException(404, "Team profile required for custom generation. Create one first.")

    # Create job record
    job_data = {
        "team_id": request.team_id,
        "organization_id": request.organization_id,
        "job_type": "custom_generation",
        "status": "pending",
        "created_by": "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
        "input_context": {
            "team_profile": team_response.data,
            "requirements": request.requirements,
            "materials_count": len(materials_response.data)
        }
    }

    print(f"📝 Creating job record")
    job_response = supabase.table('customization_jobs').insert(job_data).execute()

    if not job_response.data:
        raise HTTPException(500, "Failed to create job")

    job_id = job_response.data[0]['id']

    # Queue async task with Celery
    print(f"🚀 Queuing Celery task for job {job_id}")
    from app.tasks.generation_tasks import generate_custom_activities_task
    generate_custom_activities_task.delay(
        job_id,
        request.team_id,
        request.organization_id
    )

    return {
        "success": True,
        "job_id": job_id,
        "status": "processing",
        "message": "Custom activities are being generated. Check status with /api/jobs/{job_id}"
    }


@router.post("/team-profile", response_model=TeamProfileResponse)
async def create_team_profile(request: CreateTeamProfileRequest) -> Dict:
    """
    Create or update team profile for AI customization
    """
    print(f"📝 Creating/updating team profile for team {request.team_id}")

    supabase = get_supabase_service_client()

    profile_data = {
        "team_id": request.team_id,
        "organization_id": request.organization_id,
        "team_role_description": request.team_role_description,
        "member_responsibilities": request.member_responsibilities,
        "past_activities_summary": request.past_activities_summary,
        "industry_sector": request.industry_sector,
        "team_size": request.team_size
    }

    # Upsert (insert or update if exists)
    response = supabase.table('team_profiles')\
        .upsert(profile_data, on_conflict='team_id')\
        .execute()

    if not response.data:
        raise HTTPException(500, "Failed to save team profile")

    print(f"✅ Team profile saved successfully")

    return {
        "success": True,
        "profile": response.data[0]
    }


@router.get("/team/{team_id}")
async def get_team_activities(team_id: str) -> List[Dict]:
    """
    Get all customized activities for a team
    """
    print(f"📋 Fetching customized activities for team {team_id}")

    supabase = get_supabase_service_client()

    response = supabase.table('customized_activities')\
        .select('*')\
        .eq('team_id', team_id)\
        .order('created_at', desc=True)\
        .execute()

    return response.data or []


@router.patch("/{activity_id}/status")
async def update_activity_status(
    activity_id: str,
    request: UpdateActivityStatusRequest
) -> Dict:
    """
    Update customized activity status (suggested/saved/scheduled/expired)
    """
    print(f"📝 Updating activity {activity_id} status to {request.status}")

    supabase = get_supabase_service_client()

    # Map frontend status to database enum
    status_map = {
        "ready": "saved",
        "archived": "expired",
        "in_use": "scheduled"
    }

    db_status = status_map.get(request.status, request.status)

    response = supabase.table('customized_activities')\
        .update({"status": db_status})\
        .eq('id', activity_id)\
        .execute()

    if not response.data:
        raise HTTPException(404, "Activity not found")

    print(f"✅ Activity status updated to {db_status}")

    return response.data[0]
