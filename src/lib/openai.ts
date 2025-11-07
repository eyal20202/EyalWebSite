import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!openaiClient) {
    const apiKey = import.meta.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not found in environment variables - using fallback responses');
      return null;
    }
    try {
      openaiClient = new OpenAI({ apiKey });
      console.log('OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      return null;
    }
  }
  return openaiClient;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  page: string;
  pageContent?: string;
  metadata?: Record<string, unknown>;
}

export function getFallbackResponse(
  lastMessage: string,
  context?: ChatContext,
  allMessages?: ChatMessage[]
): string {
  const lowerMessage = lastMessage.toLowerCase();
  
  // Check previous messages for context
  const previousMessages = allMessages?.slice(0, -1) || [];
  const conversationContext = previousMessages.map(m => m.content).join(' ').toLowerCase();
  
  // Context-based responses
  if (context?.page === 'projects') {
    if (lowerMessage.includes('java') || lowerMessage.includes('spring') || lowerMessage.includes('backend')) {
      return 'אייל עובד עם Java ו-Spring Boot בפרויקטים ארגוניים גדולים. הוא מתמחה בארכיטקטורת מיקרו-שירותים, Kafka למסרים, ו-Redis לקאשינג. אם יש לך שאלה ספציפית על מימוש, אשמח לעזור!';
    }
    if (lowerMessage.includes('react') || lowerMessage.includes('frontend') || lowerMessage.includes('ui') || lowerMessage.includes('ux')) {
      return 'הפרויקטים כוללים React עם TypeScript, Redux לניהול state, ו-React Native לאפליקציות מובייל. אייל בונה ממשקים מהירים עם Tailwind CSS ומתמחה ב-optimization של ביצועים.';
    }
    if (lowerMessage.includes('node') || lowerMessage.includes('express') || lowerMessage.includes('nestjs')) {
      return 'אייל עובד עם Node.js ו-Express בפרויקטים שונים. הוא בונה REST APIs, WebSocket servers, ומערכות real-time. הוא גם משתמש ב-TypeScript לכתיבת קוד בטוח יותר.';
    }
    if (lowerMessage.includes('docker') || lowerMessage.includes('kubernetes') || lowerMessage.includes('devops')) {
      return 'אייל מתמחה ב-DevOps עם Docker ו-Kubernetes. הוא בונה CI/CD pipelines, מגדיר containerization, ומנהל deployments ב-cloud. הוא עובד עם AWS, Azure, ו-GCP.';
    }
    return 'אייל עובד על פרויקטים מגוונים - מערכות Backend, מיקרו-שירותים, ואפליקציות Full Stack. מתמחה ב-Java, Node.js, React, ו-DevOps. מה מעניין אותך במיוחד?';
  }
  
  if (context?.page === 'blog') {
    if (lowerMessage.includes('מיקרו') || lowerMessage.includes('microservice') || lowerMessage.includes('ארכיטקטורה')) {
      return 'אייל כותב על מעבר ממונוליטים למיקרו-שירותים, תכנון ארכיטקטורה, תקשורת בין שירותים עם Kafka, וניהול state מבוזר. יש לו ניסיון מעשי בפרויקטים גדולים.';
    }
    if (lowerMessage.includes('ci/cd') || lowerMessage.includes('pipeline') || lowerMessage.includes('deployment')) {
      return 'הבלוג כולל מאמרים על בניית CI/CD pipelines, אוטומציה של בדיקות, Docker, Kubernetes, ו-best practices ל-deployment. אייל משתף תובנות מניסיון מעשי.';
    }
    return 'הבלוג כולל מאמרים על מיקרו-שירותים, CI/CD, אופטימיזציה של ביצועים, וסיפורים מהשטח. אייל משתף תובנות פרקטיות מפרויקטים אמיתיים. איזה נושא מעניין אותך?';
  }
  
  if (context?.page === 'games') {
    return 'משחק הטריוויה כולל שאלות על טכנולוגיות, ארכיטקטורות, ו-best practices. אתה יכול לשחק סולו או עם שחקנים אחרים בזמן אמת. רוצה לנסות?';
  }
  
  // General responses - expanded
  if (lowerMessage.includes('מי') || lowerMessage.includes('אודות') || lowerMessage.includes('about') || lowerMessage.includes('מי אתה')) {
    return 'אייל מזרחי הוא Mid-Senior Full Stack Developer עם 6+ שנות ניסיון. הוא מתמחה ב-Java, Node.js, React, מיקרו-שירותים, ו-Cloud (AWS, Azure). עובד ב-Code Oasis ובעבר ב-Amdocs.';
  }
  
  if (lowerMessage.includes('ניסיון') || lowerMessage.includes('experience') || lowerMessage.includes('עבודה') || lowerMessage.includes('קריירה')) {
    return 'אייל עובד ב-Code Oasis (2023-היום) וב-Amdocs (2021-2023). עובד על פרויקטים ארגוניים, פיתוח מיקרו-שירותים, בניית CI/CD pipelines, ועבודה עם Kafka, Redis, ו-Kubernetes.';
  }
  
  if (lowerMessage.includes('טכנולוגיות') || lowerMessage.includes('tech') || lowerMessage.includes('stack') || lowerMessage.includes('שפות') || lowerMessage.includes('tools')) {
    return 'הטכנולוגיות העיקריות: Backend - Java (Spring Boot), Node.js, Python. Frontend - React, TypeScript, React Native. Databases - MySQL, MongoDB, Redis. Cloud - AWS, Azure, GCP, Kubernetes, Docker. אייל גם עובד עם Kafka, RabbitMQ, ו-Elasticsearch.';
  }
  
  if (lowerMessage.includes('יצירת קשר') || lowerMessage.includes('contact') || lowerMessage.includes('פגישה') || lowerMessage.includes('מייל') || lowerMessage.includes('טלפון')) {
    return 'ניתן ליצור קשר דרך דף "צור קשר" באתר. אייל זמין בימים א-ה, 09:00-19:00. אפשר גם לשלוח מייל ל-eyal20202@gmail.com או להתקשר ל-052-6479304.';
  }
  
  if (lowerMessage.includes('פרויקט') || lowerMessage.includes('project') || lowerMessage.includes('github')) {
    return 'אייל עובד על פרויקטים מגוונים - מערכות FinTech, אפליקציות מובייל, פלטפורמות e-commerce, ומערכות enterprise. תוכל לראות את הפרויקטים בדף הפרויקטים. רוב הפרויקטים זמינים ב-GitHub.';
  }
  
  if (lowerMessage.includes('בלוג') || lowerMessage.includes('blog') || lowerMessage.includes('מאמר')) {
    return 'הבלוג כולל מאמרים טכניים על מיקרו-שירותים, CI/CD, אופטימיזציה, וסיפורים מהשטח. אייל משתף תובנות מפרויקטים אמיתיים. תוכל לקרוא את המאמרים בדף הבלוג.';
  }
  
  // Check for help/greeting questions first
  if (lowerMessage.includes('שלום') || lowerMessage.includes('היי') || lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('בוקר') || lowerMessage.includes('ערב')) {
    return 'שלום! אני עוזר AI של אייל מזרחי. אני יכול לעזור עם שאלות על הפרויקטים, הבלוג, הטכנולוגיות, הניסיון, או כל דבר אחר הקשור לעבודה שלו. מה תרצה לדעת?';
  }
  
  if (lowerMessage.includes('עזרה') || lowerMessage.includes('help') || lowerMessage.includes('מה אתה יכול') || lowerMessage.includes('במה') || lowerMessage.includes('מה אפשר') || lowerMessage.includes('מה תוכל')) {
    return 'אני יכול לעזור עם שאלות על: הפרויקטים של אייל, הטכנולוגיות שהוא משתמש בהן (Java, React, Node.js, Kafka, Kubernetes), הניסיון שלו, הבלוג, יצירת קשר, וכל דבר אחר הקשור לעבודה שלו. מה מעניין אותך?';
  }
  
  // Check for general questions
  if (lowerMessage.includes('?') || lowerMessage.includes('מה') || lowerMessage.includes('איך') || lowerMessage.includes('למה') || lowerMessage.includes('מתי') || lowerMessage.includes('איפה')) {
    // If it's a very general question, provide helpful guidance
    if (lowerMessage.length < 10 || lowerMessage === 'מה' || lowerMessage === 'איך' || lowerMessage === 'למה') {
      return 'אני יכול לעזור עם שאלות על הפרויקטים, הטכנולוגיות, הניסיון, או הבלוג של אייל. נסה לשאול שאלה ספציפית יותר, למשל: "מה הטכנולוגיות שאייל משתמש בהן?" או "מה הפרויקטים שלו?" או "מה הניסיון שלו?"';
    }
    // For longer questions, try to provide a helpful response
    return 'אני יכול לעזור עם שאלות על הפרויקטים, הטכנולוגיות, הניסיון, או הבלוג של אייל. נסה לשאול שאלה ספציפית יותר, למשל: "מה הטכנולוגיות שאייל משתמש בהן?" או "מה הפרויקטים שלו?"';
  }
  
  // Check for empty or very short messages
  if (lowerMessage.trim().length < 3) {
    return 'שלום! אני עוזר AI של אייל מזרחי. אני יכול לעזור עם שאלות על הפרויקטים, הבלוג, הטכנולוגיות, או כל דבר אחר הקשור לעבודה שלו. מה תרצה לדעת?';
  }
  
  // Additional specific responses
  if (lowerMessage.includes('שכר') || lowerMessage.includes('משכורת') || lowerMessage.includes('salary') || lowerMessage.includes('כמה')) {
    return 'אני לא יכול לספק מידע על שכר או תנאים כספיים. לשאלות כאלה, מומלץ ליצור קשר ישירות דרך דף "צור קשר".';
  }
  
  if (lowerMessage.includes('קורות חיים') || lowerMessage.includes('cv') || lowerMessage.includes('resume')) {
    return 'קורות החיים של אייל זמינים דרך דף "צור קשר" או LinkedIn. תוכל גם לבקש אותם ישירות במייל: eyal20202@gmail.com';
  }
  
  if (lowerMessage.includes('תחביבים') || lowerMessage.includes('hobbies') || lowerMessage.includes('פנאי')) {
    return 'אייל מתעניין בטכנולוגיה, פיתוח, וקריאת מאמרים טכניים. הוא גם כותב בלוג על ניסיונותיו בפרויקטים שונים.';
  }
  
  if (lowerMessage.includes('השכלה') || lowerMessage.includes('לימודים') || lowerMessage.includes('education') || lowerMessage.includes('תואר')) {
    return 'אייל הוא מפתח אוטודידקט עם ניסיון מעשי של 6+ שנים. הוא למד דרך פרויקטים אמיתיים, קורסים מקוונים, ותרגול מעשי.';
  }
  
  if (lowerMessage.includes('אתגרים') || lowerMessage.includes('challenges') || lowerMessage.includes('קשיים')) {
    return 'אייל מתמחה בפתרון אתגרים טכניים מורכבים - מעבר ממונוליטים למיקרו-שירותים, אופטימיזציה של ביצועים, והטמעת CI/CD. יש לו ניסיון עם מערכות גדולות ומורכבות.';
  }
  
  if (lowerMessage.includes('טיפים') || lowerMessage.includes('tips') || lowerMessage.includes('עצות')) {
    return 'אייל משתף טיפים וניסיון בבלוג שלו. תוכל לקרוא מאמרים על מיקרו-שירותים, CI/CD, אופטימיזציה, ו-best practices. יש לך שאלה ספציפית?';
  }
  
  if (lowerMessage.includes('קוד') || lowerMessage.includes('code') || lowerMessage.includes('דוגמה') || lowerMessage.includes('example')) {
    return 'אייל משתף קוד ופרויקטים ב-GitHub. תוכל לראות דוגמאות קוד בפרויקטים שלו. יש לך שאלה ספציפית על מימוש או ארכיטקטורה?';
  }
  
  if (lowerMessage.includes('ביצועים') || lowerMessage.includes('performance') || lowerMessage.includes('אופטימיזציה')) {
    return 'אייל מתמחה באופטימיזציה של ביצועים - קאשינג עם Redis, אופטימיזציה של queries, ו-scalability. הוא כותב על זה בבלוג שלו.';
  }
  
  if (lowerMessage.includes('בדיקות') || lowerMessage.includes('testing') || lowerMessage.includes('tests') || lowerMessage.includes('qa')) {
    return 'אייל עובד עם בדיקות אוטומטיות, CI/CD pipelines, ו-unit tests. הוא מתמחה בהטמעת בדיקות כחלק מתהליך הפיתוח.';
  }
  
  if (lowerMessage.includes('אבטחה') || lowerMessage.includes('security') || lowerMessage.includes('secure')) {
    return 'אייל עובד עם best practices לאבטחה - authentication, authorization, encryption, ו-secure APIs. הוא מתמחה בבניית מערכות מאובטחות.';
  }
  
  // Default helpful response with more variety
  const defaultResponses = [
    'אני יכול לעזור עם שאלות על הפרויקטים, הטכנולוגיות, הניסיון, או הבלוג של אייל. מה מעניין אותך?',
    'אייל מזרחי הוא Mid-Senior Full Stack Developer עם ניסיון במיקרו-שירותים, Cloud, ו-DevOps. מה תרצה לדעת עליו?',
    'אני יכול לעזור עם מידע על הפרויקטים של אייל, הטכנולוגיות שהוא משתמש בהן, או הבלוג שלו. מה תרצה לשאול?',
    'תוכל לשאול אותי על: הטכנולוגיות (Java, React, Node.js), הפרויקטים, הניסיון, הבלוג, או יצירת קשר. מה מעניין אותך?',
  ];
  
  // Use a simple hash of the message to pick a response (for variety)
  const hash = lowerMessage.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultResponses[hash % defaultResponses.length];
}

