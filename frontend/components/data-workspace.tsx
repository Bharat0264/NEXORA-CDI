"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Dataset, datasetsApi } from "../services/api";

type Preview = { columns: string[]; rows: Record<string, unknown>[] };
type Connection = "checking" | "online" | "offline";

function uploadMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : "";
  if (detail.includes("Only CSV") || detail.includes("415")) return "Please choose a CSV, XLS, or XLSX file.";
  if (detail.includes("could not be parsed") || detail.includes("422")) return "This file could not be read as a table. Check that it has a header row and valid values.";
  return "The upload could not be completed. Please try again.";
}

function StatusDot({ connection }: { connection: Connection }) {
  const color = connection === "online" ? "bg-emerald-400" : connection === "offline" ? "bg-amber-400" : "bg-slate-500";
  return <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />;
}

export function DataWorkspace() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selected, setSelected] = useState<Dataset>();
  const [preview, setPreview] = useState<Preview>();
  const [connection, setConnection] = useState<Connection>("checking");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const items = await datasetsApi.list();
    setDatasets(items);
    setConnection("online");
  }, []);

  const retryConnection = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      await refresh();
    } catch {
      setConnection("offline");
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  const choose = async (dataset: Dataset) => {
    setError("");
    setPreview(undefined);
    try {
      const [details, dataPreview] = await Promise.all([datasetsApi.details(dataset.id), datasetsApi.preview(dataset.id)]);
      setSelected(details);
      setPreview(dataPreview);
    } catch {
      setError("We could not load this dataset preview. Please select it again.");
    }
  };

  useEffect(() => { void retryConnection(); }, [retryConnection]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setNotice("");
    setIsUploading(true);
    try {
      const uploaded = await datasetsApi.upload(file);
      await refresh();
      await choose(uploaded);
      setNotice(`${uploaded.original_filename} is ready for review.`);
    } catch (uploadError) {
      setError(uploadMessage(uploadError));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const columns = (selected?.profile?.columns ?? {}) as Record<string, Record<string, unknown>>;
  const serviceReady = connection === "online";

  return <div className="mx-auto max-w-6xl space-y-7 pb-8">
    <header className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(8,145,178,0.18),_transparent_32%),linear-gradient(135deg,_#111d31,_#0b1323)] px-6 py-8 shadow-2xl shadow-slate-950/30 md:px-9 md:py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">NEXORA / DATA WORKSPACE</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">Decision-ready data begins here.</h1><p className="mt-3 text-base leading-7 text-slate-300">Upload a business dataset, inspect its structure, and verify its quality before analytics, modelling, or causal analysis.</p></div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/30 px-3 py-2.5 text-sm"><StatusDot connection={connection} /><span className="text-slate-300">{connection === "online" ? "Data service connected" : connection === "checking" ? "Checking data service" : "Data service offline"}</span>{connection === "offline" && <button type="button" onClick={() => void retryConnection()} className="ml-2 rounded-md bg-slate-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-600">Retry</button>}</div>
      </div>
    </header>

    {connection === "offline" && <section className="flex flex-col gap-3 rounded-2xl border border-amber-900/60 bg-amber-950/25 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-amber-200">Start the data service to upload and inspect files.</p><p className="mt-1 text-amber-100/70">Run <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs">uvicorn app.main:app --reload --port 8000</code> from the backend folder, then select Retry.</p></div><button type="button" onClick={() => void retryConnection()} className="w-fit rounded-lg border border-amber-700/70 px-3 py-2 font-medium text-amber-100 hover:bg-amber-900/30">Check connection</button></section>}

    <section className="grid overflow-hidden rounded-3xl border border-slate-800 bg-[#101b2d] shadow-xl shadow-black/10 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="p-6 md:p-8"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300" aria-hidden="true">+</div><h2 className="mt-5 text-xl font-semibold text-white">Add a source dataset</h2><p className="mt-2 max-w-lg leading-6 text-slate-400">Accepted formats: CSV, XLS, and XLSX. NEXORA profiles the submitted file without changing your original source.</p><div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" onClick={() => inputRef.current?.click()} disabled={!serviceReady || isUploading} className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-45">{isUploading ? "Uploading..." : "Choose a data file"}</button><span className="text-xs text-slate-500">Secure local analysis</span></div><input ref={inputRef} className="sr-only" type="file" accept=".csv,.xlsx,.xls" onChange={upload} disabled={!serviceReady || isUploading} />{notice && <p role="status" className="mt-5 rounded-lg border border-emerald-900/70 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">{notice}</p>}{error && <p role="alert" className="mt-5 rounded-lg border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</p>}</div>
      <div className="border-t border-slate-800 bg-slate-950/25 p-6 lg:border-l lg:border-t-0"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace summary</p><p className="mt-5 text-4xl font-semibold tracking-tight text-white">{datasets.length}</p><p className="mt-1 text-sm text-slate-400">dataset{datasets.length === 1 ? "" : "s"} in this workspace</p><div className="mt-8 border-t border-slate-800 pt-5 text-sm leading-6 text-slate-400">Every displayed quality indicator is computed from your uploaded source and remains traceable to it.</div></div>
    </section>

    <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <section className="rounded-2xl border border-slate-800 bg-[#101b2d] p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Workspace datasets</h2><p className="mt-1 text-sm text-slate-400">Select one to inspect its evidence profile.</p></div>{isLoading && <span className="text-xs text-slate-500">Loading...</span>}</div><div className="mt-5 space-y-2">{!isLoading && datasets.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/20 px-5 py-10 text-center"><p className="font-medium text-slate-200">Your workspace is ready.</p><p className="mt-2 text-sm text-slate-500">Upload a source file to build its evidence profile.</p></div>}{datasets.map((item) => <button key={item.id} type="button" onClick={() => void choose(item)} className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left transition ${selected?.id === item.id ? "border-cyan-500/70 bg-cyan-950/35" : "border-slate-800 bg-slate-950/20 hover:border-slate-600 hover:bg-slate-900"}`}><span className="min-w-0"><span className="block truncate font-medium text-slate-100">{item.original_filename}</span><span className="mt-1 block text-xs text-slate-500">{item.row_count.toLocaleString()} rows / {item.column_count} columns</span></span><span className="shrink-0 rounded-full border border-emerald-900/70 bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-300">{item.quality_score}% quality</span></button>)}</div></section>
      <section className="rounded-2xl border border-slate-800 bg-[#101b2d] p-5 md:p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Evidence profile</p>{selected ? <><p className="mt-5 text-5xl font-semibold tracking-tight text-emerald-300">{selected.quality_score}%</p><p className="mt-2 text-sm text-slate-400">computed data quality</p><dl className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-800 pt-5 text-center"><div><dt className="text-xs text-slate-500">Rows</dt><dd className="mt-1 font-medium text-slate-100">{selected.row_count.toLocaleString()}</dd></div><div><dt className="text-xs text-slate-500">Columns</dt><dd className="mt-1 font-medium text-slate-100">{selected.column_count}</dd></div><div><dt className="text-xs text-slate-500">Duplicates</dt><dd className="mt-1 font-medium text-slate-100">{Number(selected.profile?.duplicate_count ?? 0).toLocaleString()}</dd></div></dl></> : <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/20 px-4 py-6 text-sm leading-6 text-slate-400">Select a dataset to view its computed profile, schema, missing values, and source preview.</div>}</section>
    </div>

    {selected && <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101b2d]"><div className="border-b border-slate-800 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Computed schema</p><h2 className="mt-1 font-semibold text-white">Columns and data coverage</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-950/30 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-medium">Column</th><th className="px-5 py-3 font-medium">Type</th><th className="px-5 py-3 font-medium">Missing</th><th className="px-5 py-3 font-medium">Unique</th></tr></thead><tbody>{Object.entries(columns).map(([name, info]) => <tr key={name} className="border-t border-slate-800 text-slate-300"><td className="px-5 py-3 font-medium text-white">{name}</td><td className="px-5 py-3">{String(info.type)}</td><td className="px-5 py-3">{String(info.missing_count)} ({String(info.missing_percent)}%)</td><td className="px-5 py-3">{String(info.unique_count)}</td></tr>)}</tbody></table></div></section>}
    {preview && <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101b2d]"><div className="border-b border-slate-800 px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Original source</p><h2 className="mt-1 font-semibold text-white">Data preview</h2><p className="mt-1 text-sm text-slate-400">First {preview.rows.length} rows, displayed without modification.</p></div><div className="overflow-x-auto"><table className="w-full min-w-max text-left text-sm"><thead className="bg-slate-950/30 text-xs uppercase tracking-wide text-slate-500"><tr>{preview.columns.map((column) => <th key={column} className="whitespace-nowrap px-5 py-3 font-medium">{column}</th>)}</tr></thead><tbody>{preview.rows.map((row, index) => <tr key={index} className="border-t border-slate-800 text-slate-300">{preview.columns.map((column) => <td key={column} className="max-w-64 truncate whitespace-nowrap px-5 py-3">{String(row[column] ?? "-")}</td>)}</tr>)}</tbody></table></div></section>}
  </div>;
}
