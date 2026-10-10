import { requireAdmin } from "@/lib/admin-guard";
import { loadAdminDataset } from "@/services/admin-dataset";
import { parseFilters, type SearchParams } from "@/lib/admin/filters";
import { FunnelSection } from "@/components/admin/sections/FunnelSection";

export default async function FunnelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  return <FunnelSection data={await loadAdminDataset()} filters={filters} />;
}
