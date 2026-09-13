"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";
import { createPairingCode } from "@/services/family-mode.service";
import { Button } from "@/components/ui/Button";
import type { LinkedChild } from "@/services/linking.service";

interface PairChildDeviceButtonProps {
  linkedChildren: LinkedChild[];
}

interface ActivePairing {
  qrDataUrl: string;
  code: string;
}

// "חבר מכשיר של הילד" — generates a short-lived, single-use pairing code
// for a linked child and shows it as both a QR (a plain link the child's own
// camera app can open — no in-app scanner needed) and a 6-digit code to type
// manually at /pair. Either path ends up calling the exact same
// redeemPairing* functions in family-mode.service.ts.
export function PairChildDeviceButton({ linkedChildren }: PairChildDeviceButtonProps) {
  const t = useTranslations("familyMode");
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

      const pairUrl = `${window.location.origin}/pair/${result.token}`;
      const qrDataUrl = await QRCode.toDataURL(pairUrl, { width: 220, margin: 1 });
      setPairing({ qrDataUrl, code: result.code });
      setShowPicker(false);
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
    if (linkedChildren.length === 1) {
      handleGenerate(linkedChildren[0].id);
      return;
    }
    setShowPicker(true);
  }

  if (linkedChildren.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      {!showPicker && !pairing && (
        <Button className="w-full bg-zinc-700 hover:bg-zinc-800" disabled={loading} onClick={handleStart}>
          {loading ? t("switching") : t("pairDevice")}
        </Button>
      )}

      {showPicker && (
        <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
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

      {pairing && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-center">
          <p className="text-sm font-medium text-zinc-700">{t("scanOrType")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not a Storage asset */}
          <img src={pairing.qrDataUrl} alt="QR" className="mx-auto h-[220px] w-[220px]" />
          <p className="text-3xl font-bold tracking-[0.3em]">{pairing.code}</p>
          <p className="text-xs text-text-muted">{t("expiresIn10")}</p>
          <Button className="w-full bg-zinc-700 hover:bg-zinc-800" onClick={() => setPairing(null)}>
            {t("close")}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
