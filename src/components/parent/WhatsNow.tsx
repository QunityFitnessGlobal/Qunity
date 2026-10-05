"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { matchSituation, searchSituations, withoutNames, type ChatTip } from "@/lib/whats-now";
import { recordChatQuestion, recordMoment } from "@/services/moments.service";
import {
  AllSituationsPanel,
  AssistantAvatar,
  ChatInput,
  ChatPanel,
  SearchIcon,
  type ChatMessage,
  type ChipAction,
} from "@/components/parent/WhatsNowPanels";
import type { Gender } from "@/lib/types";

interface WhatsNowProps {
  tips: ChatTip[];
  childName: string;
  childGender: Gender | null;
  parentName: string | null;
  // Names to take out of what parents type: every child's and the parent's.
  privateNames: string[];
  parentId: string;
  childId: string;
  // Tips already marked today, and adding or taking back a moment (see
  // EmpowermentView) — one moment per tip a day.
  triedToday: string[];
  onCount: (principle: string, by: number, ruleId: string) => void;
}

const GROUPS = [1, 2, 3, 4, 5];
const GROUP_COLORS: Record<number, string> = { 1: "#ff8a3d", 2: "#3b82f6", 3: "#e0457b", 4: "#22c55e", 5: "#a32894" };
const STEP_MS = 550;
const CHIPS_MS = 250;

type Step = Omit<Extract<ChatMessage, { kind: "bot" | "me" }>, "id"> | Omit<Extract<ChatMessage, { kind: "chips" }>, "id"> | Omit<Extract<ChatMessage, { kind: "tip" }>, "id">;

