# Qunity — מסמך הקשר לפרויקט (להעלאה ל-Claude Project)

מסמך זה מיועד להעלאה ל-Knowledge של Claude Project בו את/ה מנסח/ת פרומפטים עבור Claude Code (שבונה בפועל את הקוד). המטרה: שכל צ'אט חדש בפרויקט יבין מיד מה זה Qunity, מה כבר קיים, ואיך לנסח בקשות המשך בלי לחזור על כל ההיסטוריה.

## מה זה Qunity

אפליקציית Next.js + Supabase שהופכת פעילות גופנית של ילדים למשחק. ילד מבצע אימונים, צובר נקודות, ומתקדם דרך מערכת "צמידים" צבעוניים: **לבן → כתום → ירוק → כחול → סגול**. הורה מקושר לילד/ים שלו דרך קוד, רואה דשבורד עם סטטיסטיקות, וקורא "טיפים" (עצות התנהגותיות) שנוצרים אוטומטית לפי חוקים. יש גם טבלת מובילים (Leaderboard) גלובלית בין כל הילדים באפליקציה.

**קהל יעד:** הורים וילדים (ממשק דו-לשוני עברית/אנגלית, RTL/LTR).

## סטטוס נוכחי (בפרודקשן)

- **קוד:** `github.com/QunityFitnessGlobal/Qunity`, ענף `master`.
- **פריסה:** חי ב-Vercel, כתובת `https://qunity-chi.vercel.app`.
- **DB:** Supabase (Postgres + Auth + RLS), אותו פרויקט משמש גם לפיתוח מקומי וגם לפרודקשן.
- **נתוני דמו:** קיים סקריפט (`scripts/seed-demo-data.mjs`) שיצר 2 הורים + 4 ילדים עם היסטוריית אימונים מדומה, לצורך בדיקות/הדגמה. פרטי הכניסה בקובץ `README.md`.
- כל 7 שלבי הבנייה המקוריים + שלב retrofit של i18n/scale הושלמו ואומתו ידנית מול פרודקשן.

## Stack טכני

- **Next.js 16.2.10** (App Router, Turbopack) — **גרסה חדשה עם breaking changes** ביחס לידע כללי על Next.js: `middleware.ts` נקרא עכשיו `proxy.ts` (הפונקציה נקראת `proxy`, לא `middleware`), ו-`params`/`searchParams`/`cookies()` הם כולם `Promise` שצריך `await`.
- **React 19.2.4**, **TypeScript 5**, **Tailwind CSS v4** (עיצוב עם `@theme` ב-`globals.css`, **אין** `tailwind.config.ts` בגרסה הזו).
- **Supabase**: `@supabase/ssr` + `@supabase/supabase-js`, Auth + Postgres + Row Level Security.
- **next-intl v4** — מצב "non-routing" (בלי `/en/...` בנתיב), locale נקבע ע"י cookie בשם `NEXT_LOCALE`.
- **Vitest** — טסטים ל-pure functions בלבד (`points.service.test.ts`, `progression.service.test.ts`).

## מבנה קוד (מיפוי תיקיות)

```
src/app/                      # דפי Next.js App Router
  (auth)/login, signup         # הרשמה/כניסה
  add-child/                   # קישור ילד לפי קוד (הורה)
  dashboard/                    # דשבורד ראשי (הורה+ילד, מפוצל בקומפוננטה אחת לפי role)
    challenges/, leaderboard/, recent-workouts/, settings/
  workout/[id]/                 # מסך ביצוע אימון בפועל
src/components/ui/             # קומפוננטות UI כלליות (Button, TextField)
src/components/child/          # קומפוננטות ספציפיות לילד (ColorBadge, ProgressBar...)
src/components/parent/         # קומפוננטות ספציפיות להורה (ChildSelector, StatsGrid, TipsPanel...)
src/services/                  # לוגיקה עסקית — הבלוק המרכזי של האפליקציה
  auth.ts, linking.service.ts, points.service.ts, progression.service.ts,
  challenge.service.ts, workout.service.ts, parent-stats.service.ts,
  tips.service.ts, leaderboard.service.ts
src/services/tip-conditions/   # פונקציית תנאי נפרדת לכל "עיקרון" חינוכי (ראה מנוע הטיפים למטה)
src/i18n/                      # next-intl config (locales.ts, request.ts)
src/lib/supabase/              # client.ts (דפדפן) ו-server.ts (Server Components)
src/lib/types.ts               # טיפוסי TS תואמים לסכמת ה-DB
src/proxy.ts                   # הגנת נתיבים (התחברות + redirect)
messages/he.json, en.json      # תרגומים
supabase/schema.sql            # סכמת DB מלאה (מצטברת, עם הערות "ADDED IN PROMPT X")
supabase/seed.sql              # נתוני ייחוס: bracelet_levels, workouts, challenges, parent_tip_rules
scripts/seed-demo-data.mjs     # יצירת משתמשי דמו + היסטוריה (עם Supabase service_role key)
```

