/**
 * MessageBubble component for displaying chat messages.
 */
export default function MessageBubble({ message, isUser }) {
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
                {/* Avatar for AI messages */}
                {!isUser && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-dark-700/50">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-dark-400">AI Assistant</span>
                    </div>
                )}

                {/* Message content */}
                <div className={`${isUser ? '' : 'text-dark-200'} whitespace-pre-wrap text-sm leading-relaxed`}>
                    {message.content}
                </div>

                {/* Sources for AI messages */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dark-700/50">
                        <p className="text-xs font-medium text-dark-400 mb-2">📚 Sources:</p>
                        <div className="space-y-2">
                            {message.sources.map((source, idx) => (
                                <div
                                    key={idx}
                                    className="text-xs text-dark-500 bg-dark-800/50 p-2 rounded-lg line-clamp-2"
                                >
                                    {source}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
