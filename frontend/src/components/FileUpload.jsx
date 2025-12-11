import { useState, useCallback } from 'react';
import { uploadDocument } from '../services/api';

/**
 * FileUpload component with drag-and-drop support for PDF files.
 */
export default function FileUpload({ onUploadSuccess }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, []);

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = async (file) => {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setError('Please upload a PDF file');
            return;
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate progress (actual upload doesn't provide progress events easily)
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            const result = await uploadDocument(file);
            clearInterval(progressInterval);
            setUploadProgress(100);

            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
                if (onUploadSuccess) {
                    onUploadSuccess(result.document);
                }
            }, 500);
        } catch (err) {
            clearInterval(progressInterval);
            setIsUploading(false);
            setUploadProgress(0);
            setError(err.message);
        }
    };

    return (
        <div className="w-full">
            <div
                className={`upload-zone ${isDragging ? 'active' : ''} ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && document.getElementById('file-input').click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center justify-center text-center">
                    {isUploading ? (
                        <>
                            {/* Uploading state */}
                            <div className="w-16 h-16 mb-4 relative">
                                <svg className="animate-spin w-full h-full text-primary-500" viewBox="0 0 24 24">
                                    <circle
                                        className="opacity-25"
                                        cx="12" cy="12" r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="none"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                            </div>
                            <p className="text-primary-400 font-medium mb-2">Processing document...</p>
                            <div className="w-48 h-2 bg-dark-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-dark-400 text-sm mt-2">{uploadProgress}%</p>
                        </>
                    ) : (
                        <>
                            {/* Default state */}
                            <div className="w-16 h-16 mb-4 text-dark-400">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-dark-200 mb-1">
                                {isDragging ? 'Drop your PDF here' : 'Upload a PDF document'}
                            </h3>
                            <p className="text-dark-400 text-sm">
                                Drag and drop or <span className="text-primary-400 hover:underline">browse</span>
                            </p>
                            <p className="text-dark-500 text-xs mt-2">Maximum file size: 50MB</p>
                        </>
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
