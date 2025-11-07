# הוראות התקנה והגדרה

## התקנה ראשונית

1. התקן את ה-dependencies:
```bash
npm install
```

2. צור קובץ `.env` בהתבסס על `.env.example`:
```bash
cp .env.example .env
```

3. מלא את הערכים ב-`.env`:
   - `GITHUB_TOKEN` - Token מ-GitHub (אופציונלי - אם אין, יוצגו פרויקטים דוגמה)
   - `OPENAI_API_KEY` - מפתח API מ-OpenAI (אופציונלי אבל מומלץ מאוד!)
     - **ללא מפתח זה**: ה-AI Assistant יעבוד עם תשובות מוכנות מראש (fallback)
     - **עם מפתח זה**: ה-AI Assistant יעבוד עם GPT-4 של OpenAI - תשובות חכמות ודינמיות
     - ניתן להשיג מפתח ב: https://platform.openai.com/api-keys
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY` - אם משתמשים ב-Supabase
   - `PUBLIC_SITE_URL` - כתובת האתר לצורכי SEO
   - `PUBLIC_GITHUB_USERNAME` - שם המשתמש להצגת פרויקטים
   - `PUBLIC_WS_URL` - כתובת שרת ה-WebSocket למשחק (ברירת מחדל: http://localhost:3001)
   - `SCHEDULE_FROM_EMAIL` / `SCHEDULE_SMTP_*` - אם רוצים לשלוח קוד אימות דרך SMTP (ראו בהמשך)

## הרצת הפרויקט

### פיתוח
```bash
npm run dev
```
האתר יהיה זמין ב-`http://localhost:4321`

### בנייה לייצור
```bash
npm run build
```

### תצוגה מקדימה של הבנייה
```bash
npm run preview
```

## WebSocket Server (למשחק טריוויה)

השרת WebSocket רץ בנפרד:

1. התקן dependencies של השרת:
```bash
cd server
npm install
```

2. הרץ את השרת:
```bash
npm run dev
```

השרת ירוץ על פורט 3001 (או לפי `PORT` ב-env).

3. הגדר את `PUBLIC_WS_URL` ב-`.env`:
```
PUBLIC_WS_URL=http://localhost:3001
```

## הגדרת GitHub

1. צור Personal Access Token ב-GitHub:
   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - בחר את ה-scopes: `public_repo` (או `repo` לפרויקטים פרטיים)

2. הוסף את ה-token ל-`.env`:
```
GITHUB_TOKEN=your_token_here
```

3. עדכן את שם המשתמש להצגת פרויקטים:
   - ברירת המחדל היא `eyal20202`
   - ניתן לשנות דרך `PUBLIC_GITHUB_USERNAME` בקובץ `.env`

## הגדרת OpenAI

1. צור מפתח API ב-OpenAI:
   - https://platform.openai.com/api-keys

2. הוסף את המפתח ל-`.env`:
```
OPENAI_API_KEY=sk-...
```

## תוכן בלוג

הוסף פוסטים חדשים בתיקייה `src/content/blog/`:

```mdx
---
title: 'כותרת הפוסט'
description: 'תיאור קצר'
date: 2024-01-15
author: 'שם המחבר'
tags: ['תגית1', 'תגית2']
category: 'קטגוריה'
image: '/images/blog/example.jpg' # אופציונלי
readingTime: 5
---

תוכן הפוסט כאן...
```

## נגישות ו-SEO

- האתר כולל sitemap אוטומטי ב-`/sitemap.xml`
- RSS feed ב-`/rss.xml`
- Meta tags מלאים לכל דף
- תמיכה ב-RTL/LTR אוטומטית

## הערות

- האווטאר והעוזר AI עובדים גם ללא OpenAI API (אבל העוזר לא יענה)
- פרויקטים מ-GitHub יעבדו גם ללא token (אבל עם מגבלות rate limiting)
- משחק הטריוויה עובד גם ללא WebSocket server (רק מצב סולו)
- קביעת פגישה דורשת אימות מייל/טלפון. ברירת המחדל מציגה קוד במצב DEV ומדמה שליחה. כדי לשלוח קוד אמיתי:
  1. חברו ספק דוא"ל (למשל SendGrid, Resend או SMTP פרטי) בקובץ `src/pages/api/schedule.ts`
  2. השתמשו במשתני הסביבה `SCHEDULE_FROM_EMAIL`, `SCHEDULE_SMTP_HOST` וכו'
  3. עדכנו את ההערות בקוד בהתאם למדיניות האבטחה שלכם

