import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/BottomTabBar";
import type { Role } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 pb-16">{children}</div>
      <Suspense fallback={null}>
        <BottomTabBar role={profile?.role ?? "parent"} />
      </Suspense>
    </div>
  );
}
