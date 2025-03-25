import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { colors } from '../constants/theme';

const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex justify-start items-center gap-3"
  >
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ backgroundColor: colors.accent.primary }}
    >
      <Brain size={18} className="text-primary-bg" />
    </motion.div>
    <div className="relative p-4 rounded-2xl overflow-hidden" 
         style={{ backgroundColor: colors.secondary.bg }}>
      <div className="absolute inset-0 bg-gradient-funky opacity-10" />
      <div className="flex gap-2 relative z-10">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: colors.accent.primary }}
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

export default LoadingIndicator; 