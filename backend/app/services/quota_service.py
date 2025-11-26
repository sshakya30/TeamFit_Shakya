"""
Quota management service
Tracks and enforces usage limits
"""

from typing import Dict, Tuple
from datetime import datetime, timezone
from fastapi import HTTPException
from app.utils.supabase_client import get_supabase_service_client


class QuotaService:
    @staticmethod
    async def check_quota_available(
        organization_id: str,
        quota_type: str  # 'public' or 'custom'
    ) -> Tuple[bool, Dict]:
        """
        Check if organization has quota available
        Returns: (has_quota, quota_info)
        """
        supabase = get_supabase_service_client()

        # Get quota record
        response = supabase.table('usage_quotas')\
            .select('*')\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()

        if not response.data:
            raise HTTPException(404, "Quota record not found")

        quota = response.data

        # Check if period expired (auto-reset handled by database function)
        if datetime.fromisoformat(quota['quota_period_end'].replace('Z', '+00:00')) < datetime.now(timezone.utc):
            # Call database function to reset
            supabase.rpc('reset_monthly_quotas').execute()

            # Fetch again after reset
            response = supabase.table('usage_quotas')\
                .select('*')\
                .eq('organization_id', organization_id)\
                .single()\
                .execute()
            quota = response.data

        # Check availability
        if quota_type == 'public':
            has_quota = quota['public_customizations_used'] < quota['public_customizations_limit']
        elif quota_type == 'custom':
            has_quota = quota['custom_generations_used'] < quota['custom_generations_limit']
        else:
            raise ValueError(f"Invalid quota type: {quota_type}")

        return has_quota, quota

    @staticmethod
    async def increment_quota(
        organization_id: str,
        quota_type: str
    ):
        """Increment usage counter"""
        supabase = get_supabase_service_client()

        if quota_type == 'public':
            field = 'public_customizations_used'
        elif quota_type == 'custom':
            field = 'custom_generations_used'
        else:
            raise ValueError(f"Invalid quota type: {quota_type}")

        # Get current value
        response = supabase.table('usage_quotas')\
            .select(field)\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()

        if response.data:
            current_value = response.data[field]
            # Increment
            supabase.table('usage_quotas')\
                .update({field: current_value + 1})\
                .eq('organization_id', organization_id)\
                .execute()

    @staticmethod
    async def get_quota_status(organization_id: str) -> Dict:
        """Get current quota status"""
        supabase = get_supabase_service_client()

        response = supabase.table('usage_quotas')\
            .select('*')\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()

        if not response.data:
            raise HTTPException(404, "Quota not found")

        return response.data
