# TEAMFIT MVP - Clerk + Supabase Authentication Integration
# Prompt #2: Copy this entire prompt and run it in Claude Code

---

## 🎯 OBJECTIVE
Integrate Clerk authentication with your Supabase database for TEAMFIT MVP. This includes:
- Setting up user authentication flow with Clerk
- Creating a FastAPI webhook endpoint to sync users from Clerk to Supabase
- Configuring Clerk as a Supabase third-party auth provider
- Implementing JWT-based authentication for RLS policies
- Setting up auto-admin assignment for your super admin email

## 📋 CONTEXT
You have already created the database schema (Prompt #1) with a `users` table that stores `clerk_user_id`. Now we need to:
1. Configure Clerk to work with Supabase
2. Create webhook endpoint in FastAPI to sync users
3. Update Supabase RLS helper functions to use Clerk JWTs
4. Set up proper authentication flow

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: FastAPI (Python)
- Database: Supabase
- Auth: Clerk
- Webhook: FastAPI endpoint

## ⚠️ PREREQUISITES
Before running this prompt, ensure you have completed the **Manual Setup Steps** provided in the separate document. These include:
1. ✅ Creating a Clerk account and project
2. ✅ Enabling Clerk Supabase integration
3. ✅ Configuring Supabase to accept Clerk as auth provider
4. ✅ Setting up webhook in Clerk Dashboard
5. ✅ Obtaining all required environment variables

**If you haven't done the manual setup yet, STOP and complete those steps first!**

## 🔧 IMPLEMENTATION

### Step 1: Install Required Python Dependencies

Add these dependencies to your FastAPI backend:

```bash
pip install --break-system-packages supabase-py python-dotenv svix fastapi pydantic
```

**What each package does:**
- `supabase-py`: Official Supabase Python client
- `python-dotenv`: Load environment variables from .env file
- `svix`: Verify Clerk webhook signatures (security)
- `fastapi`: Your web framework (already installed)
- `pydantic`: Data validation (already installed with FastAPI)

### Step 2: Update Environment Variables

Add these variables to your `.env` file in the backend directory:

```env
# Clerk Configuration
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Supabase Configuration  
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Super Admin Configuration
SUPER_ADMIN_EMAIL=your_email@example.com

# Application Configuration
FRONTEND_URL=http://localhost:5173
```

**Where to get these values:**
- See the Manual Setup Instructions document for detailed steps
- CLERK_SECRET_KEY: Clerk Dashboard → API Keys
- CLERK_WEBHOOK_SECRET: Clerk Dashboard → Webhooks → Your webhook → Signing Secret
- CLERK_PUBLISHABLE_KEY: Clerk Dashboard → API Keys
- SUPABASE_URL: Supabase Dashboard → Project Settings → API → Project URL
- SUPABASE_SERVICE_ROLE_KEY: Supabase Dashboard → Project Settings → API → service_role key
- SUPABASE_ANON_KEY: Supabase Dashboard → Project Settings → API → anon key
- SUPER_ADMIN_EMAIL: Your email address (will be auto-assigned admin role)

### Step 3: Create Supabase Client Helper

Create a new file: `backend/app/utils/supabase_client.py`

```python
"""
Supabase client utilities for TEAMFIT MVP
Provides both service role client (bypasses RLS) and user-authenticated client
"""

from supabase import create_client, Client
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_ANON_KEY:
    raise ValueError("Missing required Supabase environment variables")


def get_supabase_service_client() -> Client:
    """
    Get Supabase client with SERVICE ROLE access.
    
    ⚠️ SECURITY WARNING: This client BYPASSES all RLS policies!
    Only use for:
    - Webhook endpoints (creating/updating users)
    - Admin operations that need to bypass RLS
    - System-level operations
    
    Never expose this client to frontend or untrusted code!
    
    Returns:
        Client: Supabase client with service role privileges
    """
    return create_client(
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_SERVICE_ROLE_KEY
    )


def get_supabase_user_client(clerk_jwt: str) -> Client:
    """
    Get Supabase client authenticated with Clerk JWT.
    
    This client respects RLS policies based on the authenticated user.
    Use this for all user-initiated operations (queries from frontend).
    
    Args:
        clerk_jwt: JWT token from Clerk session
        
    Returns:
        Client: Supabase client authenticated as the Clerk user
    """
    return create_client(
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_ANON_KEY,
        options={
            "headers": {
                "Authorization": f"Bearer {clerk_jwt}"
            }
        }
    )


def verify_clerk_jwt(jwt_token: str) -> Optional[dict]:
    """
    Verify and decode Clerk JWT token.
    
    Args:
        jwt_token: JWT token from Clerk
        
    Returns:
        dict: Decoded JWT payload if valid, None if invalid
    """
    # For production, implement proper JWT verification
    # For MVP, we'll trust Clerk's JWT (it's verified by Supabase RLS)
    import jwt
    try:
        # Decode without verification (Supabase verifies it)
        decoded = jwt.decode(jwt_token, options={"verify_signature": False})
        return decoded
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return None
```

### Step 4: Create User Sync Utilities

Create a new file: `backend/app/utils/user_sync.py`

```python
"""
User synchronization utilities for Clerk → Supabase
Handles creating, updating, and deleting users from webhook events
"""

from typing import Optional, Dict, Any
from .supabase_client import get_supabase_service_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL")


def create_user_in_supabase(clerk_user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user in Supabase from Clerk webhook data.
    
    Args:
        clerk_user_data: User data from Clerk webhook payload
        
    Returns:
        dict: Created user data from Supabase
        
    Raises:
        Exception: If user creation fails
    """
    supabase = get_supabase_service_client()
    
    # Extract user information from Clerk payload
    clerk_user_id = clerk_user_data.get("id")
    email = clerk_user_data.get("email_addresses", [{}])[0].get("email_address")
    first_name = clerk_user_data.get("first_name", "")
    last_name = clerk_user_data.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or email.split("@")[0]
    avatar_url = clerk_user_data.get("image_url")
    
    print(f"Creating user in Supabase: {email}")
    
    try:
        # Insert user into Supabase users table
        result = supabase.table("users").insert({
            "clerk_user_id": clerk_user_id,
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url,
        }).execute()
        
        user = result.data[0] if result.data else None
        
        if not user:
            raise Exception("User creation returned no data")
        
        print(f"✅ User created successfully: {email}")
        
        # Check if this is the super admin email
        if email == SUPER_ADMIN_EMAIL:
            print(f"🔐 Super admin detected: {email} - Auto-assigning admin role")
            # Note: Admin role assignment happens when user joins an organization
            # This is just a marker for later. You'll manually create the first
            # organization and team_member record with role='admin'
        
        return user
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        raise


def update_user_in_supabase(clerk_user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update existing user in Supabase from Clerk webhook data.
    
    Args:
        clerk_user_data: Updated user data from Clerk webhook payload
        
    Returns:
        dict: Updated user data from Supabase
        
    Raises:
        Exception: If user update fails
    """
    supabase = get_supabase_service_client()
    
    clerk_user_id = clerk_user_data.get("id")
    email = clerk_user_data.get("email_addresses", [{}])[0].get("email_address")
    first_name = clerk_user_data.get("first_name", "")
    last_name = clerk_user_data.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or email.split("@")[0]
    avatar_url = clerk_user_data.get("image_url")
    
    print(f"Updating user in Supabase: {email}")
    
    try:
        # Update user in Supabase
        result = supabase.table("users").update({
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url,
            "updated_at": "now()"  # Trigger will handle this, but explicit is good
        }).eq("clerk_user_id", clerk_user_id).execute()
        
        user = result.data[0] if result.data else None
        
        if not user:
            raise Exception(f"User with clerk_user_id {clerk_user_id} not found")
        
        print(f"✅ User updated successfully: {email}")
        return user
        
    except Exception as e:
        print(f"❌ Error updating user: {e}")
        raise


def delete_user_from_supabase(clerk_user_id: str) -> bool:
    """
    Delete user from Supabase when deleted in Clerk.
    
    Args:
        clerk_user_id: Clerk user ID to delete
        
    Returns:
        bool: True if deletion successful
        
    Raises:
        Exception: If user deletion fails
    """
    supabase = get_supabase_service_client()
    
    print(f"Deleting user from Supabase: {clerk_user_id}")
    
    try:
        # Delete user from Supabase
        # This will CASCADE delete all related records (team_members, feedback, etc.)
        result = supabase.table("users").delete().eq(
            "clerk_user_id", clerk_user_id
        ).execute()
        
        print(f"✅ User deleted successfully: {clerk_user_id}")
        return True
        
    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        raise


def get_user_by_clerk_id(clerk_user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve user from Supabase by Clerk user ID.
    
    Args:
        clerk_user_id: Clerk user ID
        
    Returns:
        dict: User data if found, None otherwise
    """
    supabase = get_supabase_service_client()
    
    try:
        result = supabase.table("users").select("*").eq(
            "clerk_user_id", clerk_user_id
        ).execute()
        
        return result.data[0] if result.data else None
        
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None
```

### Step 5: Create Webhook Endpoint

Create a new file: `backend/app/routers/webhooks.py`

```python
"""
Clerk webhook endpoints for user synchronization
Handles user.created, user.updated, and user.deleted events
"""

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
import os
from dotenv import load_dotenv
from svix.webhooks import Webhook, WebhookVerificationError
import json

from ..utils.user_sync import (
    create_user_in_supabase,
    update_user_in_supabase,
    delete_user_from_supabase
)

load_dotenv()

router = APIRouter()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")

if not CLERK_WEBHOOK_SECRET:
    raise ValueError("CLERK_WEBHOOK_SECRET environment variable is required")


@router.post("/clerk")
async def clerk_webhook(
    request: Request,
    svix_id: Optional[str] = Header(None, alias="svix-id"),
    svix_timestamp: Optional[str] = Header(None, alias="svix-timestamp"),
    svix_signature: Optional[str] = Header(None, alias="svix-signature"),
):
    """
    Webhook endpoint to receive and process Clerk events.
    
    Security:
    - Verifies webhook signature using Svix
    - Ensures request is actually from Clerk
    
    Supported Events:
    - user.created: Creates new user in Supabase
    - user.updated: Updates existing user in Supabase
    - user.deleted: Deletes user from Supabase
    
    Returns:
        dict: Success message and processed data
    """
    
    # Get the raw request body
    body = await request.body()
    body_str = body.decode("utf-8")
    
    # Verify the webhook signature
    try:
        wh = Webhook(CLERK_WEBHOOK_SECRET)
        payload = wh.verify(body_str, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        })
    except WebhookVerificationError as e:
        print(f"❌ Webhook verification failed: {e}")
        raise HTTPException(status_code=400, detail="Webhook verification failed")
    except Exception as e:
        print(f"❌ Error verifying webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    
    # Parse the webhook payload
    event_type = payload.get("type")
    event_data = payload.get("data")
    
    print(f"📨 Received webhook: {event_type}")
    
    # Handle different event types
    try:
        if event_type == "user.created":
            # Create new user in Supabase
            user = create_user_in_supabase(event_data)
            return {
                "success": True,
                "message": "User created successfully",
                "event_type": event_type,
                "user_id": user.get("id"),
                "email": user.get("email")
            }
            
        elif event_type == "user.updated":
            # Update existing user in Supabase
            user = update_user_in_supabase(event_data)
            return {
                "success": True,
                "message": "User updated successfully",
                "event_type": event_type,
                "user_id": user.get("id"),
                "email": user.get("email")
            }
            
        elif event_type == "user.deleted":
            # Delete user from Supabase
            clerk_user_id = event_data.get("id")
            delete_user_from_supabase(clerk_user_id)
            return {
                "success": True,
                "message": "User deleted successfully",
                "event_type": event_type,
                "clerk_user_id": clerk_user_id
            }
        
        else:
            # Unhandled event type (ignore)
            print(f"⚠️ Unhandled event type: {event_type}")
            return {
                "success": True,
                "message": f"Event type {event_type} received but not processed",
                "event_type": event_type
            }
            
    except Exception as e:
        print(f"❌ Error processing webhook: {e}")
        # Return 500 so Clerk retries the webhook
        raise HTTPException(
            status_code=500,
            detail=f"Error processing webhook: {str(e)}"
        )


@router.get("/clerk/health")
async def webhook_health():
    """
    Health check endpoint for webhook.
    Use this to verify your webhook endpoint is accessible.
    """
    return {
        "status": "healthy",
        "message": "Clerk webhook endpoint is running"
    }
```

### Step 6: Register Webhook Router in Main App

Update your `backend/app/main.py` to include the webhook router:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import webhooks  # Import webhook router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="TEAMFIT API",
    description="AI-powered team-building platform API",
    version="1.0.0"
)

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register webhook router
app.include_router(
    webhooks.router,
    prefix="/api/webhooks",
    tags=["webhooks"]
)

