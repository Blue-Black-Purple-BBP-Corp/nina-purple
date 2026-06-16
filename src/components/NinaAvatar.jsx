import React from 'react';
import { ninaIcon } from '@/lib/images';

export default function NinaAvatar({ size = 'md', className = '', glow = false }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizes[size]} ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-[#F5A800] opacity-20 blur-xl scale-150" />
      )}
      <img
        src={ninaIcon}
        alt="Nina"
        className={`relative z-10 w-full h-full object-contain rounded-full ${glow ? 'drop-shadow-[0_0_12px_rgba(245,168,0,0.5)]' : ''}`}
      />
    </div>
  );
}