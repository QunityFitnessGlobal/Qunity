import type { ReactNode } from "react";

// The settings screen's pieces, in the screens' design: grouped cards of
// rows (an icon in a soft square, the label, an arrow), and the popup the
// rows open. Presentational only, so both server and client parts use them.

export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title && <h2 className="px-1 text-[13px] font-semibold text-[#6c6580]">{title}</h2>}
      <div className="divide-y divide-[#f1edf5] overflow-hidden rounded-[20px] border border-[#ece6f2] bg-white">
        {children}
      </div>
    </section>
  );
}

// The clickable element of a row (a <button> or a <Link>).
export const SETTINGS_ROW =
  "flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-[#faf8fc] disabled:opacity-60";

interface SettingsRowContentProps {
  icon: ReactNode;
  label: string;
  hint?: string;
  // A lighter row, for a secondary path.
  quiet?: boolean;
}

export function SettingsRowContent({ icon, label, hint, quiet }: SettingsRowContentProps) {
  return (
    <>
      <span
        className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl ${
          quiet ? "bg-[#f4f2f7] text-[#8a8399]" : "bg-brand-purple/[0.08] text-brand-purple"
        }`}
        aria-hidden
      >
        {icon}
      </span>
      <span className="flex flex-1 flex-col">
        <span className={quiet ? "text-sm text-[#6c6580]" : "text-[15px] font-medium text-[#221a33]"}>{label}</span>
        {hint && <span className="text-xs text-[#8a8399]">{hint}</span>}
      </span>
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 flex-none text-[#b5aec2] ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12.5 5l-5 5 5 5" />
      </svg>
    </>
  );
}

interface SettingsDialogProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
}

// A popup over the screen: a card that rises from the bottom on a phone.
export function SettingsDialog({ title, icon, children }: SettingsDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#221a33]/40 px-4 pb-6 sm:items-center sm:pb-0" role="dialog" aria-modal="true">
      <div className="animate-chat-in flex w-full max-w-sm flex-col gap-3 rounded-[22px] bg-white p-5 text-center shadow-[0_20px_50px_rgba(34,26,51,0.25)]">
        {icon && (
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-purple/[0.08] text-brand-purple" aria-hidden>
            {icon}
          </span>
        )}
        {title && <h2 className="font-display text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

// A quiet text button under a popup's main action.
export const DIALOG_CLOSE = "mx-auto min-h-10 px-4 text-sm font-semibold text-[#6c6580]";

// A 4-digit code field (the parent's PIN).
export const PIN_INPUT =
  "w-full rounded-2xl border-[1.5px] border-[#e4dfeb] bg-[#faf8fc] px-3 py-3 text-center font-display text-2xl tracking-[0.5em] focus:border-brand-purple focus:outline-none";

const ICON = "h-5 w-5";
const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const SettingsIcons = {
  addChild: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M8 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2.5 17c.5-3 2.7-5 5.5-5s5 2 5.5 5M15.5 6.5v5M13 9h5" />
    </svg>
  ),
  device: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M6.5 2.5h7a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1zM9 15h2" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l1-1" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M5.5 9h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1zM7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M7.5 3.5 6 16.5M14 3.5l-1.5 13M3.5 7.5h13M3 12.5h13" />
    </svg>
  ),
  sound: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M3.5 8v4h3l4 3.5v-11L6.5 8z" />
      <path d="M13 7.5a3.5 3.5 0 0 1 0 5M15 5.5a6.5 6.5 0 0 1 0 9" />
    </svg>
  ),
  childMode: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M10 2.8l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5L2.8 8l5-.6z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 20 20" className={ICON} {...line}>
      <path d="M8 17H4.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H8M12.5 14l-4-4 4-4M8.5 10h8" />
    </svg>
  ),
};
