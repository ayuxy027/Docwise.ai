import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { colors } from '../constants/theme';

export const Logo = () => (
  <motion.div
    className="flex items-center justify-center gap-3 py-5 border-b w-full"
    style={{ borderColor: colors.primary.border }}
  >
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="flex items-center gap-3"
    >
      <Brain size={28} className="text-white" />
      <span className="text-2xl font-bold tracking-tight text-white">
        AI Chat
      </span>
    </motion.div>
  </motion.div>
);
