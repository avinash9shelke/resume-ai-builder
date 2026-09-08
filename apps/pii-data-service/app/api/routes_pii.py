"""Masking + unmasking endpoints backing the AI Improvement pipeline's
PII Masking & Anonymization Engine / Unmasking & Hydration Service steps
(see ARCHITECTURE.md)."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from redis import Redis

from app.db import get_redis
from app.services.masking import mask_text, unmask_value
from app.services.redis_store import load_mapping, save_mapping

router = APIRouter(tags=["pii"])


class MaskRequest(BaseModel):
    text: str


class MaskResponse(BaseModel):
    mapping_id: str
    masked_text: str


class UnmaskRequest(BaseModel):
    mapping_id: str
    data: Any


class UnmaskResponse(BaseModel):
    data: Any


@router.post("/mask", response_model=MaskResponse)
def mask(
    request: MaskRequest, redis_client: Redis = Depends(get_redis)
) -> MaskResponse:
    masked_text, mapping = mask_text(request.text)
    mapping_id = str(uuid.uuid4())
    save_mapping(redis_client, mapping_id, mapping)
    return MaskResponse(mapping_id=mapping_id, masked_text=masked_text)


@router.post("/unmask", response_model=UnmaskResponse)
def unmask(
    request: UnmaskRequest, redis_client: Redis = Depends(get_redis)
) -> UnmaskResponse:
    mapping = load_mapping(redis_client, request.mapping_id)
    return UnmaskResponse(data=unmask_value(request.data, mapping))
