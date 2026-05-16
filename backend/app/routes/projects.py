import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app import models, schemas
from app.auth import get_current_user, require_admin
from app.database import get_db

router = APIRouter(prefix="/projects", tags=["Projects"])


async def get_project_with_details(project_id: str, db: AsyncIOMotorDatabase):
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        return None
    
    # Fetch members
    members = await db["users"].find({"id": {"$in": project.get("member_ids", [])}}).to_list(length=100)
    project["members"] = members
    
    # Fetch owner
    owner = await db["users"].find_one({"id": project["owner_id"]})
    project["owner"] = owner
    
    # Count tasks
    task_count = await db["tasks"].count_documents({"project_id": project_id})
    project["task_count"] = task_count
    
    return project


@router.post("/", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: schemas.ProjectCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Create a new project - Admin only."""
    project_id = str(uuid.uuid4())
    project_data = {
        "id": project_id,
        "name": payload.name,
        "description": payload.description,
        "color": payload.color or "#628ECB",
        "is_active": True,
        "owner_id": current_user["id"],
        "member_ids": [current_user["id"]],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db["projects"].insert_one(project_data)
    
    return await get_project_with_details(project_id, db)


@router.get("/", response_model=List[schemas.ProjectOut])
async def list_projects(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List projects. Admins see all projects, Taskers see their assigned projects."""
    query = {"is_active": True}
    if current_user.get("active_role") != models.UserRole.ADMIN:
        query["member_ids"] = current_user["id"]
        
    projects = await db["projects"].find(query).to_list(length=100)
    
    for p in projects:
        # Shallow details for list
        p["task_count"] = await db["tasks"].count_documents({"project_id": p["id"]})
        # Note: Frontend might expect members to be populated even in list, 
        # but for performance we might want to keep it simple. 
        # The schema says members: List[UserOut] = [], so it's fine.
        p["members"] = await db["users"].find({"id": {"$in": p.get("member_ids", [])}}).to_list(length=100)

    return projects


@router.get("/{project_id}", response_model=schemas.ProjectOut)
async def get_project(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    project = await get_project_with_details(project_id, db)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check access
    if current_user.get("active_role") != models.UserRole.ADMIN:
        if current_user["id"] not in project.get("member_ids", []):
            raise HTTPException(status_code=403, detail="Access denied")

    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut)
async def update_project(
    project_id: str,
    payload: schemas.ProjectUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Update a project - Admin only."""
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.color is not None:
        update_data["color"] = payload.color
    if payload.is_active is not None:
        update_data["is_active"] = payload.is_active

    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db["projects"].update_one({"id": project_id}, {"$set": update_data})

    return await get_project_with_details(project_id, db)


@router.delete("/{project_id}", response_model=schemas.MessageResponse)
async def delete_project(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Delete a project - Admin only."""
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db["projects"].delete_one({"id": project_id})
    # Clean up tasks
    await db["tasks"].delete_many({"project_id": project_id})
    
    return {"message": f"Project '{project['name']}' deleted successfully"}


# ─── Member Management ────────────────────────────────────────────────────────

@router.post("/{project_id}/members", response_model=schemas.MessageResponse)
async def add_member(
    project_id: str,
    payload: schemas.AddMemberRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Add a member to a project - Admin only."""
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user = await db["users"].find_one({"id": str(payload.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["id"] in project.get("member_ids", []):
        raise HTTPException(status_code=409, detail="User is already a member")

    await db["projects"].update_one(
        {"id": project_id},
        {"$push": {"member_ids": user["id"]}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": f"{user['full_name']} added to project"}


@router.delete("/{project_id}/members/{user_id}", response_model=schemas.MessageResponse)
async def remove_member(
    project_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Remove a member from a project - Admin only."""
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if user_id == project["owner_id"]:
        raise HTTPException(status_code=400, detail="Cannot remove the project owner")

    await db["projects"].update_one(
        {"id": project_id},
        {"$pull": {"member_ids": user_id}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Member removed from project"}


@router.get("/{project_id}/members", response_model=List[schemas.UserOut])
async def list_members(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    project = await db["projects"].find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    members = await db["users"].find({"id": {"$in": project.get("member_ids", [])}}).to_list(length=100)
    return members