## ארכיטקטורת נתונים ודפוסי אבטחה

- **RLS מלא** על כל טבלה. דפוס מרכזי: ילד רואה רק את עצמו; הורה רואה רק ילדים מקושרים דרך פונקציית `is_parent_of(child_id)` (SECURITY DEFINER, בודקת את `parent_child_links`).
- **Leaderboard**: הבעיה — כולם צריכים לראות נתונים בסיסיים של **כל** הילדים (לא רק המקושרים), אבל טבלת `children` מכילה גם `child_code` רגיש. הפתרון: RPC צר בשם `get_leaderboard()` (SECURITY DEFINER) שמחזיר **רק** 4 עמודות בטוחות (id, nickname, current_color, total_points) — לא policy רחבה על הטבלה עצמה.
- **עדכונים אטומיים**: נקודות/ספירת אימונים מתעדכנים דרך RPC-ים ב-SQL (`increment_child_points`, `increment_child_workout_counts`) ולא בקריאה-ואז-כתיבה ב-JS, כדי למנוע lost updates במקביליות. מעבר צבע (progression) משתמש ב-UPDATE מותנה (`.eq("current_color", ...).gte(...)`) שמאמת מחדש ב-DB בזמן הכתיבה.
- **תוכן רב-לשוני** (workouts/challenges/parent_tip_rules) מאוחסן כ-JSONB: `{"he": "...", "en": "..."}`, נקרא דרך `resolveLocalizedText(value, locale)` עם fallback ל-`he`.
- **קוד ילד (`child_code`)**: מוצג פעם אחת בלבד (עמודת `code_shown_at`), אחרי זה זמין רק דרך הגדרות.

## מנוע הטיפים (Tips Engine)

טבלת `parent_tip_rules` מכילה 10 חוקים (5 "עקרונות" חינוכיים, 2 חוקים לכל אחד), כל חוק עם `condition_type`, `condition_params` (jsonb), `priority`, ו-`tip_text` (jsonb דו-לשוני).

הרישום ב-`src/services/tip-conditions/index.ts` (`TIP_CONDITION_REGISTRY`) ממפה `condition_type` לפונקציית JS טהורה שמקבלת snapshot של נתוני הילד (`ChildTipSnapshot`) ומחזירה boolean. `getRelevantTips()` (ב-`tips.service.ts`) בונה את ה-snapshot, שולף את כל החוקים, מסנן לפי match, ממיין לפי priority, ומחזיר את 3 המובילים.

**חשוב לדעת:** כדי להוסיף עיקרון/תנאי חדש — מוסיפים שורה ל-`parent_tip_rules` (ב-`seed.sql`), כותבים פונקציה חדשה בתיקיית `tip-conditions/`, ומוסיפים שורה אחת ל-registry. שום דבר אחר באפליקציה לא צריך להשתנות.

יש גם "מצב בדיקה ידני" ב-`TipsPanel.tsx` (שדה מספרי 1-5 + כפתור) שמריץ את אותו מנוע אמיתי אבל כופה תרחיש — שימושי לבדיקות QA בלי לחכות לנתונים אמיתיים.

## פיצ'רים מרכזיים ואיפה הם חיים

