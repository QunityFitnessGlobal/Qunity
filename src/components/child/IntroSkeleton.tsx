// What a workout or challenge shows the instant it's tapped, while the
// server prepares the real intro: the same layout (header, cards, the green
// "ready" button) in quiet placeholder shapes, so the screen changes at once
// and then simply fills in.
export function IntroSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col bg-[#faf8fc]" aria-busy="true">
      <header className="flex-none bg-white px-4 pb-3.5 pt-5 shadow-[0_1px_0_#ece6f2]">
        <div className="mx-auto flex max-w-sm flex-col gap-2.5 motion-safe:animate-pulse">
          <span className="h-3.5 w-36 rounded-full bg-zinc-200" />
          <span className="h-7 w-56 rounded-full bg-zinc-200" />
          <div className="flex gap-2">
            <span className="h-6 w-20 rounded-full bg-zinc-100" />
            <span className="h-6 w-16 rounded-full bg-zinc-100" />
            <span className="h-6 w-16 rounded-full bg-reward-gold-soft" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-2.5 px-4 py-4 motion-safe:animate-pulse">
        <span className="h-4 w-32 rounded-full bg-zinc-200" />
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5">
            <span className="h-16 w-16 flex-none rounded-xl bg-[#f1edf5]" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-4 w-2/3 rounded-full bg-zinc-200" />
              <span className="h-3 w-5/6 rounded-full bg-zinc-100" />
            </span>
          </div>
        ))}
      </main>

      <footer className="flex-none px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3">
        <div className="mx-auto h-14 max-w-sm rounded-[18px] bg-green-600/40" />
      </footer>
    </div>
  );
}
