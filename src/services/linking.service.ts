import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LinkChildErrorCode =
  | "NOT_AUTHENTICATED"
  | "CODE_NOT_FOUND"
  | "CODE_ALREADY_USED"
  | "ALREADY_LINKED"
  | "UNKNOWN";

export type LinkChildResult =
  | { success: true; childId: string; nickname: string }
  | { success: false; errorCode: LinkChildErrorCode };

const KNOWN_ERROR_CODES: LinkChildErrorCode[] = [
  "NOT_AUTHENTICATED",
  "CODE_NOT_FOUND",
  "CODE_ALREADY_USED",
  "ALREADY_LINKED",
];

interface LinkChildByCodeResponse {
  success: boolean;
  error?: string;
  child_id?: string;
  nickname?: string;
}

// Returns an error code rather than a translated message — translation is a
// UI concern (see AddChildForm.tsx, which maps these codes via the
// "linking" message namespace), not something a service should own.
export async function linkChildByCode(parentId: string, code: string): Promise<LinkChildResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== parentId) {
    return { success: false, errorCode: "NOT_AUTHENTICATED" };
  }

  const { data, error } = await supabase.rpc("link_child_by_code", {
    p_code: code.trim().toUpperCase(),
  });

  if (error) {
    return { success: false, errorCode: "UNKNOWN" };
  }

  const result = data as LinkChildByCodeResponse;

  if (!result.success) {
    const errorCode =
      result.error && KNOWN_ERROR_CODES.includes(result.error as LinkChildErrorCode)
        ? (result.error as LinkChildErrorCode)
        : "UNKNOWN";
    return { success: false, errorCode };
  }

  return { success: true, childId: result.child_id!, nickname: result.nickname! };
}

export interface LinkedChild {
  id: string;
  nickname: string;
}

// Accepts either the browser or server Supabase client so it can be called
// from both Client and Server Components.
export async function getLinkedChildren(
  supabase: SupabaseClient,
  parentId: string,
): Promise<LinkedChild[]> {
  const { data, error } = await supabase
    .from("parent_child_links")
    .select("child_id, children(nickname)")
    .eq("parent_id", parentId);

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const child = row.children as unknown as { nickname: string } | null;
    return { id: row.child_id as string, nickname: child?.nickname ?? "" };
  });
}