export async function chatWithAI(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<string | null> {
  const client = getOpenAIClient();
  
  // Use fallback if no API key
  if (!client) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const fallback = getFallbackResponse(lastMessage, context, messages);
    // Add a note that this is a fallback response
    return fallback + '\n\n(הערה: תשובה זו נוצרה ללא שימוש ב-AI. להפעלת AI מלא, יש להגדיר OPENAI_API_KEY)';
  }

  try {
    const systemPrompt = `אתה עוזר AI טכני ידידותי באתר אישי של אייל מזרחי, Mid-Senior Full Stack Developer.
אתה עוזר למשתמשים להבין תוכן טכני, עונה על שאלות, ונותן טיפים.

מידע על אייל:
- Mid-Senior Full Stack Developer עם 6+ שנות ניסיון
- מתמחה ב-Java, Node.js, React, מיקרו-שירותים, Cloud (AWS, Azure)
- עובד ב-Code Oasis (2023-היום) ובעבר ב-Amdocs
- עובד על פרויקטים ארגוניים ופיתוח Backend/Full Stack
- כותב בלוג על מיקרו-שירותים, CI/CD, ואופטימיזציה

${context ? `קונטקסט הדף הנוכחי: ${context.page}. ${context.pageContent ? `תוכן: ${context.pageContent.substring(0, 500)}` : ''}` : ''}

ענה בעברית, בצורה ידידותית ומקצועית. תן תשובות מדויקות ומועילות.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || null;
    
    if (aiResponse) {
      console.log('OpenAI response received successfully');
      return aiResponse;
    }
    
    // If no response, use fallback
    const lastMessage = messages[messages.length - 1]?.content || '';
    return getFallbackResponse(lastMessage, context, messages);
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Return fallback on error too
    const lastMessage = messages[messages.length - 1]?.content || '';
    return getFallbackResponse(lastMessage, context, messages) + '\n\n(הערה: אירעה שגיאה בחיבור ל-AI. תשובה זו נוצרה ללא שימוש ב-AI)';
  }
}

export async function summarizePost(content: string): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) {
    return null;
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'אתה עוזר שמסכם פוסטים בבלוג. תן סיכום קצר ומדויק בעברית.',
        },
        {
          role: 'user',
          content: `סכם את הפוסט הבא:\n\n${content.substring(0, 2000)}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('OpenAI summarization error:', error);
    return null;
  }
}

