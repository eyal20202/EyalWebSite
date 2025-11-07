import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedKeywordsProps {
  keywords: string[];
  interval?: number;
}

export default function AnimatedKeywords({
  keywords,
  interval = 3000,
}: AnimatedKeywordsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % keywords.length);
    }, interval);

    return () => clearInterval(timer);
  }, [keywords.length, interval]);

  return (
    <span className="inline-block min-w-[200px] text-left">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-primary-600 dark:text-primary-400 font-bold"
        >
          {keywords[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

