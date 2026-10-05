"use client";

import { useState } from "react";
import { GrowthJourney, type PracticeTipView } from "@/components/parent/GrowthJourney";
import { WhatsNow } from "@/components/parent/WhatsNow";
import type { ChatTip } from "@/lib/whats-now";
import type { Gender } from "@/lib/types";

interface EmpowermentViewProps {
  totalMoments: number;
  countsByPrinciple: Record<string, number>;
  practice: PracticeTipView[];
  chatTips: ChatTip[];
  childName: string;
  childGender: Gender | null;
  parentName: string | null;
  parentGender: Gender | null;
  parentId: string;
  childId: string;
}

// The empowerment screen below its title: the parent's journey and the
// "מה קורה עכשיו?" chat. They share the moment counts, so trying a sentence
// in the chat fills the ring and badges above it right away.
export function EmpowermentView({
  totalMoments,
  countsByPrinciple,
  practice,
  chatTips,
  childName,
  childGender,
  parentName,
  parentGender,
  parentId,
  childId,
}: EmpowermentViewProps) {
  const [total, setTotal] = useState(totalMoments);
  const [counts, setCounts] = useState(countsByPrinciple);

  function count(principle: string, by: number) {
    setTotal((n) => n + by);
    setCounts((c) => ({ ...c, [principle]: (c[principle] ?? 0) + by }));
  }

  return (
    <>
      <GrowthJourney
        totalMoments={total}
        countsByPrinciple={counts}
        onCount={count}
        practice={practice}
        parentGender={parentGender}
        parentId={parentId}
        childId={childId}
      />
      <WhatsNow
        tips={chatTips}
        childName={childName}
        childGender={childGender}
        parentName={parentName}
        parentId={parentId}
        childId={childId}
        onCount={count}
      />
    </>
  );
}
