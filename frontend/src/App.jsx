import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/api';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await listDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleUploadSuccess = (document) => {
    setDocuments(prev => [document, ...prev]);
    setSelectedDocument(document);
    setShowUpload(false);
  };

  const handleDeleteDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (selectedDocument?.id === docId) {
      setSelectedDocument(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-dark-100">DocuChat</h1>
                <p className="text-xs text-dark-500">AI-Powered Document Q&A</p>
              </div>
            </div>

            {/* Upload button */}
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Upload PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex">
          {/* Sidebar */}
          <aside className="w-80 border-r border-dark-800 flex flex-col bg-dark-900/30">
            {/* Documents header */}
            <div className="p-4 border-b border-dark-800">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-dark-200">Documents</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-dark-800 text-dark-400">
                  {documents.length}
                </span>
              </div>
            </div>

            {/* Upload panel (collapsible) */}
            {showUpload && (
              <div className="p-4 border-b border-dark-800 bg-dark-900/50">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            )}

            {/* Document list */}
            <div className="flex-1 overflow-y-auto p-4">
              <DocumentList
                documents={documents}
                selectedDocument={selectedDocument}
                onSelect={setSelectedDocument}
                onDelete={handleDeleteDocument}
              />
            </div>
          </aside>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-dark-950/50">
            <ChatInterface selectedDocument={selectedDocument} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-3 px-4 text-center">
        <p className="text-xs text-dark-600">
          Powered by LangChain • ChromaDB • HuggingFace Embeddings
        </p>
      </footer>
    </div>
  );
}

export default App;
