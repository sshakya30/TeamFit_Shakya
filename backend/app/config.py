"""
Application configuration
Loads environment variables and provides typed config access
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Clerk
    clerk_secret_key: str
    clerk_webhook_secret: str

    # OpenAI
    openai_api_key: str
    free_tier_ai_model: str = "gpt-4o-mini"
    paid_tier_ai_model: str = "gpt-4o"
    max_tokens_public_customization: int = 2000
    max_tokens_custom_generation: int = 3000

    # Storage
    storage_bucket_name: str = "team-materials"
    max_file_size_mb: int = 10
    max_team_storage_mb: int = 50

    # Quotas
    free_tier_monthly_limit: int = 5
    paid_tier_custom_limit: int = 10

    # Application
    super_admin_email: str
    frontend_url: str = "http://localhost:5173"

    # Redis/Celery
    redis_url: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra env variables not defined in Settings


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
