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
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    images?: string[];
  };
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
} 