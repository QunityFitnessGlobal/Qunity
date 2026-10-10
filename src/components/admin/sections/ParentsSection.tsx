import { availableChannels, parentsView, type AdminDataset, type AdminFilters } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, DataTable, HBars, Tile } from "@/components/admin/parts";

export function ParentsSection({ data, filters }: { data: AdminDataset; filters: AdminFilters }) {
  const v = parentsView(data, filters);

  return (
    <AdminShell section="parents" title="הורים" subtitle="מה ההורים אוהבים, ומה הם שואלים בלי לקבל תשובה טובה" filters={filters} channels={availableChannels(data)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label={'"אהבתי" על טיפים'} value={v.likes} note="מאז ההשקה" />
        <Tile label="שאלות בצ'אט" value={v.questions} note="בתקופה שנבחרה" />
        <Tile label="נמצאה תשובה" value={v.matchedPct === null ? "—" : `${v.matchedPct}%`} note="השאלה התאימה למצב מוכר" />
        <Tile label={'"זה לא בדיוק זה"'} value={v.rejectedPct === null ? "—" : `${v.rejectedPct}%`} note="ההורה סימן שהתשובה לא מתאימה" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Card title="הטיפים שהורים הכי אהבו" subtitle={'לפי מספר ה"אהבתי"'} className="lg:flex-1">
          {v.topTips.length === 0 ? (
            <p className="py-3 text-center text-sm text-[#898781]">עוד אין &quot;אהבתי&quot;</p>
          ) : (
            <HBars labelWidth={250} valueWidth={32} rows={v.topTips.map((t) => ({ label: t.text, title: t.text, value: t.likes }))} />
          )}
        </Card>
        <Card
          title="שאלות שצריך לטפל בהן"
          subtitle={'שאלות שלא נמצאה להן תשובה, או שההורה סימן "זה לא בדיוק זה" · רשימת השיפורים לצ\'אט'}
          className="lg:flex-[1.25]"
        >
          <DataTable
            columns={[{ label: "השאלה", width: "56%" }, { label: "פעמים", width: "10%", align: "center" }, { label: "מה קרה" }, { label: "אחרונה", align: "center" }]}
            rows={v.open.map((q) => [
              q.text,
              q.count,
              <span key="s" className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${q.status === "none" ? "bg-[#f1f0ec]" : "bg-[#fdeee8]"}`}>
                {q.status === "none" ? "לא נמצאה תשובה" : '"זה לא בדיוק זה"'}
              </span>,
              q.last,
            ])}
            empty="אין שאלות פתוחות 🎉"
          />
          <p className="text-xs text-[#52514e]">השאלות נשמרות בלי שם ההורה, ולכן כוללות גם שאלות של משתמשי בדיקה.</p>
        </Card>
      </div>
    </AdminShell>
  );
}
