'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NivraLogo } from './NivraLogo';

interface NivraIntroAnimationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const NivraIntroAnimation: React.FC<NivraIntroAnimationProps> = ({
  onComplete,
  forceShow = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleDismiss = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 450);
  }, [onComplete]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('nivra_intro_shown_v1');
      if (!alreadyShown || forceShow) {
        sessionStorage.setItem('nivra_intro_shown_v1', 'true');

        // Asynchronous start to avoid synchronous cascading renders
        const startTimer = setTimeout(() => {
          setIsVisible(true);
          setHasStarted(true);
        }, 10);

        // Auto-dismiss after 2.4s
        const dismissTimer = setTimeout(() => {
          handleDismiss();
        }, 2400);

        const handleKeyDown = () => {
          handleDismiss();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
          clearTimeout(startTimer);
          clearTimeout(dismissTimer);
          window.removeEventListener('keydown', handleKeyDown);
        };
      } else {
        if (onComplete) onComplete();
      }
    }
  }, [forceShow, handleDismiss, onComplete]);


  if (!hasStarted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="nivra-intro-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#07080C] select-none cursor-pointer overflow-hidden"
        >

          {/* Ambient Cosmic Purple Atmosphere Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.45, 0.35], scale: [0.6, 1.2, 1.05] }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="absolute w-[600px] sm:w-[800px] h-[400px] sm:h-[500px] rounded-full bg-gradient-to-r from-[#9B4DFF]/25 via-[#7C3AED]/30 to-[#B377FF]/20 blur-[130px] pointer-events-none"
          />

          {/* Secondary Radial Light Beam */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ delay: 0.3, duration: 1.2 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(155,77,255,0.15)_0%,transparent_70%)] pointer-events-none"
          />

          {/* Central Logo Container */}
          <div className="relative z-10 flex flex-col items-center text-center px-4">
            {/* Logo with entrance scale and elevation */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <NivraLogo
                variant="horizontal"
                size="hero"
                colorVariant="purple"
                glow={true}
              />

              {/* Specular Light Sweep Effect across Logo */}
              <motion.div
                initial={{ x: '-120%', opacity: 0 }}
                animate={{ x: '220%', opacity: [0, 0.6, 0] }}
                transition={{ delay: 0.6, duration: 1.1, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] pointer-events-none"
              />
            </motion.div>

            {/* Subtitle / System Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-4 flex items-center gap-2 text-xs font-mono tracking-[0.3em] text-[#C69BFF]/80 uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>REVENUE INTELLIGENCE & PROSPECTING</span>
            </motion.div>

            {/* Subtle Progress Line */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 140, opacity: 0.5 }}
              transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
              className="mt-5 h-[1.5px] bg-gradient-to-r from-transparent via-[#9B4DFF] to-transparent rounded-full shadow-[0_0_12px_#9B4DFF]"
            />
          </div>

          {/* Skip Hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="absolute bottom-8 text-[11px] font-mono text-[#858593] hover:text-white transition-colors"
          >
            <span>Clique ou pressione qualquer tecla para continuar</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
