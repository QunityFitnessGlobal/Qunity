"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AccordionSection } from "@/components/ui/AccordionSection";
import { PairChildDeviceMenuItem } from "@/components/parent/PairChildDeviceMenuItem";
import type { LinkedChild } from "@/services/linking.service";

interface ChildrenAccordionProps {
  linkedChildren: LinkedChild[];
}

// Owns the "הילדים שלי" section's open/closed state so it can be forced
// open or closed from outside the accordion itself:
//   - opens on load when arriving via ?openChildren=1 (see
//     CreateChildProfileForm's success popup, which links back here after
//     creating a profile — the parent should land back inside this section).
//   - closes itself once a pairing code's own success popup is dismissed
//     (PairChildDeviceMenuItem's onDone).
export function ChildrenAccordion({ linkedChildren }: ChildrenAccordionProps) {
  const t = useTranslations("settings");
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("openChildren") === "1");

  return (
    <AccordionSection title={t("sectionChildren")} open={open} onOpenChange={setOpen}>
      <Link
        href="/add-child-direct"
        className="block px-4 py-3 text-right text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {t("addChildDirect")}
      </Link>
      <PairChildDeviceMenuItem
        label={t("pairDevice")}
        linkedChildren={linkedChildren}
        onDone={() => setOpen(false)}
      />
      <Link
        href="/add-child"
        className="block px-4 py-3 text-right text-xs text-zinc-400 hover:bg-zinc-50"
      >
        {t("alreadyRegisteredLink")}
      </Link>
    </AccordionSection>
  );
}
