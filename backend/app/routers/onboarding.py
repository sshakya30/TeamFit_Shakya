"""
Onboarding router
Handles organization setup, team creation, and member invitations for new users
"""

from typing import List, Dict
from fastapi import APIRouter, HTTPException, Header
from pydantic import EmailStr
import re

from app.models.schemas import (
    OnboardingStatusResponse,
    CreateOrganizationRequest,
    CreateOrganizationResponse,
    CreateTeamRequest,
    CreateTeamResponse,
    CreateTeamProfileRequest,
    TeamProfileResponse,
    InviteMemberRequest,
    InviteMemberResponse,
    PendingInvitationResponse,
    UpdateOnboardingStepRequest,
    CompleteOnboardingResponse,
)
from app.utils.supabase_client import get_supabase_service_client, get_supabase_user_client


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug[:50]


def generate_invite_message(team_name: str, inviter_name: str, role: str, frontend_url: str) -> str:
    """Generate copyable invite message for manual sharing"""
    return f"""Hi! You've been invited to join "{team_name}" as a {role} on TEAMFIT.

To accept this invitation:
1. Go to {frontend_url}/sign-up
2. Sign up using this email address
3. You'll be automatically added to the team

Looking forward to having you on the team!
- {inviter_name}"""


router = APIRouter()


@router.get("/status", response_model=OnboardingStatusResponse)
async def get_onboarding_status(authorization: str = Header(...)):
    """
    Get current user's onboarding status
    Returns current step, organization/team IDs, and completion status
    """
    import jwt

    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Get user from JWT by parsing the Clerk JWT directly
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
        if not clerk_user_id:
            raise HTTPException(401, "Invalid token: missing sub claim")
    except Exception as e:
        raise HTTPException(401, f"Invalid or expired token: {str(e)}")

    # Get user from users table
    user_result = service_supabase.table("users").select("*").eq("clerk_user_id", clerk_user_id).single().execute()

    if not user_result.data:
        raise HTTPException(404, "User not found in database")

    user = user_result.data

    # Check for team membership
    membership_result = service_supabase.table("team_members").select("*, teams(name), organizations(name)").eq("user_id", user["id"]).execute()

    membership = membership_result.data[0] if membership_result.data else None

    return OnboardingStatusResponse(
        current_step=user.get("onboarding_step", "welcome"),
        organization_id=membership["organization_id"] if membership else None,
        team_id=membership["team_id"] if membership else None,
        is_complete=user.get("onboarding_completed", False),
        user_role=membership["role"] if membership else None
    )


@router.post("/organization", response_model=CreateOrganizationResponse)
async def create_organization(
    request: CreateOrganizationRequest,
    authorization: str = Header(...)
):
    """
    Create a new organization during onboarding (first-time admin only)
    - Validates user has no existing team memberships
    - Creates organization with generated slug
    - Updates user's onboarding step
    """
    import jwt

    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Get user from JWT by parsing the Clerk JWT directly
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
        if not clerk_user_id:
            raise HTTPException(401, "Invalid token: missing sub claim")
    except Exception as e:
        raise HTTPException(401, f"Invalid or expired token: {str(e)}")

    # Get user from users table
    user_result = service_supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()

    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Check user has no existing memberships (first-time admin check)
    existing_membership = service_supabase.table("team_members").select("id").eq("user_id", user_id).execute()

    if existing_membership.data:
        raise HTTPException(400, "User already belongs to an organization. Cannot create new organization.")

    # Generate unique slug
    base_slug = generate_slug(request.name)
    slug = base_slug
    counter = 1

    while True:
        existing_slug = service_supabase.table("organizations").select("id").eq("slug", slug).execute()
        if not existing_slug.data:
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create organization
    org_data = {
        "name": request.name,
        "slug": slug,
        "subscription_plan": "free",
        "subscription_status": "active"
    }

    org_result = service_supabase.table("organizations").insert(org_data).execute()

    if not org_result.data:
        raise HTTPException(500, "Failed to create organization")

    organization = org_result.data[0]

    # Update user's onboarding step
    service_supabase.table("users").update({
        "onboarding_step": "create_team"
    }).eq("id", user_id).execute()

    print(f"✅ Organization created: {organization['name']} (slug: {organization['slug']})")

    return CreateOrganizationResponse(
        success=True,
        organization=organization
    )