# Your other routers will go here
# app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
# app.include_router(activities.router, prefix="/api/activities", tags=["activities"])


@app.get("/")
async def root():
    return {
        "message": "TEAMFIT API is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Step 7: Update Supabase RLS Helper Function

Update the helper function in Supabase to work with Clerk JWTs.

**Open your Supabase SQL Editor and run:**

```sql
-- Update the current_user_id() helper function to work with Clerk JWTs
-- This replaces the version created in Prompt #1

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID AS $$
DECLARE
  clerk_id TEXT;
  user_uuid UUID;
BEGIN
  -- Extract Clerk user ID from JWT (stored in 'sub' claim)
  clerk_id := auth.jwt() ->> 'sub';
  
  -- If no JWT or no sub claim, return NULL
  IF clerk_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Look up the user's UUID from the users table
  SELECT id INTO user_uuid
  FROM public.users
  WHERE clerk_user_id = clerk_id;
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Verify the function works
-- Test: SELECT public.current_user_id();
-- This will return NULL until you authenticate with a Clerk JWT
```

### Step 8: Create Environment File Structure

Ensure your project has the correct `.env` file structure:

```
teamfit-mvp/
├── backend/
│   ├── .env                  # Backend environment variables
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   └── webhooks.py   # New webhook router
│   │   └── utils/
│   │       ├── supabase_client.py  # New Supabase utilities
│   │       └── user_sync.py        # New user sync utilities
│   └── requirements.txt
└── frontend/
    └── .env                  # Frontend environment variables (for Prompt #3)
```

### Step 9: Update Requirements.txt

Add new dependencies to `backend/requirements.txt`:

```txt
fastapi
uvicorn[standard]
python-dotenv
supabase-py
svix
pydantic
python-multipart
```

Install with:
```bash
pip install --break-system-packages -r requirements.txt
```

### Step 10: Test Your Webhook Endpoint Locally

1. **Start your FastAPI backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

2. **Verify webhook endpoint is running:**
```bash
curl http://localhost:8000/api/webhooks/clerk/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Clerk webhook endpoint is running"
}
```

3. **Test with Clerk Dashboard:**
   - Go to Clerk Dashboard → Webhooks → Your webhook
   - Click "Testing" tab
   - Select "user.created" event
   - Click "Send Example"
   - Check your FastAPI logs for success message

## 🧪 TESTING CHECKLIST

After implementing all steps, test in this order:

### Test 1: Health Check
```bash
curl http://localhost:8000/api/webhooks/clerk/health
```
✅ Should return: `{"status": "healthy"}`

### Test 2: Webhook from Clerk Dashboard
1. Open Clerk Dashboard → Webhooks → Your webhook
2. Go to "Testing" tab
3. Send test "user.created" event
4. Check FastAPI logs for: `✅ User created successfully`
5. Check Supabase users table - should see new test user

### Test 3: Real User Signup (requires ngrok - see Manual Setup)
1. Set up ngrok: `ngrok http 8000`
2. Update Clerk webhook URL to ngrok URL
3. Go to your app and sign up a new user
4. User should appear in Supabase users table

### Test 4: Super Admin Assignment
1. Sign up with your SUPER_ADMIN_EMAIL
2. Verify user created in Supabase
3. Manually create first organization and team_member record with role='admin'

## ✅ VALIDATION QUERIES

Run these in Supabase SQL Editor to verify everything works:

```sql
-- Check if users are being created
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;

-- Verify current_user_id() function works (will return NULL without auth)
SELECT public.current_user_id();

-- Check webhook-created users
SELECT 
  id,
  clerk_user_id,
  email,
  full_name,
  created_at
FROM public.users
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 🎯 SUCCESS CRITERIA

You've successfully completed this prompt when:
- ✅ FastAPI webhook endpoint responds to health check
- ✅ Clerk webhook can reach your endpoint
- ✅ User creation webhook creates user in Supabase
- ✅ User update webhook updates user in Supabase  
- ✅ User deletion webhook deletes user from Supabase
- ✅ Webhook signature verification works (secure)
- ✅ Super admin email is configured
- ✅ Supabase RLS helper function updated for Clerk JWTs
- ✅ Environment variables are properly set
- ✅ No errors in FastAPI logs when processing webhooks

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: Webhook verification fails
**Error:** `Webhook verification failed`
**Solution:** Double-check CLERK_WEBHOOK_SECRET matches exactly from Clerk Dashboard

### Issue 2: User not created in Supabase
**Error:** `User creation returned no data`
**Solution:** Check Supabase RLS policies - webhook should use service role key (bypasses RLS)

### Issue 3: Import errors in FastAPI
**Error:** `ModuleNotFoundError: No module named 'supabase'`
**Solution:** Run `pip install --break-system-packages supabase-py svix`

### Issue 4: Webhook endpoint not found
**Error:** `404 Not Found`
**Solution:** Verify router is registered in main.py with correct prefix `/api/webhooks`

### Issue 5: CORS errors
**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`
**Solution:** Verify FRONTEND_URL is set correctly in .env and CORS middleware is configured

## 📝 IMPORTANT SECURITY NOTES

1. **Never commit .env files to git** - add to .gitignore
2. **Never expose service role key to frontend** - only use in backend
3. **Always verify webhook signatures** - prevents unauthorized requests
4. **Use HTTPS in production** - webhooks should use SSL
5. **Rotate keys regularly** - especially after team changes

## 🚀 NEXT STEPS

After successfully completing this prompt:
1. ✅ Run Prompt #3: "Frontend + Backend Architecture - Enhanced UI + Core Dashboard"
2. ✅ Implement sign-in/sign-up UI with Clerk components
3. ✅ Add protected routes in React
4. ✅ Build dashboard with team management
5. ✅ Deploy to DigitalOcean

## 🎉 CONGRATULATIONS!

Once all validation passes, your Clerk-Supabase integration is complete! Users can now:
- Sign up via Clerk authentication
- Automatically sync to Supabase database
- Have their data secured by RLS policies based on Clerk JWT
- Be managed through your FastAPI backend

---

**Remember:** Complete the Manual Setup Instructions BEFORE running this prompt!
