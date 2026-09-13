"use client";

import { useState, type ReactNode } from "react";

interface AccordionSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

// Generic collapsed-by-default section for grouping related settings menu
// items under one tappable heading, instead of showing everything flat.
export function AccordionSection({ title, children, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-white px-4 py-3 text-right text-sm font-semibold text-zinc-700"
      >
        <span>{title}</span>
        <span className="text-zinc-400">{open ? "▾" : "◂"}</span>
      </button>
      {open && <div className="divide-y divide-zinc-100 border-t border-zinc-200">{children}</div>}
    </div>
  );
}