@router.post("/team", response_model=CreateTeamResponse)
async def create_team(
    request: CreateTeamRequest,
    authorization: str = Header(...)
):
    """
    Create a new team in an organization
    - Creates team record
    - Adds current user as admin of the team
    - Updates onboarding step
    """
    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Get user from JWT (parse sub claim)
    import jwt
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")

    # Get user from users table
    user_result = service_supabase.table("users").select("id, full_name, email").eq("clerk_user_id", clerk_user_id).single().execute()

    if not user_result.data:
        raise HTTPException(404, "User not found")

    user = user_result.data
    user_id = user["id"]

    # Verify organization exists
    org_result = service_supabase.table("organizations").select("id").eq("id", request.organization_id).single().execute()

    if not org_result.data:
        raise HTTPException(404, "Organization not found")

    # Create team
    team_data = {
        "organization_id": request.organization_id,
        "name": request.name,
        "description": request.description
    }

    team_result = service_supabase.table("teams").insert(team_data).execute()

    if not team_result.data:
        raise HTTPException(500, "Failed to create team")

    team = team_result.data[0]

    # Check if user already has a team_member record for this org
    existing_membership = service_supabase.table("team_members").select("id").eq("user_id", user_id).eq("organization_id", request.organization_id).execute()

    if not existing_membership.data:
        # Add user as admin of this team
        member_data = {
            "user_id": user_id,
            "team_id": team["id"],
            "organization_id": request.organization_id,
            "role": "admin"
        }

        member_result = service_supabase.table("team_members").insert(member_data).execute()

        if not member_result.data:
            raise HTTPException(500, "Failed to add user as team admin")

    # Update user's onboarding step
    service_supabase.table("users").update({
        "onboarding_step": "delegate_manager"
    }).eq("id", user_id).execute()

    print(f"✅ Team created: {team['name']} (id: {team['id']})")

    return CreateTeamResponse(
        success=True,
        team=team
    )


@router.post("/team-profile", response_model=TeamProfileResponse)
async def create_team_profile(
    request: CreateTeamProfileRequest,
    authorization: str = Header(...)
):
    """
    Create or update team profile during onboarding
    """
    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Get user from JWT
    import jwt
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
    except Exception:
        raise HTTPException(401, "Invalid token")

    # Get user
    user_result = service_supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()

    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Convert team_size string to integer (use lower bound of range)
    # e.g., "6-10" -> 6, "50+" -> 50
    team_size_int = None
    if request.team_size:
        try:
            # Handle formats like "2-5", "6-10", "50+"
            size_str = request.team_size.replace("+", "").split("-")[0]
            team_size_int = int(size_str)
        except (ValueError, IndexError):
            team_size_int = None

    # Create/update team profile
    profile_data = {
        "team_id": request.team_id,
        "organization_id": request.organization_id,
        "team_role_description": request.team_role_description,
        "member_responsibilities": request.member_responsibilities,
        "past_activities_summary": request.past_activities_summary,
        "industry_sector": request.industry_sector,
        "team_size": team_size_int,
        "last_updated_by": user_id
    }

    # Upsert (insert or update if exists)
    result = service_supabase.table("team_profiles").upsert(
        profile_data,
        on_conflict="team_id"
    ).execute()

    if not result.data:
        raise HTTPException(500, "Failed to save team profile")

    # Update onboarding step
    service_supabase.table("users").update({
        "onboarding_step": "invite_members"
    }).eq("id", user_id).execute()

    print(f"✅ Team profile saved for team {request.team_id}")

    return TeamProfileResponse(
        success=True,
        profile=result.data[0]
    )


