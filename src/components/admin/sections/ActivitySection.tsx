import { activityView, availableChannels, type AdminDataset, type AdminFilters } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, DailyColumns, HBars, HeatCell, Ltr, Tile } from "@/components/admin/parts";

export function ActivitySection({ data, filters }: { data: AdminDataset; filters: AdminFilters }) {
  const v = activityView(data, filters);
  const compare = filters.range === "all" ? undefined : "מול התקופה הקודמת";

  return (
    <AdminShell section="activity" title="פעילות וחזרה" subtitle="כמה מתאמנים, והאם הם חוזרים" filters={filters} channels={availableChannels(data)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {v.kpis.map((k) => (
          <Tile key={k.label} label={k.label} value={k.value} delta={k.delta} up={k.up} note={k.delta ? compare : v.periodLabel} />
        ))}
      </div>

      <Card title="אימונים שהושלמו בכל יום" subtitle={`${v.daily.length} הימים האחרונים`}>
        <DailyColumns days={v.daily} markerIndex={v.markerIndex} />
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Card title="כמה ילדים חוזרים להתאמן" subtitle="לפי שבוע האימון הראשון · אחוז הילדים שהתאמנו בכל שבוע מאז" className="lg:flex-[1.35]">
          {v.cohorts.length === 0 ? (
            <p className="py-3 text-center text-sm text-[#898781]">עוד אין אימונים</p>
          ) : (
            <div className="grid gap-[3px] text-[12.5px]" style={{ gridTemplateColumns: "150px repeat(4, 1fr)" }}>
              <span />
              {["שבוע 1", "שבוע 2", "שבוע 3", "שבוע 4"].map((w) => (
                <span key={w} className="pb-1 text-center text-xs text-[#52514e]">
                  {w}
                </span>
              ))}
              {v.cohorts.map((c) => (
                <div key={c.label} className="contents">
                  <span className="flex flex-col justify-center pe-1.5">
                    <b className="font-semibold">
                      <Ltr>{c.label}</Ltr>
                    </b>
                    <span className="text-[11.5px] text-[#52514e]">{c.size} ילדים</span>
                  </span>
                  {c.weeks.map((w, i) => (
                    <HeatCell key={i} value={w} title={`${c.label} · שבוע ${i + 1}: ${w ?? "—"}%`} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="כמה אימונים בשבוע לילד פעיל" subtitle={`7 הימים האחרונים · ${v.activeKidsWeek} ילדים`} className="lg:flex-1">
          <HBars
            labelWidth={84}
            valueWidth={66}
            rows={v.perKid.map((r) => ({ label: r.label, title: r.label, value: r.value, text: `${r.value} ילדים` }))}
          />
        </Card>
      </div>
    </AdminShell>
  );
}
