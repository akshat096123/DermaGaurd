"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, Layers, Box, Sparkles, AlertCircle } from "lucide-react";
import ThreeDTopographyMesh from "./ThreeDTopographyMesh";
import { Agent1QualityOutput, Agent3LesionOutput } from "../types";

interface DermoscopyViewerProps {
  imageUrl: string;
  imageId: string;
  quality?: Agent1QualityOutput;
  lesion?: Agent3LesionOutput;
}

export default function DermoscopyViewer({
  imageUrl,
  imageId,
  quality,
  lesion,
}: DermoscopyViewerProps) {
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [showSegmentation, setShowSegmentation] = useState<boolean>(true);
  const [glareFilter, setGlareFilter] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="flex flex-col h-full bg-[#0b101b]/90 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header Bar with 2D / 3D Switcher */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#090d16] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono tracking-wider text-slate-400">LESION IMAGING:</span>
          <span className="text-[12px] font-mono text-cyan-400 font-semibold">{imageId}</span>
        </div>

        {/* 2D vs 3D Topographical Toggle */}
        <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode("2D")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono transition-all ${
              viewMode === "2D"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D DERMOSCOPY</span>
          </button>

          <button
            onClick={() => setViewMode("3D")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono transition-all ${
              viewMode === "3D"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>3D ELEVATION MESH</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="relative flex-1 min-h-[380px] bg-[#06080D] overflow-hidden flex items-center justify-center">
        {viewMode === "3D" ? (
          <ThreeDTopographyMesh imageUrl={imageUrl} className="h-full" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-4 select-none">
            {/* 2D Image Canvas */}
            <div
              className="relative max-w-full max-h-full rounded-lg overflow-hidden transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel})`,
                filter: glareFilter ? "contrast(1.2) brightness(0.9) saturate(1.1)" : "none",
              }}
            >
              {/* Actual Image */}
              <img
                src={imageUrl}
                alt={`Dermoscopic lesion ${imageId}`}
                className="max-h-[360px] w-auto object-contain rounded-lg shadow-xl"
              />

              {/* Dynamic Lesion Segmentation Contour Overlay */}
              {showSegmentation && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <ellipse
                    cx="50"
                    cy="50"
                    rx={32 * (lesion ? Math.sqrt(lesion.lesion_area_ratio / 0.25) : 1)}
                    ry={26 * (lesion ? (1 - lesion.asymmetry_score * 0.3) : 1)}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    className="animate-pulse"
                  />
                  <ellipse
                    cx="50"
                    cy="50"
                    rx={32 * (lesion ? Math.sqrt(lesion.lesion_area_ratio / 0.25) : 1) + 2}
                    ry={26 * (lesion ? (1 - lesion.asymmetry_score * 0.3) : 1) + 2}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.6"
                    opacity="0.4"
                  />
                </svg>
              )}

              {/* Reticle / Crosshair */}
              {showReticle && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-[1px] bg-cyan-400/25 border-b border-dashed border-cyan-400/40" />
                  <div className="h-full w-[1px] bg-cyan-400/25 border-r border-dashed border-cyan-400/40 absolute" />
                  <div className="w-16 h-16 rounded-full border border-cyan-400/40 absolute flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
                  </div>
                </div>
              )}
            </div>

            {/* Millimetric Dermatoscope Reference Scale Overlay (0 - 10 mm) */}
            <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-[10px] font-mono text-slate-300 flex flex-col gap-1 pointer-events-none">
              <div className="flex justify-between items-center text-[9px] text-slate-400 w-28">
                <span>0</span>
                <span>5</span>
                <span>10 mm</span>
              </div>
              <div className="w-28 h-1.5 bg-slate-800 rounded-sm flex items-end border border-white/20">
                <div className="w-full h-full flex justify-between px-0.5">
                  <div className="w-[1px] h-full bg-white" />
                  <div className="w-[1px] h-1 bg-white/70" />
                  <div className="w-[1px] h-full bg-cyan-400" />
                  <div className="w-[1px] h-1 bg-white/70" />
                  <div className="w-[1px] h-full bg-white" />
                </div>
              </div>
            </div>

            {/* Floating 2D Controls Bar */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/15">
              <button
                onClick={() => setShowReticle(!showReticle)}
                title="Toggle Optical Crosshair Reticle"
                className={`p-1.5 rounded transition ${
                  showReticle ? "bg-cyan-500/25 text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                <Crosshair className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSegmentation(!showSegmentation)}
                title="Toggle Lesion Contour Segmentation"
                className={`p-1.5 rounded transition ${
                  showSegmentation ? "bg-emerald-500/25 text-emerald-300" : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGlareFilter(!glareFilter)}
                title="Toggle Polarization / Glare Reduction Filter"
                className={`p-1.5 rounded transition ${
                  glareFilter ? "bg-amber-500/25 text-amber-300" : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-white/20 mx-0.5" />
              <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 text-slate-400 hover:text-white rounded">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 text-slate-400 hover:text-white rounded">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={handleResetZoom} title="Reset Scale" className="p-1.5 text-slate-400 hover:text-white rounded">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Morphometric Biometrics Footer */}
      <div className="p-3 bg-[#090d16] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            PIGMENT ZONES:{" "}
            <span className="text-slate-200">
              {lesion?.distinct_color_zones?.join(", ") || "Monochromatic"}
            </span>
          </div>
          <div className="text-slate-400 hidden sm:block">
            AREA: <span className="text-cyan-400 font-semibold">{((lesion?.lesion_area_ratio || 0.22) * 100).toFixed(1)}% ROI</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {quality && !quality.is_usable && (
            <div className="flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>QUALITY SUB-DIAGNOSTIC</span>
            </div>
          )}
          <div className="text-slate-400">
            COMPACTNESS:{" "}
            <span className="text-emerald-400">
              {(1 - (lesion?.border_irregularity_score || 0.2)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
