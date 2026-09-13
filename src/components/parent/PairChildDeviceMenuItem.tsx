"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { createPairingCode } from "@/services/family-mode.service";
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
// "pick whichever is easier" rather than two separate features.
export function PairChildDeviceMenuItem({ label, linkedChildren }: PairChildDeviceMenuItemProps) {
  const t = useTranslations("familyMode");
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<ActivePairing | null>(null);

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
    setError(null);
  }

  if (linkedChildren.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="block w-full px-4 py-3 text-right text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xs space-y-3 rounded-lg bg-white p-5 text-center">
            {showPicker && (
              <div className="space-y-2 text-right">
                <p className="text-sm font-medium text-zinc-700">{t("pickChild")}</p>
                {linkedChildren.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleGenerate(child.id)}
                    className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-right text-sm hover:bg-zinc-50"
                  >
                    {child.nickname}
                  </button>
                ))}
              </div>
            )}

            {loading && !pairing && <p className="text-sm text-zinc-500">{t("switching")}</p>}

            {pairing && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not a Storage asset */}
                <img src={pairing.qrDataUrl} alt="QR" className="mx-auto h-[200px] w-[200px]" />

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-zinc-200" />
                  <span className="text-xs text-zinc-400">{t("or")}</span>
                  <div className="h-px flex-1 bg-zinc-200" />
                </div>

                <p className="text-3xl font-bold tracking-[0.3em]">{pairing.code}</p>
                <p className="text-xs text-text-muted">{t("expiresIn10")}</p>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleClose}
              className="block w-full text-center text-sm text-zinc-500 underline"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
