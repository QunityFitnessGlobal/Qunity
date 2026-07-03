// Mirrors the `parent_tip_rules` seed data (supabase/seed.sql) for reference.
// Unlike challenges.data.ts, this is NOT used at runtime — parent_tip_rules
// rows have DB-generated uuids, and tips.service.ts always reads the live
// table. This file exists purely so the condition_type <-> principle mapping
// is easy to read without opening the SQL seed file.

export interface TipRuleDefinition {
  principle: string;
  conditionType: string;
  tipText: string;
  priority: number;
}

export const TIP_RULES: TipRuleDefinition[] = [
  {
    principle: "Empowering Framework",
    conditionType: "no_workout_3_days",
    tipText:
      "כבר 3 ימים שהילד/ה לא התאמן/ה. זה הזמן להזכיר לו/לה שהבחירה בידיים שלו/ה - שאלו אותו/ה מתי נוח לו/לה להתחיל שוב, בלי לחץ.",
    priority: 8,
  },
  {
    principle: "Empowering Framework",
    conditionType: "no_workout_7_days",
    tipText:
      "עבר שבוע שלם בלי אימון. במקום להזכיר, נסו לשאול את הילד/ה מה יעזור לו/לה לחזור למסלול - התשובה שלו/ה חשובה יותר מהתזכורת שלכם.",
    priority: 9,
  },
  {
    principle: "All Feelings Are Allowed",
    conditionType: "high_difficulty_reported",
    tipText:
      "הילד/ה דיווח/ה על קושי גבוה באימון האחרון. הרגשות האלה לגיטימיים - הכי חשוב להכיר בהם בלי למזער, ולא בהכרח להוריד את רמת הקושי.",
    priority: 6,
  },
  {
    principle: "All Feelings Are Allowed",
    conditionType: "negative_feeling_streak",
    tipText:
      "כמה אימונים ברצף שהילד/ה מדווח/ת שהיה קשה. שווה לשבת יחד ולשאול איך הוא/היא מרגיש/ה, בלי לנסות לתקן מיד.",
    priority: 7,
  },
  {
    principle: "Personal Example",
    conditionType: "low_parent_participation",
    tipText:
      "התאמנתם יחד בפחות מ-10% מהאימונים האחרונים. ילדים לומדים הרבה מהדוגמה האישית - אימון אחד ביחד יכול לשנות המון.",
    priority: 5,
  },
  {
    principle: "Personal Example",
    conditionType: "zero_parent_participation",
    tipText:
      "עדיין לא התאמנתם ביחד ולו פעם אחת. נסו להצטרף לאימון אחד השבוע - הנוכחות שלכם משפיעה יותר ממה שנדמה.",
    priority: 6,
  },
  {
    principle: "Liberating Belief",
    conditionType: "difficulty_plateau",
    tipText:
      "הילד/ה ממשיך/ה להתאמן בעקביות אבל רמת הקושי לא עולה - וזה בסדר גמור. ההתמדה עצמה היא ההצלחה, לא בהכרח הקושי.",
    priority: 4,
  },
  {
    principle: "Liberating Belief",
    conditionType: "high_total_effort_reminder",
    tipText:
      "הילד/ה כבר השלים/ה הרבה אימונים לאורך הדרך. שווה להזכיר לו/לה (ולעצמכם) שההשקעה נמדדת בעקביות, לא רק בתגים שנפתחו.",
    priority: 3,
  },
  {
    principle: "Focus On The Journey",
    conditionType: "low_challenge_unlock_rate",
    tipText:
      "הילד/ה משלים/ה אימונים באופן סדיר אבל עוד לא פתח/ה הרבה אתגרים. כדאי להדגיש את המסע עצמו ולא רק את התגים - ההתמדה כבר הישג.",
    priority: 3,
  },
  {
    principle: "Focus On The Journey",
    conditionType: "consistent_monthly_activity",
    tipText:
      "הילד/ה התאמן/ה הרבה החודש! זה הזמן המושלם לחגוג את העקביות עצמה, לא רק תוצאה או מעבר שלב.",
    priority: 2,
  },
];
