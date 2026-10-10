import Link from "next/link";
import { filterQuery } from "@/lib/admin/filters";
import { availableChannels, funnelView, type AdminDataset, type AdminFilters } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";
import { BLUE, Card, DataTable, Flag, Tile } from "@/components/admin/parts";

export function FunnelSection({ data, filters }: { data: AdminDataset; filters: AdminFilters }) {
  const v = funnelView(data, filters);
  const top = Math.max(1, v.steps[0].value);
  const conversions = v.steps.slice(1).map((s, i) => (v.steps[i].value > 0 ? Math.round((s.value / v.steps[i].value) * 1000) / 10 : null));
  const worst = conversions.reduce<number | null>((w, c, i) => (c !== null && (w === null || c < (conversions[w] ?? 101)) ? i : w), null);
  const maxConversion = Math.max(0, ...v.channels.map((c) => c.conversion ?? 0));
  const familiesLink = (status: string) => `/admin/families${filterQuery(filters, {}, { status })}`;

  return (
    <AdminShell
      section="funnel"
      title="משפך ההצטרפות"
      subtitle="איפה משפחות נופלות בדרך מהכניסה לאתר ועד שהילד מתאמן שוב"
      filters={filters}
      channels={availableChannels(data)}
    >
      <div className="flex flex-col gap-3 lg:flex-row">
        <Card title="משפך ההצטרפות" subtitle="משפחות שנרשמו בתקופה שנבחרה · מהרשמה ועד אימון שני" className="lg:flex-[1.55]">
          <div className="flex items-center gap-2.5 rounded-[10px] bg-[#f4f3f0] px-3 py-2 text-[13px] text-[#52514e]">
            <svg viewBox="0 0 20 20" className="h-4 w-4 flex-none" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden>
              <circle cx="10" cy="10" r="7" />
              <path d="M3 10h14M10 3c2.5 2.5 2.5 11.5 0 14M10 3c-2.5 2.5-2.5 11.5 0 14" />
            </svg>
            {v.visits === null ? (
              <span>ספירת הכניסות לאתר תתחיל אחרי שטבלת הכניסות תיווצר במסד הנתונים.</span>
            ) : (
              <span>
                <b className="text-[#1f1a2b]">{v.visits.toLocaleString("en-US")}</b> כניסות לאתר
                {v.signupRate !== null && (
                  <>
                    {" "}
                    · <b className="text-[#1f1a2b]">{v.signupRate}%</b> מהן נרשמו
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {v.steps.map((s, i) => (
              <div key={s.label} className="flex flex-col gap-1.5">
                <div className="group flex items-center gap-3" title={`${s.label}: ${s.value}`}>
                  <span className="w-[178px] flex-none text-[13.5px]">{s.label}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {s.value > 0 && <span className="h-6 rounded-e-[4px] group-hover:brightness-90" style={{ width: `${(s.value / top) * 100}%`, background: BLUE[450] }} />}
                    <span className="text-sm font-semibold tabular-nums">{s.value.toLocaleString("en-US")}</span>
                  </span>
                </div>
                {i < conversions.length && conversions[i] !== null && (
                  <div className="flex items-center gap-2 ps-[190px] text-xs text-[#52514e]">
                    <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="#898781" strokeWidth={2} aria-hidden>
                      <path d="M10 3v13M5 11l5 5 5-5" />
                    </svg>
                    <b className="font-semibold text-[#1f1a2b]">{conversions[i]}%</b> עברו לשלב הבא
                    {worst === i && conversions.length > 1 && <Flag level="serious">הנפילה הגדולה</Flag>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {v.twoWorkoutsShare !== null && (
            <p className="text-xs text-[#52514e]">
              מתוך כל מי שנרשם, <b className="text-[#1f1a2b]">{v.twoWorkoutsShare}%</b> כבר התאמנו פעמיים.
            </p>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-1">
          <Tile
            label="זמן חציוני מהרשמה לאימון ראשון"
            value={v.medianDaysToFirstWorkout === null ? "—" : `${v.medianDaysToFirstWorkout} ימים`}
            note="רק משפחות שכבר התאמנו"
          />
          <Tile
            label="נרשמו ולא הוסיפו ילד"
            value={v.noChild}
            note={
              <Link href={familiesLink("new")} className="font-semibold text-brand-purple">
                לרשימת המשפחות ←
              </Link>
            }
          />
          <Tile
            label="הוסיפו ילד, והילד עוד לא נכנס לאפליקציה"
            value={v.childNeverEntered}
            note={
              <Link href={familiesLink("new")} className="font-semibold text-brand-purple">
                לרשימה ←
              </Link>
            }
          />
        </div>
      </div>

      <Card title="לפי ערוץ שיווק" subtitle="מקור ההגעה נשמר בהרשמה, לפי הקישור שממנו הגיעו או האתר שהפנה · המרה = מכניסה לאתר ועד אימון ראשון">
        <DataTable
          columns={[{ label: "ערוץ", width: "22%" }, { label: "כניסות", width: "12%", align: "center" }, { label: "נרשמו", width: "12%", align: "center" }, { label: "אימון ראשון", width: "13%", align: "center" }, { label: "המרה לאימון ראשון" }]}
          rows={v.channels.map((c) => [
            <b key="n" className="font-semibold">
              {c.label}
            </b>,
            c.visits === null ? "—" : c.visits.toLocaleString("en-US"),
            c.signups,
            c.firstWorkout,
            c.conversion === null ? (
              <span key="c" className="text-[#898781]">—</span>
            ) : (
              <span key="c" className="flex items-center gap-2">
                {c.conversion > 0 && <span className="h-3.5 rounded-e-[4px]" style={{ width: `${maxConversion ? (c.conversion / maxConversion) * 70 : 0}%`, background: BLUE[450] }} />}
                <b className="font-semibold">{c.conversion}%</b>
                {c.conversion === maxConversion && maxConversion > 0 && <span className="text-[11.5px] text-[#52514e]">הכי טוב</span>}
              </span>
            ),
          ])}
          empty="עוד אין משפחות בתקופה הזו"
        />
      </Card>
    </AdminShell>
  );
}
