"""
Jobs router
Handles job status polling and management
"""

from typing import List, Dict
from fastapi import APIRouter, HTTPException
from app.models.schemas import JobStatusResponse
from app.utils.supabase_client import get_supabase_service_client

router = APIRouter()


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str) -> Dict:
    """
    Get status of a customization job
    - Returns job details
    - If completed, includes generated activity IDs
    """
    print(f"🔍 Checking status for job {job_id}")

    supabase = get_supabase_service_client()

    # Fetch job
    job_response = supabase.table('customization_jobs')\
        .select('*')\
        .eq('id', job_id)\
        .single()\
        .execute()

    if not job_response.data:
        raise HTTPException(404, "Job not found")

    job = job_response.data

    # Build response
    response = {
        "status": job['status'],
        "job": job
    }

    # If completed, fetch generated activities
    if job['status'] == 'completed' and job.get('result_data'):
        activity_ids = job['result_data'].get('activity_ids', [])

        if activity_ids:
            activities_response = supabase.table('customized_activities')\
                .select('*')\
                .in_('id', activity_ids)\
                .execute()

            response['activities'] = activities_response.data or []
        else:
            response['activities'] = []

    # If failed, include error
    if job['status'] == 'failed':
        response['error'] = job.get('error_message', 'Unknown error')

    print(f"📊 Job status: {job['status']}")

    return response


@router.get("/team/{team_id}")
async def get_team_jobs(team_id: str) -> List[Dict]:
    """
    Get all jobs for a team
    - Returns jobs ordered by creation date (newest first)
    """
    print(f"📋 Fetching jobs for team {team_id}")

    supabase = get_supabase_service_client()

    response = supabase.table('customization_jobs')\
        .select('*')\
        .eq('team_id', team_id)\
        .order('created_at', desc=True)\
        .execute()

    return response.data or []
