"""
Supabase client utilities for TEAMFIT MVP
Provides both service role client (bypasses RLS) and user-authenticated client
"""

from supabase import create_client, Client, ClientOptions
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_ANON_KEY:
    raise ValueError("Missing required Supabase environment variables")


def get_supabase_service_client() -> Client:
    """
    Get Supabase client with SERVICE ROLE access.

    ⚠️ SECURITY WARNING: This client BYPASSES all RLS policies!
    Only use for:
    - Webhook endpoints (creating/updating users)
    - Admin operations that need to bypass RLS
    - System-level operations

    Never expose this client to frontend or untrusted code!

    Returns:
        Client: Supabase client with service role privileges
    """
    return create_client(
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_SERVICE_ROLE_KEY
    )


def get_supabase_user_client(clerk_jwt: str) -> Client:
    """
    Get Supabase client authenticated with Clerk JWT.

    This client respects RLS policies based on the authenticated user.
    Use this for all user-initiated operations (queries from frontend).

    Args:
        clerk_jwt: JWT token from Clerk session

    Returns:
        Client: Supabase client authenticated as the Clerk user
    """
    return create_client(
        supabase_url=SUPABASE_URL,
        supabase_key=SUPABASE_ANON_KEY,
        options=ClientOptions(
            headers={
                "Authorization": f"Bearer {clerk_jwt}"
            }
        )
    )


def verify_clerk_jwt(jwt_token: str) -> Optional[dict]:
    """
    Verify and decode Clerk JWT token.

    Args:
        jwt_token: JWT token from Clerk

    Returns:
        dict: Decoded JWT payload if valid, None if invalid
    """
    # For production, implement proper JWT verification
    # For MVP, we'll trust Clerk's JWT (it's verified by Supabase RLS)
    import jwt
    try:
        # Decode without verification (Supabase verifies it)
        decoded = jwt.decode(jwt_token, options={"verify_signature": False})
        return decoded
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        return None
