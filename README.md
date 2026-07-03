# Qunity

אפליקציה שהופכת פעילות גופנית של ילדים למשחק — מסע צבעים, נקודות, אתגרים, טבלת מובילים וטיפים להורים.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Auth + Postgres + RLS) + next-intl (עברית/אנגלית).

## התקנה

1. ודא ש-Node.js 18+ מותקן.

2. התקנת חבילות:

   ```bash
   npm install
   ```

3. יצירת קובץ סביבה מקומי:

   ```bash
   cp .env.local.example .env.local
   ```

   ומילוי `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY` עם הערכים מהפרויקט שלך ב-Supabase (Project Settings → API).

4. הרצת הסכמה מול הפרויקט (פעם אחת, בסדר הזה): פתחו את Supabase Dashboard → SQL Editor, והריצו לפי הסדר:
   - `supabase/schema.sql` (הסכמה המלאה — כולל כל התיקונים המצטברים משלבי הפיתוח)
   - `supabase/seed.sql` (נתוני ייחוס: רמות צמיד, אימונים, אתגרים, כללי טיפים)

5. (אופציונלי אך מומלץ) הרצת נתוני דמו — ראו "משתמשי דמו" למטה.

6. הרצת שרת הפיתוח:

   ```bash
   npm run dev
   ```

   האפליקציה תיפתח בכתובת [http://localhost:3000](http://localhost:3000).

7. הרצת הבדיקות (unit tests):

   ```bash
   npm run test
   ```

## משתמשי דמו

כדי שהדשבורדים, האתגרים, טבלת המובילים והטיפים לא יהיו ריקים בהרצה ראשונה, יש סקריפט שיוצר 2 הורים + 4 ילדים עם היסטוריית אימונים מדומה:

```bash
# ב-PowerShell:
$env:SUPABASE_SERVICE_ROLE_KEY = "<ה-service_role key מ-Project Settings -> API>"
node scripts/seed-demo-data.mjs

# ב-bash:
SUPABASE_SERVICE_ROLE_KEY="<...>" node scripts/seed-demo-data.mjs
```

**חשוב:** ה-`service_role key` שונה מה-`anon key` ועוקף לגמרי את כל הרשאות ה-RLS. אל תשמור אותו בקובץ, אל תעלה אותו ל-Git — הזן אותו רק כמשתנה סביבה זמני להרצת הסקריפט הזה בלבד.

לאחר ההרצה, כל המשתמשים הבאים זמינים עם הסיסמה **`Demo1234!`**:

| אימייל | תפקיד | תיאור |
|---|---|---|
| `parent1@qunity-demo.test` | הורה | רות לוי — מקושרת לנועה ולאיתי |
| `parent2@qunity-demo.test` | הורה | דני כהן — מקושר למיה ולעומר |
| `child1@qunity-demo.test` | ילד/ה | נועה — צמיד לבן, אימון אחד בלבד |
| `child2@qunity-demo.test` | ילד/ה | איתי — צמיד לבן, 6 אימונים, 140 נקודות |
| `child3@qunity-demo.test` | ילד/ה | מיה — כבר עברה לצמיד כתום |
| `child4@qunity-demo.test` | ילד/ה | עומר — לא התאמן 9 ימים (מפעיל טיפ אמיתי בדשבורד של דני, לא רק את מצב הבדיקה הידני) |

## תרחיש בדיקה מקצה לקצה (Smoke Test)

1. **הרשמה חדשה** — היכנסו ל-`/signup`, הירשמו כהורה חדש. ודאו הפניה ל-`/dashboard`.
2. **הרשמת ילד** — בטאב אינקוגניטו, הירשמו כילד/ה חדש/ה. ודאו שמוצג קוד (`QNTY-XXXXX`) פעם ראשונה בלבד במסך הבית.
3. **קישור ילד** — כהורה, לכו להגדרות → "הוספת ילד לפי קוד", הזינו את הקוד. ודאו הודעת הצלחה, ושכניסה חוזרת לאותו קוד מציגה "This child code has already been used."
4. **ביצוע אימון** — כילד, לחצו על כרטיס "האימון הבא" → Start → המתינו כמה שניות → Finish → מלאו את השאלון → שליחה. ודאו הודעת נקודות, ואם רלוונטי הודעת מעבר צבע/אתגר.
5. **דשבורד הורה** — כהורה, ודאו שהמספרים בדשבורד השתנו בהתאם (נקודות, זמן פעילות, אימונים אחרונים).
6. **טיפים** — באזור "טיפים להורה", נסו את שדה הבדיקה הידני (הזינו 1–5, לחצו "הצג"), ובדקו ב-Supabase שנוצרה שורה ב-`parent_tips`.
7. **טבלת מובילים** — כילד, עברו לטאב "מובילים" וודאו שמוצגים **רק** נickname, badge צבעוני ונקודות — בלי שם מלא, אימייל, או קוד.
8. **מעבר שפה** — ב-DevTools Console: `document.cookie = "NEXT_LOCALE=en; path=/"` ואז רענון, ודאו שהכל מוצג באנגלית וכיוון הטקסט הופך ל-LTR.

## פריסה ל-Vercel

1. **Supabase (אם עוד אין פרויקט):** צרו פרויקט חדש ב-[supabase.com](https://supabase.com), הריצו את `schema.sql` ו-`seed.sql` דרך ה-SQL Editor (ואופציונלית את סקריפט הדמו).
2. **Git:** ודאו שכל הקוד ב-commit, וש-GitHub repo קיים עם הקוד (`git push`).
3. **Vercel:** התחברו ל-[vercel.com](https://vercel.com) (אפשר עם GitHub), "Add New Project", בחרו את ה-repo.
4. **משתני סביבה:** בהגדרות הפרויקט ב-Vercel → Environment Variables, הוסיפו את `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY` (אותם ערכים כמו ב-`.env.local`).
5. **Deploy:** Vercel יבנה ויפרוס אוטומטית. כל push עתידי ל-branch הראשי יפרוס מחדש.
6. **בדיקה:** גשו לכתובת הציבורית שקיבלתם מ-Vercel, והריצו שוב את ה-Smoke Test למעלה — מול **אותו** פרויקט Supabase (אין בסיס נתונים נפרד לפרודקשן בשלב ה-MVP הזה).

## מבנה הפרויקט

```
src/
├── app/                    # Next.js App Router (עמודים)
│   └── dashboard/          # דשבורד + טאבים (בית/מובילים/אתגרים/אימונים/הגדרות)
├── components/ui/          # קומפוננטות UI כלליות לשימוש חוזר
├── components/child/       # קומפוננטות ספציפיות לדשבורד הילד
├── components/parent/      # קומפוננטות ספציפיות לדשבורד ההורה
├── services/               # לוגיקה עסקית (auth, points, workouts, tips...)
├── services/tip-conditions/ # פונקציית חישוב ייעודית לכל תרחיש טיפ
├── i18n/                   # הגדרות next-intl (locale resolution)
├── lib/supabase/           # חיבור ל-Supabase (client/server)
├── lib/types.ts            # טיפוסי TypeScript התואמים לסכמת ה-DB
└── proxy.ts                # הגנת נתיבים (התחברות/הרשאות)
messages/he.json, en.json   # קבצי תרגום
supabase/schema.sql         # סכמת ה-database המלאה (כולל כל התיקונים המצטברים)
supabase/seed.sql           # נתוני ייחוס (רמות/אימונים/אתגרים/כללי טיפים)
scripts/seed-demo-data.mjs  # יצירת משתמשי דמו + היסטוריה
```

## תיעוד פנימי

תוכן עתידי (Future, לא מומש בכוונה ב-MVP הזה): מסך הגדרות למשתמש לבחירת שפה (`users.preferred_language` כבר קיים ומוכן), פאג'ינציה מלאה (עמוד הבא/קודם) ברשימות, scoping של טבלת המובילים (למשל לפי קבוצה/מדינה), מנגנון מניעת חזרה על אותו טיפ (הלוגינג ל-`parent_tips` כבר קיים, המניעה עצמה לא).
