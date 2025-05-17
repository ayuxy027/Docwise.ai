import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const Logo = () => (
  <motion.div
    className="flex items-center justify-center gap-2"
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
      className="flex items-center gap-2.5"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
        <Sparkles size={16} className="text-white" />
      </div>
      <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
        Gemma Chat
      </span>
    </motion.div>
  </motion.div>
);
