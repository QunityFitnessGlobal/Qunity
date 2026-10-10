import { availableChannels, challengesView, type AdminDataset, type AdminFilters } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";
import { BLUE, BucketColumns, Card, DataTable, HBars, Ltr } from "@/components/admin/parts";

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ChallengesSection({ data, filters }: { data: AdminDataset; filters: AdminFilters }) {
  const v = challengesView(data, filters);
  const dash = <span className="text-[#898781]">—</span>;

  return (
    <AdminShell section="challenges" title="אתגרים" subtitle="אילו אתגרים ילדים משיגים, ואיך עובדים אתגרי המדרגות" filters={filters} channels={availableChannels(data)}>
      <div className="flex flex-col gap-3 lg:flex-row">
        <Card title="אתגרים חד־פעמיים" subtitle={`אחוז מ־${v.kidsInProgram} הילדים בתוכנית שכבר קיבלו כל אתגר`} className="lg:flex-1">
          <HBars max={100} labelWidth={150} height={16} rows={v.once.map((c) => ({ label: c.title, title: c.title, value: c.pct, text: `${c.pct}%` }))} />
        </Card>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-[1.15]">
          <Card title="אתגרי המדרגות" subtitle="כל ביצוע משלם לפי הזמן שהשרת מדד · ביצועים בתקופה שנבחרה">
            <DataTable
              columns={[{ label: "אתגר", width: "20%" }, { label: "נפתח ל־", width: "11%", align: "center" }, { label: "ביצועים", width: "11%", align: "center" }, { label: "זמן חציוני", width: "13%", align: "center" }, { label: "קיבלו 0", width: "11%", align: "center" }, { label: "ממוצע נקודות", align: "center" }]}
              rows={v.stairs.map((s) =>
                s.unlocked === 0 && s.runs === 0
                  ? [s.title, "0", dash, dash, dash, <span key="n" className="text-[#898781]">עוד לא נפתח</span>]
                  : [
                      s.title,
                      s.unlocked,
                      s.runs,
                      s.medianSeconds === null ? dash : <Ltr key="t">{clock(s.medianSeconds)}</Ltr>,
                      s.zeroPct === null ? dash : `${s.zeroPct}%`,
                      s.avgPoints === null ? dash : <Ltr key="a">{`${s.avgPoints} / ${s.max}`}</Ltr>,
                    ],
              )}
            />
          </Card>

          <Card
            title={v.histogram ? `${v.histogram.title}: כמה נקודות קיבלו` : "כמה נקודות קיבלו"}
            subtitle={v.histogram ? `${v.histogram.runs} ביצועים, לפי נקודות (מתוך ${v.histogram.max})` : undefined}
          >
            {v.histogram ? (
              <>
                <BucketColumns buckets={v.histogram.buckets} />
                <p className="flex items-center gap-1.5 text-xs text-[#52514e]">
                  <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-sm" style={{ background: BLUE[600] }} />
                  <span>
                    <b className="text-[#1f1a2b]">
                      {v.histogram.zero} ביצועים ({v.histogram.zeroPct}%) קיבלו 0
                    </b>
                    {v.histogram.minSeconds !== null && `, כי הסתיימו תוך פחות מ־${v.histogram.minSeconds} שניות`}. אם המספר יעלה, כדאי לכוונן את זמן המינימום.
                  </span>
                </p>
              </>
            ) : (
              <p className="py-3 text-center text-sm text-[#898781]">עוד אין ביצועים של אתגרי מדרגות בתקופה הזו</p>
            )}
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
