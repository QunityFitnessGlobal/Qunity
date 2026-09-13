"use client";

import { useState, type ReactNode } from "react";

interface AccordionSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  // Controlled mode: pass both to let a parent force-open/close this
  // section (e.g. re-opening it after a successful action inside it, or
  // closing it once that action's own success popup is dismissed).
  // Uncontrolled (just defaultOpen, or neither) when omitted.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Generic collapsed-by-default section for grouping related settings menu
// items under one tappable heading, instead of showing everything flat.
export function AccordionSection({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: AccordionSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  function toggle() {
    const next = !open;
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  }

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between bg-white px-4 py-3 text-right text-sm font-semibold text-zinc-700"
      >
        <span>{title}</span>
        <span className="text-zinc-400">{open ? "▾" : "◂"}</span>
      </button>
      {open && <div className="divide-y divide-zinc-100 border-t border-zinc-200">{children}</div>}
    </div>
  );
}
