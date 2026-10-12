import type { ReactNode } from "react";
import { skinStyle, type SkinKey } from "@/lib/skins";
import { SkinBackdrop } from "@/components/child/SkinBackdrop";

interface SkinRootProps {
  skin: SkinKey;
  className?: string;
  children: ReactNode;
}

// The root of the child's screens: sets the skin's colors for everything
// inside (the --skin-* tokens) and draws its backdrop behind it. With the
// regular look it's a plain wrapper. `isolate` keeps the backdrop's negative
// z-index inside this root, behind the screens but above the page itself.
export function SkinRoot({ skin, className = "", children }: SkinRootProps) {
  const skinned = skin !== "qunity";
  return (
    <div data-skin={skin} className={`${skinned ? "isolate" : ""} ${className}`} style={skinStyle(skin)}>
      <SkinBackdrop skin={skin} />
      {children}
    </div>
  );
}
