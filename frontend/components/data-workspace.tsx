"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Dataset, datasetsApi } from "../services/api";

type Preview = { columns: string[]; rows: Record<string, unknown>[] };

function messageFor(error: unknown) {
  const detail = error instanceof Error ? error.message : "";
  if (detail.includes("Only CSV") || detail.includes("415")) return "Choose a CSV, XLS, or XLSX file.";
  if (detail.includes("could not be parsed") || detail.includes("422")) return "We could not read this file as a tabular dataset. Check that it has a header row and valid values.";
  return "We could not upload the file. Make sure the API is running, then try again.";
}

export function DataWorkspace() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selected, setSelected] = useState<Dataset>();
  const [preview, setPreview] = useState<Preview>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const items = await datasetsApi.list();
    setDatasets(items);
  };

  const choose = async (dataset: Dataset) => {
    setError("");
    setPreview(undefined);
    try {
      const [details, dataPreview] = await Promise.all([datasetsApi.details(dataset.id), datasetsApi.preview(dataset.id)]);
      setSelected(details);
      setPreview(dataPreview);
    } catch {
      setError("We could not load this dataset preview. Please try selecting it again.");
    }
  };

  useEffect(() => {
    void refresh().catch(() => setError("The dataset service is unavailable. Start the backend and refresh this page.")).finally(() => setIsLoading(false));
  }, []);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice(""); setIsUploading(true);
    try {
      const uploaded = await datasetsApi.upload(file);
      await refresh();
      await choose(uploaded);
      setNotice(`${uploaded.original_filename} is ready to inspect.`);
    } catch (uploadError) {
      setError(messageFor(uploadError));
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const columns = (selected?.profile?.columns ?? {}) as Record<string, Record<string, unknown>>;
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Data foundation</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Bring in your dataset</h1><p className="mt-2 max-w-2xl text-slate-400">Upload a source file, check its quality, and inspect the original values before analysis.</p></div><span className="w-fit rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">{datasets.length} dataset{datasets.length === 1 ? "" : "s"} available</span></div>

    <section className="rounded-2xl border border-cyan-900/80 bg-gradient-to-br from-cyan-950/40 via-[#101b2d] to-[#101b2d] p-6 shadow-xl shadow-black/10 md:p-8"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-medium text-white">Upload a file</h2><p className="mt-1 text-sm text-slate-400">CSV, XLS, and XLSX files are supported. Your source file is kept unchanged.</p></div><button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading} className="inline-flex min-w-40 items-center justify-center rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-wait disabled:opacity-70">{isUploading ? "Uploading…" : "Choose a file"}</button><input ref={inputRef} className="sr-only" type="file" accept=".csv,.xlsx,.xls" onChange={upload} disabled={isUploading} /></div>{notice && <p role="status" className="mt-5 rounded-lg border border-emerald-900 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-300">{notice}</p>}{error && <p role="alert" className="mt-5 rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-300">{error}</p>}</section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]"><section className="rounded-2xl border border-slate-800 bg-[#101b2d] p-5"><div className="flex items-center justify-between"><h2 className="font-medium text-white">Your datasets</h2>{isLoading && <span className="text-xs text-slate-400">Loading…</span>}</div><div className="mt-4 space-y-2">{!isLoading && datasets.length === 0 && <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">No datasets yet. Choose a CSV or spreadsheet above to get started.</div>}{datasets.map((item) => <button key={item.id} type="button" onClick={() => void choose(item)} className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${selected?.id === item.id ? "border-cyan-600 bg-cyan-950/40" : "border-transparent bg-slate-900/70 hover:border-slate-700 hover:bg-slate-800"}`}><span className="min-w-0"><span className="block truncate font-medium text-slate-100">{item.original_filename}</span><span className="mt-1 block text-xs text-slate-400">{item.row_count.toLocaleString()} rows · {item.column_count} columns</span></span><span className="shrink-0 rounded-full bg-emerald-950 px-2.5 py-1 text-xs font-medium text-emerald-300">{item.quality_score}% quality</span></button>)}</div></section><section className="rounded-2xl border border-slate-800 bg-[#101b2d] p-5"><h2 className="font-medium text-white">Dataset quality</h2>{selected ? <><p className="mt-6 text-5xl font-semibold tracking-tight text-emerald-300">{selected.quality_score}%</p><p className="mt-2 text-sm text-slate-400">Profiled from the uploaded file</p><dl className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-800 pt-5 text-center"><div><dt className="text-xs text-slate-500">Rows</dt><dd className="mt-1 text-sm font-medium">{selected.row_count.toLocaleString()}</dd></div><div><dt className="text-xs text-slate-500">Columns</dt><dd className="mt-1 text-sm font-medium">{selected.column_count}</dd></div><div><dt className="text-xs text-slate-500">Duplicates</dt><dd className="mt-1 text-sm font-medium">{Number(selected.profile?.duplicate_count ?? 0).toLocaleString()}</dd></div></dl></> : <p className="mt-6 text-sm leading-6 text-slate-400">Select a dataset to see its computed quality profile and preview.</p>}</section></div>

    {selected && <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101b2d]"><div className="border-b border-slate-800 px-5 py-4"><h2 className="font-medium text-white">Schema and missing values</h2><p className="mt-1 text-sm text-slate-400">Computed from {selected.original_filename}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 font-medium">Column</th><th className="px-5 py-3 font-medium">Type</th><th className="px-5 py-3 font-medium">Missing</th><th className="px-5 py-3 font-medium">Unique</th></tr></thead><tbody>{Object.entries(columns).map(([name, info]) => <tr key={name} className="border-t border-slate-800 text-slate-300"><td className="px-5 py-3 font-medium text-slate-100">{name}</td><td className="px-5 py-3">{String(info.type)}</td><td className="px-5 py-3">{String(info.missing_count)} ({String(info.missing_percent)}%)</td><td className="px-5 py-3">{String(info.unique_count)}</td></tr>)}</tbody></table></div></section>}
    {preview && <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#101b2d]"><div className="border-b border-slate-800 px-5 py-4"><h2 className="font-medium text-white">Source preview</h2><p className="mt-1 text-sm text-slate-400">First {preview.rows.length} rows, shown without modifications.</p></div><div className="overflow-x-auto"><table className="w-full min-w-max text-left text-sm"><thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400"><tr>{preview.columns.map((column) => <th key={column} className="whitespace-nowrap px-5 py-3 font-medium">{column}</th>)}</tr></thead><tbody>{preview.rows.map((row, index) => <tr key={index} className="border-t border-slate-800 text-slate-300">{preview.columns.map((column) => <td key={column} className="max-w-64 truncate whitespace-nowrap px-5 py-3">{String(row[column] ?? "—")}</td>)}</tr>)}</tbody></table></div></section>}
  </div>;
}
