-- Qunity — shorter exercise descriptions
--
-- Rewrites public.exercises.description_he for all 50 bank exercises in a
-- shorter wording that keeps the whole exercise (start position, the
-- movement, the way back and any rule such as "feet stay together").
-- Approved by the user from אימונים/Qunity_תיאורי_תרגילים_מקוצרים.xlsx.
-- Data only (no schema change): paste into the Supabase SQL Editor; the app
-- shows the new text right away. Safe to run more than once.

begin;

-- BE01 · לגעת בבהונות
update public.exercises set description_he = 'עומדים ישר, מתכופפים קדימה ונוגעים בידיים באצבעות הרגליים, ומתיישרים חזרה לעמידה.' where id = 'BE01';

-- BE02 · חיפוש המטמון
update public.exercises set description_he = 'עומדים ישר מול חפץ שעל הרצפה. מתכופפים, מרימים אותו בידיים ומתיישרים חזרה לעמידה.' where id = 'BE02';

-- BE03 · המנוף
update public.exercises set description_he = 'ברכיים מעט כפופות. דוחפים את הישבן לאחור ומטים את הגוף קדימה בגב ישר, ואז דוחפים את האגן קדימה וחוזרים לעמידה, כמו מנוף.' where id = 'BE03';

-- BE04 · הגשר
update public.exercises set description_he = 'שוכבים על הגב, ברכיים כפופות וכפות רגליים על הרצפה. דוחפים ברגליים ומרימים את האגן למעלה, ומורידים חזרה.' where id = 'BE04';

-- BE05 · גשר על רגל אחת
update public.exercises set description_he = 'שוכבים על הגב, ברך אחת כפופה וכף הרגל על הרצפה, והרגל השנייה באוויר. דוחפים ומרימים את האגן, מורידים ומחליפים רגל.' where id = 'BE05';

-- BE06 · כפיפת הבטן הקטנה
update public.exercises set description_he = 'שוכבים על הגב, ברכיים כפופות וכפות רגליים על הרצפה. מרימים מעט ראש וכתפיים לכיוון הברכיים, ומורידים חזרה.' where id = 'BE06';

-- BE07 · הסופרמן
update public.exercises set description_he = 'שוכבים על הבטן, ידיים ישרות קדימה ורגליים ישרות מאחור. מרימים מעט ידיים, חזה ורגליים ונשארים כך, כמו סופרמן שעף.' where id = 'BE07';

-- BE08 · מגע בהונות בישיבה
update public.exercises set description_he = 'יושבים עם רגליים ישרות קדימה. מתכופפים ונוגעים בידיים באצבעות הרגליים, וחוזרים לישיבה ישרה.' where id = 'BE08';

-- BE09 · כדור מתגלגל
update public.exercises set description_he = 'יושבים ומחבקים את הברכיים אל החזה. בגב מעוגל מתגלגלים לאחור ובחזרה קדימה לישיבה, כמו כדור.' where id = 'BE09';

-- BE10 · הפרפר
update public.exercises set description_he = 'יושבים, כפות הרגליים צמודות והברכיים פתוחות לצדדים. בלי להפריד את כפות הרגליים מתכופפים קדימה, וחוזרים לישיבה ישרה.' where id = 'BE10';

-- MV01 · זחילת הדוב
update public.exercises set description_he = 'ידיים ורגליים על הרצפה, ברכיים באוויר. מתקדמים קדימה על ארבע בלי להוריד את הברכיים, כמו דוב.' where id = 'MV01';

-- MV02 · קפיצת הצפרדע
update public.exercises set description_he = 'יורדים נמוך עם הידיים על הרצפה לפנינו. קופצים קדימה בשתי רגליים יחד ונוחתים בברכיים כפופות, כמו צפרדע.' where id = 'MV02';

