import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BubbleRotatingTextProps {
  texts: string[];
  interval?: number;
  className?: string;
}

const BubbleRotatingText: React.FC<BubbleRotatingTextProps> = ({
  texts,
  interval = 3000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  // Find the longest word to set a consistent width
  const longestWord = texts.reduce((longest, current) => 
    current.length > longest.length ? current : longest
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#26272B] text-white shadow-lg font-space-grotesk font-bold"
        style={{ 
          minWidth: `${longestWord.length * 0.8}em`,
          width: 'fit-content'
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="whitespace-nowrap text-center"
          >
            {texts[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default BubbleRotatingText; 