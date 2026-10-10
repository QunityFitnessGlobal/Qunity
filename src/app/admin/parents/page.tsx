import { requireAdmin } from "@/lib/admin-guard";
import { loadAdminDataset } from "@/services/admin-dataset";
import { parseFilters, type SearchParams } from "@/lib/admin/filters";
import { ParentsSection } from "@/components/admin/sections/ParentsSection";

export default async function ParentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  return <ParentsSection data={await loadAdminDataset()} filters={filters} />;
}