-- MV03 · הליכת הסרטן
update public.exercises set description_he = 'יושבים עם הידיים מאחור וכפות הרגליים על הרצפה. מרימים את הישבן ומתקדמים על ידיים ורגליים עם הבטן למעלה, כמו סרטן.' where id = 'MV03';

-- MV04 · ריצת המקום
update public.exercises set description_he = 'רצים במקום ומרימים ברכיים גבוה לכיוון הבטן, ברך אחרי ברך, ברצף.' where id = 'MV04';

-- MV05 · דילוגי הזריזות
update public.exercises set description_he = 'בברכיים מעט כפופות, עושים כמה צעדים קטנים ומהירים לצד אחד ואז לצד השני, וממשיכים מצד לצד.' where id = 'MV05';

-- MV06 · בעיטות לישבן
update public.exercises set description_he = 'רצים במקום, ובכל צעד מעלים את העקב לכיוון הישבן. מחליפים רגליים ברצף.' where id = 'MV06';

-- MV07 · זחילה אינדיאנית
update public.exercises set description_he = 'שוכבים על הבטן קרוב לרצפה, ומושכים ודוחפים את הגוף קדימה בידיים וברגליים בלי לקום.' where id = 'MV07';

-- MV08 · קפיצות כוכב
update public.exercises set description_he = 'רגליים צמודות וידיים לצד הגוף. קופצים ופותחים רגליים לצדדים וידיים מעל הראש, קופצים וסוגרים חזרה, וממשיכים ברצף כמו כוכב.' where id = 'MV08';

-- MV09 · הליכת הפינגווין
update public.exercises set description_he = 'עם ברכיים מעט כפופות כל הזמן, צועדים צעדים קטנים לצד אחד ואז לצד השני, כמו פינגווין.' where id = 'MV09';

-- MV10 · קפיצת המחליק
update public.exercises set description_he = 'עומדים על רגל אחת, קופצים הצידה ונוחתים על הרגל השנייה בברך מעט כפופה. ממשיכים מצד לצד, כמו מחליק על הקרח.' where id = 'MV10';

-- PL01 · חתירה על הבטן
update public.exercises set description_he = 'שוכבים על הבטן, ידיים ישרות קדימה ומורמות מעט. מושכים את המרפקים לאחור אל הגוף, ומיישרים שוב קדימה.' where id = 'PL01';

-- PL02 · מטוס
update public.exercises set description_he = 'שוכבים על הבטן, ידיים ישרות לצדדים כמו כנפי מטוס. מרימים אותן מעט מהרצפה, מחזיקים באוויר ומורידים.' where id = 'PL02';

-- PL03 · רובוט
update public.exercises set description_he = 'עומדים עם מרפקים כפופים ליד הגוף. צועדים במקום, ובכל צעד מושכים את המרפקים לאחור ומחזירים קדימה, כמו רובוט.' where id = 'PL03';

-- PL04 · מטפס קירות
update public.exercises set description_he = 'עומדים מול הקיר עם שתי הידיים עליו. מעלים ומורידים את הידיים לסירוגין, כאילו מטפסים על הקיר.' where id = 'PL04';

-- PL05 · גב האריה
update public.exercises set description_he = 'שוכבים על הבטן, ידיים קדימה. מרימים חזה וידיים ומחזיקים באוויר, מושכים את המרפקים לאחור לצד הגוף, עוצרים לרגע ומיישרים שוב קדימה.' where id = 'PL05';

-- PL06 · מושך את הסירה
update public.exercises set description_he = 'יושבים עם ברכיים כפופות וכפות רגליים על הרצפה, ידיים קדימה. מושכים את המרפקים לאחור ובאותו זמן מיישרים מעט את הרגליים, וחוזרים. כמו חתירה בסירה.' where id = 'PL06';

-- PL07 · מטפס ההר
update public.exercises set description_he = 'מרימים יד אחת גבוה כאילו תופסים משהו. מושכים את המרפק למטה ומרימים אליו את הברך הנגדית. חוזרים ומחליפים צד, כמו טיפוס על הר.' where id = 'PL07';

