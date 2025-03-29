// src/components/Chat.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { generateResponse, uploadFile, getFileType, extractTextFromDocument } from '../services/llmService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Image as ImageIcon, 
  FileAudio, 
  FileVideo,
  FileText,
  File as FileIcon, 
  User, 
  Bot,
  Plus,
  MessageSquare,
  Brain
} from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { Logo } from './Logo';

// New component for file upload preview and context input
interface FileUploadModalProps {
  file: File;
  onSend: (context: string) => void;
  onCancel: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ file, onSend, onCancel }) => {
  const [context, setContext] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#111111] rounded-lg p-6 max-w-lg w-full border border-[#333333]"
      >
        <h3 className="text-xl font-semibold mb-4 text-white">
          Add Context
        </h3>
        
        <div className="rounded-lg overflow-hidden bg-[#0A0A0A] border border-[#222222] p-4">
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-64 w-full object-contain rounded-lg"
            />
          ) : (
            <div className="flex items-center gap-3 text-gray-400 py-2">
              <FileIcon className="w-6 h-6" />
              <span className="truncate">{file.name}</span>
              <span className="text-xs text-gray-500 ml-auto">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </div>
        
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Add some context about this file... (optional)"
          className="mt-4 w-full rounded-lg p-4 min-h-[100px] bg-[#0A0A0A] text-white border border-[#222222] focus:outline-none focus:border-white"
        />
        
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-transparent text-white border border-[#333333] hover:border-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(context)}
            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-opacity-90 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FilePreview: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const getFileIcon = () => {
    switch (message.type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'audio':
        return <FileAudio className="w-5 h-5" />;
      case 'video':
        return <FileVideo className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileIcon className="w-5 h-5" />;
    }
  };

  const renderContent = () => {
    const { content, type } = message;
    const url = content.fileUrl || content.imageUrl || content.audioUrl;
    
    if (!url) {
      console.warn('Missing URL in file message', message);
      return null;
    }

    switch (type) {
      case 'image':
        return (
          <div className="relative group">
            <img 
              src={url} 
              alt={content.fileName || 'Uploaded image'}
              className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity" 
              loading="lazy"
              onClick={() => window.open(url, '_blank')}
            />
          </div>
        );
      case 'audio':
        return (
          <audio controls className="w-full">
            <source src={url} type="audio/*" />
          </audio>
        );
      case 'video':
        return (
          <video controls className="w-full rounded-lg">
            <source src={url} type="video/*" />
          </video>
        );
      case 'document':
      case 'other':
        return (
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-black/5 rounded-lg hover:bg-black/10 transition-colors"
          >
            {getFileIcon()}
            <span className="flex-1 truncate">
              {content.fileName || 'Download file'}
            </span>
            <FileIcon className="w-4 h-4 opacity-50" />
          </a>
        );
    }
  };

  return (
    <div className="space-y-3">
      {message.content.context && (
        <div className="flex items-start gap-2 text-sm text-gray-400">
          <MessageSquare className="w-4 h-4 mt-1" />
          <p>{message.content.context}</p>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

// Update MessageBubble with cleaner styling
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-start gap-3 ${message.isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      {!message.isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white">
          <Bot size={16} className="text-black" />
        </div>
      )}
      
      <div
        className={`relative max-w-[85%] p-4 rounded-lg shadow-sm ${
          message.isUser 
            ? 'bg-white text-black' 
            : 'bg-[#111111] text-white border border-[#222222]'
        }`}
      >
        <FilePreview message={message} />
        {message.content.text && (
          <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content.text}</p>
        )}
      </div>

      {message.isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#333333]">
          <User size={16} className="text-white" />
        </div>
      )}
    </motion.div>
  );
};

// Update LoadingIndicator for cleaner look
const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex justify-start items-center gap-3 mb-6"
  >
    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
      <Bot size={16} className="text-black" />
    </div>
    <div className="bg-[#111111] text-white p-4 rounded-lg border border-[#222222] flex items-center">
      <div className="flex space-x-1.5">
        <motion.span
          className="w-2 h-2 bg-white rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
        />
        <motion.span
          className="w-2 h-2 bg-white rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop", delay: 0.2 }}
        />
        <motion.span
          className="w-2 h-2 bg-white rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "loop", delay: 0.4 }}
        />
      </div>
      <span className="ml-3 text-sm opacity-75">Processing...</span>
    </div>
  </motion.div>
);

