export const colors = {
  primary: {
    bg: '#000000',
    text: '#FFFFFF',
    border: '#222222',
  },
  secondary: {
    bg: '#0D0D0D',
    text: '#F2F2F2',
    accent: '#1A1A1A',
  },
  accent: {
    primary: '#FFFFFF',
    secondary: '#222222',
    error: '#FF3333',
    success: '#00CC66',
  },
  gradient: {
    primary: 'linear-gradient(to right, #FFFFFF, #E0E0E0)',
    secondary: 'linear-gradient(to right, #222222, #111111)',
  },
  ui: {
    messageBubbleUser: '#FFFFFF',
    messageBubbleBot: '#111111',
    messageTextUser: '#000000',
    messageTextBot: '#FFFFFF',
    inputBackground: '#111111',
    buttonHover: '#F0F0F0',
  }
} as const;