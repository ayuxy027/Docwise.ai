// src/services/llmService.ts

const OLLAMA_API = import.meta.env.VITE_OLLAMA_API;
const MODEL = import.meta.env.VITE_MODEL;

interface Message {
    content: string;
    role: 'user' | 'assistant';
  }
  
  export const generateResponse = async (messages: Message[]) => {
    try {
      const response = await fetch(`${OLLAMA_API}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          prompt: messages[messages.length - 1].content,
          stream: false,
        }),
      });
  
      if (!response.ok) throw new Error('Network response was not ok');
  
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  };