@router.post("/invite", response_model=InviteMemberResponse)
async def invite_member(
    request: InviteMemberRequest,
    authorization: str = Header(...)
):
    """
    Create a pending invitation for a new team member
    - Validates email format
    - Checks for duplicate pending invitations
    - Creates pending_invitations record
    - Returns copyable invite message
    """
    import os
    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Get user from JWT
    import jwt
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
    except Exception:
        raise HTTPException(401, "Invalid token")

    # Get inviter user
    user_result = service_supabase.table("users").select("id, full_name, email").eq("clerk_user_id", clerk_user_id).single().execute()

    if not user_result.data:
        raise HTTPException(404, "User not found")

    inviter = user_result.data

    # Check if email already has a pending invitation for this team
    existing_invite = service_supabase.table("pending_invitations").select("id").eq("email", request.email.lower()).eq("team_id", request.team_id).eq("status", "pending").execute()

    if existing_invite.data:
        raise HTTPException(400, f"Pending invitation already exists for {request.email} in this team")

    # Check if user already exists with this email
    existing_user = service_supabase.table("users").select("id").eq("email", request.email.lower()).execute()

    if existing_user.data:
        # Check if they're already in this team
        existing_member = service_supabase.table("team_members").select("id").eq("user_id", existing_user.data[0]["id"]).eq("team_id", request.team_id).execute()

        if existing_member.data:
            raise HTTPException(400, f"User with email {request.email} is already a member of this team")

    # Get team name for invite message
    team_result = service_supabase.table("teams").select("name").eq("id", request.team_id).single().execute()
    team_name = team_result.data["name"] if team_result.data else "the team"

    # Create pending invitation
    invitation_data = {
        "email": request.email.lower(),
        "full_name": request.full_name,
        "team_id": request.team_id,
        "organization_id": request.organization_id,
        "role": request.role,
        "invited_by": inviter["id"]
    }

    result = service_supabase.table("pending_invitations").insert(invitation_data).execute()

    if not result.data:
        raise HTTPException(500, "Failed to create invitation")

    invitation = result.data[0]

    # Generate invite message
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    inviter_name = inviter.get("full_name") or inviter.get("email", "Your team admin")
    invite_message = generate_invite_message(team_name, inviter_name, request.role, frontend_url)

    print(f"✅ Invitation created for {request.email} as {request.role}")

    return InviteMemberResponse(
        success=True,
        invitation=invitation,
        invite_message=invite_message
    )


@router.get("/invitations/{team_id}", response_model=List[PendingInvitationResponse])
async def get_pending_invitations(
    team_id: str,
    authorization: str = Header(...)
):
    """
    Get all pending invitations for a team
    """
    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    result = service_supabase.table("pending_invitations").select("*").eq("team_id", team_id).eq("status", "pending").order("created_at", desc=True).execute()

    return result.data or []


@router.delete("/invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: str,
    authorization: str = Header(...)
):
    """
    Cancel a pending invitation
    """
    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Update status to cancelled
    result = service_supabase.table("pending_invitations").update({
        "status": "cancelled"
    }).eq("id", invitation_id).execute()

    if not result.data:
        raise HTTPException(404, "Invitation not found")

    print(f"✅ Invitation {invitation_id} cancelled")

    return {"success": True, "message": "Invitation cancelled"}


@router.patch("/step")
async def update_onboarding_step(
    request: UpdateOnboardingStepRequest,
    authorization: str = Header(...)
):
    """
    Update user's current onboarding step
    """
    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Get user from JWT
    import jwt
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
    except Exception:
        raise HTTPException(401, "Invalid token")

    result = service_supabase.table("users").update({
        "onboarding_step": request.step
    }).eq("clerk_user_id", clerk_user_id).execute()

    if not result.data:
        raise HTTPException(404, "User not found")

    return {"success": True, "step": request.step}


@router.patch("/complete", response_model=CompleteOnboardingResponse)
async def complete_onboarding(authorization: str = Header(...)):
    """
    Mark onboarding as complete
    """
    clerk_jwt = authorization.replace("Bearer ", "")
    service_supabase = get_supabase_service_client()

    # Get user from JWT
    import jwt
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
    except Exception:
        raise HTTPException(401, "Invalid token")

    result = service_supabase.table("users").update({
        "onboarding_completed": True,
        "onboarding_step": "complete"
    }).eq("clerk_user_id", clerk_user_id).execute()

    if not result.data:
        raise HTTPException(404, "User not found")

    print(f"✅ Onboarding completed for user {clerk_user_id}")

    return CompleteOnboardingResponse(
        success=True,
        message="Onboarding completed successfully"
    )
