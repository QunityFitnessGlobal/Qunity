import type { CSSProperties, ReactNode } from "react";
import type { FamilyStatus } from "@/lib/admin/metrics";
import { STAGE_NAMES } from "@/lib/admin/metrics";
import type { BraceletColor } from "@/lib/types";

// The admin dashboard's building blocks. Charts follow one set of rules:
// one blue series, an ordinal blue ramp for ordered buckets, a stage's color
// only as a dot beside its name, status colors only with an icon and a label,
// and text always in ink. Every mark has a title for hover.

export const INK = { primary: "#1f1a2b", secondary: "#52514e", muted: "#898781", grid: "#e1e0d9", base: "#c3c2b7" };
export const BLUE = { 600: "#184f95", 550: "#1c5cab", 450: "#2a78d6", 400: "#3987e5", 300: "#6da7ec", 250: "#86b6ef", 200: "#9ec5f4" };
const STATUS_COLOR = { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" };

const STAGE_DOT: Record<BraceletColor, CSSProperties> = {
  white: { background: "#f1f1f4", boxShadow: "inset 0 0 0 2px #2c2c30" },
  orange: { background: "#ff8a3d" },
  green: { background: "#22c55e" },
  blue: { background: "#3b82f6" },
  purple: { background: "#a32894" },
};

export function StageDot({ color, size = 10 }: { color: BraceletColor; size?: number }) {
  return <span aria-hidden className="inline-block flex-none rounded-full" style={{ width: size, height: size, ...STAGE_DOT[color] }} />;
}

export function StageName({ color }: { color: BraceletColor }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StageDot color={color} />
      {STAGE_NAMES[color]}
    </span>
  );
}

