from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DocumentInfo(BaseModel):
    """Information about an uploaded document."""
    id: str
    filename: str
    upload_time: datetime
    page_count: int
    chunk_count: int


class DocumentListResponse(BaseModel):
    """Response for listing documents."""
    documents: List[DocumentInfo]


class UploadResponse(BaseModel):
    """Response after uploading a document."""
    success: bool
    message: str
    document: Optional[DocumentInfo] = None


class QueryRequest(BaseModel):
    """Request for querying a document."""
    question: str = Field(..., min_length=1, max_length=1000)
    document_id: str


class QueryResponse(BaseModel):
    """Response from a query."""
    answer: str
    sources: List[str] = []
    

class DeleteResponse(BaseModel):
    """Response after deleting a document."""
    success: bool
    message: str
