import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app import models, schemas
from app.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
    build_token_payload,
)
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: schemas.UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public registration is disabled. Please contact your administrator.",
    )

    # Validate role
    try:
        role = models.UserRole(payload.role.upper())
    except (ValueError, AttributeError):
        role = models.UserRole.TASKER

    user_data = {
        "id": str(uuid.uuid4()),
        "email": payload.email,
        "full_name": payload.full_name,
        "hashed_password": get_password_hash(payload.password),
        "role": role.value,
        "active_role": role.value,
        "is_active": True,
        "avatar_url": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    await db["users"].insert_one(user_data)
    
    # Remove MongoDB's _id before returning/serializing
    if "_id" in user_data:
        del user_data["_id"]
        
    token = create_access_token(build_token_payload(user_data))
    return {"access_token": token, "token_type": "bearer", "user": user_data}


@router.post("/login", response_model=schemas.TokenResponse)
async def login(payload: schemas.UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db["users"].find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    token = create_access_token(build_token_payload(user))
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/switch-role", response_model=schemas.TokenResponse)
async def switch_role(
    payload: schemas.RoleSwitchRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    try:
        new_role = models.UserRole(payload.role.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {payload.role}. Must be ADMIN or TASKER",
        )

    # Only allow switching to roles the user has permission for
    if new_role == models.UserRole.ADMIN and current_user.get("role") != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have ADMIN privileges",
        )

    await db["users"].update_one(
        {"id": current_user["id"]},
        {"$set": {"active_role": new_role.value, "updated_at": datetime.now(timezone.utc)}}
    )
    
    user = await db["users"].find_one({"id": current_user["id"]})
    token = create_access_token(build_token_payload(user))
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=schemas.UserOut)
async def update_me(
    payload: schemas.UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    update_data = {}
    if payload.full_name is not None:
        update_data["full_name"] = payload.full_name
    if payload.avatar_url is not None:
        update_data["avatar_url"] = payload.avatar_url
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db["users"].update_one({"id": current_user["id"]}, {"$set": update_data})
    
    user = await db["users"].find_one({"id": current_user["id"]})
    return user
