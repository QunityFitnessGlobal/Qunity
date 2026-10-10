import { requireAdmin } from "@/lib/admin-guard";
import { loadAdminDataset } from "@/services/admin-dataset";
import { parseFilters, type SearchParams } from "@/lib/admin/filters";
import { ActivitySection } from "@/components/admin/sections/ActivitySection";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  return <ActivitySection data={await loadAdminDataset()} filters={filters} />;
}
