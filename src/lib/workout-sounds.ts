// Cue sounds for the interval timer's work<->rest transitions (see
// WorkoutRunner.tsx), synthesized with the Web Audio API so there are no
// audio files to host or license. The chosen kind is a per-device
// preference (localStorage), picked in Settings -> "סוג צלצול לאימון".
//
// Browser-only: every function here is a no-op on the server. Audio needs a
// user gesture before it can play — unlockWorkoutAudio() is called from the
// workout's Start tap so the timer's later, gesture-less transitions work.

export type WorkoutSoundKind = "bell" | "beeps" | "arp" | "voiceFemale" | "voiceMale" | "none";
export type WorkoutPhase = "work" | "rest";

export const WORKOUT_SOUND_KINDS: readonly WorkoutSoundKind[] = [
  "bell",
  "beeps",
  "arp",
  "voiceFemale",
  "voiceMale",
  "none",
];
export const DEFAULT_WORKOUT_SOUND: WorkoutSoundKind = "bell";

const STORAGE_KEY = "qunity_workout_sound";

// Spoken cues are Hebrew for now (the app is Hebrew-only); move these into
// the message files if an English mode ever needs different words.
const VOICE_LANG = "he-IL";
const VOICE_TEXT: Record<WorkoutPhase, string> = { work: "קדימה!", rest: "מנוחה" };

type SpokenKind = "voiceFemale" | "voiceMale";

function isSpokenKind(kind: WorkoutSoundKind): kind is SpokenKind {
  return kind === "voiceFemale" || kind === "voiceMale";
}

// Which Hebrew voices a device has depends on its OS/browser, and voices don't
// report their gender — so match by known names (Windows: Asaf = male, Hila =
// female; Android/Chrome's "Google עברית" and Apple's Carmit are female). When
// no voice of the requested gender is found, the default Hebrew voice is used
// with its pitch shifted, which most engines honor.
const VOICE_NAME_HINTS: Record<SpokenKind, RegExp> = {
  voiceMale: /asaf|\bmale\b|גבר/i,
  voiceFemale: /hila|carmit|female|אישה|google.*(עברית|hebrew)/i,
};
const VOICE_FALLBACK_PITCH: Record<SpokenKind, number> = { voiceMale: 0.6, voiceFemale: 1.15 };

export function getWorkoutSoundPreference(): WorkoutSoundKind {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // "voice" was the single spoken option before it split into female/male;
    // the one voice devices had been using was the default (female) one.
    if (stored === "voice") return "voiceFemale";
    if (stored && (WORKOUT_SOUND_KINDS as readonly string[]).includes(stored)) {
      return stored as WorkoutSoundKind;
    }
  } catch {
    // storage unavailable (private mode, blocked) — fall back to the default.
  }
  return DEFAULT_WORKOUT_SOUND;
}

export function setWorkoutSoundPreference(kind: WorkoutSoundKind) {
  try {
    localStorage.setItem(STORAGE_KEY, kind);
  } catch {
    // ignore — the choice just won't persist on this device.
  }
}

let audioCtx: AudioContext | null = null;
let master: AudioNode | null = null;

function getAudio(): { ctx: AudioContext; out: AudioNode } | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  if (!audioCtx) {
    audioCtx = new Ctor();
    // A compressor on the way out so the loud, overlapping bell partials
    // never clip.
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.connect(audioCtx.destination);
    master = compressor;
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return { ctx: audioCtx, out: master as AudioNode };
}

// Call from a user gesture (the workout's Start tap) so later timer-driven
// sounds are allowed to play.
export function unlockWorkoutAudio() {
  getAudio();
  if (isSpokenKind(getWorkoutSoundPreference()) && "speechSynthesis" in window) {
    const primer = new SpeechSynthesisUtterance("");
    primer.volume = 0;
    speechSynthesis.speak(primer);
  }
}

function tone(
  audio: { ctx: AudioContext; out: AudioNode },
  when: number,
  freq: number,
  attack: number,
  decay: number,
  peak: number,
  wave: OscillatorType = "sine",
) {
  const { ctx, out } = audio;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(out);
  const t0 = ctx.currentTime + when;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  osc.start(t0);
  osc.stop(t0 + attack + decay + 0.02);
}