// Keeps numeric ranges and fractions ("11.8 / 15", "7–13") in order inside Hebrew.
export function Ltr({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}

export function Card({ title, subtitle, children, className = "" }: { title: string; subtitle?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col gap-2.5 rounded-[14px] border border-black/[0.09] bg-[#fcfcfb] px-4 py-3.5 ${className}`}>
      <div className="flex flex-col gap-px">
        <h2 className="text-[14.5px] font-semibold">{title}</h2>
        {subtitle && <span className="text-xs text-[#52514e]">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

export function Tile({ label, value, note, delta, up, tone }: { label: string; value: ReactNode; note?: ReactNode; delta?: string | null; up?: boolean | null; tone?: "warning" }) {
  return (
    <section
      className={`flex min-w-0 flex-col gap-0.5 rounded-[14px] border px-4 py-3 ${
        tone === "warning" ? "border-[#f3dca8] bg-[#fffaf0]" : "border-black/[0.09] bg-[#fcfcfb]"
      }`}
    >
      <span className="flex items-center gap-1.5 text-[12.5px] text-[#52514e]">
        {tone === "warning" && <WarnIcon color={STATUS_COLOR.warning} />}
        {label}
      </span>
      <span className="text-[30px] font-semibold leading-tight">{value}</span>
      {(delta || note) && (
        <span className="text-xs text-[#52514e]">
          {delta && (
            <b className={`font-semibold ${up === false ? "text-[#b42318]" : "text-[#006300]"}`}>
              {up === false ? "▼" : "▲"} <Ltr>{delta}</Ltr>
            </b>
          )}{" "}
          {note}
        </span>
      )}
    </section>
  );
}

function WarnIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden>
      <path d="M10 2.5l8 14.5H2z" fill={color} />
      <path d="M10 8v4.2M10 14.6v.1" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export function Flag({ level, children }: { level: "critical" | "serious"; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#fbd9c4] bg-[#fff7ed] px-2.5 py-0.5 text-xs font-semibold">
      <WarnIcon color={STATUS_COLOR[level]} size={13} />
      {children}
    </span>
  );
}

const STATUS_META: Record<FamilyStatus, { label: string; color: string; path: string; filled?: boolean }> = {
  active: { label: "פעיל", color: STATUS_COLOR.good, path: "M5 10.5l3.2 3.2L15 7" },
  risk: { label: "בסיכון", color: STATUS_COLOR.warning, path: "M10 3.5l7 12.5H3z", filled: true },
  inactive: { label: "לא פעיל", color: STATUS_COLOR.critical, path: "M6 6l8 8M14 6l-8 8" },
  new: { label: "טרם התחיל", color: INK.muted, path: "M10 5v5l3 2" },
};

export const FAMILY_STATUS_LABELS: Record<FamilyStatus, string> = {
  active: STATUS_META.active.label,
  risk: STATUS_META.risk.label,
  inactive: STATUS_META.inactive.label,
  new: STATUS_META.new.label,
};

export function StatusPill({ status }: { status: FamilyStatus }) {
  const m = STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-semibold">
      <svg viewBox="0 0 20 20" width={14} height={14} aria-hidden>
        <path d={m.path} fill={m.filled ? m.color : "none"} stroke={m.filled ? "none" : m.color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {m.label}
    </span>
  );
}

export interface BarRow {
  label: ReactNode;
  title: string;
  value: number | null;
  text?: string;
  empty?: string;
}

// Horizontal bars growing from the start (right), value at the tip.
export function HBars({ rows, max, labelWidth = 150, height = 18, valueWidth = 56 }: { rows: BarRow[]; max?: number; labelWidth?: number; height?: number; valueWidth?: number }) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value ?? 0));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => {
        const w = r.value && r.value > 0 ? Math.max(0.6, (r.value / m) * 100) : 0;
        return (
          <div key={i} className="group flex items-center gap-2.5" title={r.value === null ? `${r.title}: ${r.empty ?? "אין עדיין נתונים"}` : `${r.title}: ${r.text ?? r.value}`}>
            <span className="flex flex-none items-center gap-1.5 overflow-hidden text-[13px]" style={{ width: labelWidth }}>
              <span className="truncate">{r.label}</span>
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              {r.value === null ? (
                <span className="text-xs text-[#898781]">{r.empty ?? "אין עדיין נתונים"}</span>
              ) : (
                <>
                  {w > 0 && <span className="rounded-s-none rounded-e-[4px] group-hover:brightness-90" style={{ height, width: `${w}%`, background: BLUE[450] }} />}
                  <span className="flex-none text-[12.5px] font-semibold tabular-nums" style={{ width: valueWidth }}>
                    {r.text ?? r.value}
                  </span>
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Legend({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="flex flex-wrap gap-3.5 text-xs text-[#52514e]">
      {items.map(([color, label], i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function DataTable({ columns, rows, empty = "אין עדיין נתונים" }: { columns: { label: string; width?: string; align?: "center" }[]; rows: ReactNode[][]; empty?: string }) {
  if (rows.length === 0) return <p className="py-3 text-center text-sm text-[#898781]">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={`border-b border-[#e1e0d9] px-2.5 py-1.5 text-xs font-semibold text-[#52514e] ${c.align === "center" ? "text-center" : "text-start"}`} style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-[#f6f5f2]">
              {r.map((cell, j) => (
                <td key={j} className={`border-b border-[#efeee9] px-2.5 py-2 align-middle tabular-nums ${columns[j]?.align === "center" ? "text-center" : "text-start"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Daily columns, oldest on the left (dates read left to right), with an
// optional marker line and the last value labeled.
export function DailyColumns({ days, markerIndex, markerLabel }: { days: { label: string; value: number }[]; markerIndex: number | null; markerLabel?: string }) {
  const W = 980;
  const H = 190;
  const padL = 34;
  const padB = 22;
  const padT = 18;
  const plotW = W - padL - 8;
  const plotH = H - padB - padT;
  const peak = Math.max(4, ...days.map((d) => d.value));
  const step = peak <= 10 ? 2 : peak <= 40 ? 10 : peak <= 100 ? 20 : 50;
  const maxY = Math.ceil(peak / step) * step;
  const bw = plotW / days.length;
  const barW = Math.min(18, Math.max(3, bw - 4));
  const labelEvery = Math.max(1, Math.ceil(days.length / 7));
  const y = (v: number) => padT + plotH - (v / maxY) * plotH;
  const last = days[days.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ direction: "ltr" }} role="img" aria-label="אימונים שהושלמו בכל יום">
      {Array.from({ length: maxY / step + 1 }, (_, i) => i * step).map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - 8} y1={y(t)} y2={y(t)} stroke={t === 0 ? INK.base : INK.grid} strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={INK.muted} direction="ltr">
            {t}
          </text>
        </g>
      ))}
      {days.map((d, i) => {
        const x = padL + i * bw + (bw - barW) / 2;
        const h = (d.value / maxY) * plotH;
        const r = Math.min(4, h / 2);
        return (
          <g key={i}>
            {d.value > 0 && (
              <path
                d={`M${x} ${padT + plotH} V${y(d.value) + r} Q${x} ${y(d.value)} ${x + r} ${y(d.value)} H${x + barW - r} Q${x + barW} ${y(d.value)} ${x + barW} ${y(d.value) + r} V${padT + plotH} Z`}
                fill={BLUE[450]}
                className="hover:brightness-90"
              >
                <title>{`${d.label}: ${d.value} אימונים`}</title>
              </path>
            )}
            {(i % labelEvery === 0 || i === days.length - 1) && (
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill={INK.muted} direction="ltr">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
      {markerIndex !== null && (
        <g>
          <line x1={padL + markerIndex * bw - 2} x2={padL + markerIndex * bw - 2} y1={padT - 6} y2={padT + plotH} stroke={INK.primary} strokeWidth={1} />
          <text x={padL + markerIndex * bw - 8} y={padT + 4} textAnchor="end" fontSize={11.5} fontWeight={600} fill={INK.primary}>
            {markerLabel ?? "התחלת השיווק"}
          </text>
        </g>
      )}
      {last && last.value > 0 && (
        <text x={padL + (days.length - 1) * bw + bw / 2} y={y(last.value) - 6} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={INK.primary} direction="ltr">
          {last.value}
        </text>
      )}
    </svg>
  );
}

// Columns for a few buckets, the first one picked out (e.g. runs that paid 0).
export function BucketColumns({ buckets, highlightFirst = true }: { buckets: { label: string; value: number }[]; highlightFirst?: boolean }) {
  const W = 460;
  const H = 170;
  const pb = 24;
  const pt = 18;
  const plotH = H - pb - pt;
  const peak = Math.max(4, ...buckets.map((b) => b.value));
  const step = peak <= 10 ? 2 : peak <= 40 ? 10 : 20;
  const maxY = Math.ceil(peak / step) * step;
  const bw = (W - 40) / buckets.length;
  const barW = 24;
  const y = (v: number) => pt + plotH - (v / maxY) * plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ direction: "ltr" }} role="img" aria-label="התפלגות הנקודות">
      {Array.from({ length: maxY / step + 1 }, (_, i) => i * step).map((t) => (
        <g key={t}>
          <line x1={30} x2={W} y1={y(t)} y2={y(t)} stroke={t === 0 ? INK.base : INK.grid} />
          <text x={24} y={y(t) + 4} textAnchor="end" fontSize={11} fill={INK.muted} direction="ltr">
            {t}
          </text>
        </g>
      ))}
      {buckets.map((b, i) => {
        const x = 40 + i * bw + (bw - barW) / 2;
        const top = y(b.value);
        return (
          <g key={b.label}>
            {b.value > 0 && (
              <path d={`M${x} ${pt + plotH} V${top + 4} Q${x} ${top} ${x + 4} ${top} H${x + barW - 4} Q${x + barW} ${top} ${x + barW} ${top + 4} V${pt + plotH} Z`} fill={highlightFirst && i === 0 ? BLUE[600] : BLUE[250]}>
                <title>{`${b.label} נקודות: ${b.value} ביצועים`}</title>
              </path>
            )}
            <text x={x + barW / 2} y={top - 5} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={INK.primary} direction="ltr">
              {b.value}
            </text>
            <text x={x + barW / 2} y={H - 7} textAnchor="middle" fontSize={11.5} fill={INK.secondary} direction="ltr">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// A percent cell of the return table: darker blue for more children back.
export function HeatCell({ value, title }: { value: number | null; title: string }) {
  if (value === null) return <span className="flex h-[38px] items-center justify-center rounded bg-[#f1f0ec] text-[#898781]">—</span>;
  const [bg, fg] = value >= 90 ? [BLUE[550], "#fff"] : value >= 65 ? [BLUE[400], "#fff"] : value >= 50 ? [BLUE[300], INK.primary] : [BLUE[200], INK.primary];
  return (
    <span title={title} className="flex h-[38px] items-center justify-center rounded font-semibold" style={{ background: bg, color: fg }}>
      {value}%
    </span>
  );
}
