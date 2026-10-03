import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

// The five stage colors as small beads that bob one after another — the
// "colorful journey" mark under the logo on every entry screen.
const BEADS: { fill: string; ring?: string }[] = [
  { fill: "var(--color-bracelet-white)", ring: "var(--color-bracelet-white-outline)" },
  { fill: "var(--color-bracelet-orange)" },
  { fill: "var(--color-bracelet-green)" },
  { fill: "var(--color-bracelet-blue)" },
  { fill: "var(--color-bracelet-purple)" },
];

export function StageBeads({ size = 9, gap = 8 }: { size?: number; gap?: number }) {
  return (
    <div aria-hidden className="flex justify-center" style={{ gap }}>
      {BEADS.map((bead, i) => (
        <span
          key={i}
          className="animate-entry-bead box-border rounded-full"
          style={
            {
              width: size,
              height: size,
              background: bead.fill,
              border: bead.ring ? `2px solid ${bead.ring}` : undefined,
              boxShadow: `0 0 10px ${bead.fill}`,
              ["--bead-delay" as string]: `${i * 0.18}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

interface EntryShellProps {
  children: ReactNode;
  // Where the back arrow goes; no arrow when omitted.
  backHref?: string;
  backLabel?: string;
  // Shorter brand bar, for screens with more fields.
  compact?: boolean;
}

// Every entry screen (login, signup, forgot/new password): the dark brand
// bar with the logo and the stage beads, and a light sheet rising over it.
export function EntryShell({ children, backHref, backLabel, compact = false }: EntryShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#faf8fc]">
      <div
        className={`relative flex flex-none flex-col items-center justify-center gap-3.5 overflow-hidden bg-brand-background pb-[22px] ${
          compact ? "h-32" : "h-[168px]"
        }`}
      >
        <span aria-hidden className="animate-entry-glow absolute h-[120px] w-[220px] rounded-full bg-brand-purple blur-[60px]" />
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7.5 5l5 5-5 5" />
            </svg>
          </Link>
        )}
        <Image
          src="/logo/qunity-logo-transparent.png"
          alt="Qunity"
          width={156}
          height={70}
          priority
          className="animate-power-badge-pop relative h-auto w-[156px]"
        />
        <div className="relative">
          <StageBeads />
        </div>
      </div>
      <div className="animate-entry-sheet relative -mt-[22px] flex flex-1 flex-col rounded-t-[28px] bg-[#faf8fc] px-5 pb-6 pt-6">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-3.5">{children}</div>
      </div>
    </div>
  );
}

export const PRIMARY_BUTTON =
  "flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-purple font-display text-[19px] font-semibold text-white shadow-[0_4px_0_#5c1553] transition-transform active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-60";

export const SECONDARY_BUTTON =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#e4dfeb] bg-white font-display text-[17px] font-semibold text-[#221a33]";

export const CHILD_CODE_CHIP =
  "flex min-h-12 items-center justify-center gap-2 rounded-full bg-reward-gold-soft px-4 py-2 text-center text-[15px] font-semibold leading-snug text-[#5c4200]";

export function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6.5" cy="13.5" r="3.5" />
      <path d="M9 11l7.5-7.5M14 6l2 2M12 8l1.5 1.5" />
    </svg>
  );
}
