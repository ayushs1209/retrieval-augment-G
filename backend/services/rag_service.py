"""
RAG Service - Handles document loading, chunking, embedding, and retrieval.
Uses LangChain 1.1.0 with ChromaDB as the vector store and Google Gemini for Q&A.
"""

import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
load_dotenv()


class RAGService:
    """Service for RAG operations on PDF documents."""
    
    def __init__(
        self,
        upload_dir: str = "uploads",
        chroma_dir: str = "chroma_db",
        chunk_size: int = 2000,
        chunk_overlap: int = 400
    ):
        self.upload_dir = Path(upload_dir)
        self.chroma_dir = Path(chroma_dir)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Create directories
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize embeddings (using HuggingFace - free and local)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        # Initialize LLM (Google Gemini)
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            self.llm = ChatGoogleGenerativeAI(
                # model="gemma-3-27b-it",
                model="gemini-2.5-flash",
                google_api_key=api_key,
                temperature=0.3,
            )
        else:
            self.llm = None
            print("⚠️ Warning: GOOGLE_API_KEY not set. LLM features disabled.")
        
        # Document metadata storage
        self._documents: Dict[str, dict] = {}
        
        # Text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # RAG prompt template
        self.rag_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful AI assistant that answers questions based on the provided document context. 
            
Your task is to:
1. Carefully read and understand ALL the context provided from the document
2. Answer the user's question based ONLY on the information in the context
3. If the question asks for elaboration or details, provide comprehensive explanations from the context
4. If the context doesn't contain enough information to fully answer the question, say what you CAN answer and note what's missing
5. Be thorough and detailed in your answers - include all relevant information from the context
6. If referencing specific parts, mention the page numbers when available
7. Use bullet points or numbered lists when appropriate for clarity

Context from the document:
{context}"""),
            ("human", "{question}")
        ])
    
    def _get_collection_name(self, doc_id: str) -> str:
        """Get ChromaDB collection name for a document."""
        # ChromaDB collection names must be 3-63 chars, alphanumeric with underscores
        return f"doc_{doc_id.replace('-', '_')[:50]}"
    
    async def upload_document(self, file_path: str, original_filename: str) -> dict:
        """
        Upload and process a PDF document.
        
        Args:
            file_path: Path to the uploaded PDF file
            original_filename: Original name of the file
            
        Returns:
            Document info dict
        """
        doc_id = str(uuid.uuid4())
        
        # Move file to upload directory with unique name
        dest_path = self.upload_dir / f"{doc_id}.pdf"
        shutil.move(file_path, dest_path)
        
        # Load PDF
        loader = PyPDFLoader(str(dest_path))
        pages = loader.load()
        
        # Split into chunks
        chunks = self.text_splitter.split_documents(pages)
        
        # Add document ID to metadata
        for chunk in chunks:
            chunk.metadata["doc_id"] = doc_id
            chunk.metadata["source_file"] = original_filename
        
        # Create vector store for this document
        collection_name = self._get_collection_name(doc_id)
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=str(self.chroma_dir),
            collection_name=collection_name
        )
        
        # Store document info
        doc_info = {
            "id": doc_id,
            "filename": original_filename,
            "upload_time": datetime.now(),
            "page_count": len(pages),
            "chunk_count": len(chunks),
            "file_path": str(dest_path)
        }
        self._documents[doc_id] = doc_info
        
        return doc_info
    
    async def query_document(
        self, 
        doc_id: str, 
        question: str, 
        k: int = 8
    ) -> Tuple[str, List[str]]:
        """
        Query a document with a question using RAG.
        
        Args:
            doc_id: Document ID to query
            question: User's question
            k: Number of relevant chunks to retrieve
            
        Returns:
            Tuple of (answer, list of source snippets)
        """
        if doc_id not in self._documents:
            raise ValueError(f"Document {doc_id} not found")
        
        # Load vector store
        collection_name = self._get_collection_name(doc_id)
        vectorstore = Chroma(
            persist_directory=str(self.chroma_dir),
            embedding_function=self.embeddings,
            collection_name=collection_name
        )
        
        # Retrieve relevant chunks
        relevant_docs = vectorstore.similarity_search(question, k=k)
        
        if not relevant_docs:
            return "I couldn't find relevant information in the document to answer your question.", []
        
        # Build context from retrieved chunks with page references
        context_parts = []
        for doc in relevant_docs:
            page_num = doc.metadata.get("page", "unknown")
            context_parts.append(f"[Page {int(page_num) + 1 if isinstance(page_num, (int, float)) else page_num}]\n{doc.page_content}")
        
        context = "\n\n---\n\n".join(context_parts)
        
        # Generate answer using LLM
        answer = await self._generate_answer_with_llm(question, context)
        
        # Extract source snippets
        sources = [doc.page_content[:200] + "..." for doc in relevant_docs]
        
        return answer, sources
    
    async def _generate_answer_with_llm(self, question: str, context: str) -> str:
        """
        Generate an answer using the LLM based on retrieved context.
        """
        if not self.llm:
            return f"""⚠️ LLM not configured. Here's the relevant context from the document:

{context[:2000]}{"..." if len(context) > 2000 else ""}

---
*To enable AI-powered answers, set GOOGLE_API_KEY in your .env file.*"""
        
        try:
            # Create the prompt with context and question
            messages = self.rag_prompt.format_messages(
                context=context,
                question=question
            )
            
            # Get response from LLM
            response = await self.llm.ainvoke(messages)
            
            return response.content
            
        except Exception as e:
            return f"❌ Error generating answer: {str(e)}\n\nRelevant context:\n{context[:1000]}..."
    
    def get_document(self, doc_id: str) -> Optional[dict]:
        """Get document info by ID."""
        return self._documents.get(doc_id)
    
    def list_documents(self) -> List[dict]:
        """List all uploaded documents."""
        return list(self._documents.values())
    
    async def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document and its vector store.
        
        Args:
            doc_id: Document ID to delete
            
        Returns:
            True if deleted, False if not found
        """
        if doc_id not in self._documents:
            return False
        
        doc_info = self._documents[doc_id]
        
        # Delete PDF file
        pdf_path = Path(doc_info["file_path"])
        if pdf_path.exists():
            pdf_path.unlink()
        
        # Delete from ChromaDB
        try:
            collection_name = self._get_collection_name(doc_id)
            vectorstore = Chroma(
                persist_directory=str(self.chroma_dir),
                embedding_function=self.embeddings,
                collection_name=collection_name
            )
            vectorstore.delete_collection()
        except Exception:
            pass  # Collection might not exist
        
        # Remove from memory
        del self._documents[doc_id]
        
        return True


# Global instance
rag_service = RAGService()

