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

// Convert file to base64 for sending to API
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Strip the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

// Update uploadFile to handle both local display and API usage
export const uploadFile = async (file: File): Promise<{ url: string, base64?: string, file: File }> => {
  try {
    // Create local URL for display in UI
    const localUrl = URL.createObjectURL(file);
    
    // For image and audio which need base64 for API
    let base64: string | undefined;
    if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
      base64 = await fileToBase64(file);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
    return { url: localUrl, base64, file };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file. Please try again.');
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
    
    // Debug logging to help diagnose issues
    console.log('Generating response for message type:', lastMessage.type);
    console.log('Message content keys:', Object.keys(lastMessage.content));

    const payload: GeneratePayload = {
      model: MODEL,
      stream: false,
      prompt: '',
    };

    // Handle different message types
    if (lastMessage.type === 'text') {
      payload.prompt = lastMessage.content.text || '';
    } else if (lastMessage.content.fileUrl) {
      // Add context if provided
      const context = lastMessage.content.context || '';
      
      switch (lastMessage.type) {
        case 'image':
          // Use base64 data for images
          if (lastMessage.content.base64) {
            console.log('Processing image with base64 data (length):', lastMessage.content.base64.length);
            payload.image = lastMessage.content.base64;
            payload.prompt = context || 'Please analyze this image in detail.';
          } else {
            console.warn('Image upload missing base64 data');
            payload.prompt = 'There was an issue processing the image file. Please try again with a different image.';
          }
          break;
          
        case 'audio':
          // Use base64 data for audio
          if (lastMessage.content.base64) {
            payload.audio = lastMessage.content.base64;
            payload.prompt = context || 'Please analyze this audio file in detail.';
          } else {
            payload.prompt = 'There was an issue processing the audio file. Please try again with a different audio file.';
          }
          break;
          
        case 'document':
          // For documents, we'll extract text if possible and include it in the prompt
          if (lastMessage.content.textContent) {
            payload.prompt = `[Document: ${lastMessage.content.fileName || 'Uploaded document'}]\n\n${lastMessage.content.textContent}\n\n${context || 'Please analyze this document content.'}`;
          } else {
            payload.prompt = `[Document: ${lastMessage.content.fileName || 'Uploaded document'}] ${context || 'Please analyze this document. The user has uploaded a document file.'}\nFile type: ${lastMessage.content.type || 'unknown'}`;
          }
          break;
          
        case 'video':
          payload.prompt = `[Video: ${lastMessage.content.fileName || 'Uploaded video'}] ${context || 'Please provide information about analyzing this type of video file.'}\nFile type: ${lastMessage.content.type || 'unknown'}\nFile size: ${lastMessage.content.size ? Math.round(lastMessage.content.size/1024) + ' KB' : 'unknown'}`;
          break;
          
        case 'other':
          payload.prompt = `[File: ${lastMessage.content.fileName || 'Uploaded file'}] ${context || 'Please provide information about analyzing this type of file.'}\nFile type: ${lastMessage.content.type || 'unknown'}\nFile size: ${lastMessage.content.size ? Math.round(lastMessage.content.size/1024) + ' KB' : 'unknown'}`;
          break;
      }
    }

    // Log what's being sent to API (remove in production)
    console.log('Sending to API:', {
      ...payload,
      image: payload.image ? '(base64 data)' : undefined,
      audio: payload.audio ? '(base64 data)' : undefined,
    });

    const response = await fetch(`${OLLAMA_API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error (${response.status})`);
    }

    const data = await response.json() as ApiResponse;
    return data.response;
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};

// Function to extract text from document files (optional enhancement)
export const extractTextFromDocument = async (file: File): Promise<string | null> => {
  // Basic text extraction for text files
  if (file.type.startsWith('text/')) {
    try {
      const text = await file.text();
      return text;
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  }
  
  // For PDFs and other document types, you would need specialized libraries
  // For now, return null to indicate we can't extract text from non-text files
  return null;
};