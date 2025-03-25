// src/components/Chat.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { generateResponse, uploadFile, getFileType } from '../services/llmService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  // Paperclip, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  FileAudio, 
  FileVideo,
  FileText,
  File as FileIcon, 
  User, 
  Bot,
  // X,
  Plus,
  MessageSquare
} from 'lucide-react';
import type { ChatMessage } from '../types/chat';
import { colors } from '../constants/theme';
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

  const getFilePreview = () => {
    const type = getFileType(file);
    const icon = {
      image: <ImageIcon className="w-6 h-6" />,
      audio: <FileAudio className="w-6 h-6" />,
      video: <FileVideo className="w-6 h-6" />,
      document: <FileText className="w-6 h-6" />,
      other: <FileIcon className="w-6 h-6" />
    }[type];

    return (
      <div className="relative rounded-lg overflow-hidden bg-gray-900/50 p-4">
        {preview ? (
          <img 
            src={preview} 
            alt="Preview" 
            className="max-h-64 w-full object-contain rounded-lg"
          />
        ) : (
          <div className="flex items-center gap-3 text-gray-400">
            {icon}
            <span className="truncate">{file.name}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: `${colors.primary.bg}80` }}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="rounded-2xl p-6 max-w-lg w-full shadow-xl"
        style={{ backgroundColor: colors.secondary.bg }}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ color: colors.primary.text }}>
          Add Context
        </h3>
        
        {getFilePreview()}
        
        <div className="mt-4">
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Add some context about this file... (optional)"
            className="w-full rounded-xl p-4 min-h-[100px] transition-colors"
            style={{
              backgroundColor: colors.primary.bg,
              color: colors.primary.text,
              borderColor: colors.primary.border,
            }}
          />
        </div>
        
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl transition-colors"
            style={{ 
              backgroundColor: colors.secondary.accent,
              color: colors.secondary.text
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(context)}
            className="px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            style={{ 
              backgroundColor: colors.accent.primary,
              color: colors.primary.bg
            }}
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
    
    if (!url) return null;

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

// Add a funky message effect component
const MessageEffect = () => (
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
    <div className="absolute inset-0 bg-gradient-funky opacity-10 blur-xl" />
  </div>
);

// Update MessageBubble with funky effects
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 260,
          damping: 20
        }
      }}
      exit={{ 
        opacity: 0, 
        x: message.isUser ? 100 : -100,
        transition: {
          duration: 0.2
        }
      }}
      className={`flex items-start gap-3 group ${message.isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!message.isUser && (
        <motion.div
          whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-accent-primary"
        >
          <Bot size={18} className="text-primary-bg" />
        </motion.div>
      )}
      
      <div
        className="relative max-w-xl p-4 rounded-2xl shadow-lg overflow-hidden group"
        style={{ 
          backgroundColor: message.isUser ? colors.accent.primary : colors.secondary.bg,
          color: message.isUser ? colors.primary.bg : colors.primary.text,
        }}
      >
        <MessageEffect />
        <FilePreview message={message} />
        {message.content.text && (
          <p className="text-lg leading-relaxed mt-2 relative z-10">{message.content.text}</p>
        )}
      </div>

      {message.isUser && (
        <motion.div
          whileHover={{ scale: 1.1, rotate: [0, 10, -10, 0] }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: colors.accent.secondary }}
        >
          <User size={18} className="text-primary-bg" />
        </motion.div>
      )}
    </motion.div>
  );
};

const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex justify-start items-center gap-3"
  >
    <div className="w-8 h-8 rounded-full bg-accent-secondary flex items-center justify-center">
      <Bot size={18} />
    </div>
    <div className="bg-gray-900 text-white p-4 rounded-2xl flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-white rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  </motion.div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ icon, onClick, disabled, active, className, style }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`p-4 rounded-2xl disabled:opacity-50 transition-colors duration-200 ${
      active ? 'bg-accent-error' : 'bg-secondary-accent'
    } ${className}`}
    style={style}
  >
    {icon}
  </motion.button>
);

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
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
      const url = await uploadFile(pendingFile);
      const type = getFileType(pendingFile);

      // Create user message with file and context
      const userMessage: ChatMessage = {
        content: {
          fileUrl: url,
          fileName: pendingFile.name,
          type: pendingFile.type,
          size: pendingFile.size,
          context: context.trim() || undefined,
          text: context.trim(), // Add the context as text for the API
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
          fileUrl: url, // Include the file URL
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setPendingFile(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        const url = await uploadFile(file);
        
        const userMessage: ChatMessage = {
          content: { audioUrl: url },
          isUser: true,
          timestamp: Date.now(),
          type: 'audio',
        };

        setMessages(prev => [...prev, userMessage]);
        // Handle AI response...
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: colors.primary.bg }}>
      <header className="border-b" style={{ borderColor: colors.primary.border }}>
        <Logo />
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl"
            style={{ 
              backgroundColor: `${colors.accent.error}20`,
              borderColor: colors.accent.error,
              color: colors.accent.error
            }}
          >
            {error}
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

      <AnimatePresence>
        {pendingFile && (
          <FileUploadModal
            file={pendingFile}
            onSend={handleFileSend}
            onCancel={() => setPendingFile(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="border-t p-6 backdrop-blur-lg"
        style={{ 
          borderColor: colors.primary.border,
          background: `linear-gradient(to top, ${colors.primary.bg} 0%, transparent 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-funky blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative flex gap-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder="Send a funky message..."
                disabled={isLoading}
                className="w-full rounded-2xl px-6 py-4 text-lg transition-all duration-300"
                style={{
                  backgroundColor: `${colors.secondary.bg}CC`,
                  color: colors.primary.text,
                  borderColor: colors.primary.border,
                }}
              />
              
              <ActionButton
                icon={<Plus className="w-6 h-6" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-accent-primary text-primary-bg"
              />

              <ActionButton
                icon={isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                active={isRecording}
                className={isRecording ? 'bg-accent-error' : 'bg-accent-secondary'}
              />

              <ActionButton
                icon={<Send className="w-6 h-6" />}
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-funky"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="*/*"
        className="hidden"
      />
    </div>
  );
};

export default Chat;