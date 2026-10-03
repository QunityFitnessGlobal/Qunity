import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/session";
import { CreateChildProfileForm } from "@/components/parent/CreateChildProfileForm";

export default async function AddChildDirectPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  if (profile?.role !== "parent") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <CreateChildProfileForm parentGender={profile?.gender ?? null} />
    </div>
  );
}
