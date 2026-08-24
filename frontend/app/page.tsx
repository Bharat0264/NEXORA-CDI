import Link from "next/link";

export default function OverviewPage() {
  return <div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">NEXORA-CDI</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Overview</h1><div className="mt-8 rounded-2xl border border-[#22314a] bg-[#101b2d] p-8 shadow-2xl shadow-black/10"><h2 className="text-xl font-medium">Evidence-calibrated decision intelligence</h2><p className="mt-3 max-w-xl leading-7 text-slate-400">Your workspace is ready. Upload a dataset to begin profiling and evidence-backed analysis.</p><Link href="/data" className="mt-7 inline-flex rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-cyan-600">Upload Dataset</Link></div></div>;
}
