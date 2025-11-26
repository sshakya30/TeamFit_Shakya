"""
AI service for activity generation
Handles OpenAI API calls
"""

import json
from typing import Dict, List
from openai import AsyncOpenAI
from app.config import get_settings
from app.utils.prompts import CUSTOMIZATION_PROMPT, CUSTOM_GENERATION_PROMPT, SUMMARIZATION_PROMPT

settings = get_settings()


class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def customize_public_activity(
        self,
        source_activity: Dict,
        team_profile: Dict,
        duration: int,
        is_paid_tier: bool = False
    ) -> Dict:
        """
        Customize a public activity for a specific team
        """
        model = settings.paid_tier_ai_model if is_paid_tier else settings.free_tier_ai_model

        prompt = CUSTOMIZATION_PROMPT.format(
            activity_title=source_activity['title'],
            activity_description=source_activity['description'],
            activity_category=source_activity['category'],
            activity_instructions=source_activity['instructions'],
            team_role=team_profile.get('team_role_description', 'General team'),
            responsibilities=team_profile.get('member_responsibilities', 'Various responsibilities'),
            past_activities=team_profile.get('past_activities_summary', 'No past activities recorded'),
            sector=team_profile.get('industry_sector', 'general'),
            duration=duration
        )

        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert team-building facilitator."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=settings.max_tokens_public_customization
        )

        result = json.loads(response.choices[0].message.content)
        return {
            **result,
            'tokens_used': response.usage.total_tokens,
            'model_used': model
        }

    async def generate_custom_activities(
        self,
        team_profile: Dict,
        materials_summary: str,
        requirements: str = ""
    ) -> List[Dict]:
        """
        Generate 3 custom activities based on team profile and materials
        """
        model = settings.paid_tier_ai_model
        activities = []

        for i in range(1, 4):
            prompt = CUSTOM_GENERATION_PROMPT.format(
                activity_number=i,
                team_role=team_profile.get('team_role_description', 'General team'),
                responsibilities=team_profile.get('member_responsibilities', 'Various responsibilities'),
                materials_summary=materials_summary[:2000],  # Limit context
                requirements=requirements or "No specific requirements",
                previous_titles=', '.join([a['title'] for a in activities]) if activities else 'None'
            )

            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are an expert team-building activity designer."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=settings.max_tokens_custom_generation
            )

            activity = json.loads(response.choices[0].message.content)
            activity['tokens_used'] = response.usage.total_tokens
            activity['model_used'] = model
            activity['suggestion_number'] = i
            activities.append(activity)

        return activities

    async def summarize_content(self, text: str, max_length: int = 500) -> str:
        """
        Create a concise summary of document content
        """
        if len(text) <= max_length:
            return text

        prompt = SUMMARIZATION_PROMPT.format(
            max_length=max_length,
            text=text[:5000]  # Limit input to avoid token overflow
        )

        response = await self.client.chat.completions.create(
            model=settings.free_tier_ai_model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=200
        )

        return response.choices[0].message.content.strip()
