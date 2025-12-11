const API_BASE_URL = 'http://localhost:8000';

/**
 * Upload a PDF document to the backend.
 * @param {File} file - The PDF file to upload
 * @returns {Promise<Object>} Upload response with document info
 */
export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
}

/**
 * Query a document with a question.
 * @param {string} documentId - The document ID to query
 * @param {string} question - The question to ask
 * @returns {Promise<Object>} Query response with answer and sources
 */
export async function queryDocument(documentId, question) {
    const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            document_id: documentId,
            question: question,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Query failed');
    }

    return response.json();
}

/**
 * Get list of all uploaded documents.
 * @returns {Promise<Object>} List of documents
 */
export async function listDocuments() {
    const response = await fetch(`${API_BASE_URL}/documents`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch documents');
    }

    return response.json();
}

/**
 * Delete a document.
 * @param {string} documentId - The document ID to delete
 * @returns {Promise<Object>} Delete response
 */
export async function deleteDocument(documentId) {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Delete failed');
    }

    return response.json();
}
