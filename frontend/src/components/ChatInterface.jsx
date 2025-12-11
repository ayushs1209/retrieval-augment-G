import { useState, useRef, useEffect } from 'react';
import { queryDocument } from '../services/api';
import MessageBubble from './MessageBubble';

/**
 * ChatInterface component for Q&A interaction with uploaded documents.
 */
export default function ChatInterface({ selectedDocument }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reset messages when document changes
    useEffect(() => {
        if (selectedDocument) {
            setMessages([{
                id: Date.now(),
                content: `📄 **${selectedDocument.filename}** is ready!\n\nI've processed ${selectedDocument.page_count} pages into ${selectedDocument.chunk_count} searchable chunks. Ask me anything about this document!`,
                isUser: false,
                sources: []
            }]);
        } else {
            setMessages([]);
        }
    }, [selectedDocument]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !selectedDocument || isLoading) return;

        const question = inputValue.trim();
        setInputValue('');

        // Add user message
        const userMessage = {
            id: Date.now(),
            content: question,
            isUser: true
        };
        setMessages(prev => [...prev, userMessage]);

        // Get AI response
        setIsLoading(true);
        try {
            const response = await queryDocument(selectedDocument.id, question);

            const aiMessage = {
                id: Date.now() + 1,
                content: response.answer,
                isUser: false,
                sources: response.sources || []
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                id: Date.now() + 1,
                content: `❌ Error: ${error.message}`,
                isUser: false,
                sources: []
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!selectedDocument) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 text-dark-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-dark-300 mb-2">No document selected</h3>
                    <p className="text-dark-500 max-w-sm">
                        Upload a PDF document and select it to start asking questions
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(message => (
                    <MessageBubble
                        key={message.id}
                        message={message}
                        isUser={message.isUser}
                    />
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="message-bubble ai">
                            <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-dark-400 text-sm">Searching document...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-dark-800">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask a question about the document..."
                        className="input-field flex-1"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