// "מה קורה עכשיו?" on the empowerment screen: a guided chat over the menu
// tips. Folded by default; open, it offers the common situations as quick
// picks, "כל המצבים" and a line to describe it in your own words. The chat
// and the list open full screen as a step in the browser history (?panel=),
// so the phone's back button closes them. Answers come from the tips;
// typed text is matched by keywords (lib/whats-now.ts) and kept without
// names to learn what's missing. "ניסיתי את זה" collects a moment.
export function WhatsNow({
  tips,
  childName,
  childGender,
  parentName,
  privateNames,
  parentId,
  childId,
  triedToday,
  onCount,
}: WhatsNowProps) {
  const t = useTranslations("whatsNow");
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");
  const gender = childGender ?? "other";

  const greeting = parentName
    ? t("greeting", { parentName, name: childName, gender })
    : t("greetingNoName", { name: childName, gender });
  const groupChips = (): Step => ({
    kind: "chips",
    chips: GROUPS.map((group) => ({ label: t(`groups.${group}`, { gender }), action: { type: "group", group } })),
  });

  const [open, setOpen] = useState(false);
  const [entryDraft, setEntryDraft] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: 1, kind: "bot", text: greeting },
    { id: 2, ...groupChips() } as ChatMessage,
  ]);
  const [typing, setTyping] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const [failedId, setFailedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(0);

  const nextId = useRef(3);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // History steps this screen added (?panel=), so closing goes back instead
  // of leaving a stray entry; and where "כל המצבים" was opened from.
  const pushed = useRef(0);
  const allFrom = useRef<"home" | "chat">("home");
  // The last typed text and what it matched, for "זה לא בדיוק זה".
  const lastMatch = useRef<{ text: string; ruleId: string } | null>(null);

  const tipsById = useMemo(() => new Map(tips.map((tip) => [tip.ruleId, tip])), [tips]);
  const quick = useMemo(
    () => tips.filter((tip) => tip.quick !== null).sort((a, b) => (a.quick ?? 0) - (b.quick ?? 0)),
    [tips],
  );

  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), []);

  // The page behind a full-screen panel shouldn't scroll.
  useEffect(() => {
    if (!panel) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [panel]);

  useEffect(() => {
    const onPop = () => {
      pushed.current = Math.max(0, pushed.current - 1);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function setPanel(next: "chat" | "all" | null, how: "push" | "replace") {
    const params = new URLSearchParams(window.location.search);
    if (next) params.set("panel", next);
    else params.delete("panel");
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (how === "push") {
      window.history.pushState(null, "", url);
      pushed.current += 1;
    } else {
      window.history.replaceState(null, "", url);
    }
  }

  function closePanel() {
    if (pushed.current > 0) window.history.back();
    else setPanel(null, "replace");
  }

  function withId(step: Step): ChatMessage {
    return { ...step, id: nextId.current++ } as ChatMessage;
  }

  function stopTyping() {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
  }

  // The helper "types" each step in turn.
  function say(steps: Step[]) {
    stopTyping();
    setTyping(true);
    let delay = 0;
    steps.forEach((step, i) => {
      delay += step.kind === "chips" ? CHIPS_MS : STEP_MS;
      const typingAfter = i < steps.length - 1 && steps[i + 1].kind !== "chips";
      timers.current.push(
        setTimeout(() => {
          setMessages((current) => [...current, withId(step)]);
          setTyping(typingAfter);
        }, delay),
      );
    });
    if (steps.length === 0) setTyping(false);
  }

  function pushMine(text: string) {
    setMessages((current) => [...current.filter((m) => m.kind !== "chips"), withId({ kind: "me", text })]);
  }

  function answer(tip: ChatTip, intro?: string): Step[] {
    const lead = intro ? `${intro} ` : "";
    if (tip.what) {
      return [
        { kind: "bot", text: lead + tip.what },
        ...(tip.doText && tip.dont
          ? [{ kind: "bot" as const, text: t("doLine", { doText: tip.doText, dontText: tip.dont }) }]
          : []),
        { kind: "tip", ruleId: tip.ruleId },
      ];
    }
    return [{ kind: "bot", text: lead + t("howToRespond") }, { kind: "tip", ruleId: tip.ruleId }];
  }

  function notIt(): Step {
    return { kind: "chips", chips: [{ label: t("notIt"), action: { type: "notIt" } }] };
  }

  // What the parent typed: an answer when a situation matches, else the groups.
  function reply(text: string): Step[] {
    const tip = matchSituation(text, tips);
    const clean = withoutNames(text, privateNames);
    lastMatch.current = tip ? { text: clean, ruleId: tip.ruleId } : null;
    void recordChatQuestion(createClient(), clean, tip?.ruleId ?? null);
    return tip
      ? [...answer(tip, t("soundsLike", { label: tip.label.replace(/"/g, "") })), notIt()]
      : [{ kind: "bot", text: t("notUnderstood") }, groupChips()];
  }

  function startChat(first: string | null, steps: Step[]) {
    stopTyping();
    setTyping(false);
    setTried([]);
    setFailedId(null);
    setMessages([withId({ kind: "bot", text: greeting }), ...(first ? [withId({ kind: "me", text: first })] : [])]);
    say(steps);
  }

  function openWithTip(tip: ChatTip) {
    startChat(tip.label, answer(tip));
    setPanel("chat", "push");
  }

  function sendFromEntry() {
    const text = entryDraft.trim();
    if (!text) return;
    setEntryDraft("");
    startChat(text, reply(text));
    setPanel("chat", "push");
  }

  function sendInChat() {
    const text = chatDraft.trim();
    if (!text) return;
    setChatDraft("");
    pushMine(text);
    say(reply(text));
  }

  function pickChip({ label, action }: { label: string; action: ChipAction }) {
    if (action.type === "home") {
      closePanel();
      return;
    }
    pushMine(label);
    if (action.type === "tip") {
      const tip = tipsById.get(action.ruleId);
      if (tip) say(answer(tip));
    } else if (action.type === "group") {
      say([
        { kind: "bot", text: t("whatExactly") },
        {
          kind: "chips",
          chips: tips
            .filter((tip) => tip.group === action.group)
            .map((tip) => ({ label: tip.label, action: { type: "tip", ruleId: tip.ruleId } })),
        },
      ]);
    } else if (action.type === "notIt") {
      if (lastMatch.current) {
        void recordChatQuestion(createClient(), lastMatch.current.text, lastMatch.current.ruleId, true);
        lastMatch.current = null;
      }
      say([{ kind: "bot", text: t("narrowDown") }, groupChips()]);
    } else {
      say([{ kind: "bot", text: action.text }, groupChips()]);
    }
  }

  async function tryTip(messageId: number, tip: ChatTip) {
    if (triedToday.includes(tip.ruleId)) return;
    setTried((current) => [...current, messageId]);
    setFailedId(null);
    onCount(tip.principle, 1, tip.ruleId);
    const saved = await recordMoment(createClient(), parentId, childId, tip.ruleId);
    if (!saved) {
      setTried((current) => current.filter((id) => id !== messageId));
      onCount(tip.principle, -1, tip.ruleId);
      setFailedId(messageId);
      return;
    }
    say([
      { kind: "bot", text: t("afterTried") },
      {
        kind: "chips",
        chips: [
          { label: t("somethingElse"), action: { type: "groups", text: t("title") } },
          { label: t("back"), action: { type: "home" } },
        ],
      },
    ]);
  }

  function anotherTip(tip: ChatTip) {
    const same = tips.filter((other) => other.group === tip.group);
    const next = same[(same.indexOf(tip) + 1) % same.length];
    pushMine(t("another"));
    say(answer(next, t("anotherIntro", { label: next.label })));
  }

  function openAll() {
    allFrom.current = panel === "chat" ? "chat" : "home";
    setQuery("");
    setGroup(0);
    setPanel("all", "push");
  }

  function pickFromAll(tip: ChatTip) {
    if (allFrom.current === "chat") {
      // Back to the conversation, which goes on with this situation.
      closePanel();
      pushMine(tip.label);
      say(answer(tip));
    } else {
      startChat(tip.label, answer(tip));
      setPanel("chat", "replace");
    }
  }

  return (
    <>
      <section className="animate-power-fade-up flex flex-col rounded-[20px] border border-[#ece6f2] bg-white px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-h-[60px] w-full items-center gap-2.5 rounded-[14px] px-2 py-1.5 text-start"
        >
          <AssistantAvatar />
          <span className="flex flex-1 flex-col">
            <span className="font-display text-lg font-semibold">{t("title")}</span>
            <span className="text-[13px] text-[#6c6580]">{t("subtitle", { name: childName })}</span>
          </span>
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[#f5eef4] text-[#7d1f72]">
            <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 8l5 5 5-5" />
            </svg>
          </span>
        </button>

        {open && (
          <div className="animate-chat-in flex flex-col gap-3 px-2 pb-2.5 pt-1.5">
            <p className="max-w-[88%] self-start rounded-[18px] rounded-ss-md border border-[#ece6f2] bg-[#faf8fc] px-3 py-2.5 text-[15px] leading-normal">
              {greeting}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {quick.map((tip) => (
                <button
                  key={tip.ruleId}
                  type="button"
                  onClick={() => openWithTip(tip)}
                  className="min-h-10 rounded-full border-[1.5px] border-[#e4d3e1] bg-white px-3.5 text-sm font-semibold text-[#7d1f72]"
                >
                  {tip.label}
                </button>
              ))}
              <button
                type="button"
                onClick={openAll}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-[#c9b3c5] px-3.5 text-sm font-semibold text-[#4f4960]"
              >
                <SearchIcon className="h-3.5 w-3.5" />
                {t("allSituations")}
              </button>
            </div>
            <ChatInput
              id="whats-now-entry"
              value={entryDraft}
              placeholder={t("entryPlaceholder")}
              onChange={setEntryDraft}
              onSend={sendFromEntry}
            />
          </div>
        )}
      </section>

      {panel === "chat" && (
        <ChatPanel
          messages={messages}
          typing={typing}
          tipsById={tipsById}
          tried={tried}
          triedToday={triedToday}
          failedId={failedId}
          childGender={gender}
          draft={chatDraft}
          onDraft={setChatDraft}
          onSend={sendInChat}
          onChip={pickChip}
          onTry={tryTip}
          onAnother={anotherTip}
          onBack={closePanel}
          onOpenAll={openAll}
        />
      )}
      {panel === "all" && (
        <AllSituationsPanel
          tips={searchSituations(tips, query, group)}
          query={query}
          group={group}
          groupColors={GROUP_COLORS}
          onQuery={setQuery}
          onGroup={(id) => {
            setGroup(id);
            setQuery("");
          }}
          onPick={pickFromAll}
          onBack={closePanel}
        />
      )}
    </>
  );
}
