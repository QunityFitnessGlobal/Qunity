import { requireAdmin } from "@/lib/admin-guard";
import { loadAdminDataset } from "@/services/admin-dataset";
import { familyParam, parseFamilyStatus, parseFilters, type SearchParams } from "@/lib/admin/filters";
import { FamiliesSection } from "@/components/admin/sections/FamiliesSection";

export default async function FamiliesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = await searchParams;
  return (
    <FamiliesSection
      data={await loadAdminDataset()}
      filters={parseFilters(params)}
      status={parseFamilyStatus(params)}
      familyId={familyParam(params)}
    />
  );
}
