"use client";

import { useEffect, useRef, type CSSProperties, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { ChatTip } from "@/lib/whats-now";

// The pieces of the "מה קורה עכשיו?" chat (WhatsNow.tsx holds the state):
// the full-screen chat, the "כל המצבים" list, and the shared bits.

export type ChipAction =
  | { type: "tip"; ruleId: string }
  | { type: "group"; group: number }
  | { type: "groups"; text: string }
  | { type: "notIt" }
  | { type: "home" };

export type ChatMessage =
  | { id: number; kind: "bot" | "me"; text: string }
  | { id: number; kind: "chips"; chips: { label: string; action: ChipAction }[] }
  | { id: number; kind: "tip"; ruleId: string };

const BACK_PATH = "M7.5 5l5 5-5 5";

export function AssistantAvatar() {
  return (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-purple" aria-hidden>
      <svg viewBox="0 0 20 20" className="h-5 w-5" fill="#ffffff">
        <path d="M10 1.5c.4 4.2 2.1 6.2 6.5 6.8-4.4.7-6.1 2.6-6.5 6.8-.4-4.2-2.1-6.1-6.5-6.8 4.4-.6 6.1-2.6 6.5-6.8z" />
        <path d="M15.5 12.5c.2 1.8.9 2.6 2.7 2.9-1.8.3-2.5 1.1-2.7 2.9-.2-1.8-.9-2.6-2.7-2.9 1.8-.3 2.5-1.1 2.7-2.9z" />
      </svg>
    </span>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.2 13.2 17 17" />
    </svg>
  );
}

interface ChatInputProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatInput({ id, value, placeholder, onChange, onSend }: ChatInputProps) {
  const t = useTranslations("whatsNow");
  function submit(event: FormEvent) {
    event.preventDefault();
    onSend();
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor={id} className="sr-only">
        {t("inputLabel")}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={500}
        className="min-h-[46px] min-w-0 flex-1 rounded-full border border-[#e4dfeb] bg-[#faf8fc] px-4 text-[15px] text-[#221a33] placeholder:text-[#8a8399] focus:border-brand-purple focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t("send")}
        className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-brand-purple text-white"
      >
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M16 10H4M9 5l-5 5 5 5" />
        </svg>
      </button>
    </form>
  );
}

export function ChipRow({ chips, onPick }: { chips: { label: string; action: ChipAction }[]; onPick: (chip: { label: string; action: ChipAction }) => void }) {
  return (
    <div className="animate-chat-in flex flex-wrap gap-1.5 py-0.5">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onPick(chip)}
          className="min-h-10 rounded-full border-[1.5px] border-[#e4d3e1] bg-white px-3.5 text-sm font-semibold text-[#7d1f72]"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

interface ChatPanelProps {
  messages: ChatMessage[];
  typing: boolean;
  tipsById: Map<string, ChatTip>;
  tried: number[];
  // Tips already marked today: one moment per tip a day.
  triedToday: string[];
  failedId: number | null;
  childGender: string;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  onChip: (chip: { label: string; action: ChipAction }) => void;
  onTry: (messageId: number, tip: ChatTip) => void;
  onAnother: (tip: ChatTip) => void;
  onBack: () => void;
  onOpenAll: () => void;
}

// The chat, full screen over the empowerment screen.
export function ChatPanel({
  messages,
  typing,
  tipsById,
  tried,
  triedToday,
  failedId,
  childGender,
  draft,
  onDraft,
  onSend,
  onChip,
  onTry,
  onAnother,
  onBack,
  onOpenAll,
}: ChatPanelProps) {
  const t = useTranslations("whatsNow");
  const listRef = useRef<HTMLDivElement>(null);
  const lastChips = [...messages].reverse().find((m) => m.kind === "chips");

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="fixed inset-0 z-30 flex justify-center bg-[#faf8fc]">
      <div className="flex h-dvh w-full max-w-md flex-col">
        <header className="flex flex-none items-center gap-2.5 border-b border-[#ece6f2] bg-white px-2.5 pb-3 pt-3.5">
          <button
            type="button"
            onClick={onBack}
            aria-label={t("back")}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[#4f4960]"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5 ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={BACK_PATH} />
            </svg>
          </button>
          <AssistantAvatar />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-display text-[17px] font-semibold">{t("title")}</span>
            <span className="text-xs leading-snug text-[#6c6580]">{t("assistant")}</span>
          </div>
          <button
            type="button"
            onClick={onOpenAll}
            aria-label={t("allSituations")}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#ece6f2] bg-white text-[#4f4960]"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div ref={listRef} aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto px-3.5 py-4">
          {messages.map((message) => {
            if (message.kind === "bot") {
              return (
                <p
                  key={message.id}
                  className="animate-chat-in max-w-[84%] self-start whitespace-pre-line rounded-[18px] rounded-ss-md border border-[#ece6f2] bg-white px-3 py-2.5 text-[15px] leading-normal"
                >
                  {message.text}
                </p>
              );
            }
            if (message.kind === "me") {
              return (
                <p
                  key={message.id}
                  className="animate-chat-in max-w-[80%] self-end rounded-[18px] rounded-se-md bg-brand-purple px-3 py-2.5 text-[15px] leading-normal text-white"
                >
                  {message.text}
                </p>
              );
            }
            if (message.kind === "chips") {
              // Only the latest choice can still be picked.
              return message === lastChips ? <ChipRow key={message.id} chips={message.chips} onPick={onChip} /> : null;
            }
            if (message.kind !== "tip") return null;
            const tip = tipsById.get(message.ruleId);
            if (!tip) return null;
            const isTried = tried.includes(message.id);
            return (
              <div
                key={message.id}
                className="animate-chat-in flex w-[88%] flex-col gap-2 self-start rounded-[18px] rounded-ss-md border border-[#ece6f2] bg-white px-3 py-3 shadow-[0_6px_18px_rgba(52,30,99,0.07)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-brand-purple">{t("sayToChild", { gender: childGender })}</span>
                  <span className="rounded-full bg-brand-purple/[0.08] px-2.5 py-[3px] text-[11px] font-semibold text-[#7d1f72]">
                    {tip.principleLabel}
                  </span>
                </div>
                <p className="rounded-xl bg-[#faf3f9] px-3 py-2.5 font-display text-[17px] font-semibold leading-snug text-[#5c1f54]">
                  &quot;{tip.quote}&quot;
                </p>
                {tip.why && <p className="text-[13px] leading-relaxed text-[#6c6580]">{tip.why}</p>}
                {isTried ? (
                  <div className="animate-home-said flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-reward-gold-soft text-sm font-semibold text-[#5c4200]">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="#d99a0b" aria-hidden>
                      <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" />
                    </svg>
                    {t("collected")}
                  </div>
                ) : triedToday.includes(tip.ruleId) ? (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-[#6c6580]">{t("triedToday")}</span>
                    <button
                      type="button"
                      onClick={() => onAnother(tip)}
                      className="min-h-11 rounded-[14px] border border-[#ece6f2] bg-white px-3 text-sm font-semibold text-[#4f4960]"
                    >
                      {t("another")}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onTry(message.id, tip)}
                      className="min-h-11 flex-1 rounded-[14px] bg-brand-purple font-display text-[15px] font-semibold text-white shadow-[0_4px_0_#5c1553] active:translate-y-[3px] active:shadow-[0_1px_0_#5c1553]"
                    >
                      {t("tried")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAnother(tip)}
                      className="min-h-11 rounded-[14px] border border-[#ece6f2] bg-white px-3 text-sm font-semibold text-[#4f4960]"
                    >
                      {t("another")}
                    </button>
                  </div>
                )}
                {failedId === message.id && (
                  <p role="alert" className="text-center text-xs text-red-600">
                    {t("saveFailed")}
                  </p>
                )}
              </div>
            );
          })}
          {typing && (
            <div
              role="status"
              aria-label={t("typing")}
              className="flex gap-1 self-start rounded-[18px] rounded-ss-md border border-[#ece6f2] bg-white px-3.5 py-3.5"
            >
              {[0, 0.15, 0.3].map((delay) => (
                <span
                  key={delay}
                  className="animate-chat-dot h-[7px] w-[7px] rounded-full bg-[#a79fb6]"
                  style={{ ["--dot-delay" as string]: `${delay}s` } as CSSProperties}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-none flex-col gap-1.5 border-t border-[#ece6f2] bg-white px-3 pb-3.5 pt-2.5">
          <ChatInput id="whats-now-chat" value={draft} placeholder={t("chatPlaceholder")} onChange={onDraft} onSend={onSend} />
          <p className="text-center text-[11px] text-[#8a8399]">{t("privacyNote")}</p>
        </div>
      </div>
    </div>
  );
}

interface AllSituationsPanelProps {
  tips: ChatTip[];
  query: string;
  group: number;
  groupColors: Record<number, string>;
  onQuery: (value: string) => void;
  onGroup: (group: number) => void;
  onPick: (tip: ChatTip) => void;
  onBack: () => void;
}

// "כל המצבים": every situation, searchable and by group.
export function AllSituationsPanel({ tips, query, group, groupColors, onQuery, onGroup, onPick, onBack }: AllSituationsPanelProps) {
  const t = useTranslations("whatsNow");
  const pills = [0, 1, 2, 3, 4, 5];
  return (
    <div className="fixed inset-0 z-30 flex justify-center bg-[#faf8fc]">
      <div className="flex h-dvh w-full max-w-md flex-col">
        <header className="flex flex-none flex-col gap-2.5 border-b border-[#ece6f2] bg-white px-3 pb-2.5 pt-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              aria-label={t("backToChat")}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[#4f4960]"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5 ltr:-scale-x-100" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={BACK_PATH} />
              </svg>
            </button>
            <h2 className="flex-1 font-display text-lg font-semibold">{t("allSituations")}</h2>
          </div>
          <label htmlFor="whats-now-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <div className="flex min-h-[46px] items-center gap-2 rounded-full border-[1.5px] border-[#e4d3e1] bg-[#faf8fc] px-3.5 focus-within:border-brand-purple">
            <SearchIcon className="h-[18px] w-[18px] flex-none text-brand-purple" />
            <input
              id="whats-now-search"
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#221a33] placeholder:text-[#8a8399] focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {pills.map((id) => {
              const on = group === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onGroup(id)}
                  aria-pressed={on}
                  className={`min-h-9 flex-none rounded-full border-[1.5px] px-3 text-[13px] font-semibold ${
                    on ? "border-brand-purple bg-brand-purple text-white" : "border-[#e4d3e1] bg-white text-[#7d1f72]"
                  }`}
                >
                  {id === 0 ? t("all") : t(`groupShort.${id}`)}
                </button>
              );
            })}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 pb-4 pt-3">
          {tips.map((tip) => (
            <button
              key={tip.ruleId}
              type="button"
              onClick={() => onPick(tip)}
              className="flex min-h-[50px] items-center gap-2.5 rounded-[14px] border border-[#ece6f2] bg-white px-3.5 text-start text-[15px] text-[#221a33]"
            >
              <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: groupColors[tip.group] }} aria-hidden />
              <span className="flex-1">{tip.label}</span>
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 flex-none ltr:-scale-x-100" fill="none" stroke="#a79fb8" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12.5 5l-5 5 5 5" />
              </svg>
            </button>
          ))}
          {tips.length === 0 && <p className="px-2 py-6 text-center text-sm leading-relaxed text-[#6c6580]">{t("noResults")}</p>}
        </div>
      </div>
    </div>
  );
}