-- PL08 · שחיין
update public.exercises set description_he = 'שוכבים על הבטן, ידיים ישרות קדימה ורגליים ישרות מאחור. מרימים מעט יד ורגל נגדית, מורידים ומחליפים צד, כמו שחיין.' where id = 'PL08';

-- PL09 · כנפי המלאך
update public.exercises set description_he = 'שוכבים על הבטן, רגליים ישרות וידיים ישרות לצד הגוף. מרימים את הידיים מעט, מעבירים דרך הצדדים עד מעל הראש, וחוזרים באותה הדרך.' where id = 'PL09';

-- PL10 · מושך את המצנח
update public.exercises set description_he = 'עומדים עם ידיים מעל הראש. מכופפים מעט את הברכיים ובאותו זמן מושכים את המרפקים למטה לצדי הגוף, ואז מתיישרים ומרימים שוב. כמו משיכת חבלי מצנח.' where id = 'PL10';

-- PU01 · דחיפת הקיר
update public.exercises set description_he = 'עומדים מול הקיר עם הידיים עליו. מכופפים את המרפקים עד שהגוף מתקרב לקיר, ודוחפים חזרה עד שהידיים ישרות.' where id = 'PU01';

-- PU02 · דחיפה מהשולחן
update public.exercises set description_he = 'נשענים על שולחן בידיים ישרות ובגוף ישר. מכופפים את המרפקים עד שהגוף מגיע לשולחן, ודוחפים חזרה.' where id = 'PU02';

-- PU03 · דחיפת הגיבור מהברכיים
update public.exercises set description_he = 'ידיים ישרות וברכיים על הרצפה, הגוף ישר מהברכיים עד הראש. מכופפים את המרפקים ויורדים לכיוון הרצפה, ודוחפים חזרה למעלה.' where id = 'PU03';

-- PU04 · דחיפת הגיבור
update public.exercises set description_he = 'ידיים וקצות אצבעות הרגליים על הרצפה, הגוף ישר. מכופפים את המרפקים ויורדים עם כל הגוף לכיוון הרצפה, ודוחפים חזרה למעלה.' where id = 'PU04';

-- PU05 · דחיפת הגיבור רחבה
update public.exercises set description_he = 'ידיים על הרצפה רחב יותר מהכתפיים, קצות אצבעות הרגליים על הרצפה והגוף ישר. מכופפים את המרפקים ויורדים לכיוון הרצפה, ודוחפים חזרה למעלה.' where id = 'PU05';

-- PU06 · החזקת הקרש
update public.exercises set description_he = 'ידיים ישרות וקצות אצבעות הרגליים על הרצפה. מחזיקים את הגוף ישר מהראש עד הרגליים, כמו קרש, ונשארים כך.' where id = 'PU06';

-- PU07 · דחיפה עם מגע כתף
update public.exercises set description_he = 'בתנוחת דחיפת הגיבור, הגוף ישר. עושים דחיפה אחת, ולמעלה נוגעים ביד אחת בכתף הנגדית ומחזירים אותה לרצפה. בכל חזרה מחליפים יד.' where id = 'PU07';

-- PU08 · דחיפת הגיבור האיטית
update public.exercises set description_he = 'בתנוחת דחיפת הגיבור, הגוף ישר. יורדים לאט לכיוון הרצפה, ודוחפים חזרה למעלה בקצב רגיל.' where id = 'PU08';

-- PU09 · דחיפת הגיבור הצמודה
update public.exercises set description_he = 'בתנוחת דחיפת הגיבור, עם הידיים קרובות זו לזו מתחת לחזה. מכופפים את המרפקים ויורדים לכיוון הידיים, ודוחפים חזרה למעלה.' where id = 'PU09';

