// Parent tips in the "מה קורה כאן / מה לא לעשות / מה כן לעשות / משפט לדוגמה"
// shape are stored as one line (see scripts/clean-tip-text-linebreaks.mjs
// for why there are no line breaks). These split it back into its parts so
// each can be shown on its own line with its heading.

const LABELS = ["מה קורה כאן:", "מה לא לעשות:", "מה כן לעשות:", "משפט לדוגמה:"];

export interface TipPart {
  // The heading without its colon; null for text that has none.
  label: string | null;
  text: string;
}

export function splitTipParts(text: string): TipPart[] {
  const hits = LABELS.map((label) => ({ label, at: text.indexOf(label) }))
    .filter((hit) => hit.at >= 0)
    .sort((a, b) => a.at - b.at);
  if (hits.length === 0) {
    return [{ label: null, text: text.trim() }];
  }
  const parts: TipPart[] = [];
  const lead = text.slice(0, hits[0].at).trim();
  if (lead) parts.push({ label: null, text: lead });
  hits.forEach((hit, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].at : text.length;
    parts.push({ label: hit.label.slice(0, -1), text: text.slice(hit.at + hit.label.length, end).trim() });
  });
  return parts;
}

// An example sentence written as `"what to say" (why it works)`.
export function splitExample(text: string): { quote: string; why: string | null } {
  const match = /^"([^"]+)"\s*(?:\(([^()]+)\))?\s*$/.exec(text);
  return match ? { quote: match[1], why: match[2] ?? null } : { quote: text, why: null };
}
