import { SKIN_PALETTES, type SkinKey } from "@/lib/skins";
import { skinDecorSvg } from "@/lib/skin-decor";

// Behind a skinned screen: the skin's background and decorations, fixed to
// the viewport so they stay put while the screen scrolls. Sits at z-index
// -1 inside the skinned root (which is `isolate`). Nothing for the regular look.
export function SkinBackdrop({ skin }: { skin: SkinKey }) {
  if (skin === "qunity") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ background: SKIN_PALETTES[skin].backdrop }}>
      <svg
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        dangerouslySetInnerHTML={{ __html: skinDecorSvg(skin) }}
      />
    </div>
  );
}
