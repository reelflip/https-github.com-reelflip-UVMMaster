import React, { useState, useRef, useEffect } from 'react';
import { UvmComponentType, ChatMessage } from '../types';
import { streamChatResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  activeComponent: UvmComponentType;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeComponent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear chat when component context changes drastically? No, preserve context but announce change visually if needed.
  // Actually, let's keep the history so user can compare.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsgPlaceholder: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      content: '',
      isLoading: true
    };
    setMessages(prev => [...prev, modelMsgPlaceholder]);

    try {
      // Prepare history for API
      const historyApiFormat = messages.map(m => ({ role: m.role, content: m.content }));
      
      const stream = await streamChatResponse(historyApiFormat, userMsg.content, activeComponent);
      
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === modelMsgId 
            ? { ...msg, content: fullText, isLoading: false } 
            : msg
        ));
      }

    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, content: "Error connecting to AI tutor.", isLoading: false } 
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-uvm-panel border-l border-gray-700 w-80 md:w-96 shrink-0">
      <div className="p-4 border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm">
        <h3 className="font-semibold text-white">AI Tutor</h3>
        <p className="text-xs text-gray-400">Ask about <span className="text-uvm-accent">{activeComponent}</span></p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10 text-sm">
            <p>Ask a specific question about the {activeComponent}.</p>
            <p className="mt-2 text-xs">e.g., "How does the driver get items?"</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-uvm-accent text-gray-900 font-medium rounded-tr-none' 
                : 'bg-gray-700 text-gray-200 rounded-tl-none'
            }`}>
              {msg.role === 'model' && msg.isLoading && !msg.content ? (
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </span>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-uvm-accent focus:ring-1 focus:ring-uvm-accent"
            disabled={isStreaming}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;