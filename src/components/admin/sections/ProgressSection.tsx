import { availableChannels, progressView, STAGE_NAMES, type AdminDataset, type AdminFilters } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, DataTable, HBars, Ltr, StageName, Tile } from "@/components/admin/parts";

export function ProgressSection({ data, filters }: { data: AdminDataset; filters: AdminFilters }) {
  const v = progressView(data, filters);
  const white = v.daysPerStage.find((s) => s.color === "white");
  const whiteLevel = data.levels.find((l) => l.color === "white");

  return (
    <AdminShell section="progress" title="התקדמות בשלבים" subtitle="איפה הילדים נמצאים, כמה זמן לוקח לעבור שלב, ומי נתקע" filters={filters} channels={availableChannels(data)}>
      <div className="grid gap-3 md:grid-cols-3">
        <Tile label="ילדים בתוכנית" value={v.kidsInProgram} note="ילדים שהתאמנו לפחות פעם אחת" />
        <Tile
          label="ימים בממוצע לסיום השלב הלבן"
          value={white?.avg ?? "—"}
          note={white?.fastest ? `${whiteLevel?.requiredWorkouts ?? ""} אימונים · הכי מהיר: ${white.fastest === 1 ? "יום אחד" : `${white.fastest} ימים`}` : "עוד אף ילד לא סיים"}
        />
        <Tile label={'ילדים "תקועים"'} value={v.stuckCount} tone={v.stuckCount > 0 ? "warning" : undefined} note="סיימו את כל אימוני השלב, אבל חסרות להם נקודות" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Card title="כמה ילדים בכל שלב" subtitle="השלב הנוכחי של כל ילד" className="lg:flex-1">
          <HBars
            labelWidth={70}
            valueWidth={66}
            rows={v.perStage.map((s) => ({ label: <StageName color={s.color} />, title: STAGE_NAMES[s.color], value: s.count, text: `${s.count} ילדים` }))}
          />
        </Card>
        <Card title="ימים בממוצע לסיום כל שלב" subtitle="מהאימון הראשון בשלב ועד האחרון לפני השלב הבא" className="lg:flex-1">
          <HBars
            labelWidth={70}
            valueWidth={70}
            rows={v.daysPerStage.map((s) => ({
              label: <StageName color={s.color} />,
              title: STAGE_NAMES[s.color],
              value: s.avg,
              text: s.avg === null ? undefined : `${s.avg} ימים`,
              empty: s.color === "purple" ? "השלב האחרון" : "עוד אף ילד לא סיים",
            }))}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Card title="הילדים התקועים" subtitle="סיימו את כל אימוני השלב ולא עלו, כי חסרות נקודות · רלוונטי להחלטה על דרישת הנקודות" className="lg:flex-[1.45]">
          <DataTable
            columns={[{ label: "ילד", width: "17%" }, { label: "שלב", width: "15%" }, { label: "אימונים בשלב", width: "16%", align: "center" }, { label: "נקודות", width: "15%", align: "center" }, { label: "חסרות", width: "11%", align: "center" }, { label: "אימונים נוספים", align: "center" }]}
            rows={v.stuck.map((s) => [
              s.name,
              <StageName key="s" color={s.color} />,
              <Ltr key="w">{s.workouts}</Ltr>,
              <Ltr key="p">{s.points}</Ltr>,
              <b key="m" className="font-semibold">
                {s.missing}
              </b>,
              s.extra,
            ])}
            empty="אין ילדים תקועים 🎉"
          />
          {v.stuckCount > v.stuck.length && <p className="text-xs text-[#52514e]">ועוד {v.stuckCount - v.stuck.length} ילדים.</p>}
        </Card>
        <Card title="אימונים עם הורה" subtitle="אחוז מהאימונים בכל שלב, בתקופה שנבחרה" className="lg:flex-1">
          <HBars
            max={Math.max(60, ...v.parentShare.map((p) => p.value ?? 0))}
            labelWidth={70}
            rows={v.parentShare.map((p) => ({ label: <StageName color={p.color} />, title: STAGE_NAMES[p.color], value: p.value, text: p.value === null ? undefined : `${p.value}%` }))}
          />
        </Card>
      </div>
    </AdminShell>
  );
}