// Short filtered-noise click at the start of each bell ring — the "hammer
// hitting metal" that makes it sound struck rather than synthesized.
function strike(audio: { ctx: AudioContext; out: AudioNode }, when: number, level: number) {
  const { ctx, out } = audio;
  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 2500;
  const gain = ctx.createGain();
  gain.gain.value = level;
  source.connect(highpass);
  highpass.connect(gain);
  gain.connect(out);
  source.start(ctx.currentTime + when);
}

// [frequency ratio to the base note, gain, decay seconds] — inharmonic
// ratios (2.76, 5.4, 8.93) are what make it read as metal instead of a
// plain chord; the 1.004 copy of the fundamental adds a slow shimmer.
const BELL_PARTIALS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0.85, 1.3],
  [1.004, 0.55, 1.1],
  [2.0, 0.5, 0.9],
  [2.76, 0.45, 0.7],
  [5.4, 0.35, 0.45],
  [8.93, 0.22, 0.28],
];

function ringBell(audio: { ctx: AudioContext; out: AudioNode }, when: number, base: number, level: number) {
  strike(audio, when, level * 0.9);
  for (const [ratio, gain, decay] of BELL_PARTIALS) {
    tone(audio, when, base * ratio, 0.002, decay, gain * level);
  }
}

let previewTimer: ReturnType<typeof setTimeout> | null = null;

export function stopWorkoutSound() {
  if (previewTimer) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
}

function speak(kind: SpokenKind, phase: WorkoutPhase) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(VOICE_TEXT[phase]);
  utterance.lang = VOICE_LANG;
  const hebrewVoices = speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("he"));
  const matched = hebrewVoices.find((voice) => VOICE_NAME_HINTS[kind].test(voice.name));
  const voice = matched ?? hebrewVoices[0];
  if (voice) {
    utterance.voice = voice;
  }
  if (!matched) {
    utterance.pitch = VOICE_FALLBACK_PITCH[kind];
  }
  utterance.rate = 1.05;
  utterance.volume = 1;
  speechSynthesis.speak(utterance);
}

// Plays the cue for entering `phase`: bell = double ring for work / single
// lower ring for rest; beeps = two high beeps / one soft low tone; arp =
// rising / falling three-note run; spoken = "קדימה!" / "מנוחה" (female / male voice).
export function playWorkoutSound(kind: WorkoutSoundKind, phase: WorkoutPhase) {
  if (kind === "none") return;

  if (isSpokenKind(kind)) {
    speak(kind, phase);
    return;
  }

  const audio = getAudio();
  if (!audio) return;

  if (kind === "bell") {
    if (phase === "work") {
      ringBell(audio, 0, 784, 0.34);
      ringBell(audio, 0.2, 784, 0.34);
    } else {
      ringBell(audio, 0, 587, 0.3);
    }
    return;
  }

  if (kind === "beeps") {
    if (phase === "work") {
      tone(audio, 0, 880, 0.005, 0.06, 0.75);
      tone(audio, 0.15, 880, 0.005, 0.06, 0.75);
    } else {
      tone(audio, 0, 392, 0.02, 0.3, 0.65);
    }
    return;
  }

  // arp
  if (phase === "work") {
    [523, 659, 784].forEach((freq, i) => tone(audio, i * 0.11, freq, 0.005, 0.16, 0.6, "triangle"));
  } else {
    [784, 659, 523].forEach((freq, i) => tone(audio, i * 0.17, freq, 0.01, 0.3, 0.55));
  }
}

// Seconds to wait after the work cue before the rest cue when previewing,
// long enough for the first to finish (the spoken one is the slowest).
const PREVIEW_GAP_SECONDS: Record<WorkoutSoundKind, number> = {
  bell: 1.7,
  beeps: 1.0,
  arp: 1.1,
  voiceFemale: 1.6,
  voiceMale: 1.6,
  none: 0,
};

// Settings preview: work cue, then the rest cue, so both can be heard.
export function previewWorkoutSound(kind: WorkoutSoundKind) {
  stopWorkoutSound();
  if (kind === "none") return;
  playWorkoutSound(kind, "work");
  previewTimer = setTimeout(() => {
    previewTimer = null;
    playWorkoutSound(kind, "rest");
  }, PREVIEW_GAP_SECONDS[kind] * 1000);
}
