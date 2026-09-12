import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateChildProfileForm } from "@/components/parent/CreateChildProfileForm";
import type { Role } from "@/lib/types";

export default async function AddChildDirectPage() {
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

  if (profile?.role !== "parent") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <CreateChildProfileForm />
    </div>
  );
}
