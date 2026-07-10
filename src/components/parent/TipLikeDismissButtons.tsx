"use client";

import { createClient } from "@/lib/supabase/client";
import { ThumbsUpIcon, XIcon } from "@/components/parent/tipActionIcons";

interface TipLikeDismissButtonsProps {
  ruleId: string;
  onLike: () => void;
  onDismiss: () => void;
}

// Shared by TipCard (main dashboard) and WhatsHappeningNowMenu (the
// "What's happening now" accordion) — both use identical like/dismiss
// behavior: liking increments parent_tip_rules.like_count (one counter per
// tip overall, not per-child) via a security-definer RPC, then dismisses
// the card same as the X would; the caller decides how "dismiss" looks
// (fade-out vs. immediate).
export function TipLikeDismissButtons({ ruleId, onLike, onDismiss }: TipLikeDismissButtonsProps) {
  async function handleLike() {
    onLike();
    const supabase = createClient();
    await supabase.rpc("increment_tip_like_count", { p_rule_id: ruleId });
  }

  return (
    <div className="absolute left-2 top-2 flex gap-1.5">
      <button
        type="button"
        aria-label="like"
        onClick={handleLike}
        className="rounded p-0.5 text-zinc-400 hover:text-green-600"
      >
        <ThumbsUpIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="dismiss"
        onClick={onDismiss}
        className="rounded p-0.5 text-zinc-400 hover:text-red-600"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
