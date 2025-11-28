"""
Management router for organization and team administration
Handles CRUD operations for teams, team profiles, and member management post-onboarding
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
import jwt

from app.utils.supabase_client import get_supabase_service_client


# ============================================================================
# Request/Response Models
# ============================================================================

class UpdateOrganizationRequest(BaseModel):
    """Request to update organization details"""
    name: str = Field(..., min_length=2, max_length=100)


class UpdateTeamRequest(BaseModel):
    """Request to update team details"""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class CreateTeamRequest(BaseModel):
    """Request to create a new team (post-onboarding)"""
    organization_id: str
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class UpdateTeamProfileRequest(BaseModel):
    """Request to update team profile"""
    team_role_description: Optional[str] = Field(None, max_length=500)
    member_responsibilities: Optional[str] = Field(None, max_length=500)
    past_activities_summary: Optional[str] = Field(None, max_length=1000)
    industry_sector: Optional[str] = None
    team_size: Optional[str] = None  # String like "2-5", "6-10", etc.


class PromoteMemberRequest(BaseModel):
    """Request to change a team member's role"""
    new_role: str = Field(..., pattern="^(member|manager)$")


class TeamWithProfile(BaseModel):
    """Team with its profile data"""
    id: str
    name: str
    description: Optional[str]
    organization_id: str
    created_at: str
    member_count: int
    profile: Optional[dict] = None


class TeamMemberInfo(BaseModel):
    """Team member with user info"""
    id: str
    user_id: str
    role: str
    joined_at: Optional[str]
    user: dict  # Contains full_name, email, avatar_url


router = APIRouter()


# ============================================================================
# User Profile/Settings Endpoint
# ============================================================================

@router.get("/me/profile")
async def get_my_profile(authorization: str = Header(...)):
    """
    Get the current user's complete profile including organization, team, and role.
    This endpoint bypasses RLS by using the service client.
    """
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("*").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user = user_result.data

    # Get team membership
    membership_result = supabase.table("team_members").select("*").eq("user_id", user["id"]).execute()

    if not membership_result.data:
        # User has no team membership
        return {
            "user": user,
            "teamMember": None,
            "team": None,
            "organization": None,
            "teamMembersCount": 0,
            "upcomingEventsCount": 0
        }

    team_member = membership_result.data[0]

    # Get team
    team_result = supabase.table("teams").select("*").eq("id", team_member["team_id"]).single().execute()
    team = team_result.data if team_result.data else None

    # Get organization
    org_result = supabase.table("organizations").select("*").eq("id", team_member["organization_id"]).single().execute()
    organization = org_result.data if org_result.data else None

    # Get team member count
    members_count_result = supabase.table("team_members").select("id", count="exact").eq("team_id", team_member["team_id"]).execute()
    team_members_count = members_count_result.count or 0

    # Get upcoming events count
    from datetime import datetime
    events_result = supabase.table("scheduled_events").select("id", count="exact").eq("team_id", team_member["team_id"]).eq("status", "scheduled").gte("scheduled_date", datetime.now().isoformat()).execute()
    upcoming_events_count = events_result.count or 0

    return {
        "user": user,
        "teamMember": team_member,
        "team": team,
        "organization": organization,
        "teamMembersCount": team_members_count,
        "upcomingEventsCount": upcoming_events_count
    }


def get_user_from_token(authorization: str):
    """Extract user info from Clerk JWT token"""
    clerk_jwt = authorization.replace("Bearer ", "")
    try:
        decoded = jwt.decode(clerk_jwt, options={"verify_signature": False})
        clerk_user_id = decoded.get("sub")
        if not clerk_user_id:
            raise HTTPException(401, "Invalid token: missing sub claim")
        return clerk_user_id
    except Exception as e:
        raise HTTPException(401, f"Invalid or expired token: {str(e)}")


def get_user_membership(supabase, user_id: str, organization_id: str = None):
    """Get user's team membership and role"""
    query = supabase.table("team_members").select("*, teams(*), organizations(*)").eq("user_id", user_id)
    if organization_id:
        query = query.eq("organization_id", organization_id)
    result = query.execute()
    return result.data[0] if result.data else None


# ============================================================================
# Organization Endpoints
# ============================================================================

