"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTestFamily } from "@/services/admin-actions";

// "משפחת בדיקה" in a family's side panel: a test family is left out of the
// dashboard's numbers while "בלי משתמשי בדיקה" is on.
export function TestFamilyToggle({ parentId, isTest }: { parentId: string; isTest: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function toggle() {
    setFailed(false);
    startTransition(async () => {
      const { ok } = await setTestFamily(parentId, !isTest);
      if (!ok) {
        setFailed(true);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] border border-dashed border-black/15 px-3 py-2.5">
      <label className="flex cursor-pointer items-center justify-between gap-3 text-[13px] font-semibold">
        משפחת בדיקה
        <button
          type="button"
          role="switch"
          aria-checked={isTest}
          onClick={toggle}
          disabled={pending}
          className={`relative h-[18px] w-[32px] flex-none rounded-full transition-colors disabled:opacity-50 ${isTest ? "bg-[#1f1a2b]" : "bg-[#c3c2b7]"}`}
        >
          <span className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all ${isTest ? "start-[2px]" : "start-[16px]"}`} />
        </button>
      </label>
      <span className="text-[11.5px] leading-snug text-[#52514e]">
        {failed
          ? "לא נשמר. נסו שוב."
          : isTest
            ? "המשפחה לא נספרת במספרים כשהמתג \"בלי משתמשי בדיקה\" דלוק."
            : "סמנו משפחה שהיא חשבון בדיקה, כדי שלא תיספר במספרים."}
      </span>
    </div>
  );
}
