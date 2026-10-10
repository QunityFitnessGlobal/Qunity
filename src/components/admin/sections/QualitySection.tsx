import { availableChannels, qualityView, STAGE_NAMES, type AdminDataset, type AdminFilters } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";
import { BLUE, Card, DataTable, Flag, HBars, Legend, Ltr, StageName } from "@/components/admin/parts";

const SEGMENTS: [string, string, string][] = [
  [BLUE[600], "ב־100%", "#fff"],
  [BLUE[400], "60%–99%", "#fff"],
  [BLUE[250], "מתחת ל־60%", "#1f1a2b"],
  ["#c9c8c1", "התחילו ולא סיימו", "#1f1a2b"],
];

export function QualitySection({ data, filters }: { data: AdminDataset; filters: AdminFilters }) {
  const v = qualityView(data, filters);

  return (
    <AdminShell section="quality" title="איכות האימון" subtitle="האם הילדים מסיימים את האימונים, ואיך הם מרגישים בהם" filters={filters} channels={availableChannels(data)}>
      <Card title="איך האימונים הסתיימו" subtitle={'לפי שלב · "התחילו ולא סיימו" = לא הגיעו לשאלון בסוף'}>
        <Legend items={SEGMENTS.map(([color, label]) => [color, label.includes("–") ? <Ltr key={label}>{label}</Ltr> : label])} />
        <div className="mt-0.5 flex flex-col gap-2.5">
          {v.stages.map((s) => (
            <div key={s.color} className="flex items-center gap-2.5">
              <span className="w-24 flex-none text-[13px]">
                <StageName color={s.color} />
              </span>
              {s.parts === null ? (
                <span className="text-xs text-[#898781]">אין עדיין אימונים בשלב הזה</span>
              ) : (
                <>
                  <span className="flex h-[22px] flex-1 gap-[2px]">
                    {s.parts.map((p, i) =>
                      p > 0 ? (
                        <span
                          key={i}
                          title={`${STAGE_NAMES[s.color]} · ${SEGMENTS[i][1]}: ${p}%`}
                          className="flex items-center justify-center text-[11.5px] font-semibold first:rounded-s-[4px] last:rounded-e-[4px] hover:brightness-90"
                          style={{ width: `${p}%`, background: SEGMENTS[i][0], color: SEGMENTS[i][2] }}
                        >
                          {p >= 9 ? `${p}%` : ""}
                        </span>
                      ) : null,
                    )}
                  </span>
                  <span className="w-[86px] flex-none text-xs tabular-nums text-[#52514e]">{s.total.toLocaleString("en-US")} אימונים</span>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Card title="דיווחו &quot;עייף&quot; או &quot;מותש&quot;" subtitle="אחוז מהאימונים בכל שלב" className="lg:flex-1">
          <HBars
            max={Math.max(50, ...v.tired.map((t) => t.value ?? 0))}
            labelWidth={70}
            rows={v.tired.map((t) => ({ label: <StageName color={t.color} />, title: STAGE_NAMES[t.color], value: t.value, text: t.value === null ? undefined : `${t.value}%` }))}
          />
        </Card>
        <Card title="קושי ממוצע שדווח" subtitle={<>מ־1 (קליל) עד 4 (קשה מאוד)</>} className="lg:flex-1">
          <HBars
            max={4}
            labelWidth={70}
            rows={v.difficulty.map((d) => ({ label: <StageName color={d.color} />, title: STAGE_NAMES[d.color], value: d.value, text: d.value === null ? undefined : d.value.toFixed(1) }))}
          />
        </Card>
      </div>

      <Card title="אימונים שכדאי לבדוק" subtitle="אימונים שהתחילו לפחות 3 פעמים · ממוינים לפי &quot;התחילו ולא סיימו&quot;">
        <DataTable
          columns={[{ label: "אימון", width: "30%" }, { label: "שלב", width: "13%" }, { label: "התחילו", width: "9%", align: "center" }, { label: "ב־100%", width: "9%", align: "center" }, { label: "לא סיימו", width: "10%", align: "center" }, { label: "הרגשה נפוצה", width: "14%" }, { label: "" }]}
          rows={v.problems.map((p) => [
            p.title,
            p.color ? (
              <span key="s" className="inline-flex items-center gap-1.5">
                <StageName color={p.color} />
                {p.order !== null && <span className="text-[#52514e]">· {p.order}</span>}
              </span>
            ) : (
              "—"
            ),
            p.starts,
            `${p.fullPct}%`,
            <b key="a" className={p.level ? "font-semibold" : "font-normal"}>
              {p.abandonPct}%
            </b>,
            p.topFeeling ?? "—",
            p.level ? <Flag key="f" level={p.level}>{p.level === "critical" ? "נטישה גבוהה" : "לבדוק"}</Flag> : "",
          ])}
          empty="עוד אין מספיק אימונים כדי להשוות"
        />
        <p className="text-xs text-[#52514e]">
          נטישה גבוהה: <Ltr>20%</Ltr> ומעלה לא סיימו · לבדוק: <Ltr>12%</Ltr> ומעלה.
        </p>
      </Card>
    </AdminShell>
  );
}
