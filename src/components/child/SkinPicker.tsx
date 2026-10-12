"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { SKIN_PREVIEWS, type SkinKey } from "@/lib/skins";
import { skinMiniDecorSvg } from "@/lib/skin-decor";

export interface SkinChoice {
  itemId: string;
  key: SkinKey;
  name: string;
  description: string;
}

interface SkinPickerProps {
  skins: SkinChoice[];
  // The skin on now.
  active: SkinKey;
  // For the preview phone: the child's own name and points.
  childName: string;
  points: number;
}

// The picker: a small phone showing the chosen skin, a card per skin, the
// store to come, and the button that puts the chosen skin on. Putting it on
// goes through equip_item() (which checks the child may use it), then the
// screens re-render in it.
export function SkinPicker({ skins, active, childName, points }: SkinPickerProps) {
  const t = useTranslations("skins");
  const router = useRouter();
  const [selected, setSelected] = useState<SkinKey>(active);
  // Updated right away on success, before the refresh brings the new skin.
  const [current, setCurrent] = useState<SkinKey>(active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();
  const chosen = skins.find((skin) => skin.key === selected) ?? skins[0];

  async function apply() {
    if (!chosen || saving) return;
    setSaving(true);
    setError(false);
    const { error: rpcError } = await createClient().rpc("equip_item", { p_item_id: chosen.itemId });
    setSaving(false);
    if (rpcError) {
      setError(true);
      return;
    }
    setCurrent(chosen.key);
    startTransition(() => router.refresh());
  }

  const isOn = chosen?.key === current;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-center gap-3.5 rounded-[22px] border border-skin-line bg-skin-surface p-3.5">
        <MiniPhone
          key={chosen.key}
          skin={chosen.key}
          points={points}
          greeting={t("previewGreeting", { name: childName })}
          mission={t("previewMission")}
        />
        <div key={`text-${chosen.key}`} className="animate-power-fade-up flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs font-semibold text-skin-accent-ink">{t("preview")}</span>
          <span className="font-display text-2xl font-bold leading-tight">{chosen.name}</span>
          <span className="text-[13px] leading-snug text-skin-muted">{chosen.description}</span>
          <span
            className={`mt-0.5 inline-flex self-start rounded-full px-2.5 py-1 text-xs font-semibold ${
              isOn ? "bg-[#f0fdf4] text-[#15803d]" : "bg-skin-accent/10 text-skin-accent-ink"
            }`}
          >
            {isOn ? t("active") : t("open")}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        {skins.map((skin) => {
          const look = SKIN_PREVIEWS[skin.key];
          const picked = skin.key === selected;
          const on = skin.key === current;
          return (
            <button
              key={skin.key}
              type="button"
              onClick={() => setSelected(skin.key)}
              aria-pressed={picked}
              className={`relative flex flex-col overflow-hidden rounded-[18px] bg-skin-surface text-start transition-shadow ${
                picked
                  ? "border-[2.5px] border-skin-accent shadow-[0_6px_16px_rgba(163,40,148,0.18)]"
                  : "border border-skin-line"
              }`}
            >
              <span className="relative isolate block h-[74px] overflow-hidden" style={{ background: look.bg }}>
                <svg
                  viewBox="0 0 170 74"
                  preserveAspectRatio="xMidYMid slice"
                  className="absolute inset-0 -z-10 h-full w-full"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: skinMiniDecorSvg(skin.key, 170, 74) }}
                />
                <span
                  className="absolute bottom-[9px] start-2.5 flex h-[26px] w-16 items-center gap-1 rounded-lg px-1.5"
                  style={{ background: look.surface, border: `1px solid ${look.line}` }}
                  aria-hidden
                >
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: look.accent }} />
                  <span className="h-1 flex-1 rounded-sm" style={{ background: look.line }} />
                </span>
              </span>
              <span className="flex flex-col gap-0.5 px-2.5 pb-2.5 pt-2">
                <span className="font-display text-base font-semibold">{skin.name}</span>
                <span className={`text-xs font-medium ${on ? "text-skin-work-label" : "text-skin-muted"}`}>
                  {on ? t("active") : t("open")}
                </span>
              </span>
              {on && (
                <span
                  className="absolute end-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-skin-accent text-white shadow-[0_0_0_2px_var(--skin-surface)]"
                  aria-hidden
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-[#e7d6a6] bg-[#fffbef] px-3 py-2.5 text-[#221a33]">
        <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-reward-gold shadow-[inset_0_-2px_0_#d99a0b]" aria-hidden>
          <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="#8a5d00" strokeWidth={1.6} strokeLinecap="round">
            <path d="M3 7h14l-1.2 9a1.5 1.5 0 01-1.5 1.3H5.7A1.5 1.5 0 014.2 16zM7 7V5.5a3 3 0 016 0V7" />
          </svg>
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">{t("storeTitle")}</span>
          <span className="text-xs text-[#6c6580]">{t("storeText")}</span>
        </span>
        <span className="rounded-full bg-[#fff0c2] px-2.5 py-0.5 text-[11px] font-bold text-reward-gold-ink">{t("soon")}</span>
      </div>

      <div className="flex flex-col gap-2">
        {isOn ? (
          <span className="animate-home-said flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#f0fdf4] font-display text-lg font-semibold text-[#15803d]">
            <CheckIcon className="h-[18px] w-[18px]" />
            {t("applied")}
          </span>
        ) : (
          <button
            type="button"
            onClick={apply}
            disabled={saving}
            className="min-h-[54px] rounded-2xl bg-green-600 font-display text-lg font-semibold text-white shadow-[0_4px_0_theme(colors.green.800)] transition-transform hover:bg-green-700 active:translate-y-[3px] disabled:opacity-70"
          >
            {saving ? t("applying") : t("apply")}
          </button>
        )}
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-red-600">
            {t("error")}
          </p>
        )}
      </div>
    </div>
  );
}

// A small phone showing the home screen in a skin, in that skin's own
// colors whatever skin is on now.
function MiniPhone({ skin, points, greeting, mission }: { skin: SkinKey; points: number; greeting: string; mission: string }) {
  const look = SKIN_PREVIEWS[skin];
  const card = { background: look.surface, border: `1px solid ${look.line}` };
  return (
    <div
      className="animate-power-fade-up relative isolate flex h-[228px] w-32 flex-none flex-col overflow-hidden rounded-[22px] border-[3px] border-[#221a33] shadow-[0_10px_24px_rgba(34,26,51,0.22)]"
      style={{ background: look.bg }}
      aria-hidden
    >
      <svg
        viewBox="0 0 128 228"
        className="absolute inset-0 -z-10 h-full w-full"
        dangerouslySetInnerHTML={{ __html: skinMiniDecorSvg(skin, 128, 228) }}
      />
      <div className="flex h-[22px] flex-none items-center justify-center font-display text-[10px] font-bold text-white" style={{ background: look.header }}>
        Qunity
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <span className="truncate font-display text-xs font-bold" style={{ color: look.ink }}>
          {greeting}
        </span>
        <div className="flex flex-col gap-1 rounded-[9px] p-1.5" style={card}>
          <span className="h-[5px] w-3/5 rounded-sm" style={{ background: look.line }} />
          <span dir="ltr" className="text-end font-display text-[13px] font-bold" style={{ color: look.ink }}>
            {points.toLocaleString("en-US")}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-[9px] p-1.5" style={card}>
          <span className="h-[5px] w-[45%] rounded-sm" style={{ background: look.line }} />
          <span className="flex h-[7px] overflow-hidden rounded bg-[#2a2230]">
            <span className="w-[55%] rounded bg-bracelet-orange" />
          </span>
        </div>
        <div className="flex flex-col gap-[5px] rounded-[9px] p-1.5" style={card}>
          <span className="self-start rounded-full px-[5px] py-px text-[7px] font-semibold" style={{ color: look.accent, background: look.line }}>
            {mission}
          </span>
          <span className="h-4 rounded-md bg-green-600 shadow-[0_2px_0_#166534]" />
        </div>
      </div>
      <div className="flex h-6 flex-none items-center justify-around px-2" style={{ background: look.tab, borderTop: `1px solid ${look.line}` }}>
        <span className="h-2 w-4 rounded-full" style={{ background: look.accent }} />
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: look.line }} />
        ))}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 10.5l3.5 3.5 7.5-8" />
    </svg>
  );
}
