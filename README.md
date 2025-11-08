# 🌐 אתר חי

[https://eyal-web-site.vercel.app/games](https://eyal-web-site.vercel.app/games)

---

# אתר אישי מתקדם

אתר אישי מודרני בנוי עם Astro, React, Tailwind CSS, AI, ו-WebSockets.

## 🚀 תכונות

- 🚀 **ביצועים גבוהים** - Astro עם SSG/ISR
- 🌙 **Dark Mode** - תמיכה מלאה במצב כהה
- 🌍 **i18n** - עברית ואנגלית עם RTL/LTR
- 📝 **בלוג** - MDX עם syntax highlighting
- 🤖 **AI Assistant** - צ'אטבוט מבוסס GPT-4 (עובד גם בלי API key!)
- 🎮 **משחק טריוויה** - WebSocket multiplayer + Solo mode
- 📊 **GitHub Projects** - אינטגרציה עם GitHub API (עובד גם בלי token!)
- 🎨 **אווטאר אינטראקטיבי** - SVG עם אנימציות
- 📅 **קביעת פגישות** - מערכת אימות וקביעת פגישות

## 📦 התקנה

```bash
npm install
```

## 🛠️ פיתוח

```bash
npm run dev
```

האתר יהיה זמין ב-`http://localhost:4321`

## 🏗️ בנייה

```bash
npm run build
```

## 🌐 הפצה

### Vercel (מומלץ)

1. היכנס ל-[Vercel](https://vercel.com)
2. חבר את GitHub repository
3. Deploy אוטומטי!

ראה [DEPLOYMENT.md](./DEPLOYMENT.md) לפרטים מלאים.

### Netlify

1. היכנס ל-[Netlify](https://netlify.com)
2. חבר את GitHub repository
3. Deploy!

## ⚙️ Environment Variables

צור קובץ `.env`:

```bash
# אופציונלי - AI Assistant יעבוד גם בלי זה (עם תשובות בסיסיות)
OPENAI_API_KEY=sk-your-key-here

# אופציונלי - פרויקטים יעבדו גם בלי זה (עם fallback data)
GITHUB_TOKEN=your-github-token

# חובה לייצור
PUBLIC_SITE_URL=https://your-site.vercel.app
PUBLIC_GITHUB_USERNAME=eyal20202

# למשחק מרובה משתתפים (אם יש שרת WebSocket)
PUBLIC_WS_URL=https://your-websocket-server.com
```

**הערה חשובה**: האתר עובד מצוין גם בלי environment variables! 
- AI Assistant עובד עם תשובות בסיסיות
- פרויקטים מופיעים עם fallback data
- משחק סולו עובד בלי שרת WebSocket

ראה [SETUP.md](./SETUP.md) לפרטים נוספים.

## 📚 תיעוד

- [SETUP.md](./SETUP.md) - הוראות התקנה מפורטות
- [DEPLOYMENT.md](./DEPLOYMENT.md) - מדריך הפצה
- [AI_ASSISTANT_GUIDE.md](./AI_ASSISTANT_GUIDE.md) - מדריך לעוזר AI

## 📝 רישיון

MIT

