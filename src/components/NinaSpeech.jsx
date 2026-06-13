import React from 'react';
import NinaAvatar from './NinaAvatar';
import { motion } from 'framer-motion';

export default function NinaSpeech({ message, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`flex items-start gap-3 ${className}`}
    >
      <NinaAvatar size="sm" glow />
      <div className="relative max-w-lg">
        {/* Speech bubble */}
        <div
          className="glass-card rounded-2xl rounded-tl-none px-5 py-4 text-foreground text-base leading-relaxed"
          style={{ borderColor: 'rgba(245,168,0,0.2)', boxShadow: '0 0 20px rgba(245,168,0,0.05)' }}
        >
          {message}
        </div>
      </div>
    </motion.div>
  );
}