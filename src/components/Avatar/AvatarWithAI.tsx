import { useState } from 'react';
import Avatar from './Avatar';
import AIAssistant from '../AIAssistant/AIAssistant';
import type { ChatContext } from '@lib/openai';

interface AvatarWithAIProps {
  size?: 'small' | 'large';
  floating?: boolean;
  context?: ChatContext;
}

export default function AvatarWithAI({
  size = 'large',
  floating = false,
  context,
}: AvatarWithAIProps) {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [avatarMood, setAvatarMood] = useState<
    'neutral' | 'happy' | 'thinking' | 'surprised' | 'sleeping'
  >('neutral');

  const handleAvatarClick = () => {
    setIsAIOpen(!isAIOpen);
    setAvatarMood(isAIOpen ? 'neutral' : 'thinking');
  };

  const handleAIClose = () => {
    setIsAIOpen(false);
    setAvatarMood('neutral');
  };

  return (
    <>
      <Avatar
        mood={avatarMood}
        size={size}
        floating={floating}
        onClick={handleAvatarClick}
      />
      <AIAssistant
        isOpen={isAIOpen}
        onClose={handleAIClose}
        context={context}
      />
    </>
  );
}

