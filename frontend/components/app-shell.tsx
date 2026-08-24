import Link from "next/link";

const navigation = [
  ["Overview", "/"],
  ["Data", "/data"],
  ["Analytics", "/analytics"],
  ["ML Lab", "/ml-lab"],
  ["Causal Lab", "/causal-lab"],
  ["Scenarios", "/scenarios"],
  ["AI Investigator", "/ai-investigator"],
  ["Decisions", "/decisions"],
  ["Experiments", "/experiments"],
] as const;

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#08111f] md:grid md:grid-cols-[252px_1fr]">
      <aside className="border-b border-[#22314a] bg-[#0b1627] p-6 md:min-h-screen md:border-b-0 md:border-r">
        <Link href="/" className="block text-lg font-semibold tracking-[0.08em] text-white">NEXORA-CDI</Link>
        <p className="mt-2 max-w-[170px] text-xs leading-5 text-slate-400">Evidence-Calibrated Decision Intelligence</p>
        <nav className="mt-9 flex gap-1 overflow-x-auto md:flex-col md:gap-2" aria-label="Primary navigation">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-[#17263c] hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
        <a
          href="https://github.com/Bharat0264/NEXORA---CDI"
          target="_blank"
          rel="noreferrer"
          className="mt-8 flex items-center gap-2 rounded-lg border border-[#22314a] px-3 py-2.5 text-sm text-slate-300 transition-colors hover:border-cyan-800 hover:bg-[#17263c] hover:text-white"
        >
          <span aria-hidden="true">↗</span>
          View on GitHub
        </a>
      </aside>
      <main>
        <header className="flex h-16 items-center justify-between border-b border-[#22314a] bg-[#0b1627]/80 px-6 backdrop-blur md:px-10">
          <span className="text-sm text-slate-400">Research workspace</span>
          <span className="rounded-full border border-emerald-800/70 bg-emerald-950/50 px-3 py-1 text-xs text-emerald-300">Evidence-first</span>
        </header>
        <section className="mx-auto w-full max-w-[1440px] p-6 md:p-10">{children}</section>
      </main>
    </div>
  );
}
