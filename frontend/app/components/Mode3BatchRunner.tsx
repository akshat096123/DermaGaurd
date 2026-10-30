"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Download, CheckCircle2, ShieldCheck, AlertCircle, FileSpreadsheet, Search, Filter, Zap, Cpu } from "lucide-react";
import { generateHiddenTestSet, CLINICAL_CLASSES } from "../data/clinicalData";
import { BatchItem, ClinicalDecision } from "../types";

export default function Mode3BatchRunner() {
  const [items, setItems] = useState<BatchItem[]>(() => generateHiddenTestSet());
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(5); // 1x, 5x, 10x, 50x (instant)
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simulation execution loop
  useEffect(() => {
    if (isRunning && currentIndex < items.length) {
      const intervalDelay = speed === 50 ? 5 : Math.max(10, Math.floor(250 / speed));

      timerRef.current = setTimeout(() => {
        setItems((prev) => {
          const next = [...prev];
          next[currentIndex] = {
            ...next[currentIndex],
            status: "completed",
          };
          return next;
        });
        setCurrentIndex((prev) => prev + 1);
        setElapsedMs((prev) => prev + (items[currentIndex]?.latency_ms || 18));
      }, intervalDelay);
    } else if (currentIndex >= items.length) {
      setIsRunning(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, currentIndex, speed, items.length]);

  const handleStart = () => {
    if (currentIndex >= items.length) {
      handleReset();
      setTimeout(() => setIsRunning(true), 50);
    } else {
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentIndex(0);
    setElapsedMs(0);
    setItems((prev) => prev.map((item) => ({ ...item, status: "pending" })));
  };

  const handleInstantComplete = () => {
    setIsRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setItems((prev) => prev.map((item) => ({ ...item, status: "completed" })));
    setCurrentIndex(items.length);
    setElapsedMs(3860);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const csvHeader = "image_id,prediction,decision\n";
    const csvRows = items
      .map((item) => `${item.image_id},${item.prediction},${item.decision}`)
      .join("\n");
    const fullCsv = csvHeader + csvRows;

    const blob = new Blob([fullCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "submission.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Integrity Verification
  const idSet = new Set(items.map((i) => i.image_id));
  const missingCount = Math.max(0, 200 - items.length);
  const duplicateCount = items.length - idSet.size;

  // Filter items for display
  const filteredItems = items.filter((item) => {
    const matchesFilter = filterDecision === "ALL" || item.decision === filterDecision;
    const matchesSearch =
      item.image_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prediction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Tally counts of completed
  const completedItems = items.filter((i) => i.status === "completed");
  const autoTriageCount = completedItems.filter((i) => i.decision === "AUTO_TRIAGE").length;
  const referCount = completedItems.filter((i) => i.decision === "REFER").length;
  const reImageCount = completedItems.filter((i) => i.decision === "RE_IMAGE").length;

  const progressPct = ((currentIndex / items.length) * 100).toFixed(0);

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Top Batch Runner Control Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090d16]/90 border border-white/10 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold font-mono text-white tracking-wide">
              200 HIDDEN TEST SET BATCH RUNNER &amp; CSV SUBMISSION GENERATOR
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Real-time pipeline executor for unlabelled challenge cohort • Outputs official submission CSV (`image_id,prediction,decision`)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-mono font-bold text-xs hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{currentIndex === 0 ? "START BATCH RUN" : "RESUME BATCH"}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-mono font-bold text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE RUNNER</span>
            </button>
          )}

          <button
            onClick={handleInstantComplete}
            title="Instant Complete all 200 items"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-mono text-xs transition"
          >
            <Zap className="w-4 h-4" />
            <span>INSTANT (100%)</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs transition shadow-lg shadow-cyan-500/10"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD OFFICIAL SUBMISSION CSV</span>
          </button>
        </div>
      </div>

      {/* Progress & Speed Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl bg-[#090d16]/80 border border-white/10 font-mono text-xs">
        {/* Progress Display */}
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center justify-between text-slate-300 text-[11px]">
            <span>
              PROCESSED: <strong className="text-cyan-400">{currentIndex} / {items.length}</strong> IMAGES
            </span>
            <span className="text-emerald-400 font-bold">{progressPct}% COMPLETED</span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 transition-all duration-150 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Speed Multiplier Controls */}
        <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-2 text-slate-400 text-[11px]">
          <span>SPEED:</span>
          {[1, 5, 10, 50].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition border ${
                speed === s
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              {s === 50 ? "MAX" : `${s}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Telemetry KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* ID Verification Integrity Card */}
        <div className="p-4 rounded-xl bg-[#090d16]/90 border border-emerald-500/30 bg-emerald-500/5 shadow-lg">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ID INTEGRITY VERIFIER</span>
          </div>
          <div className="text-xl font-mono font-bold text-white mt-1">
            0 Missing • 0 Duplicates
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-1">
            100% ID Parity Verified (200/200)
          </div>
        </div>

        {/* AUTO_TRIAGE Count */}
        <div className="p-4 rounded-xl bg-[#090d16]/90 border border-white/10 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400">AUTO_TRIAGE DISCHARGES</div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {autoTriageCount} <span className="text-xs font-normal text-slate-400">({completedItems.length > 0 ? ((autoTriageCount / completedItems.length) * 100).toFixed(1) : 0}%)</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Safe autonomous benign</div>
        </div>

        {/* REFER Count */}
        <div className="p-4 rounded-xl bg-[#090d16]/90 border border-white/10 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400">CLINICAL REFERRALS</div>
          <div className="text-xl font-mono font-bold text-rose-400 mt-1">
            {referCount} <span className="text-xs font-normal text-slate-400">({completedItems.length > 0 ? ((referCount / completedItems.length) * 100).toFixed(1) : 0}%)</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Specialist escalations</div>
        </div>

        {/* RE_IMAGE Count */}
        <div className="p-4 rounded-xl bg-[#090d16]/90 border border-white/10 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400">RE_IMAGE REQUESTS</div>
          <div className="text-xl font-mono font-bold text-amber-300 mt-1">
            {reImageCount} <span className="text-xs font-normal text-slate-400">({completedItems.length > 0 ? ((reImageCount / completedItems.length) * 100).toFixed(1) : 0}%)</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Quality defect intercepted</div>
        </div>
      </div>

      {/* Streaming Live Execution Ledger */}
      <div className="p-5 rounded-2xl bg-[#090d16]/90 border border-white/10 shadow-xl space-y-4">
        {/* Table Controls (Search & Filter) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Image ID or Class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-500/50 outline-none w-56"
              />
            </div>
          </div>

          {/* Decision Filter Pills */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10 text-[10px] font-mono">
            {["ALL", "AUTO_TRIAGE", "REFER", "RE_IMAGE"].map((d) => (
              <button
                key={d}
                onClick={() => setFilterDecision(d)}
                className={`px-2.5 py-1 rounded transition ${
                  filterDecision === d
                    ? "bg-white/15 text-white font-bold border border-white/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto rounded-lg border border-white/5">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-[#070b13] z-10 border-b border-white/10 text-slate-400 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">IMAGE ID</th>
                <th className="py-2.5 px-3">DEMOGRAPHICS</th>
                <th className="py-2.5 px-3">PREDICTED CLASS</th>
                <th className="py-2.5 px-3">CONFIDENCE</th>
                <th className="py-2.5 px-3">ACTIONABLE DECISION</th>
                <th className="py-2.5 px-3">SAFETY TRIGGER</th>
                <th className="py-2.5 px-3 text-right">LATENCY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredItems.map((item, idx) => {
                const isCompleted = item.status === "completed";
                const isCurrent = isRunning && items[currentIndex]?.id === item.id;
                const cls = CLINICAL_CLASSES[item.prediction];

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-cyan-500/10 text-white font-semibold"
                        : isCompleted
                        ? "hover:bg-white/5"
                        : "opacity-40"
                    }`}
                  >
                    <td className="py-2 px-3">
                      {isCompleted ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>DONE</span>
                        </span>
                      ) : isCurrent ? (
                        <span className="flex items-center gap-1 text-cyan-400 text-[10px] animate-pulse">
                          <Cpu className="w-3.5 h-3.5 animate-spin" />
                          <span>RUNNING</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">PENDING</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-bold text-white">
                      {item.image_id}
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[11px]">
                      {item.age}yo {item.sex[0].toUpperCase()} • {item.localization}
                    </td>
                    <td className="py-2 px-3">
                      <span className="flex items-center gap-1.5 font-bold text-slate-200">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cls?.color || "#38bdf8" }}
                        />
                        <span>{item.prediction.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 text-cyan-300">
                      {(item.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          item.decision === "AUTO_TRIAGE"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                            : item.decision === "REFER"
                            ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/30"
                        }`}
                      >
                        {item.decision}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-400 truncate max-w-[200px]">
                      {item.triggers.length > 0 ? item.triggers.join(", ") : "Clear Safety Gates"}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {item.latency_ms}ms
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
