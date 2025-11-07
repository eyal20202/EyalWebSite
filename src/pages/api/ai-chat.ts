import type { APIRoute } from 'astro';
import { chatWithAI, type ChatContext, type ChatMessage } from '@lib/openai';

// Simple rate limiting (in-memory, for production use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // max requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

export const POST: APIRoute = async ({ request }) => {
  let messages: ChatMessage[] = [];
  let context: ChatContext | undefined;
  
  try {
    // Rate limiting
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    messages = body.messages;
    context = body.context;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const response = await chatWithAI(messages, context);

    // Always return a valid response, even if it's a fallback
    const finalResponse = response || 'מצטער, לא הצלחתי ליצור תשובה. נסה שוב מאוחר יותר.';

    return new Response(
      JSON.stringify({ message: finalResponse }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI chat API error:', error);
    
    // Return a fallback response instead of an error
    const lastMessage = messages[messages.length - 1]?.content || '';
    const { getFallbackResponse } = await import('@lib/openai');
    const fallbackResponse = getFallbackResponse(lastMessage, context, messages);
    
    return new Response(
      JSON.stringify({ message: fallbackResponse }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Add GET handler to avoid warning
export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
