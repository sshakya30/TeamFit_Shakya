"""
Clerk webhook endpoints for user synchronization
Handles user.created, user.updated, and user.deleted events
"""

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
import os
from dotenv import load_dotenv
from svix.webhooks import Webhook, WebhookVerificationError
import json

from ..utils.user_sync import (
    create_user_in_supabase,
    update_user_in_supabase,
    delete_user_from_supabase
)

load_dotenv()

router = APIRouter()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")

if not CLERK_WEBHOOK_SECRET:
    raise ValueError("CLERK_WEBHOOK_SECRET environment variable is required")


@router.post("/clerk")
async def clerk_webhook(
    request: Request,
    svix_id: Optional[str] = Header(None, alias="svix-id"),
    svix_timestamp: Optional[str] = Header(None, alias="svix-timestamp"),
    svix_signature: Optional[str] = Header(None, alias="svix-signature"),
):
    """
    Webhook endpoint to receive and process Clerk events.

    Security:
    - Verifies webhook signature using Svix
    - Ensures request is actually from Clerk

    Supported Events:
    - user.created: Creates new user in Supabase
    - user.updated: Updates existing user in Supabase
    - user.deleted: Deletes user from Supabase

    Returns:
        dict: Success message and processed data
    """

    # Get the raw request body
    body = await request.body()
    body_str = body.decode("utf-8")

    # Verify the webhook signature
    try:
        wh = Webhook(CLERK_WEBHOOK_SECRET)
        payload = wh.verify(body_str, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        })
    except WebhookVerificationError as e:
        print(f"❌ Webhook verification failed: {e}")
        raise HTTPException(status_code=400, detail="Webhook verification failed")
    except Exception as e:
        print(f"❌ Error verifying webhook: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # Parse the webhook payload
    event_type = payload.get("type")
    event_data = payload.get("data")

    print(f"📨 Received webhook: {event_type}")

    # Handle different event types
    try:
        if event_type == "user.created":
            # Create new user in Supabase
            user = create_user_in_supabase(event_data)
            return {
                "success": True,
                "message": "User created successfully",
                "event_type": event_type,
                "user_id": user.get("id"),
                "email": user.get("email")
            }

        elif event_type == "user.updated":
            # Update existing user in Supabase
            user = update_user_in_supabase(event_data)
            return {
                "success": True,
                "message": "User updated successfully",
                "event_type": event_type,
                "user_id": user.get("id"),
                "email": user.get("email")
            }

        elif event_type == "user.deleted":
            # Delete user from Supabase
            clerk_user_id = event_data.get("id")
            delete_user_from_supabase(clerk_user_id)
            return {
                "success": True,
                "message": "User deleted successfully",
                "event_type": event_type,
                "clerk_user_id": clerk_user_id
            }

        else:
            # Unhandled event type (ignore)
            print(f"⚠️ Unhandled event type: {event_type}")
            return {
                "success": True,
                "message": f"Event type {event_type} received but not processed",
                "event_type": event_type
            }

    except Exception as e:
        print(f"❌ Error processing webhook: {e}")
        # Return 500 so Clerk retries the webhook
        raise HTTPException(
            status_code=500,
            detail=f"Error processing webhook: {str(e)}"
        )


@router.get("/clerk/health")
async def webhook_health():
    """
    Health check endpoint for webhook.
    Use this to verify your webhook endpoint is accessible.
    """
    return {
        "status": "healthy",
        "message": "Clerk webhook endpoint is running"
    }