const MAX_FILE_SIZE_MB = 10; // 10MB max file size

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    setError(null);

    const userMessage: ChatMessage = {
      content: { text: inputMessage },
      isUser: true,
      timestamp: Date.now(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateResponse([{ 
        content: { text: inputMessage },
        role: 'user',
        type: 'text',
      }]);
      
      const aiMessage: ChatMessage = {
        content: { text: aiResponse },
        isUser: false,
        timestamp: Date.now(),
        type: 'text',
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`);
        if (event.target) {
          event.target.value = '';
        }
        return;
      }
      
      setPendingFile(file);
    }
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  const handleFileSend = async (context: string) => {
    if (!pendingFile) return;
    setIsLoading(true);
    setError(null);

    try {
      console.log('Processing file:', pendingFile.name, pendingFile.type);
      
      // Get file data including URL and base64 if applicable
      const fileData = await uploadFile(pendingFile);
      const type = getFileType(pendingFile);
      
      console.log('File type determined as:', type);
      console.log('Base64 data available:', !!fileData.base64);

      // For documents, try to extract text content
      let textContent = null;
      if (type === 'document') {
        textContent = await extractTextFromDocument(pendingFile);
        console.log('Extracted text content:', textContent ? 'Yes (length: ' + textContent.length + ')' : 'No');
      }

      // Create user message with file and context
      const userMessage: ChatMessage = {
        content: {
          fileUrl: fileData.url,
          fileName: pendingFile.name,
          type: pendingFile.type,
          size: pendingFile.size,
          context: context.trim() || undefined,
          text: context.trim(), // Add the context as text for the API
          base64: fileData.base64, // Add base64 data if available
          textContent: textContent, // Add extracted text content if available
        },
        isUser: true,
        timestamp: Date.now(),
        type,
      };

      setMessages(prev => [...prev, userMessage]);

      // Generate AI response with proper message structure
      const aiResponse = await generateResponse([{
        content: {
          text: context.trim(),
          fileUrl: fileData.url,
          base64: fileData.base64,
          textContent: textContent,
          fileName: pendingFile.name,
          type: pendingFile.type,
          size: pendingFile.size,
          context: context.trim(),
        },
        role: 'user',
        type, // Pass the correct file type
      }]);

      const aiMessage: ChatMessage = {
        content: { text: aiResponse },
        isUser: false,
        timestamp: Date.now(),
        type: 'text',
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error processing file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black">
      <Logo />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <Brain size={40} className="text-gray-700 mb-6" />
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
              How can I assist you today?
            </h2>
            <p className="text-gray-400 max-w-md">
              Ask me anything or upload an image, document, or audio file for analysis.
            </p>
          </div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-lg bg-red-500/5 text-red-400 border border-red-500/10 mb-4 max-w-md mx-auto"
          >
            <div className="flex items-start gap-2">
              <span className="text-red-400 shrink-0">⚠️</span>
              <span className="text-sm">{error}</span>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-xs text-red-400 underline mt-2 opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble key={message.timestamp} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#222222] p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
              placeholder="Type a message..."
              disabled={isLoading}
              className="w-full rounded-lg px-4 py-3.5 bg-[#111111] text-white border border-[#333333] focus:outline-none focus:border-white transition-colors"
            />
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 rounded-lg bg-[#111111] text-white border border-[#333333] hover:border-white transition-colors"
            title="Upload a file"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:hover:bg-white"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="*/*"
        className="hidden"
      />
      
      <AnimatePresence>
        {pendingFile && (
          <FileUploadModal
            file={pendingFile}
            onSend={handleFileSend}
            onCancel={() => setPendingFile(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;