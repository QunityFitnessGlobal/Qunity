import { requireAdmin } from "@/lib/admin-guard";
import { loadAdminDataset } from "@/services/admin-dataset";
import { parseFilters, type SearchParams } from "@/lib/admin/filters";
import { ProgressSection } from "@/components/admin/sections/ProgressSection";

export default async function ProgressPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  return <ProgressSection data={await loadAdminDataset()} filters={filters} />;
}
