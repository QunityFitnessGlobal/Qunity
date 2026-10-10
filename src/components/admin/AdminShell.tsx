import Link from "next/link";
import type { ReactNode } from "react";
import { CHANNEL_LABELS, type Channel } from "@/lib/acquisition";
import { filterQuery } from "@/lib/admin/filters";
import type { AdminFilters, RangeKey } from "@/lib/admin/metrics";
import { ChannelSelect } from "@/components/admin/ChannelSelect";

// The admin dashboard's frame (internal, Hebrew only): the sections on the
// side, the section's title, and the filters every section shares.

export type AdminSection = "funnel" | "activity" | "quality" | "progress" | "challenges" | "parents" | "families";

export const ADMIN_SECTIONS: { key: AdminSection; letter: string; label: string; icon: string }[] = [
  { key: "funnel", letter: "א", label: "משפך הצטרפות", icon: "M3 4h14l-5 6v6l-4-2v-4z" },
  { key: "activity", letter: "ב", label: "פעילות וחזרה", icon: "M3 15l4-5 3 3 4-6 3 4" },
  { key: "quality", letter: "ג", label: "איכות האימון", icon: "M10 2.5l2.4 5 5.4.6-4 3.7 1.1 5.4L10 14.6l-4.9 2.6 1.1-5.4-4-3.7 5.4-.6z" },
  { key: "progress", letter: "ד", label: "התקדמות בשלבים", icon: "M3 16h4v-4h4V8h4V4h2" },
  { key: "challenges", letter: "ה", label: "אתגרים", icon: "M5 17.5V3M5 3.5h9l-2 3.5 2 3.5H5" },
  { key: "parents", letter: "ו", label: "הורים", icon: "M7 9a3 3 0 100-6 3 3 0 000 6zM2 17c.4-3 2.4-5 5-5s4.6 2 5 5M14 8.5a2.5 2.5 0 100-5M14.5 12c2 .3 3.3 2 3.5 4.5" },
  { key: "families", letter: "ז", label: "משפחות", icon: "M3 5h14M3 10h14M3 15h9" },
];

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "7", label: "7 ימים" },
  { value: "30", label: "30 ימים" },
  { value: "all", label: "מתחילת הבדיקה" },
];

interface AdminShellProps {
  section: AdminSection;
  title: string;
  subtitle: string;
  filters: AdminFilters;
  channels: Channel[];
  children: ReactNode;
}

export function AdminShell({ section, title, subtitle, filters, channels, children }: AdminShellProps) {
  const current = ADMIN_SECTIONS.find((s) => s.key === section)!;
  const base = `/admin/${section}`;
  const chip = (on: boolean) =>
    `rounded-full px-3 py-1.5 text-[12.5px] ${on ? "bg-[#1f1a2b] font-semibold text-white" : "border border-black/10 bg-white font-medium text-[#52514e] hover:bg-[#f6f5f2]"}`;

  return (
    <div dir="rtl" className="flex min-h-dvh w-full flex-col bg-[#f5f4f7] font-ui text-[#1f1a2b] md:flex-row">
      <aside className="flex flex-none flex-col gap-1 bg-[#1f1a2b] px-3.5 py-4 md:sticky md:top-0 md:h-dvh md:w-[216px]">
        <div className="flex items-baseline gap-2 px-1.5 pb-3">
          <span className="font-display text-[22px] font-bold text-white">Qunity</span>
          <span className="text-xs text-[#c9c4d6]">מסך בקרה</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {ADMIN_SECTIONS.map((s) => {
            const on = s.key === section;
            return (
              <Link
                key={s.key}
                href={`/admin/${s.key}${filterQuery(filters)}`}
                aria-current={on ? "page" : undefined}
                className={`relative flex flex-none items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm ${
                  on ? "bg-white/[0.12] font-semibold text-white" : "font-medium text-[#c9c4d6] hover:bg-white/[0.06]"
                }`}
              >
                {on && <span aria-hidden className="absolute inset-y-2 -start-3.5 hidden w-1 rounded-e bg-brand-purple md:block" />}
                <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] flex-none" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={s.icon} />
                </svg>
                <span className="whitespace-nowrap md:flex-1">{s.label}</span>
                <span className="hidden text-[11px] opacity-60 md:inline">{s.letter}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden rounded-[10px] bg-white/[0.07] p-2.5 text-[11.5px] leading-relaxed text-[#c9c4d6] md:block">
          <b className="font-semibold text-white">רק למנהלים</b>
          <br />
          בלי שמות מלאים ובלי הקלטות מסך. כינויים של ילדים בלבד.
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-3.5 px-4 py-4 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-brand-purple">
              {current.letter} · {current.label}
            </span>
            <h1 className="text-2xl font-bold">{title}</h1>
            <span className="text-[13px] text-[#52514e]">{subtitle}</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {RANGES.map((r) => (
              <Link key={r.value} href={`${base}${filterQuery(filters, { range: r.value })}`} className={chip(filters.range === r.value)}>
                {r.label}
              </Link>
            ))}
            <ChannelSelect
              value={filters.source}
              options={[
                { value: "all", label: "כל הערוצים", href: `${base}${filterQuery(filters, { source: "all" })}` },
                ...channels.map((c) => ({ value: c, label: CHANNEL_LABELS[c], href: `${base}${filterQuery(filters, { source: c })}` })),
              ]}
            />
            <Link
              href={`${base}${filterQuery(filters, { includeTests: !filters.includeTests })}`}
              className="inline-flex items-center gap-2 text-[12.5px] text-[#52514e]"
              role="switch"
              aria-checked={!filters.includeTests}
            >
              <span className={`relative inline-block h-[17px] w-[30px] rounded-full ${filters.includeTests ? "bg-[#c3c2b7]" : "bg-[#1f1a2b]"}`}>
                <span className={`absolute top-[2px] h-[13px] w-[13px] rounded-full bg-white ${filters.includeTests ? "end-[2px]" : "start-[2px]"}`} />
              </span>
              בלי משתמשי בדיקה
            </Link>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
