#!/usr/bin/env python3
"""
Script to reset user password
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.api.v1.endpoints.users import get_password_hash

async def reset_user_password():
    """Reset password for a user"""
    try:
        print("🔐 Password Reset Tool")
        print("=" * 40)
        
        # Get user input
        email = input("Enter email: ").strip()
        new_password = input("Enter new password: ").strip()
        
        if not email or not new_password:
            print("❌ Email and password are required!")
            return
        
        # Connect to database
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        users_collection = db["users"]
        
        # Find user
        user = await users_collection.find_one({"email": email})
        if not user:
            print(f"❌ User with email '{email}' not found!")
            return
        
        print(f"✅ User found: {user.get('username', 'N/A')}")
        
        # Hash new password
        hashed_password = get_password_hash(new_password)
        
        # Update password
        result = await users_collection.update_one(
            {"email": email},
            {"$set": {"hashed_password": hashed_password}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Password updated successfully for {email}")
        else:
            print(f"❌ Failed to update password")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(reset_user_password())
