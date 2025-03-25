import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';

export const Logo = () => (
  <motion.div
    className="flex items-center gap-2 px-4 py-2"
    whileHover={{ scale: 1.05 }}
  >
    <motion.div
      animate={{
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Brain size={32} className="text-accent-primary" />
    </motion.div>
    <span className="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
      ChamtGmpt
    </span>
  </motion.div>
);
