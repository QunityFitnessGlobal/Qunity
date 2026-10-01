// TEMP — a per-device switch (Settings › "כלי בדיקה באימון") for testing
// shortcuts, such as finishing a workout instantly at 100% or 70%. Off by
// default and kept only in this browser's storage, so a child's device never
// shows the shortcuts unless someone turns them on there. Remove together
// with the shortcuts once testing is over.
const QA_TOOLS_KEY = "qunity:qaTools";
const QA_TOOLS_EVENT = "qunity:qa-tools-change";

export function readQaTools(): boolean {
  try {
    return window.localStorage.getItem(QA_TOOLS_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeQaTools(enabled: boolean): void {
  try {
    if (enabled) {
      window.localStorage.setItem(QA_TOOLS_KEY, "1");
    } else {
      window.localStorage.removeItem(QA_TOOLS_KEY);
    }
  } catch {
    // Storage unavailable: the switch just stays off.
  }
  window.dispatchEvent(new Event(QA_TOOLS_EVENT));
}

export function subscribeQaTools(onChange: () => void): () => void {
  window.addEventListener(QA_TOOLS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(QA_TOOLS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
