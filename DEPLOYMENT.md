# מדריך הפצה והרצה בייצור

## העלאה ל-GitHub

הפרויקט כבר מוכן להעלאה. הרץ:

```bash
git push -u origin main
```

## הרצה בייצור

### אפשרות 1: Vercel (מומלץ - הכי קל)

1. **היכנס ל-Vercel**: https://vercel.com
2. **חבר את GitHub**:
   - לחץ על "New Project"
   - בחר את ה-repository `EyalWebSite`
3. **הגדר את הפרויקט**:
   - **Framework Preset**: Astro
   - **Root Directory**: `./` (ברירת מחדל)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** (אופציונלי):
   - `OPENAI_API_KEY` - אם רוצה AI מלא
   - `GITHUB_TOKEN` - אם רוצה פרויקטים אמיתיים מ-GitHub
   - `PUBLIC_GITHUB_USERNAME` - `eyal20202`
   - `PUBLIC_SITE_URL` - כתובת האתר ב-Vercel
5. **Deploy** - Vercel יבנה ויריץ את האתר אוטומטית!

**יתרונות Vercel**:
- ✅ חינמי לחלוטין
- ✅ HTTPS אוטומטי
- ✅ CDN גלובלי
- ✅ Deploy אוטומטי מ-GitHub
- ✅ תמיכה ב-Astro out of the box

### אפשרות 2: Netlify

1. **היכנס ל-Netlify**: https://netlify.com
2. **חבר את GitHub**:
   - לחץ על "Add new site" → "Import an existing project"
   - בחר את ה-repository
3. **הגדר את הפרויקט**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Environment Variables**: כמו ב-Vercel
5. **Deploy**!

### אפשרות 3: GitHub Pages (חינמי אבל מוגבל)

1. **התקן את ה-package**:
   ```bash
   npm install --save-dev @astrojs/node
   ```

2. **עדכן את `astro.config.mjs`**:
   ```js
   export default defineConfig({
     output: 'static', // כבר מוגדר
     site: 'https://eyal20202.github.io',
     // ...
   });
   ```

3. **צור GitHub Action** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

## שרת WebSocket (למשחק מרובה משתתפים)

**חשוב**: שרת ה-WebSocket צריך לרוץ בנפרד!

### אפשרויות:

1. **Railway** (חינמי עם מגבלות):
   - https://railway.app
   - העלה את תיקיית `server`
   - הגדר `PORT` environment variable
   - עדכן `PUBLIC_WS_URL` ב-Astro

2. **Render** (חינמי):
   - https://render.com
   - צור Web Service
   - העלה את תיקיית `server`
   - עדכן `PUBLIC_WS_URL`

3. **Heroku** (חינמי עם מגבלות):
   - https://heroku.com
   - העלה את תיקיית `server`
   - עדכן `PUBLIC_WS_URL`

4. **VPS/Cloud** (DigitalOcean, AWS, Azure):
   - הרץ את השרת על VPS
   - עדכן `PUBLIC_WS_URL`

### עדכון `PUBLIC_WS_URL`:

אחרי שהשרת רץ, עדכן ב-Vercel/Netlify:
```
PUBLIC_WS_URL=https://your-websocket-server.com
```

## Environment Variables לייצור

### חובה:
- `PUBLIC_SITE_URL` - כתובת האתר (לדוגמה: `https://yourname.vercel.app`)
- `PUBLIC_GITHUB_USERNAME` - `eyal20202`

### אופציונלי אבל מומלץ:
- `OPENAI_API_KEY` - להפעלת AI מלא
- `GITHUB_TOKEN` - לפרויקטים אמיתיים מ-GitHub

### למשחק מרובה משתתפים:
- `PUBLIC_WS_URL` - כתובת שרת WebSocket

## בדיקה אחרי Deploy

1. ✅ בדוק שהאתר נטען
2. ✅ בדוק שהבלוג עובד
3. ✅ בדוק שהפרויקטים מופיעים
4. ✅ בדוק שה-AI Assistant עובד
5. ✅ בדוק שמשחק סולו עובד
6. ✅ בדוק שמשחק מרובה משתתפים עובד (אם השרת רץ)

## טיפים

- **Vercel** הוא הכי קל ומהיר
- **משחק סולו** עובד בלי שרת WebSocket
- **AI Assistant** עובד בלי API key (עם תשובות בסיסיות)
- **פרויקטים** מופיעים גם בלי GitHub token (עם fallback data)

