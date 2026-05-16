from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app import models, schemas
from app.auth import get_current_user, require_admin
from app.database import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[schemas.UserOut])
async def list_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List users - Admins see all, Taskers only see themselves."""
    if current_user.get("active_role") == models.UserRole.ADMIN:
        cursor = db["users"].find({"is_active": True})
        return await cursor.to_list(length=100)
    
    # Taskers only see their own record
    user = await db["users"].find_one({"id": current_user["id"]})
    return [user] if user else []


@router.get("/{user_id}", response_model=schemas.UserOut)
async def get_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", response_model=schemas.MessageResponse)
async def deactivate_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Deactivate a user (soft delete) - Admin only."""
    user = await db["users"].find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    await db["users"].update_one({"id": user_id}, {"$set": {"is_active": False}})
    return {"message": f"User {user['email']} has been deactivated"}
