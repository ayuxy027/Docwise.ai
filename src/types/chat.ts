export interface MessageContent {
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  type?: string;
  size?: number;
  context?: string;
  error?: string;
}

export type FileType = 'image' | 'audio' | 'video' | 'document' | 'other';

export interface Message {
  content: MessageContent;
  role: 'user' | 'assistant';
  type: FileType | 'text';
}

export interface ChatMessage extends Omit<Message, 'role'> {
  isUser: boolean;
  timestamp: number;
  error?: string;
}

export interface ApiResponse {
  response: string;
  url?: string;
} 