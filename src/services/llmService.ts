// src/services/llmService.ts

import type { Message, FileType } from '../types/chat';
import * as pdfjs from 'pdfjs-dist';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = 'pdf.worker.js';

const OLLAMA_API = import.meta.env.VITE_OLLAMA_API;
const MODEL = import.meta.env.VITE_MODEL;
const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant that provides accurate, concise information. If you don't know something, admit it rather than guessing.";

// Add file type utilities
export const getFileType = (file: File): FileType => {
  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'document';
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

export const generateResponse = async (messages: Message[], systemPrompt?: string): Promise<string> => {
  try {
    const lastMessage = messages[messages.length - 1];
    
    // Debug logging to help diagnose issues
    console.log('Generating response for message type:', lastMessage.type);
    console.log('Message content keys:', Object.keys(lastMessage.content));

    // Prepare messages for the chat API
    const chatMessages = [];
    
    // Add system message if provided
    if (systemPrompt || DEFAULT_SYSTEM_PROMPT) {
      chatMessages.push({
        role: 'system',
        content: systemPrompt || DEFAULT_SYSTEM_PROMPT
      });
    }
    
    // If the last message is a file type, prepare content accordingly
    if (lastMessage.type !== 'text' && lastMessage.content.fileUrl) {
      let content = '';
      const context = lastMessage.content.context || '';
      
      switch (lastMessage.type) {
        case 'image':
          // For image, add the base64 image to the message
          if (lastMessage.content.base64) {
            chatMessages.push({
              role: 'user',
              content: context || 'Please analyze this image in detail.',
              images: [lastMessage.content.base64]
            });
          } else {
            chatMessages.push({
              role: 'user',
              content: 'There was an issue processing the image file. Please try again with a different image.'
            });
          }
          break;
          
        case 'audio':
          // For audio, handle with text description
          content = `[Audio: ${lastMessage.content.fileName || 'Uploaded audio'}] ${context || 'Please analyze this audio file.'}`;
          chatMessages.push({ role: 'user', content });
          break;
          
        case 'document':
          // For documents, include text content if available
          if (lastMessage.content.textContent) {
            content = `[Document: ${lastMessage.content.fileName || 'Uploaded document'}]\n\n${lastMessage.content.textContent}\n\n${context || 'Please analyze this document content.'}`;
          } else {
            content = `[Document: ${lastMessage.content.fileName || 'Uploaded document'}] ${context || 'Please analyze this document.'}`;
          }
          chatMessages.push({ role: 'user', content });
          break;
          
        case 'video':
        case 'other':
          content = `[File: ${lastMessage.content.fileName || 'Uploaded file'}] ${context || 'Please provide information about analyzing this type of file.'}`;
          chatMessages.push({ role: 'user', content });
          break;
      }
    } else {
      // Simple text message
      chatMessages.push({
        role: 'user',
        content: lastMessage.content.text || ''
      });
    }

    console.log('Sending chat messages to API:', chatMessages);

    const payload = {
      model: MODEL,
      messages: chatMessages,
      stream: false,
      options: {
        temperature: 0.7
      }
    };

    console.log('Sending to API:', payload);

    const response = await fetch(`${OLLAMA_API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error (${response.status})`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};

// Enhanced function to extract text from document files
export const extractTextFromDocument = async (file: File): Promise<string | null> => {
  try {
    // For text files
    if (file.type.startsWith('text/')) {
      return await file.text();
    }
    
    // For PDF files
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    }
    
    // For other document types, return null
    return null;
  } catch (error) {
    console.error('Error extracting text:', error);
    return null;
  }
};

// Function to extract text from PDF files
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let extractedText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      extractedText += `[Page ${i}]\n${pageText}\n\n`;
    }
    
    console.log(`Successfully extracted text from PDF with ${pdf.numPages} pages`);
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please try again with a different file.');
  }
};