| פיצ'ר | קבצים עיקריים |
|---|---|
| הרשמה/כניסה | `src/app/(auth)/`, `src/services/auth.ts`, `src/proxy.ts` |
| קישור הורה-ילד לפי קוד | `src/app/add-child/`, `src/services/linking.service.ts` |
| ביצוע אימון | `src/app/workout/[id]/`, `src/components/WorkoutRunner.tsx`, `src/services/workout.service.ts` |
| נקודות + מעבר צבע | `src/services/points.service.ts`, `src/services/progression.service.ts` |
| אתגרים (challenges) | `src/services/challenge.service.ts`, `src/data/challenges.data.ts` |
| דשבורד הורה/ילד | `src/app/dashboard/page.tsx` (מפוצל לפי `profile.role`) |
| טבלת מובילים | `src/app/dashboard/leaderboard/page.tsx`, `src/services/leaderboard.service.ts` |
| טיפים להורה | ראה סעיף מנוע הטיפים למעלה |
| ניווט מובייל | `src/components/BottomTabBar.tsx` (טאבים תחתונים, לא hamburger/drawer) |

## מוסכמות וגוצ'האות חשובות שנלמדו תוך כדי הבנייה

- **`feeling_after`** (איך הילד הרגיש אחרי אימון) נשמר כקוד יציב באנגלית (`"great"|"ok"|"hard"`), **לא** כטקסט מתורגם — כי לוגיקת התנאים (tip-conditions) עושה match ישיר על הערך. רק התווית המוצגת מתורגמת.
- **`actual_duration_seconds`** (לא דקות) — כדי לא לאבד דיוק באימוני בדיקה קצרים.
- **Supabase Server Client** (`src/lib/supabase/server.ts`) חייב `global: { fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }) }` — בלי זה, ל-Next.js יש נטייה לשמור ב-cache תשובות GET מ-PostgREST ב-Server Components, מה שגרם בעבר לבאג של דאטה "תקוע" בדשבורד ההורה.
- **`.gitignore`** חייב `!.env.local.example` אחרי שורת `.env*`, אחרת קובץ הדוגמה (בלי סודות) לא עולה ל-git.
- כל טבלת `bracelet_levels`/`workouts`/`challenges`/`parent_tip_rules` היא תוכן-ייחוס גלובלי (לא per-user) — פתוחה לקריאה לכל authenticated user.
- ה-Leaderboard ונתוני דמו תלויים אחד בשני רק דרך אותו פרויקט Supabase — אין הפרדה בין dev/prod כרגע (MVP).

## מגבלות ידועות / לא מומש בכוונה (MVP)

- אין UI למשתמש לבחירת שפה (יש עמודת `users.preferred_language` מוכנה ב-DB, בלי ממשק).
- פאג'ינציה חלקית בלבד ברשימות (recent-workouts).
- Leaderboard גלובלי בלבד — אין scoping לפי קבוצה/מדינה.
- אין מנגנון מניעת חזרה על אותו טיפ (יש logging ל-`parent_tips`, בלי חסימה בפועל).
- אין separate DB/deployment ל-staging מול production.

## איך לנסח פרומפטים עבור Claude Code על הפרויקט הזה

1. **תמיד לבקש ממנו לוודא מצב קיים לפני שינוי** — הקוד עבר הרבה שכבות, וייתכנו עדכונים ידניים שלא מתועדים כאן.
2. **לא לבקש "לבנות מחדש"** רכיב קיים — להגדיר מפורש "להוסיף X" או "לתקן Y", ולציין אם מותר לו לגעת בקבצים סמוכים.
3. פרומפטים משמעותיים (פיצ'ר חדש, שינוי סכמה) — לפרט: מה המטרה העסקית, אילו טבלאות/RLS מעורבות, ואם יש דרישת i18n (כל טקסט משתמש צריך `he`+`en`).
4. שינויים שנוגעים ל-DB — לזכור שצריך להריץ SQL ידנית ב-Supabase Dashboard (אין migrations אוטומטיות); לבקש מקלוד קוד לתת את קטע ה-SQL המדויק להרצה.
5. שינויים שדורשים בדיקה חזותית/פונקציונלית — לבקש אימות בדפדפן (יש preview tools), לא רק "עבר build".
