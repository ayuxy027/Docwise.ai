// src/components/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { generateResponse } from '../services/llmService';
import { Send, User, Bot, MessageSquare, Settings, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Define types
interface Message {
  content: {
    text: string;
  };
  isUser: boolean;
  timestamp: number;
}

interface SystemPromptModalProps {
  systemPrompt: string;
  onSave: (prompt: string) => void;
  onClose: () => void;
}

interface MessageBubbleProps {
  message: Message;
}

interface EmptyStateProps {
  onExampleClick: (example: string) => void;
}

// System prompt modal
const SystemPromptModal: React.FC<SystemPromptModalProps> = ({ systemPrompt, onSave, onClose }) => {
  const [prompt, setPrompt] = useState(systemPrompt);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#111111] rounded-xl p-6 max-w-lg w-full border border-[#333333] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">System Prompt</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="You are a helpful assistant..."
          className="w-full rounded-xl p-4 min-h-[150px] bg-[#0A0A0A] text-white border border-[#222222] focus:outline-none focus:border-white mb-4"
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-transparent text-white border border-[#333333] hover:border-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(prompt)}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-opacity-90"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Message bubble component
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div className={`flex items-start gap-3 ${message.isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      {!message.isUser && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600 shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}

      <div
        className={`relative max-w-[85%] md:max-w-[75%] p-4 rounded-lg shadow-sm ${message.isUser
          ? 'bg-blue-600 text-white'
          : 'bg-[#111111] text-white border border-[#222222]'
          }`}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content.text}</p>
      </div>

      {message.isUser && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#333333] shrink-0">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  );
};

// Loading indicator
const LoadingIndicator: React.FC = () => (
  <div className="flex justify-start items-center gap-3 mb-6">
    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
      <Bot size={16} className="text-white" />
    </div>
    <div className="bg-[#111111] text-white p-3 rounded-lg border border-[#222222] flex items-center">
      <div className="flex space-x-1.5">
        <motion.span
          className="w-2 h-2 bg-purple-400 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.span
          className="w-2 h-2 bg-purple-400 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop", delay: 0.2 }}
        />
        <motion.span
          className="w-2 h-2 bg-purple-400 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop", delay: 0.4 }}
        />
      </div>
      <span className="ml-3 text-sm opacity-75">Thinking...</span>
    </div>
  </div>
);

// Empty state
const EmptyState: React.FC<EmptyStateProps> = ({ onExampleClick }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-4">
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-6">
      <Sparkles size={32} className="text-white" />
    </div>
    <h2 className="text-xl md:text-2xl font-semibold text-white mb-3">
      How can I assist you today?
    </h2>
    <p className="text-gray-400 max-w-md mb-8">
      Ask me anything or upload an image, document, or audio file for analysis.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg w-full">
      {[
        "Explain quantum computing",
        "Write a short poem about AI",
        "Summarize the current AI landscape",
        "Tell me a fun fact"
      ].map((example) => (
        <button
          key={example}
          onClick={() => onExampleClick(example)}
          className="text-sm text-left px-4 py-3 bg-[#111111] rounded-lg border border-[#222222] hover:bg-[#1a1a1a] hover:border-purple-500 flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span>{example}</span>
        </button>
      ))}
    </div>
  </div>
);

// Main Chat component
const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant that provides accurate, concise information. If you don't know something, admit it rather than guessing.");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Focus the input field when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle example click
  const handleExampleClick = (example: string) => {
    setInputMessage(example);
    sendMessage(example);
  };

  // Send a message
  const sendMessage = async (text: string | null = null) => {
    const messageText = text || inputMessage;
    if (!messageText.trim()) return;

    // Clear input if sending from input field
    if (!text) setInputMessage('');

    // Add user message
    const userMessage: Message = {
      content: { text: messageText },
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Generate response
      const response = await generateResponse([{
        content: { text: messageText },
        role: 'user',
        type: 'text',
      }], systemPrompt);

      // Add AI message
      const aiMessage: Message = {
        content: { text: response },
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      // Add error message
      const errorMessage: Message = {
        content: { text: "Sorry, I encountered an error. Please try again." },
        isUser: false,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input field after response
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    // Focus input field after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Header */}
      <header className="bg-[#111] border-b border-[#222] p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold">Gemma Chat</h1>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-[#222] transition-colors"
          title="System Prompt"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* No messages state */}
        {messages.length === 0 ? (
          <EmptyState onExampleClick={handleExampleClick} />
        ) : (
          <>
            {/* Message list */}
            {messages.map((message) => (
              <MessageBubble key={message.timestamp} message={message} />
            ))}

            {/* Loading indicator */}
            {isLoading && <LoadingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#222] p-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Clear button */}
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-2 rounded-lg hover:bg-[#222] transition-colors text-gray-400 hover:text-white"
              title="Clear conversation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          )}

          {/* Input field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
              placeholder="Type a message..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-[#111] rounded-lg border border-[#333] focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 rounded-lg bg-purple-600 text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SystemPromptModal
          systemPrompt={systemPrompt}
          onSave={(newPrompt) => {
            setSystemPrompt(newPrompt);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Chat;