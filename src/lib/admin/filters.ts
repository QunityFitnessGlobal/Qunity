import { CHANNEL_LABELS, type Channel } from "@/lib/acquisition";
import type { AdminFilters, FamilyStatus, RangeKey } from "@/lib/admin/metrics";

// The dashboard's filters live in the address (?range=7&source=facebook&tests=1),
// so every view can be linked to and reloaded as it is.

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseFilters(params: SearchParams): AdminFilters {
  const range = first(params.range);
  const source = first(params.source);
  return {
    range: range === "7" || range === "all" ? (range as RangeKey) : "30",
    source: source && source in CHANNEL_LABELS ? (source as Channel) : "all",
    includeTests: first(params.tests) === "1",
  };
}

export function parseFamilyStatus(params: SearchParams): FamilyStatus | "all" {
  const status = first(params.status);
  return status === "active" || status === "risk" || status === "inactive" || status === "new" ? status : "all";
}

export function familyParam(params: SearchParams): string | null {
  return first(params.family) ?? null;
}

// The query string for these filters with some changed ("" when all defaults).
export function filterQuery(filters: AdminFilters, changes: Partial<AdminFilters> = {}, extra: Record<string, string> = {}): string {
  const f = { ...filters, ...changes };
  const q = new URLSearchParams();
  if (f.range !== "30") q.set("range", f.range);
  if (f.source !== "all") q.set("source", f.source);
  if (f.includeTests) q.set("tests", "1");
  for (const [key, value] of Object.entries(extra)) q.set(key, value);
  const s = q.toString();
  return s ? `?${s}` : "";
}
