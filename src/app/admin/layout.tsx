import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-guard";

export const metadata: Metadata = {
  title: "Qunity · מסך בקרה",
  robots: { index: false, follow: false },
};

// The admin dashboard (internal, Hebrew only). Each page checks again too.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
