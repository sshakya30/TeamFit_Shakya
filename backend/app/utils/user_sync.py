"""
User synchronization utilities for Clerk → Supabase
Handles creating, updating, and deleting users from webhook events
"""

from typing import Optional, Dict, Any
from .supabase_client import get_supabase_service_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL")


def create_user_in_supabase(clerk_user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user in Supabase from Clerk webhook data.
    
    Args:
        clerk_user_data: User data from Clerk webhook payload
        
    Returns:
        dict: Created user data from Supabase
        
    Raises:
        Exception: If user creation fails
    """
    supabase = get_supabase_service_client()
    
    # Extract user information from Clerk payload
    clerk_user_id = clerk_user_data.get("id")
    
    # Handle email addresses (may be empty in test webhooks)
    email_addresses = clerk_user_data.get("email_addresses", [])
    
    # Check if we have a valid email
    if not email_addresses or len(email_addresses) == 0:
        print(f"⚠️ Warning: Test webhook with no email addresses. Skipping user creation.")
        print(f"   This is normal for Clerk test webhooks. Try with a real user signup.")
        # Return mock data for test webhooks
        return {
            "id": "test-user-id",
            "email": "test@example.com",
            "clerk_user_id": clerk_user_id,
            "message": "Test webhook - user not created (no email provided)"
        }
    
    # Get the primary email address
    email = email_addresses[0].get("email_address")
    
    # Validate email exists
    if not email:
        raise Exception("Email address is required but primary email is empty")
    
    first_name = clerk_user_data.get("first_name", "")
    last_name = clerk_user_data.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or email.split("@")[0]
    avatar_url = clerk_user_data.get("image_url")
    
    print(f"Creating user in Supabase: {email}")
    
    try:
        # Insert user into Supabase users table
        result = supabase.table("users").insert({
            "clerk_user_id": clerk_user_id,
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url,
        }).execute()
        
        user = result.data[0] if result.data else None
        
        if not user:
            raise Exception("User creation returned no data")
        
        print(f"✅ User created successfully: {email}")

        # Check for pending invitations for this email
        pending_invitations = supabase.table("pending_invitations").select("*").eq("email", email.lower()).eq("status", "pending").execute()

        if pending_invitations.data:
            print(f"📨 Found {len(pending_invitations.data)} pending invitation(s) for {email}")

            for invitation in pending_invitations.data:
                try:
                    # Create team_member record for this invitation
                    member_data = {
                        "user_id": user["id"],
                        "team_id": invitation["team_id"],
                        "organization_id": invitation["organization_id"],
                        "role": invitation["role"]
                    }

                    supabase.table("team_members").insert(member_data).execute()
                    print(f"✅ Added user to team {invitation['team_id']} as {invitation['role']}")

                    # Mark invitation as accepted
                    supabase.table("pending_invitations").update({
                        "status": "accepted",
                        "accepted_at": "now()"
                    }).eq("id", invitation["id"]).execute()

                except Exception as invite_error:
                    print(f"⚠️ Error processing invitation {invitation['id']}: {invite_error}")

            # Mark onboarding as complete for invited users (they don't need to go through onboarding)
            supabase.table("users").update({
                "onboarding_completed": True,
                "onboarding_step": "complete"
            }).eq("id", user["id"]).execute()

            print(f"✅ User {email} auto-linked to {len(pending_invitations.data)} team(s) via invitations")

        # Check if this is the super admin email (only if no invitations found)
        elif email == SUPER_ADMIN_EMAIL:
            print(f"🔐 Super admin detected: {email} - Will go through onboarding flow")

        return user

    except Exception as e:
        print(f"❌ Error creating user: {e}")
        raise


def update_user_in_supabase(clerk_user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update existing user in Supabase from Clerk webhook data.

    Args:
        clerk_user_data: Updated user data from Clerk webhook payload

    Returns:
        dict: Updated user data from Supabase

    Raises:
        Exception: If user update fails
    """
    supabase = get_supabase_service_client()

    clerk_user_id = clerk_user_data.get("id")

    # Safely extract email (handle empty array from test webhooks)
    email_addresses = clerk_user_data.get("email_addresses", [])
    email = email_addresses[0].get("email_address") if email_addresses else None

    # Validate required fields
    if not email:
        raise ValueError("Email address is required but not found in webhook payload")

    first_name = clerk_user_data.get("first_name", "")
    last_name = clerk_user_data.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip() or email.split("@")[0]
    avatar_url = clerk_user_data.get("image_url")

    print(f"Updating user in Supabase: {email}")

    try:
        # Update user in Supabase
        result = supabase.table("users").update({
            "email": email,
            "full_name": full_name,
            "avatar_url": avatar_url,
            "updated_at": "now()"  # Trigger will handle this, but explicit is good
        }).eq("clerk_user_id", clerk_user_id).execute()

        user = result.data[0] if result.data else None

        if not user:
            raise Exception(f"User with clerk_user_id {clerk_user_id} not found")

        print(f"✅ User updated successfully: {email}")
        return user

    except Exception as e:
        print(f"❌ Error updating user: {e}")
        raise


def delete_user_from_supabase(clerk_user_id: str) -> bool:
    """
    Delete user from Supabase when deleted in Clerk.

    Args:
        clerk_user_id: Clerk user ID to delete

    Returns:
        bool: True if deletion successful

    Raises:
        Exception: If user deletion fails
    """
    supabase = get_supabase_service_client()

    print(f"Deleting user from Supabase: {clerk_user_id}")

    try:
        # Delete user from Supabase
        # This will CASCADE delete all related records (team_members, feedback, etc.)
        result = supabase.table("users").delete().eq(
            "clerk_user_id", clerk_user_id
        ).execute()

        print(f"✅ User deleted successfully: {clerk_user_id}")
        return True

    except Exception as e:
        print(f"❌ Error deleting user: {e}")
        raise


def get_user_by_clerk_id(clerk_user_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve user from Supabase by Clerk user ID.

    Args:
        clerk_user_id: Clerk user ID

    Returns:
        dict: User data if found, None otherwise
    """
    supabase = get_supabase_service_client()

    try:
        result = supabase.table("users").select("*").eq(
            "clerk_user_id", clerk_user_id
        ).execute()

        return result.data[0] if result.data else None

    except Exception as e:
        print(f"Error fetching user: {e}")
        return None