@router.get("/organization/{organization_id}")
async def get_organization(
    organization_id: str,
    authorization: str = Header(...)
):
    """Get organization details (admin only)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Check user is admin in this organization
    membership = get_user_membership(supabase, user_id, organization_id)
    if not membership or membership["role"] != "admin":
        raise HTTPException(403, "Only admins can view organization details")

    # Get organization
    org_result = supabase.table("organizations").select("*").eq("id", organization_id).single().execute()
    if not org_result.data:
        raise HTTPException(404, "Organization not found")

    return {"organization": org_result.data}


@router.patch("/organization/{organization_id}")
async def update_organization(
    organization_id: str,
    request: UpdateOrganizationRequest,
    authorization: str = Header(...)
):
    """Update organization details (admin only)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Check user is admin in this organization
    membership = get_user_membership(supabase, user_id, organization_id)
    if not membership or membership["role"] != "admin":
        raise HTTPException(403, "Only admins can update organization")

    # Update organization
    result = supabase.table("organizations").update({
        "name": request.name
    }).eq("id", organization_id).execute()

    if not result.data:
        raise HTTPException(500, "Failed to update organization")

    print(f"✅ Organization updated: {request.name}")
    return {"success": True, "organization": result.data[0]}


# ============================================================================
# Team Endpoints
# ============================================================================

@router.get("/organization/{organization_id}/teams")
async def list_organization_teams(
    organization_id: str,
    authorization: str = Header(...)
):
    """List all teams in an organization with member counts and profiles"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Check user belongs to this organization
    membership = get_user_membership(supabase, user_id, organization_id)
    if not membership:
        raise HTTPException(403, "You don't belong to this organization")

    is_admin = membership["role"] == "admin"

    # Get all teams in the organization
    teams_result = supabase.table("teams").select("*").eq("organization_id", organization_id).execute()
    teams = teams_result.data or []

    # Get member counts for each team
    teams_with_info = []
    for team in teams:
        # Get member count
        members_result = supabase.table("team_members").select("id", count="exact").eq("team_id", team["id"]).execute()
        member_count = members_result.count or 0

        # Get team profile
        profile_result = supabase.table("team_profiles").select("*").eq("team_id", team["id"]).execute()
        profile = profile_result.data[0] if profile_result.data else None

        # If user is not admin, only include their own team
        if not is_admin and team["id"] != membership["team_id"]:
            continue

        teams_with_info.append({
            **team,
            "member_count": member_count,
            "profile": profile
        })

    return {"teams": teams_with_info, "is_admin": is_admin}


@router.post("/teams")
async def create_team(
    request: CreateTeamRequest,
    authorization: str = Header(...)
):
    """Create a new team in the organization (admin only)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Check user is admin in this organization
    membership = get_user_membership(supabase, user_id, request.organization_id)
    if not membership or membership["role"] != "admin":
        raise HTTPException(403, "Only admins can create teams")

    # Create team
    team_data = {
        "organization_id": request.organization_id,
        "name": request.name,
        "description": request.description
    }

    team_result = supabase.table("teams").insert(team_data).execute()
    if not team_result.data:
        raise HTTPException(500, "Failed to create team")

    team = team_result.data[0]
    print(f"✅ Team created: {team['name']} (id: {team['id']})")

    return {"success": True, "team": team}


@router.get("/teams/{team_id}")
async def get_team(
    team_id: str,
    authorization: str = Header(...)
):
    """Get team details with profile"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team
    team_result = supabase.table("teams").select("*").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    team = team_result.data

    # Check user has access (admin of org or member of team)
    membership = get_user_membership(supabase, user_id, team["organization_id"])
    if not membership:
        raise HTTPException(403, "You don't have access to this team")

    is_admin = membership["role"] == "admin"
    is_manager = membership["role"] == "manager" and membership["team_id"] == team_id

    if not is_admin and not is_manager and membership["team_id"] != team_id:
        raise HTTPException(403, "You don't have access to this team")

    # Get team profile
    profile_result = supabase.table("team_profiles").select("*").eq("team_id", team_id).execute()
    profile = profile_result.data[0] if profile_result.data else None

    # Get member count
    members_result = supabase.table("team_members").select("id", count="exact").eq("team_id", team_id).execute()

    return {
        "team": {
            **team,
            "member_count": members_result.count or 0,
            "profile": profile
        },
        "can_edit": is_admin or is_manager
    }


@router.patch("/teams/{team_id}")
async def update_team(
    team_id: str,
    request: UpdateTeamRequest,
    authorization: str = Header(...)
):
    """Update team details (admin or team manager only)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team to find organization
    team_result = supabase.table("teams").select("organization_id").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    org_id = team_result.data["organization_id"]

    # Check user has permission (admin of org or manager of this team)
    membership = get_user_membership(supabase, user_id, org_id)
    if not membership:
        raise HTTPException(403, "You don't belong to this organization")

    is_admin = membership["role"] == "admin"
    is_team_manager = membership["role"] == "manager" and membership["team_id"] == team_id

    if not is_admin and not is_team_manager:
        raise HTTPException(403, "Only admins or team managers can update team details")

    # Update team
    result = supabase.table("teams").update({
        "name": request.name,
        "description": request.description
    }).eq("id", team_id).execute()

    if not result.data:
        raise HTTPException(500, "Failed to update team")

    print(f"✅ Team updated: {request.name}")
    return {"success": True, "team": result.data[0]}


