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
    team_id: str
    organization_id: str
    team_role_description: str = Field(..., min_length=10, max_length=500)
    member_responsibilities: str = Field(..., min_length=10, max_length=500)
    past_activities_summary: Optional[str] = Field(None, max_length=1000)
    industry_sector: Optional[str] = None
    team_size: Optional[int] = Field(None, gt=0, le=1000)


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
