import { SkinRoot } from "@/components/child/SkinRoot";
import { getEquippedSkin } from "@/services/skin.service";
import { getSessionUser, getSupabase } from "@/lib/session";

// A challenge is a child's screen, so it wears the child's skin — loading
// skeleton included, which is why this is a layout and not the page.
export default async function ChallengeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const skin = user ? await getEquippedSkin(await getSupabase(), user.id) : "qunity";
  return (
    <SkinRoot skin={skin} className="flex flex-1 flex-col">
      {children}
    </SkinRoot>
  );
}
