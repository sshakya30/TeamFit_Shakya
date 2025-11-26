"""
Celery tasks for async activity generation
"""

from celery import Celery
from datetime import datetime, timedelta, timezone
import uuid
from app.config import get_settings
from app.services.ai_service import AIService
from app.services.quota_service import QuotaService
from app.utils.supabase_client import get_supabase_service_client

settings = get_settings()

# Initialize Celery
celery_app = Celery('teamfit', broker=settings.redis_url)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)


@celery_app.task(name='generate_custom_activities_task')
def generate_custom_activities_task(job_id: str, team_id: str, organization_id: str):
    """
    Background task to generate 3 custom activities
    """
    supabase = get_supabase_service_client()

    try:
        print(f"⚙️ [Celery] Processing job {job_id}")

        # Update job status to processing
        supabase.table('customization_jobs')\
            .update({'status': 'processing'})\
            .eq('id', job_id)\
            .execute()

        # Get job context
        job_response = supabase.table('customization_jobs')\
            .select('input_context')\
            .eq('id', job_id)\
            .single()\
            .execute()

        context = job_response.data['input_context']
        team_profile = context['team_profile']
        requirements = context.get('requirements', '')

        # Get uploaded materials
        materials_response = supabase.table('uploaded_materials')\
            .select('content_summary, extracted_text, file_name')\
            .eq('team_id', team_id)\
            .execute()

        materials_text = '\n\n---\n\n'.join([
            f"File: {m['file_name']}\n{m['extracted_text'][:2000]}"
            for m in materials_response.data
        ]) if materials_response.data else "No uploaded materials"

        # Generate 3 activities using async AI service
        # Note: We need to use a synchronous approach here since Celery tasks can't be async
        import asyncio

        print(f"🤖 [Celery] Generating 3 custom activities")
        ai_service = AIService()

        # Run async function in sync context
        loop = asyncio.get_event_loop()
        activities = loop.run_until_complete(
            ai_service.generate_custom_activities(
                team_profile=team_profile,
                materials_summary=materials_text,
                requirements=requirements
            )
        )

        # Save activities to customized_activities table
        generation_batch_id = str(uuid.uuid4())
        activity_ids = []
        total_tokens = 0

        for i, activity in enumerate(activities, 1):
            activity_data = {
                'team_id': team_id,
                'organization_id': organization_id,
                "created_by": "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
                'job_id': job_id,
                'customization_type': 'custom_generated',
                'generation_batch_id': generation_batch_id,
                'suggestion_number': i,
                'status': 'suggested',
                'title': activity['title'],
                'description': activity['description'],
                'category': activity['category'],
                'duration_minutes': activity['duration_minutes'],
                'complexity': activity['complexity'],
                'required_tools': activity['required_tools'],
                'instructions': activity['instructions'],
                'customization_notes': activity.get('why_this_works', ''),
                'expires_at': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            }

            response = supabase.table('customized_activities')\
                .insert(activity_data)\
                .execute()

            if response.data:
                activity_ids.append(response.data[0]['id'])
                total_tokens += activity['tokens_used']

        # Update job as completed
        supabase.table('customization_jobs')\
            .update({
                'status': 'completed',
                'completed_at': datetime.utcnow().isoformat(),
                'result_data': {
                    'activity_ids': activity_ids,
                    'generation_batch_id': generation_batch_id,
                    'total_tokens_used': total_tokens,
                    'activities_generated': len(activity_ids)
                },
                'tokens_used': total_tokens
            })\
            .eq('id', job_id)\
            .execute()

        # Increment quota
        loop.run_until_complete(
            QuotaService.increment_quota(organization_id, 'custom')
        )

        print(f"✅ [Celery] Job {job_id} completed: {len(activity_ids)} activities created")

        return {
            'status': 'completed',
            'activity_ids': activity_ids,
            'generation_batch_id': generation_batch_id
        }

    except Exception as e:
        # Mark job as failed
        print(f"❌ [Celery] Job {job_id} failed: {str(e)}")
        supabase.table('customization_jobs')\
            .update({
                'status': 'failed',
                'completed_at': datetime.utcnow().isoformat(),
                'error_message': str(e)
            })\
            .eq('id', job_id)\
            .execute()

        raise
