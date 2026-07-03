import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Qunity</h1>
      <p className="max-w-md text-zinc-600">{t("tagline")}</p>
      <div className="flex gap-3">
        <Link href="/login">
          <Button>{t("login")}</Button>
        </Link>
        <Link href="/signup">
          <Button className="bg-zinc-700 hover:bg-zinc-800">{t("signup")}</Button>
        </Link>
      </div>
    </div>
  );
}
