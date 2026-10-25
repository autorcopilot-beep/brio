export function RouteLoading({ label = "Carregando seu espaço" }: { label?: string }) {
  return <main className="min-h-screen bg-[#f4f1ec] p-3 md:p-4" aria-busy="true" aria-live="polite">
    <div className="mx-auto flex max-w-7xl gap-4">
      <aside className="hidden h-[calc(100vh-2rem)] w-64 shrink-0 animate-pulse rounded-[28px] border border-white/70 bg-[#fafaf7]/80 p-4 md:block"><div className="h-10 w-28 rounded-xl bg-[#e9e3db]"/><div className="mt-10 space-y-3">{[1,2,3,4,5].map((item)=><div key={item} className="h-12 rounded-2xl bg-[#e9e3db]"/>)}</div></aside>
      <section className="min-w-0 flex-1"><div className="h-16 animate-pulse rounded-[22px] border border-white/80 bg-[#fafaf7]/90"/><div className="mt-7 animate-pulse"><div className="h-3 w-28 rounded bg-[#c38d9e]/40"/><div className="mt-4 h-14 max-w-xl rounded-xl bg-[#d9d2ca]/70"/><div className="mt-4 h-4 max-w-2xl rounded bg-[#e9e3db]"/><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="h-44 rounded-[24px] bg-[#fafaf7]"/><div className="h-44 rounded-[24px] bg-[#fafaf7]"/><div className="h-44 rounded-[24px] bg-[#fafaf7]"/></div></div><p className="mt-6 text-sm text-[#5e5a56]">{label}…</p></section>
    </div>
  </main>;
}
