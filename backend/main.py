"""
FastAPI Backend for Document-Based RAG Application.
Provides endpoints for PDF upload, querying, and document management.
"""

import os
import tempfile
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.schemas import (
    DocumentInfo,
    DocumentListResponse,
    UploadResponse,
    QueryRequest,
    QueryResponse,
    DeleteResponse
)
from services.rag_service import rag_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("🚀 RAG API Server starting...")
    print(f"📁 Upload directory: {rag_service.upload_dir}")
    print(f"🗄️  ChromaDB directory: {rag_service.chroma_dir}")
    yield
    # Shutdown
    print("👋 RAG API Server shutting down...")


app = FastAPI(
    title="Document RAG API",
    description="API for document-based Retrieval Augmented Generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000", "http://localhost:5174","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "healthy", "service": "Document RAG API"}


@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a PDF document for processing.
    
    The document will be:
    1. Saved to the uploads directory
    2. Loaded and parsed
    3. Split into chunks
    4. Embedded and stored in ChromaDB
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )
    
    # Validate file size (max 50MB)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 50MB"
        )
    
    try:
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        # Process document
        doc_info = await rag_service.upload_document(tmp_path, file.filename)
        
        return UploadResponse(
            success=True,
            message=f"Successfully processed '{file.filename}' ({doc_info['page_count']} pages, {doc_info['chunk_count']} chunks)",
            document=DocumentInfo(
                id=doc_info["id"],
                filename=doc_info["filename"],
                upload_time=doc_info["upload_time"],
                page_count=doc_info["page_count"],
                chunk_count=doc_info["chunk_count"]
            )
        )
    except Exception as e:
        # Clean up temp file on error
        if 'tmp_path' in locals() and Path(tmp_path).exists():
            os.unlink(tmp_path)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing document: {str(e)}"
        )


@app.post("/query", response_model=QueryResponse)
async def query_document(request: QueryRequest):
    """
    Query a document with a question.
    
    Returns the answer along with source snippets from the document.
    """
    try:
        answer, sources = await rag_service.query_document(
            doc_id=request.document_id,
            question=request.question
        )
        return QueryResponse(answer=answer, sources=sources)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error querying document: {str(e)}"
        )


@app.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """List all uploaded documents."""
    docs = rag_service.list_documents()
    return DocumentListResponse(
        documents=[
            DocumentInfo(
                id=doc["id"],
                filename=doc["filename"],
                upload_time=doc["upload_time"],
                page_count=doc["page_count"],
                chunk_count=doc["chunk_count"]
            )
            for doc in docs
        ]
    )


@app.get("/documents/{doc_id}", response_model=DocumentInfo)
async def get_document(doc_id: str):
    """Get information about a specific document."""
    doc = rag_service.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentInfo(
        id=doc["id"],
        filename=doc["filename"],
        upload_time=doc["upload_time"],
        page_count=doc["page_count"],
        chunk_count=doc["chunk_count"]
    )


@app.delete("/documents/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str):
    """Delete a document and its vector store."""
    deleted = await rag_service.delete_document(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return DeleteResponse(
        success=True,
        message="Document deleted successfully"
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
