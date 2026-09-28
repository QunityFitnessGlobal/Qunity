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
   - `supabase/seed.sql` (נתוני ייחוס: רמות שלב, אימונים, אתגרים, כללי טיפים)

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
| `child1@qunity-demo.test` | ילד/ה | נועה — שלב לבן, אימון אחד בלבד |
| `child2@qunity-demo.test` | ילד/ה | איתי — שלב לבן, 6 אימונים, 140 נקודות |
| `child3@qunity-demo.test` | ילד/ה | מיה — כבר עברה לשלב כתום |
| `child4@qunity-demo.test` | ילד/ה | עומר — לא התאמן 9 ימים (מפעיל טיפ אמיתי בדשבורד של דני, לא רק את מצב הבדיקה הידני) |

## תרחיש בדיקה מקצה לקצה (Smoke Test)

1. **הרשמה חדשה** — היכנסו ל-`/signup`, הירשמו כהורה חדש. ודאו הפניה ל-`/dashboard`.
2. **הרשמת ילד** — בטאב אינקוגניטו, הירשמו כילד/ה חדש/ה. ודאו שמוצג קוד (`QNTY-XXXXX`) פעם ראשונה בלבד במסך הבית.
3. **קישור ילד** — כהורה, לכו להגדרות → "הוספת ילד לפי קוד", הזינו את הקוד. ודאו הודעת הצלחה, ושכניסה חוזרת לאותו קוד מציגה "This child code has already been used."
4. **ביצוע אימון** — כילד, לחצו על כרטיס "האימון הבא" → Start → המתינו כמה שניות → Finish → מלאו את השאלון → שליחה. ודאו הודעת נקודות, ואם רלוונטי הודעת מעבר שלב/אתגר.
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

## לוגיקת שלבים ונקודות

מקור האמת הוא הקוד עצמו (`src/services/points.service.ts`, `src/services/workout.service.ts`, `src/services/progression.service.ts`, `src/services/journey.service.ts`); הסיכום כאן הוא מפת דרכים, לא תיעוד ממצה.

- **שני מונים נפרדים לכל צבע (שלב):** `workouts_completed_in_color` ו-`points_in_color`, לצד `total_workouts_completed`/`total_points` שלא מתאפסים בין צבעים. עלייה לצבע הבא (`progression.service.ts`, `evaluateProgression`) דורשת ששניהם יעברו את דרישות הצבע (`bracelet_levels.required_workouts`/`required_points`) **יחד**. מד ההתקדמות (`calculateProgressPercent`) מציג את המינימום בין שני האחוזים, לא ממוצע — כדי שלא יראה יותר התקדמות ממה שבאמת חוסם את העלייה.
- **אחוז השלמה** (`calculateCompletionPercent`): זמן בפועל חלקי זמן מתוכנן (סך זמן הטיימר, או המשך המומלץ באימונים בלי טיימר), מעוגל כלפי מטה, מקסימום 100%. הסף המכריע הוא **60%** (`COMPLETION_THRESHOLD_PERCENT`, `meetsCompletionThreshold`).
  - מתחת ל-60%: 0 נקודות, והתחנה לא מתקדמת (`workouts_completed_in_color` לא עולה, רק `total_workouts_completed`) — התחנה נשארת "נוכחית" עד שניסיון עתידי יעבור את הסף. `completeWorkout` בודק זאת מחדש מול ה-DB בכל השלמה (`stationAlreadyDone`/`advancesColor`), לא לפי דגל שהלקוח שולח.
  - 60% ומעלה: מקבלים את האחוז המתאים מסכום הבונוסים (`calculateWorkoutPoints`: בסיס 20 + עד 4 בונוסים).
- **תחנה חוזרת:** מהניסיון השני על אותה תחנה (בלי קשר אם הראשון עבר את הסף) זה "אימון חוזר" (`is_replay`, מסומן אוטומטית או דרך `?replay=` מהמסלול). לכל ניסיון חוזר יש שני חישובים נפרדים: הסכום המלא של הניסיון נזקף תמיד ל-`total_points`, אבל ל-`points_in_color` נזקף רק ההפרש מעל השיא הקודם ששולם לאותה תחנה (`getPaidBestPercent`), עד תקרה של 100% מערך התחנה.
- **חצי כוכב / כוכב מלא** (`journey.service.ts`): חצי כוכב = ההישג הטוב ביותר בתחנה מתחת ל-100% (גם על תחנה "נוכחית" עם ניסיון כושל על הרשומה). כוכב מלא רק בדיוק ב-100%.
- **טבלת המובילים** (`get_leaderboard` ב-`schema.sql`): ממוינת לפי סדר הצבע קודם, נקודות רק כשובר שוויון בתוך אותו צבע.
- סיכום מלא ומנוסח להורה קיים כ-PDF שנשלח בשיחה (לא נשמר בריפו).

## לוגיקת טיפים להורים

- **אוטומטיים** (24 `condition_type`, ב-`src/services/tip-conditions/`, רשומים ב-`TIP_CONDITION_REGISTRY` שב-`tip-conditions/index.ts`): נבדקים בכל טעינת דשבורד ההורה מול `ChildTipSnapshot` (`tips.service.ts`). מוצגים עד 5 (`MAX_RELEVANT_TIPS`), ממוינים לפי `priority` (`parent_tip_rules.priority`) מהגבוה לנמוך.
- **ידניים** (`condition_type = 'manual_selection'`, 33 שורות בחמש קטגוריות לפי `condition_params.menuGroup`): לא נבדקים אוטומטית, מוצגים דרך תפריט "מה קורה עכשיו?" (`WhatsHappeningNowMenu.tsx`) — ההורה בוחר תיאור התנהגות/רגש ורואה כרטיס אחד.
- הוספת תרחיש חדש: שורה ב-`parent_tip_rules` (`supabase/schema.sql`) + פונקציה תואמת ב-`tip-conditions/*.ts` + שורה אחת ב-registry. שום דבר אחר לא צריך להשתנות.

## תיעוד פנימי

תוכן עתידי (Future, לא מומש בכוונה ב-MVP הזה): מסך הגדרות למשתמש לבחירת שפה (`users.preferred_language` כבר קיים ומוכן), פאג'ינציה מלאה (עמוד הבא/קודם) ברשימות, scoping של טבלת המובילים (למשל לפי קבוצה/מדינה), מנגנון מניעת חזרה על אותו טיפ (הלוגינג ל-`parent_tips` כבר קיים, המניעה עצמה לא).
