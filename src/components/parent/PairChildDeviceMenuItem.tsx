"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { createPairingCode } from "@/services/family-mode.service";
import { PRIMARY_BUTTON } from "@/components/entry/EntryShell";
import { DIALOG_CLOSE, SETTINGS_ROW, SettingsDialog, SettingsIcons, SettingsRowContent } from "@/components/ui/SettingsUI";
import { STAGE_DOT_CLASS } from "@/lib/stage-colors";
import type { LinkedChild } from "@/services/linking.service";

interface PairChildDeviceMenuItemProps {
  label: string;
  linkedChildren: LinkedChild[];
}

interface ActivePairing {
  qrDataUrl: string;
  code: string;
}

// "חבר את מכשיר הילד" — one menu item, one generated code, shown as QR and
// 6-digit code together (QR, an "או" divider, then the code) — the same
// layout Netflix/Disney+-style device pairing screens use, so it reads as
// "pick whichever is easier" rather than two separate features. Ends with
// its own success confirmation, separate from the QR/code screen itself,
// since that's the actual useful content and shouldn't just vanish once
// generated.
export function PairChildDeviceMenuItem({ label, linkedChildren }: PairChildDeviceMenuItemProps) {
  const t = useTranslations("familyMode");
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<ActivePairing | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleGenerate(childId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await createPairingCode(childId);
      if (!result.success || !result.token || !result.code) {
        setError(t("pairingError"));
        return;
      }
      const qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/pair/${result.token}`, {
        width: 200,
        margin: 1,
      });
      setPairing({ qrDataUrl, code: result.code });
      setShowPicker(false);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setError(null);
    setOpen(true);
    if (linkedChildren.length === 1) {
      handleGenerate(linkedChildren[0].id);
    } else {
      setShowPicker(true);
    }
  }

  function handleClose() {
    setOpen(false);
    setShowPicker(false);
    setPairing(null);
    setShowSuccess(false);
    setError(null);
  }


  if (linkedChildren.length === 0) {
    return null;
  }

  return (
    <>
      <button type="button" onClick={handleOpen} className={SETTINGS_ROW}>
        <SettingsRowContent icon={SettingsIcons.device} label={label} />
      </button>

      {open && (
        <SettingsDialog title={showSuccess ? undefined : label} icon={showSuccess ? undefined : SettingsIcons.device}>
          {showPicker && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-[#6c6580]">{t("pickChild")}</p>
              {linkedChildren.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleGenerate(child.id)}
                  className="flex min-h-12 items-center gap-2.5 rounded-2xl border border-[#ece6f2] bg-white px-4 text-start text-[15px] font-medium disabled:opacity-60"
                >
                  <span className={`h-2.5 w-2.5 flex-none rounded-full ${STAGE_DOT_CLASS[child.color]}`} aria-hidden />
                  {child.nickname}
                </button>
              ))}
            </div>
          )}

          {loading && !pairing && <p className="text-sm text-[#6c6580]">{t("switching")}</p>}

          {pairing && !showSuccess && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not a Storage asset */}
              <img src={pairing.qrDataUrl} alt="QR" className="mx-auto h-[200px] w-[200px] rounded-2xl border border-[#ece6f2] p-2" />

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[#ece6f2]" />
                <span className="text-xs text-[#8a8399]">{t("or")}</span>
                <div className="h-px flex-1 bg-[#ece6f2]" />
              </div>

              <p dir="ltr" className="font-display text-4xl font-bold tracking-[0.3em] text-[#221a33]">
                {pairing.code}
              </p>
              <p className="text-xs text-[#6c6580]">{t("expiresIn10")}</p>

              <button type="button" className={PRIMARY_BUTTON} onClick={() => setShowSuccess(true)}>
                {t("continue")}
              </button>
            </>
          )}

          {showSuccess && (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e3f8ea]" aria-hidden>
                <svg viewBox="0 0 20 20" className="h-7 w-7" fill="none" stroke="#16a34a" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 10.5 8.5 14.5 15.5 6" />
                </svg>
              </span>
              <p className="font-display text-lg font-semibold">{t("pairSuccess")}</p>
              <button type="button" className={PRIMARY_BUTTON} onClick={handleClose}>
                {t("continue")}
              </button>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          {!pairing && (
            <button type="button" onClick={handleClose} className={DIALOG_CLOSE}>
              {t("close")}
            </button>
          )}
        </SettingsDialog>
      )}
    </>
  );
}
