"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any
from datetime import datetime


# ============================================
# File Upload Models
# ============================================

class FileUploadResponse(BaseModel):
    success: bool
    material_id: str
    file_name: str
    size_bytes: int
    summary: Optional[str] = None


class MaterialListItem(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_size_bytes: int
    uploaded_by: str
    created_at: datetime


# ============================================
# Activity Customization Models
# ============================================

class CustomizeActivityRequest(BaseModel):
    team_id: str
    organization_id: str
    public_activity_id: str
    duration_minutes: Literal[15, 30, 45]
    additional_context: Optional[str] = None


class CustomizedActivityResponse(BaseModel):
    success: bool
    activity_id: str
    activity: Dict[str, Any]
    quotas_remaining: Dict[str, int]


class ActivityResponse(BaseModel):
    """Response model for a single activity"""
    id: str
    team_id: str
    organization_id: str
    title: str
    description: str
    category: str
    duration_minutes: int
    complexity: str
    required_tools: List[str]
    instructions: str
    customization_notes: Optional[str] = None
    is_custom_generated: bool
    status: str
    created_at: Optional[datetime] = None


class UpdateActivityStatusRequest(BaseModel):
    """Request to update activity status"""
    status: Literal["ready", "archived", "in_use"]


# ============================================
# Custom Generation Models
# ============================================

class GenerateCustomRequest(BaseModel):
    team_id: str
    organization_id: str
    requirements: Optional[str] = None


class GenerateCustomResponse(BaseModel):
    success: bool
    job_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    status: Literal["pending", "processing", "completed", "failed"]
    job: Optional[Dict[str, Any]] = None
    activities: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None
    message: Optional[str] = None


# ============================================
# Team Profile Models
# ============================================

class CreateTeamProfileRequest(BaseModel):
    """
    Request model for creating/updating team profile during onboarding.
    All fields except team_id and organization_id are optional to allow
    users to skip filling in details during onboarding.
    """
    team_id: str
    organization_id: str
    team_role_description: Optional[str] = Field(None, max_length=500)
    member_responsibilities: Optional[str] = Field(None, max_length=500)
    past_activities_summary: Optional[str] = Field(None, max_length=1000)
    industry_sector: Optional[str] = None
    team_size: Optional[str] = None  # String like "2-5", "6-10", etc.


class TeamProfileResponse(BaseModel):
    success: bool
    profile: Dict[str, Any]


# ============================================
# Quota Models
# ============================================

class QuotaStatusResponse(BaseModel):
    public_customizations_used: int
    public_customizations_limit: int
    custom_generations_used: int
    custom_generations_limit: int
    trust_score: float
    requires_verification: bool
    verification_type: Optional[str] = None


# ============================================
# Onboarding Models
# ============================================

class OnboardingStatusResponse(BaseModel):
    """Response for user's onboarding state"""
    current_step: str
    organization_id: Optional[str] = None
    team_id: Optional[str] = None
    is_complete: bool
    user_role: Optional[str] = None


class CreateOrganizationRequest(BaseModel):
    """Request to create a new organization during onboarding"""
    name: str = Field(..., min_length=2, max_length=100)


class CreateOrganizationResponse(BaseModel):
    """Response after creating organization"""
    success: bool
    organization: Dict[str, Any]


class CreateTeamRequest(BaseModel):
    """Request to create a new team"""
    organization_id: str
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class CreateTeamResponse(BaseModel):
    """Response after creating team"""
    success: bool
    team: Dict[str, Any]


class InviteMemberRequest(BaseModel):
    """Request to invite a new team member"""
    email: str = Field(..., min_length=5, max_length=255)
    full_name: Optional[str] = Field(None, max_length=100)
    team_id: str
    organization_id: str
    role: Literal["manager", "member"]


class InviteMemberResponse(BaseModel):
    """Response after creating invitation"""
    success: bool
    invitation: Dict[str, Any]
    invite_message: str


class PendingInvitationResponse(BaseModel):
    """Response for a single pending invitation"""
    id: str
    email: str
    full_name: Optional[str] = None
    team_id: str
    organization_id: str
    role: str
    status: str
    created_at: str
    expires_at: str


class UpdateOnboardingStepRequest(BaseModel):
    """Request to update onboarding step"""
    step: Literal[
        "welcome",
        "create_organization",
        "create_team",
        "delegate_manager",
        "team_profile",
        "invite_members",
        "complete"
    ]


class CompleteOnboardingResponse(BaseModel):
    """Response after completing onboarding"""
    success: bool
    message: str
