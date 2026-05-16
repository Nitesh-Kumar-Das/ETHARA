import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app import models, schemas
from app.auth import get_current_user, require_admin
from app.database import get_db

router = APIRouter(prefix="/tasks", tags=["Tasks"])


async def get_task_with_details(task_id: str, db: AsyncIOMotorDatabase):
    task = await db["tasks"].find_one({"id": task_id})
    if not task:
        return None
    
    # Fetch project
    project = await db["projects"].find_one({"id": task["project_id"]})
    task["project"] = project
    
    # Fetch assignee
    if task.get("assignee_id"):
        assignee = await db["users"].find_one({"id": task["assignee_id"]})
        task["assignee"] = assignee
    else:
        task["assignee"] = None
        
    # Fetch creator
    if task.get("creator_id"):
        creator = await db["users"].find_one({"id": task["creator_id"]})
        task["creator"] = creator
    else:
        task["creator"] = None
        
    return task


@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: schemas.TaskCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Create a task - Admin only."""
    project = await db["projects"].find_one({"id": str(payload.project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate assignee if provided
    if payload.assignee_id:
        assignee = await db["users"].find_one({"id": str(payload.assignee_id)})
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")

    # Validate status and priority
    try:
        task_status = models.TaskStatus(payload.status.upper()) if payload.status else models.TaskStatus.TODO
        task_priority = models.TaskPriority(payload.priority.upper()) if payload.priority else models.TaskPriority.MEDIUM
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    task_id = str(uuid.uuid4())
    task_data = {
        "id": task_id,
        "title": payload.title,
        "description": payload.description,
        "status": task_status.value,
        "priority": task_priority.value,
        "due_date": payload.due_date,
        "project_id": str(payload.project_id),
        "assignee_id": str(payload.assignee_id) if payload.assignee_id else None,
        "creator_id": current_user["id"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db["tasks"].insert_one(task_data)
    
    return await get_task_with_details(task_id, db)


@router.get("/", response_model=List[schemas.TaskOut])
async def list_tasks(
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee_id: Optional[str] = Query(None),
    overdue: Optional[bool] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List tasks with optional filters."""
    query = {}

    # Role-based filtering
    if current_user.get("active_role") == models.UserRole.TASKER:
        query["assignee_id"] = current_user["id"]

    if project_id:
        query["project_id"] = project_id
    if status:
        try:
            query["status"] = models.TaskStatus(status.upper()).value
        except ValueError:
            pass
    if priority:
        try:
            query["priority"] = models.TaskPriority(priority.upper()).value
        except ValueError:
            pass
    if assignee_id:
        query["assignee_id"] = assignee_id
    if overdue is True:
        now = datetime.now(timezone.utc)
        query["due_date"] = {"$lt": now}
        query["status"] = {"$ne": models.TaskStatus.DONE.value}

    cursor = db["tasks"].find(query).sort("created_at", -1)
    tasks = await cursor.to_list(length=100)
    
    # Enrich tasks for the response
    for task in tasks:
        # Shallow enrich for list
        task["project"] = await db["projects"].find_one({"id": task["project_id"]})
        if task.get("assignee_id"):
            task["assignee"] = await db["users"].find_one({"id": task["assignee_id"]})
        else:
            task["assignee"] = None

    return tasks


@router.get("/my-tasks", response_model=List[schemas.TaskOut])
async def get_my_tasks(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Get tasks assigned to the current user."""
    cursor = db["tasks"].find({"assignee_id": current_user["id"]}).sort("created_at", -1)
    tasks = await cursor.to_list(length=100)
    for task in tasks:
        task["project"] = await db["projects"].find_one({"id": task["project_id"]})
        task["assignee"] = current_user
    return tasks


@router.get("/{task_id}", response_model=schemas.TaskOut)
async def get_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = await get_task_with_details(task_id, db)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Taskers can only view their assigned tasks
    if current_user.get("active_role") == models.UserRole.TASKER:
        if task.get("assignee_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")

    return task


@router.put("/{task_id}", response_model=schemas.TaskOut)
async def update_task(
    task_id: str,
    payload: schemas.TaskUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Full task update - Admin only."""
    task = await db["tasks"].find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = {}
    if payload.title is not None:
        update_data["title"] = payload.title
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.status is not None:
        try:
            update_data["status"] = models.TaskStatus(payload.status.upper()).value
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")
    if payload.priority is not None:
        try:
            update_data["priority"] = models.TaskPriority(payload.priority.upper()).value
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid priority: {payload.priority}")
    if payload.due_date is not None:
        update_data["due_date"] = payload.due_date
    if payload.assignee_id is not None:
        if payload.assignee_id:
            assignee = await db["users"].find_one({"id": str(payload.assignee_id)})
            if not assignee:
                raise HTTPException(status_code=404, detail="Assignee not found")
            update_data["assignee_id"] = str(payload.assignee_id)
        else:
            update_data["assignee_id"] = None

    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db["tasks"].update_one({"id": task_id}, {"$set": update_data})

    return await get_task_with_details(task_id, db)


@router.patch("/{task_id}/status", response_model=schemas.TaskOut)
async def update_task_status(
    task_id: str,
    payload: schemas.TaskStatusUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update task status - Tasker can only update their own tasks."""
    task = await db["tasks"].find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Taskers can only update their own tasks
    if current_user.get("active_role") == models.UserRole.TASKER:
        if task.get("assignee_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only update your own tasks")

    try:
        new_status = models.TaskStatus(payload.status.upper()).value
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    await db["tasks"].update_one(
        {"id": task_id}, 
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return await get_task_with_details(task_id, db)


@router.delete("/{task_id}", response_model=schemas.MessageResponse)
async def delete_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """Delete a task - Admin only."""
    task = await db["tasks"].find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db["tasks"].delete_one({"id": task_id})
    return {"message": f"Task '{task['title']}' deleted successfully"}
