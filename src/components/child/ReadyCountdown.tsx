"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type CountdownStep = 3 | 2 | 1 | "go";

const STEP_MS = 900;
const GO_MS = 700;

// The 3-2-1 / "let's go" before a workout or challenge starts. `start()`
// begins the count; when it ends, `onDone` runs and the overlay stays up
// until it settles (e.g. while the session is still being created).
export function useReadyCountdown(onDone: () => unknown) {
  const [step, setStep] = useState<CountdownStep | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (step === null) return;
    const timeout = setTimeout(
      () => {
        if (step === 3) setStep(2);
        else if (step === 2) setStep(1);
        else if (step === 1) setStep("go");
        else Promise.resolve(onDoneRef.current()).finally(() => setStep(null));
      },
      step === "go" ? GO_MS : STEP_MS,
    );
    return () => clearTimeout(timeout);
  }, [step]);

  return { step, start: () => setStep(3) };
}

export function ReadyCountdownOverlay({ step }: { step: CountdownStep | null }) {
  const t = useTranslations("workout");
  if (step === null) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#221a33]/80" aria-live="assertive">
      {step === "go" ? (
        <span key="go" className="animate-workout-go font-display text-7xl font-bold text-white">
          {t("countdownGo")}
        </span>
      ) : (
        <span
          key={step}
          className="animate-workout-count font-display text-[150px] font-bold leading-none"
          style={{
            color: step === 3 ? "#ffffff" : step === 2 ? "var(--color-reward-gold)" : "var(--color-bracelet-orange)",
          }}
        >
          {step}
        </span>
      )}
    </div>
  );
}
