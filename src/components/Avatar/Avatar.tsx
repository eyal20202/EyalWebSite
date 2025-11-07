import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AvatarProps {
  mood?: 'neutral' | 'happy' | 'thinking' | 'surprised' | 'sleeping';
  size?: 'small' | 'large';
  floating?: boolean;
  onClick?: () => void;
}

export default function Avatar({
  mood = 'neutral',
  size = 'large',
  floating = false,
  onClick,
}: AvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [currentMood, setCurrentMood] = useState(mood);

  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Auto-sleep after inactivity
  useEffect(() => {
    if (mood === 'neutral') {
      const sleepTimer = setTimeout(() => {
        setCurrentMood('sleeping');
      }, 60000); // 1 minute

      return () => clearTimeout(sleepTimer);
    }
  }, [mood]);

  const sizeClasses = {
    small: 'w-16 h-16',
    large: 'w-32 h-32 md:w-40 md:h-40',
  };

  const getMoodSVG = () => {
    const baseSize = size === 'small' ? 64 : 128;
    const eyeY = baseSize * 0.4;
    const mouthY = baseSize * 0.65;

    switch (currentMood) {
      case 'happy':
        return (
          <svg
            width={baseSize}
            height={baseSize}
            viewBox={`0 0 ${baseSize} ${baseSize}`}
            className="w-full h-full"
          >
            {/* Face circle */}
            <circle
              cx={baseSize / 2}
              cy={baseSize / 2}
              r={baseSize / 2 - 4}
              fill="currentColor"
              className="text-primary-400 dark:text-primary-500"
            />
            {/* Happy eyes */}
            <circle
              cx={baseSize * 0.35}
              cy={eyeY}
              r={baseSize * 0.08}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            <circle
              cx={baseSize * 0.65}
              cy={eyeY}
              r={baseSize * 0.08}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            {/* Happy smile */}
            <path
              d={`M ${baseSize * 0.3} ${mouthY} Q ${baseSize / 2} ${baseSize * 0.75} ${baseSize * 0.7} ${mouthY}`}
              stroke="white"
              strokeWidth={baseSize * 0.03}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );

      case 'thinking':
        return (
          <svg
            width={baseSize}
            height={baseSize}
            viewBox={`0 0 ${baseSize} ${baseSize}`}
            className="w-full h-full"
          >
            <circle
              cx={baseSize / 2}
              cy={baseSize / 2}
              r={baseSize / 2 - 4}
              fill="currentColor"
              className="text-primary-400 dark:text-primary-500"
            />
            {/* Thinking eyes (looking up) */}
            <circle
              cx={baseSize * 0.35}
              cy={eyeY - baseSize * 0.05}
              r={baseSize * 0.08}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            <circle
              cx={baseSize * 0.65}
              cy={eyeY - baseSize * 0.05}
              r={baseSize * 0.08}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            {/* Thinking mouth (small line) */}
            <line
              x1={baseSize * 0.4}
              y1={mouthY}
              x2={baseSize * 0.6}
              y2={mouthY}
              stroke="white"
              strokeWidth={baseSize * 0.03}
              strokeLinecap="round"
            />
          </svg>
        );

      case 'surprised':
        return (
          <svg
            width={baseSize}
            height={baseSize}
            viewBox={`0 0 ${baseSize} ${baseSize}`}
            className="w-full h-full"
          >
            <circle
              cx={baseSize / 2}
              cy={baseSize / 2}
              r={baseSize / 2 - 4}
              fill="currentColor"
              className="text-primary-400 dark:text-primary-500"
            />
            {/* Surprised eyes (big) */}
            <circle
              cx={baseSize * 0.35}
              cy={eyeY}
              r={baseSize * 0.12}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            <circle
              cx={baseSize * 0.65}
              cy={eyeY}
              r={baseSize * 0.12}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            {/* Surprised mouth (O shape) */}
            <ellipse
              cx={baseSize / 2}
              cy={mouthY}
              rx={baseSize * 0.1}
              ry={baseSize * 0.15}
              fill="white"
            />
          </svg>
        );

      case 'sleeping':
        return (
          <svg
            width={baseSize}
            height={baseSize}
            viewBox={`0 0 ${baseSize} ${baseSize}`}
            className="w-full h-full"
          >
            <circle
              cx={baseSize / 2}
              cy={baseSize / 2}
              r={baseSize / 2 - 4}
              fill="currentColor"
              className="text-primary-300 dark:text-primary-600"
            />
            {/* Sleeping eyes (closed) */}
            <path
              d={`M ${baseSize * 0.25} ${eyeY} Q ${baseSize * 0.35} ${eyeY + baseSize * 0.05} ${baseSize * 0.45} ${eyeY}`}
              stroke="white"
              strokeWidth={baseSize * 0.03}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${baseSize * 0.55} ${eyeY} Q ${baseSize * 0.65} ${eyeY + baseSize * 0.05} ${baseSize * 0.75} ${eyeY}`}
              stroke="white"
              strokeWidth={baseSize * 0.03}
              fill="none"
              strokeLinecap="round"
            />
            {/* Sleeping mouth (small z) */}
            <path
              d={`M ${baseSize * 0.4} ${mouthY} L ${baseSize * 0.5} ${mouthY + baseSize * 0.05} L ${baseSize * 0.6} ${mouthY}`}
              stroke="white"
              strokeWidth={baseSize * 0.03}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );

      default: // neutral
        return (
          <svg
            width={baseSize}
            height={baseSize}
            viewBox={`0 0 ${baseSize} ${baseSize}`}
            className="w-full h-full"
          >
            <circle
              cx={baseSize / 2}
              cy={baseSize / 2}
              r={baseSize / 2 - 4}
              fill="currentColor"
              className="text-primary-400 dark:text-primary-500"
            />
            {/* Neutral eyes */}
            <circle
              cx={baseSize * 0.35}
              cy={eyeY}
              r={baseSize * 0.08}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            <circle
              cx={baseSize * 0.65}
              cy={eyeY}
              r={baseSize * 0.08}
              fill="white"
              className={isBlinking ? 'opacity-0' : 'opacity-100'}
            />
            {/* Neutral mouth */}
            <line
              x1={baseSize * 0.35}
              y1={mouthY}
              x2={baseSize * 0.65}
              y2={mouthY}
              stroke="white"
              strokeWidth={baseSize * 0.03}
              strokeLinecap="round"
            />
          </svg>
        );
    }
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${floating ? 'fixed bottom-6 left-6 z-50 cursor-pointer' : ''}
        transition-all duration-300
        ${onClick ? 'hover:scale-110' : ''}
        ${currentMood === 'sleeping' ? 'opacity-70' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label="Avatar"
    >
      {getMoodSVG()}
    </div>
  );
}

