import { splitExample, splitTipParts } from "@/lib/tip-text";

// A parent tip as the parent reads it: each headed part ("מה קורה כאן",
// "מה לא לעשות"...) on its own line with its heading in bold, and the
// example sentence set apart, its explanation in smaller muted text.
// A tip without headings shows as a plain paragraph.
export function TipText({ text }: { text: string }) {
  const parts = splitTipParts(text);
  if (parts.length === 1 && parts[0].label === null) {
    return <p className="text-sm leading-relaxed text-zinc-700">{text}</p>;
  }
  return (
    <div className="flex flex-col gap-1.5 text-sm leading-relaxed text-zinc-700">
      {parts.map((part, i) => {
        if (part.label === "משפט לדוגמה") {
          const { quote, why } = splitExample(part.text);
          return (
            <div key={i} className="mt-0.5 rounded-xl bg-white/70 px-3 py-2">
              <span className="block text-xs font-semibold text-brand-purple">{part.label}</span>
              <span className="block font-medium text-[#221a33]">&quot;{quote}&quot;</span>
              {why && <span className="block text-xs text-text-muted">{why}</span>}
            </div>
          );
        }
        return (
          <p key={i}>
            {part.label && <span className="font-semibold text-[#4a1c44]">{part.label}: </span>}
            {part.text}
          </p>
        );
      })}
    </div>
  );
}
