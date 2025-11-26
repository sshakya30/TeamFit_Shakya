"""
Trust scoring service for abuse prevention
Calculates organization trust scores based on multiple signals
"""

from datetime import datetime, timezone
from typing import Tuple
from fastapi import HTTPException
from app.utils.supabase_client import get_supabase_service_client


class TrustService:
    # Disposable email domains (add more as needed)
    DISPOSABLE_DOMAINS = {
        'tempmail.com', 'guerrillamail.com', '10minutemail.com',
        'throwaway.email', 'temp-mail.org', 'fakeinbox.com',
        'mailinator.com', 'maildrop.cc', 'yopmail.com'
    }

    @staticmethod
    async def calculate_trust_score(organization_id: str) -> float:
        """
        Calculate trust score for an organization
        Returns: float between 0.00 (no trust) and 1.00 (full trust)
        """
        supabase = get_supabase_service_client()

        print(f"🔍 Calculating trust score for organization {organization_id}")

        # Get organization data
        org_response = supabase.table('organizations')\
            .select('created_at, settings')\
            .eq('id', organization_id)\
            .single()\
            .execute()

        if not org_response.data:
            return 0.00

        org = org_response.data

        # Calculate org age
        created_at = datetime.fromisoformat(org['created_at'].replace('Z', '+00:00'))
        org_age_days = (datetime.now(timezone.utc) - created_at).days

        # Get team count
        teams_response = supabase.table('teams')\
            .select('id', count='exact')\
            .eq('organization_id', organization_id)\
            .execute()
        team_count = teams_response.count or 0

        # Get member count
        members_response = supabase.table('team_members')\
            .select('user_id', count='exact')\
            .eq('organization_id', organization_id)\
            .execute()
        member_count = members_response.count or 0

        # Get subscription info
        sub_response = supabase.table('subscriptions')\
            .select('plan_type, status')\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()

        has_payment = False
        if sub_response.data:
            has_payment = sub_response.data.get('plan_type') != 'free'

        # Calculate trust score (starts at 1.00)
        trust_score = 1.00

        # Age penalties
        if org_age_days < 1:
            trust_score -= 0.30
            print(f"  📉 New organization (<1 day): -0.30")
        elif org_age_days < 7:
            trust_score -= 0.20
            print(f"  📉 Young organization (<7 days): -0.20")

        # Structure penalties
        if team_count == 0:
            trust_score -= 0.25
            print(f"  📉 No teams created: -0.25")
        if member_count <= 1:
            trust_score -= 0.25
            print(f"  📉 Only one member: -0.25")

        # Payment method bonus
        if has_payment:
            trust_score += 0.15
            print(f"  📈 Has paid subscription: +0.15")

        # Age bonus
        if org_age_days > 30:
            trust_score += 0.10
            print(f"  📈 Mature organization (>30 days): +0.10")

        final_score = max(0.00, min(1.00, trust_score))
        print(f"  ✅ Final trust score: {final_score:.2f}")

        return final_score

    @staticmethod
    async def update_trust_score(organization_id: str) -> float:
        """Calculate and update trust score in database"""
        supabase = get_supabase_service_client()

        score = await TrustService.calculate_trust_score(organization_id)

        # Determine if verification required
        requires_verification = score < 0.60
        verification_type = None

        if requires_verification:
            if score < 0.40:
                verification_type = 'phone'
                print(f"  ⚠️ Low trust ({score:.2f}) - Phone verification required")
            else:
                verification_type = 'email'
                print(f"  ⚠️ Medium trust ({score:.2f}) - Email verification required")

        # Update quota record
        supabase.table('usage_quotas')\
            .update({
                'trust_score': score,
                'requires_verification': requires_verification,
                'verification_type': verification_type
            })\
            .eq('organization_id', organization_id)\
            .execute()

        print(f"  💾 Trust score updated in database")

        return score

    @staticmethod
    def is_disposable_email(email: str) -> bool:
        """Check if email is from disposable provider"""
        domain = email.split('@')[-1].lower()
        is_disposable = domain in TrustService.DISPOSABLE_DOMAINS

        if is_disposable:
            print(f"  🚫 Disposable email detected: {domain}")

        return is_disposable

    @staticmethod
    async def check_verification_required(organization_id: str) -> Tuple[bool, str]:
        """
        Check if organization requires verification
        Returns: (requires_verification, verification_type)
        """
        supabase = get_supabase_service_client()

        # Get quota record with trust info
        response = supabase.table('usage_quotas')\
            .select('requires_verification, verification_type, trust_score')\
            .eq('organization_id', organization_id)\
            .single()\
            .execute()

        if not response.data:
            # No quota record, create one with trust calculation
            await TrustService.update_trust_score(organization_id)
            return await TrustService.check_verification_required(organization_id)

        requires = response.data.get('requires_verification', False)
        v_type = response.data.get('verification_type')

        return requires, v_type or 'email'
