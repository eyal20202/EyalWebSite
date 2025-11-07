import { useState, useEffect, useRef } from 'react';
import type { ChatMessage, ChatContext } from '@lib/openai';
import { getFallbackResponse } from '@lib/openai';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
}

export default function AIAssistant({
  isOpen,
  onClose,
  context,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem('ai-chat-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Save chat history to localStorage
    if (messages.length > 0) {
      localStorage.setItem('ai-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If there's an error in the response, use fallback
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Check if we have a message in the response
      if (!data.message) {
        throw new Error('No message in response');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Try to provide a helpful fallback response based on the user's message
      const fallbackResponse = getFallbackResponse(userMessage.content, context);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: fallbackResponse,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('ai-chat-history');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 left-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] glass-panel flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-brand-500 flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-white">עוזר AI</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearHistory}
            className="text-sm text-gray-400 hover:text-primary-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
            title="נקה היסטוריה"
          >
            נקה
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            aria-label="סגור"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {messages.length === 0 && (
                 <div className="text-center text-gray-300 py-8">
                   <p className="text-lg mb-2">שלום! איך אוכל לעזור לך?</p>
                   <p className="text-sm text-gray-400 mb-4">
                     שאל אותי על התוכן באתר, בקש טיפים טכניים, או כל דבר אחר!
                   </p>
                   <div className="text-xs text-gray-500 bg-white/5 rounded-lg p-4 text-right space-y-2">
                     <p className="font-medium text-gray-400 mb-2">דוגמאות לשאלות:</p>
                     <ul className="space-y-1 text-gray-500">
                       <li>• מה הטכנולוגיות שאייל משתמש בהן?</li>
                       <li>• מה הניסיון שלו?</li>
                       <li>• מה הפרויקטים שלו?</li>
                       <li>• איך ליצור קשר?</li>
                       <li>• מה יש בבלוג?</li>
                       <li>• שאלות על Java, React, Node.js, Kafka, Kubernetes</li>
                     </ul>
                   </div>
                 </div>
               )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-primary-500 to-brand-500 text-white shadow-lg'
                  : 'bg-white/10 border border-white/10 text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 rounded-xl p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="שאל שאלה..."
            className="flex-1 px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-brand-500 text-white rounded-xl hover:shadow-lg shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            שלח
          </button>
        </div>
      </div>
    </div>
  );
}

