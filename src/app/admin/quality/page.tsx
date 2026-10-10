import { requireAdmin } from "@/lib/admin-guard";
import { loadAdminDataset } from "@/services/admin-dataset";
import { parseFilters, type SearchParams } from "@/lib/admin/filters";
import { QualitySection } from "@/components/admin/sections/QualitySection";

export default async function QualityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  return <QualitySection data={await loadAdminDataset()} filters={filters} />;
}
