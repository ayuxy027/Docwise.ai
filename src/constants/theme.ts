export const colors = {
  primary: {
    bg: '#0F0E17', // Deep space black
    text: '#FFFFFE',
    accent: '#FF8906', // Vibrant orange
    border: '#232323',
  },
  secondary: {
    bg: '#1A1A25',
    text: '#A7A9BE',
    accent: '#F25F4C', // Coral red
  },
  accent: {
    primary: '#7F5AF0', // Electric purple
    secondary: '#2CB67D', // Neon green
    error: '#E53170', // Hot pink
    success: '#72F2EB', // Cyan
  },
  gradient: {
    primary: 'linear-gradient(135deg, #7F5AF0 0%, #2CB67D 100%)',
    funky: 'linear-gradient(45deg, #FF8906 0%, #F25F4C 50%, #E53170 100%)',
  },
} as const;