"""CRUD endpoints for resumes (Feature 2/7/8: editor persistence + dashboard).

Documents are stored in MongoDB's `resumes` collection, one per resume:
    {"_id": <uuid str>, "title": str, "data": {...full Resume JSON...},
     "created_at": datetime, "updated_at": datetime}
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument
from pymongo.collection import Collection

from app.db import get_resumes_collection
from app.models.schema import Resume

router = APIRouter(prefix="/resumes", tags=["resumes"])


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _document_to_resume(document: dict[str, Any]) -> Resume:
    data = dict(document["data"])
    data["id"] = document["_id"]
    data["title"] = document["title"]
    data["createdAt"] = document["created_at"].isoformat()
    data["updatedAt"] = document["updated_at"].isoformat()
    return Resume.model_validate(data)


@router.get("", response_model=list[Resume])
def list_resumes(
    collection: Collection = Depends(get_resumes_collection),
) -> list[Resume]:
    documents = collection.find().sort("updated_at", -1)
    return [_document_to_resume(d) for d in documents]


@router.post("", response_model=Resume, status_code=201)
def create_resume(
    resume: Resume, collection: Collection = Depends(get_resumes_collection)
) -> Resume:
    now = _utcnow()
    document = {
        "_id": str(uuid.uuid4()),
        "title": resume.title or "Untitled Resume",
        "data": resume.model_dump(exclude={"id", "createdAt", "updatedAt"}),
        "created_at": now,
        "updated_at": now,
    }
    collection.insert_one(document)
    return _document_to_resume(document)


@router.get("/{resume_id}", response_model=Resume)
def get_resume(
    resume_id: str, collection: Collection = Depends(get_resumes_collection)
) -> Resume:
    document = collection.find_one({"_id": resume_id})
    if document is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    return _document_to_resume(document)


@router.put("/{resume_id}", response_model=Resume)
def update_resume(
    resume_id: str,
    resume: Resume,
    collection: Collection = Depends(get_resumes_collection),
) -> Resume:
    updates = {
        "title": resume.title or "Untitled Resume",
        "data": resume.model_dump(exclude={"id", "createdAt", "updatedAt"}),
        "updated_at": _utcnow(),
    }
    document = collection.find_one_and_update(
        {"_id": resume_id}, {"$set": updates}, return_document=ReturnDocument.AFTER
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    return _document_to_resume(document)


@router.delete("/{resume_id}", status_code=204)
def delete_resume(
    resume_id: str, collection: Collection = Depends(get_resumes_collection)
) -> None:
    result = collection.delete_one({"_id": resume_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