@router.delete("/teams/{team_id}")
async def delete_team(
    team_id: str,
    authorization: str = Header(...)
):
    """Delete a team (admin only, cannot delete if it's the only team)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team
    team_result = supabase.table("teams").select("organization_id").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    org_id = team_result.data["organization_id"]

    # Check user is admin
    membership = get_user_membership(supabase, user_id, org_id)
    if not membership or membership["role"] != "admin":
        raise HTTPException(403, "Only admins can delete teams")

    # Check this is not the only team in the organization
    teams_count = supabase.table("teams").select("id", count="exact").eq("organization_id", org_id).execute()
    if teams_count.count <= 1:
        raise HTTPException(400, "Cannot delete the only team in the organization")

    # Check if admin is trying to delete their own team
    if membership["team_id"] == team_id:
        raise HTTPException(400, "Cannot delete your own team. Transfer to another team first.")

    # Delete team profile first
    supabase.table("team_profiles").delete().eq("team_id", team_id).execute()

    # Delete team members
    supabase.table("team_members").delete().eq("team_id", team_id).execute()

    # Delete pending invitations for this team
    supabase.table("pending_invitations").delete().eq("team_id", team_id).execute()

    # Delete the team
    supabase.table("teams").delete().eq("id", team_id).execute()

    print(f"✅ Team deleted: {team_id}")
    return {"success": True, "message": "Team deleted successfully"}


# ============================================================================
# Team Profile Endpoints
# ============================================================================

@router.patch("/teams/{team_id}/profile")
async def update_team_profile(
    team_id: str,
    request: UpdateTeamProfileRequest,
    authorization: str = Header(...)
):
    """Update team profile (admin or team manager only)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team
    team_result = supabase.table("teams").select("organization_id").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    org_id = team_result.data["organization_id"]

    # Check permission
    membership = get_user_membership(supabase, user_id, org_id)
    if not membership:
        raise HTTPException(403, "You don't belong to this organization")

    is_admin = membership["role"] == "admin"
    is_team_manager = membership["role"] == "manager" and membership["team_id"] == team_id

    if not is_admin and not is_team_manager:
        raise HTTPException(403, "Only admins or team managers can update team profile")

    # Convert team_size string to integer
    team_size_int = None
    if request.team_size:
        try:
            size_str = request.team_size.replace("+", "").split("-")[0]
            team_size_int = int(size_str)
        except (ValueError, IndexError):
            team_size_int = None

    # Upsert team profile
    profile_data = {
        "team_id": team_id,
        "organization_id": org_id,
        "team_role_description": request.team_role_description,
        "member_responsibilities": request.member_responsibilities,
        "past_activities_summary": request.past_activities_summary,
        "industry_sector": request.industry_sector,
        "team_size": team_size_int,
        "last_updated_by": user_id
    }

    result = supabase.table("team_profiles").upsert(
        profile_data,
        on_conflict="team_id"
    ).execute()

    if not result.data:
        raise HTTPException(500, "Failed to update team profile")

    print(f"✅ Team profile updated for team {team_id}")
    return {"success": True, "profile": result.data[0]}


# ============================================================================
# Team Member Management
# ============================================================================

