import { deleteDocument } from '../services/api';

/**
 * DocumentList component for displaying and managing uploaded documents.
 */
export default function DocumentList({ documents, selectedDocument, onSelect, onDelete }) {
    const handleDelete = async (e, doc) => {
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
            return;
        }

        try {
            await deleteDocument(doc.id);
            if (onDelete) {
                onDelete(doc.id);
            }
        } catch (error) {
            alert(`Failed to delete: ${error.message}`);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 text-dark-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                </div>
                <p className="text-dark-500 text-sm">No documents uploaded</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {documents.map(doc => (
                <div
                    key={doc.id}
                    onClick={() => onSelect(doc)}
                    className={`document-card group ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                >
                    <div className="flex items-start gap-3">
                        {/* File icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedDocument?.id === doc.id
                                ? 'bg-primary-500/20 text-primary-400'
                                : 'bg-dark-700 text-dark-400 group-hover:bg-dark-600'
                            }`}>
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>

                        {/* File details */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-dark-200 truncate text-sm">
                                {doc.filename}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-dark-500">
                                <span>{doc.page_count} pages</span>
                                <span>•</span>
                                <span>{doc.chunk_count} chunks</span>
                            </div>
                            <p className="text-xs text-dark-600 mt-1">
                                {formatDate(doc.upload_time)}
                            </p>
                        </div>

                        {/* Delete button */}
                        <button
                            onClick={(e) => handleDelete(e, doc)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-dark-500 hover:text-red-400 transition-all"
                            title="Delete document"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>

                    {/* Selection indicator */}
                    {selectedDocument?.id === doc.id && (
                        <div className="mt-2 pt-2 border-t border-primary-500/20">
                            <div className="flex items-center gap-1.5 text-xs text-primary-400">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                </svg>
                                <span>Currently selected</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
