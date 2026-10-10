import { requireAdmin } from "@/lib/admin-guard";
import { loadAdminDataset } from "@/services/admin-dataset";
import { parseFilters, type SearchParams } from "@/lib/admin/filters";
import { ChallengesSection } from "@/components/admin/sections/ChallengesSection";

export default async function ChallengesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filters = parseFilters(await searchParams);
  return <ChallengesSection data={await loadAdminDataset()} filters={filters} />;
}
