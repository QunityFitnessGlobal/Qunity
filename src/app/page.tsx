import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CHILD_CODE_CHIP, KeyIcon, PRIMARY_BUTTON, SECONDARY_BUTTON, StageBeads } from "@/components/entry/EntryShell";
import { TrackVisit } from "@/components/entry/TrackVisit";

// The first screen: the logo and the five stage beads on the dark brand
// background, and a sheet with the ways in — log in, sign up a new family,
// or (for a child) enter the code from a parent.
export default async function Home() {
  const t = await getTranslations("home");
  const tEntry = await getTranslations("entry");

  return (
    <div className="flex min-h-dvh flex-col bg-brand-background">
      <TrackVisit />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-[22px] px-7 pb-12 pt-8 text-center">
        <span aria-hidden className="animate-entry-glow absolute top-1/3 h-[200px] w-[300px] rounded-full bg-brand-purple blur-[80px]" />
        <Image
          src="/logo/qunity-logo-transparent.png"
          alt="Qunity"
          width={240}
          height={107}
          priority
          className="animate-power-badge-pop relative h-auto w-[240px]"
        />
        <div className="animate-power-fade-up relative" style={{ ["--power-fade-delay" as string]: "0.4s" }}>
          <StageBeads size={16} gap={14} />
        </div>
        <p
          className="animate-power-fade-up relative max-w-[270px] text-[17px] leading-relaxed text-[#e9e3ef]"
          style={{ ["--power-fade-delay" as string]: "0.6s" }}
        >
          {t("tagline")}
        </p>
      </div>

      <div className="animate-entry-sheet -mt-[22px] rounded-t-[28px] bg-[#faf8fc] px-5 pb-7 pt-6">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <h1 className="text-center font-display text-[26px] font-bold">{tEntry("welcomeTitle")}</h1>
          <p className="mb-1 text-center text-[15px] text-text-muted">{tEntry("welcomeSub")}</p>
          <Link href="/login" className={PRIMARY_BUTTON}>
            {t("login")}
          </Link>
          <Link href="/signup" className={SECONDARY_BUTTON}>
            {tEntry("signupFamily")}
          </Link>
          <div className="flex items-center gap-2.5 text-[13px] text-[#a79fb6]">
            <span className="h-px flex-1 bg-[#ece6f2]" />
            {tEntry("or")}
            <span className="h-px flex-1 bg-[#ece6f2]" />
          </div>
          <Link href="/pair" className={CHILD_CODE_CHIP}>
            <KeyIcon className="h-[18px] w-[18px]" />
            {tEntry("childCode")}
          </Link>
        </div>
      </div>
    </div>
  );
}
