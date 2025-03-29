export type FileType = 'image' | 'audio' | 'video' | 'document' | 'other';

export interface MessageContent {
  text?: string;
  fileUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
  fileName?: string;
  type?: string;
  size?: number;
  context?: string;
  base64?: string;
  textContent?: string | null;
}

export interface Message {
  content: MessageContent;
  role: 'user' | 'assistant';
  type: 'text' | FileType;
}

export interface ChatMessage {
  content: MessageContent;
  isUser: boolean;
  timestamp: number;
  type: 'text' | FileType;
}

export interface ApiResponse {
  response: string;
  // Add other API response fields if needed
} 