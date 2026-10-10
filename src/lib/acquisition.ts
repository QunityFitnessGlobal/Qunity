// Where a family came from, for the admin dashboard's per-channel numbers:
// the utm_* parameters of the link they landed on, or else the site that
// referred them. Kept in the browser from the first visit (first touch) until
// sign-up, where it's stored with the new account (see services/auth.ts).

export interface Acquisition {
  source: string;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
}

const STORAGE_KEY = "qunity_acquisition";
const MAX_LENGTH = 120;

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase().slice(0, MAX_LENGTH);
  return trimmed ? trimmed : null;
}

// From the landing URL and document.referrer. A referrer on our own site
// isn't a source (it's just moving between screens).
export function acquisitionFromLanding(url: URL, referrer: string): Acquisition {
  let referrerHost: string | null = null;
  try {
    const host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
    referrerHost = host && host !== url.hostname.replace(/^www\./, "") ? clean(host) : null;
  } catch {
    referrerHost = null;
  }
  return {
    source: clean(url.searchParams.get("utm_source")) ?? referrerHost ?? "direct",
    medium: clean(url.searchParams.get("utm_medium")),
    campaign: clean(url.searchParams.get("utm_campaign")),
    referrer: referrerHost,
  };
}

// The first real source gets the credit: a link or a referring site is kept
// for good, while "direct" (typed the address, no link) only holds until
// one comes along.
export function shouldReplaceAcquisition(stored: Acquisition | null, incoming: Acquisition): boolean {
  return stored === null || (stored.source === "direct" && incoming.source !== "direct");
}

export function rememberAcquisition(acquisition: Acquisition): void {
  try {
    if (shouldReplaceAcquisition(storedAcquisition(), acquisition)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(acquisition));
    }
  } catch {
    // Storage blocked (private mode): the sign-up simply has no source.
  }
}

export function storedAcquisition(): Acquisition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Acquisition>;
    return typeof parsed.source === "string"
      ? { source: parsed.source, medium: parsed.medium ?? null, campaign: parsed.campaign ?? null, referrer: parsed.referrer ?? null }
      : null;
  } catch {
    return null;
  }
}

// The channel a raw source belongs to, for grouping on the dashboard:
// "fb", "m.facebook.com" and "facebook" are all Facebook.
export type Channel = "facebook" | "instagram" | "whatsapp" | "tiktok" | "google" | "school" | "direct" | "other";

export function channelOf(source: string | null | undefined): Channel {
  const s = (source ?? "").toLowerCase();
  if (!s || s === "direct" || s === "(direct)") return "direct";
  if (s.includes("facebook") || s === "fb" || s.startsWith("fb.")) return "facebook";
  if (s.includes("instagram") || s === "ig") return "instagram";
  if (s.includes("whatsapp") || s === "wa" || s === "wa.me") return "whatsapp";
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("google")) return "google";
  if (s.includes("school") || s.includes("בית ספר") || s.includes("בית-ספר")) return "school";
  return "other";
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  whatsapp: "וואטסאפ",
  tiktok: "טיקטוק",
  google: "גוגל",
  school: "בית ספר",
  direct: "ישיר / לא ידוע",
  other: "אחר",
};