-- PU10 · דחיפה וסיבוב
update public.exercises set description_he = 'עושים דחיפת גיבור אחת. למעלה, נשארים על יד אחת, מסתובבים הצידה ומרימים את היד השנייה לתקרה. חוזרים, ובחזרה הבאה מסתובבים לצד השני.' where id = 'PU10';

-- SQ01 · ישיבה על כיסא בלתי נראה
update public.exercises set description_he = 'מתיישבים לאחור על כיסא דמיוני וקמים חזרה לעמידה.' where id = 'SQ01';

-- SQ02 · הקפצות קטנות
update public.exercises set description_he = 'עם ברכיים מעט כפופות, קופצים למעלה קפיצות קטנות.' where id = 'SQ02';

-- SQ03 · קפיצת הכוכב
update public.exercises set description_he = 'רגליים מעט פתוחות. מתיישבים לאחור על כיסא דמיוני, ומשם קמים בקפיצה ופותחים ידיים ורגליים כמו כוכב.' where id = 'SQ03';

-- SQ04 · רגליים צמודות
update public.exercises set description_he = 'רגליים צמודות. מתיישבים לאחור על כיסא דמיוני וקמים חזרה, כשהרגליים נשארות צמודות כל הזמן.' where id = 'SQ04';

-- SQ05 · רגליים רחבות
update public.exercises set description_he = 'רגליים פתוחות רחב מהכתפיים, כפות הרגליים מעט החוצה. מתיישבים לאחור עם ברכיים כפופות, וקמים חזרה לעמידה.' where id = 'SQ05';

-- SQ06 · ישיבת הקיר
update public.exercises set description_he = 'גב צמוד לקיר ורגליים מעט רחוקות ממנו. מחליקים למטה עד שיושבים על כיסא דמיוני, ונשארים כך עם הגב על הקיר.' where id = 'SQ06';

-- SQ07 · ישיבה עם מגע רצפה
update public.exercises set description_he = 'רגליים מעט פתוחות. מתיישבים לאחור על כיסא דמיוני, נוגעים ביד אחת ברצפה בין הרגליים, וקמים חזרה לעמידה.' where id = 'SQ07';

-- SQ08 · ישיבת הצדדים
update public.exercises set description_he = 'מרגליים צמודות, צעד גדול לצד ומתיישבים לאחור על הרגל הזו, כשהשנייה נשארת ישרה. דוחפים חזרה למרכז ומחליפים צד.' where id = 'SQ08';

-- SQ09 · ישיבה עם סיבוב
update public.exercises set description_he = 'רגליים מעט פתוחות. מתיישבים לאחור על כיסא דמיוני, ובקימה מסובבים את פלג הגוף העליון לצד אחד. בכל חזרה מחליפים צד.' where id = 'SQ09';

-- SQ10 · קפיצת הארנב
update public.exercises set description_he = 'רגליים מעט פתוחות וברכיים מעט כפופות. קופצים קדימה בשתי רגליים יחד, נוחתים עם ברכיים מעט כפופות וממשיכים לקפיצה הבאה, כמו ארנב.' where id = 'SQ10';

commit;

-- Check: every row should show the new text.
select id, description_he from public.exercises where id in ('BE01', 'BE02', 'BE03', 'BE04', 'BE05', 'BE06', 'BE07', 'BE08', 'BE09', 'BE10', 'MV01', 'MV02', 'MV03', 'MV04', 'MV05', 'MV06', 'MV07', 'MV08', 'MV09', 'MV10', 'PL01', 'PL02', 'PL03', 'PL04', 'PL05', 'PL06', 'PL07', 'PL08', 'PL09', 'PL10', 'PU01', 'PU02', 'PU03', 'PU04', 'PU05', 'PU06', 'PU07', 'PU08', 'PU09', 'PU10', 'SQ01', 'SQ02', 'SQ03', 'SQ04', 'SQ05', 'SQ06', 'SQ07', 'SQ08', 'SQ09', 'SQ10') order by id;
