// The guided "מה קורה עכשיו?" chat on the empowerment screen answers from
// the menu tips (parent_tip_rules with condition_params.menuGroup). Until
// there's an AI behind it, typed text is matched to a situation by its
// keywords; these are the pure parts, shared by the page and the chat.

export interface ChatTip {
  ruleId: string;
  group: number;
  // The situation in this child's and parent's words ("מבקשת עזרה מיד").
  label: string;
  // The principle as stored (its Hebrew name, the key of the badges) and as shown.
  principle: string;
  principleLabel: string;
  // The tip's parts; the first three only for tips written in that shape.
  what: string | null;
  dont: string | null;
  doText: string | null;
  quote: string;
  why: string | null;
  keywords: string[];
  // Place among the quick picks shown first, or null.
  quick: number | null;
}

// The situation whose keyword found in the text is the longest — so "לא
// יכולה" beats "לא", and an unrelated sentence matches nothing.
export function matchSituation(text: string, tips: ChatTip[]): ChatTip | null {
  let best: ChatTip | null = null;
  let bestLength = 0;
  for (const tip of tips) {
    for (const word of tip.keywords) {
      if (word && text.includes(word) && word.length > bestLength) {
        best = tip;
        bestLength = word.length;
      }
    }
  }
  return best;
}

// "כל המצבים": every situation, narrowed by group (0 = all) and by what's
// typed in the search — in the label, or a keyword in either direction.
export function searchSituations(tips: ChatTip[], query: string, group: number): ChatTip[] {
  const q = query.trim();
  return tips.filter(
    (tip) =>
      (!group || tip.group === group) &&
      (!q || tip.label.includes(q) || tip.keywords.some((word) => word.includes(q) || q.includes(word))),
  );
}

// What a parent typed, kept to learn which situations are missing — with
// the child's and parent's names taken out first.
export function withoutNames(text: string, names: (string | null | undefined)[]): string {
  return names.reduce<string>(
    (out, name) => (name && name.trim().length > 1 ? out.split(name.trim()).join("[שם]") : out),
    text.trim(),
  );
}

// The tip's "what's happening" usually opens with "הילד"/"הילדה"; in the
// chat it reads better with the child's name.
export function withChildName(what: string, name: string): string {
  return what.replace(/^(הילדה|הילד) /, `${name} `);
}
