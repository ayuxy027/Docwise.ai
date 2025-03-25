// src/services/llmService.ts

import type { Message, ApiResponse, FileType } from '../types/chat';

const OLLAMA_API = import.meta.env.VITE_OLLAMA_API;
const MODEL = import.meta.env.VITE_MODEL;

// Add file type utilities
export const getFileType = (file: File): FileType => {
  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
  return 'other';
};

// Update uploadFile function to use FormData with proper metadata
export const uploadFile = async (file: File): Promise<string> => {
  try {
    // For development/demo purposes, create a local URL
    // Remove this in production and use actual upload service
    const localUrl = URL.createObjectURL(file);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return local URL for demo
    return localUrl;

    // Production implementation would look like this:
    /*
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', getFileType(file));
    formData.append('name', file.name);
    
    const response = await fetch(`${OLLAMA_API}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
    
    const data = await response.json() as ApiResponse;
    if (!data.url) {
      throw new Error('Upload response missing URL');
    }
    
    return data.url;
    */
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

interface GeneratePayload {
  model: string;
  stream: boolean;
  prompt: string;
  image?: string;
  audio?: string;
}

export const generateResponse = async (messages: Message[]): Promise<string> => {
  try {
    const lastMessage = messages[messages.length - 1];
    const payload: GeneratePayload = {
      model: MODEL,
      stream: false,
      prompt: lastMessage.content.text || '',
    };

    // Properly handle file content based on type
    if (lastMessage.type === 'image' && lastMessage.content.fileUrl) {
      payload.image = lastMessage.content.fileUrl;
      // If no context was provided, add a default prompt for image analysis
      if (!payload.prompt) {
        payload.prompt = "Please analyze this image and describe what you see.";
      }
    } else if (lastMessage.type === 'audio' && lastMessage.content.fileUrl) {
      payload.audio = lastMessage.content.fileUrl;
      if (!payload.prompt) {
        payload.prompt = "Please analyze this audio file.";
      }
    }

    console.log('Sending payload to API:', payload); // Debug log

    const response = await fetch(`${OLLAMA_API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API error (${response.status}): ${errorData}`);
    }

    const data = await response.json() as ApiResponse;
    return data.response;
  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};