@router.get("/teams/{team_id}/members")
async def list_team_members(
    team_id: str,
    authorization: str = Header(...)
):
    """List all members of a team"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team
    team_result = supabase.table("teams").select("organization_id").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    org_id = team_result.data["organization_id"]

    # Check user has access
    membership = get_user_membership(supabase, user_id, org_id)
    if not membership:
        raise HTTPException(403, "You don't belong to this organization")

    is_admin = membership["role"] == "admin"
    is_team_manager = membership["role"] == "manager" and membership["team_id"] == team_id
    is_team_member = membership["team_id"] == team_id

    if not is_admin and not is_team_manager and not is_team_member:
        raise HTTPException(403, "You don't have access to this team")

    # Get team members with user info
    members_result = supabase.table("team_members").select(
        "id, user_id, role, joined_at, users(id, full_name, email, avatar_url)"
    ).eq("team_id", team_id).execute()

    members = []
    for m in (members_result.data or []):
        members.append({
            "id": m["id"],
            "user_id": m["user_id"],
            "role": m["role"],
            "joined_at": m["joined_at"],
            "user": m["users"]
        })

    return {
        "members": members,
        "can_manage": is_admin or is_team_manager
    }


@router.patch("/teams/{team_id}/members/{member_id}/role")
async def update_member_role(
    team_id: str,
    member_id: str,
    request: PromoteMemberRequest,
    authorization: str = Header(...)
):
    """Update a team member's role (admin or manager promoting to manager)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team
    team_result = supabase.table("teams").select("organization_id").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    org_id = team_result.data["organization_id"]

    # Check permission
    membership = get_user_membership(supabase, user_id, org_id)
    if not membership:
        raise HTTPException(403, "You don't belong to this organization")

    is_admin = membership["role"] == "admin"
    is_team_manager = membership["role"] == "manager" and membership["team_id"] == team_id

    if not is_admin and not is_team_manager:
        raise HTTPException(403, "Only admins or team managers can change member roles")

    # Get the member being updated
    target_member = supabase.table("team_members").select("*").eq("id", member_id).eq("team_id", team_id).single().execute()
    if not target_member.data:
        raise HTTPException(404, "Team member not found")

    # Cannot change admin role (admin is org-level, not team-level)
    if target_member.data["role"] == "admin":
        raise HTTPException(400, "Cannot change admin role")

    # Cannot demote yourself if you're a manager
    if target_member.data["user_id"] == user_id and request.new_role == "member":
        raise HTTPException(400, "Cannot demote yourself")

    # Update role
    result = supabase.table("team_members").update({
        "role": request.new_role
    }).eq("id", member_id).execute()

    if not result.data:
        raise HTTPException(500, "Failed to update member role")

    print(f"✅ Member role updated to {request.new_role}")
    return {"success": True, "member": result.data[0]}


@router.delete("/teams/{team_id}/members/{member_id}")
async def remove_team_member(
    team_id: str,
    member_id: str,
    authorization: str = Header(...)
):
    """Remove a member from a team (admin or manager only)"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team
    team_result = supabase.table("teams").select("organization_id").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    org_id = team_result.data["organization_id"]

    # Check permission
    membership = get_user_membership(supabase, user_id, org_id)
    if not membership:
        raise HTTPException(403, "You don't belong to this organization")

    is_admin = membership["role"] == "admin"
    is_team_manager = membership["role"] == "manager" and membership["team_id"] == team_id

    if not is_admin and not is_team_manager:
        raise HTTPException(403, "Only admins or team managers can remove members")

    # Get the member being removed
    target_member = supabase.table("team_members").select("*").eq("id", member_id).eq("team_id", team_id).single().execute()
    if not target_member.data:
        raise HTTPException(404, "Team member not found")

    # Cannot remove an admin
    if target_member.data["role"] == "admin":
        raise HTTPException(400, "Cannot remove an admin from a team")

    # Cannot remove yourself
    if target_member.data["user_id"] == user_id:
        raise HTTPException(400, "Cannot remove yourself from the team")

    # Delete the membership
    supabase.table("team_members").delete().eq("id", member_id).execute()

    print(f"✅ Member removed from team")
    return {"success": True, "message": "Member removed from team"}


# ============================================================================
# Pending Invitations Management
# ============================================================================

@router.get("/teams/{team_id}/invitations")
async def list_team_invitations(
    team_id: str,
    authorization: str = Header(...)
):
    """List pending invitations for a team"""
    clerk_user_id = get_user_from_token(authorization)
    supabase = get_supabase_service_client()

    # Get user
    user_result = supabase.table("users").select("id").eq("clerk_user_id", clerk_user_id).single().execute()
    if not user_result.data:
        raise HTTPException(404, "User not found")

    user_id = user_result.data["id"]

    # Get team
    team_result = supabase.table("teams").select("organization_id").eq("id", team_id).single().execute()
    if not team_result.data:
        raise HTTPException(404, "Team not found")

    org_id = team_result.data["organization_id"]

    # Check permission
    membership = get_user_membership(supabase, user_id, org_id)
    if not membership:
        raise HTTPException(403, "You don't belong to this organization")

    is_admin = membership["role"] == "admin"
    is_team_manager = membership["role"] == "manager" and membership["team_id"] == team_id

    if not is_admin and not is_team_manager:
        raise HTTPException(403, "Only admins or team managers can view invitations")

    # Get pending invitations
    result = supabase.table("pending_invitations").select("*").eq("team_id", team_id).eq("status", "pending").order("created_at", desc=True).execute()

    return {"invitations": result.data or [], "can_manage": True}
