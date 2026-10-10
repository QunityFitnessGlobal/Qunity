import Link from "next/link";
import { filterQuery } from "@/lib/admin/filters";
import { availableChannels, familiesView, STAGE_NAMES, type AdminDataset, type AdminFilters, type FamilyStatus } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";
import { FAMILY_STATUS_LABELS, Ltr, StageDot, StatusPill } from "@/components/admin/parts";

const COLUMNS = "grid-cols-[1.1fr_1.2fr_.8fr_.9fr_1.05fr_.7fr_1.25fr]";

interface FamiliesSectionProps {
  data: AdminDataset;
  filters: AdminFilters;
  status: FamilyStatus | "all";
  familyId: string | null;
}

export function FamiliesSection({ data, filters, status, familyId }: FamiliesSectionProps) {
  const v = familiesView(data, filters, status, familyId);
  const href = (changes: { status?: FamilyStatus | "all"; family?: string }) => {
    const extra: Record<string, string> = {};
    const nextStatus = changes.status ?? status;
    if (nextStatus !== "all") extra.status = nextStatus;
    if (changes.family) extra.family = changes.family;
    return `/admin/families${filterQuery(filters, {}, extra)}`;
  };
  const chips: (FamilyStatus | "all")[] = ["all", "active", "risk", "inactive", "new"];

  return (
    <AdminShell
      section="families"
      title="משפחות"
      subtitle="כל משפחה, איפה היא עומדת ומתי התאמנה לאחרונה · לחיצה על שורה פותחת את ציר הזמן"
      filters={filters}
      channels={availableChannels(data)}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <section className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-[14px] border border-black/[0.09] bg-[#fcfcfb] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <Link
                  key={c}
                  href={href({ status: c })}
                  scroll={false}
                  className={`rounded-full border border-black/10 px-3 py-1.5 text-[12.5px] font-semibold ${status === c ? "bg-[#1f1a2b] text-white" : "bg-white text-[#52514e] hover:bg-[#f6f5f2]"}`}
                >
                  {c === "all" ? "הכול" : FAMILY_STATUS_LABELS[c]} <span className="font-normal opacity-75">{v.counts[c]}</span>
                </Link>
              ))}
            </div>
            <span className="text-xs text-[#52514e]">
              פעיל: התאמן ב־7 הימים האחרונים · בסיכון: <Ltr>7–13</Ltr> ימים · לא פעיל: 14 ומעלה
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className={`grid ${COLUMNS} gap-2 px-2.5 pb-1 text-xs font-semibold text-[#52514e]`}>
                <span>הורה</span>
                <span>ילדים ושלב</span>
                <span>הצטרפו</span>
                <span>ערוץ</span>
                <span>אימון אחרון</span>
                <span className="text-center">אימונים</span>
                <span>סטטוס</span>
              </div>
              <div className="flex flex-col gap-1">
                {v.rows.length === 0 && <p className="py-4 text-center text-sm text-[#898781]">אין משפחות כאן</p>}
                {v.rows.map((f) => {
                  const on = v.selected?.id === f.id;
                  return (
                    <Link
                      key={f.id}
                      href={href({ family: f.id })}
                      scroll={false}
                      aria-current={on ? "true" : undefined}
                      className={`grid ${COLUMNS} items-center gap-2 rounded-[10px] border px-2.5 py-2 text-[13px] ${on ? "border-[#d9b3d4] bg-[#f6eef6]" : "border-transparent hover:bg-[#f6f5f2]"}`}
                    >
                      <b className="font-semibold">{f.parentName}</b>
                      <span className="flex flex-col gap-0.5">
                        {f.kids.length === 0 && <span className="text-[#898781]">—</span>}
                        {f.kids.map((k, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5">
                            <StageDot color={k.color} size={9} />
                            {k.name}
                          </span>
                        ))}
                      </span>
                      <span className="tabular-nums">{f.joined}</span>
                      <span>{f.channel}</span>
                      <span className="flex flex-col">
                        <span className="tabular-nums">{f.lastWorkout ?? "—"}</span>
                        <span className="text-[11.5px] text-[#52514e]">{f.ago}</span>
                      </span>
                      <span className="text-center tabular-nums">{f.workouts}</span>
                      <StatusPill status={f.status} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="flex w-full flex-none flex-col gap-3 rounded-[14px] border border-black/[0.09] bg-[#fcfcfb] p-4 lg:w-[300px]">
          {v.selected ? (
            <>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-[#52514e]">משפחה</span>
                <span className="text-xl font-bold">{v.selected.parentName}</span>
                <span className="text-[12.5px] text-[#52514e]">
                  הצטרפו ב־{v.selected.joined} · {v.selected.channel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={v.selected.status} />
                <span className="text-[12.5px] text-[#52514e]">{v.selected.ago}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {v.selected.kidCards.map((k, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-[10px] bg-[#f4f3f0] px-2.5 py-2 text-[13px]">
                    <StageDot color={k.color} />
                    <b className="font-semibold">{k.name}</b>
                    <span className="text-[#52514e]">שלב {STAGE_NAMES[k.color]}</span>
                    <span className="ms-auto text-xs tabular-nums text-[#52514e]">
                      {k.workouts} אימונים · {k.points.toLocaleString("en-US")} נק׳
                    </span>
                  </div>
                ))}
              </div>
              <span className="mt-0.5 text-[13px] font-semibold">ציר זמן</span>
              <ol className="flex flex-col">
                {v.selected.timeline.map((e, i) => (
                  <li key={i} className="flex items-start gap-2.5 pb-2.5">
                    <span aria-hidden className="mt-1.5 h-2 w-2 flex-none rounded-full bg-[#2a78d6]" />
                    <span className="flex flex-col">
                      <span className="text-[11.5px] tabular-nums text-[#52514e]">{e.date}</span>
                      <span className="text-[13px]">{e.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-[#898781]">בחרו משפחה מהרשימה</p>
          )}
        </aside>
      </div>
    </AdminShell>
  );
}
