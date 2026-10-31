"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Scan,
  Shield,
  X,
} from "lucide-react";
import { PresetCase } from "../types";
import TactileSkinDepthMesh from "./TactileSkinDepthMesh";
import GuidedSmartCamera from "./GuidedSmartCamera";

interface ImageUploadCardProps {
  selectedImageUrl: string | null;
  selectedImageId: string | null;
  selectedImageFile: File | null;
  onSelectImageFile: (file: File) => void;
  onSelectPreset: (preset: PresetCase) => void;
  onCameraCapture: (blob: Blob, dataUrl: string) => void;
  onClearImage?: () => void;
  presets: PresetCase[];
  onVerify: () => void;
  isLoading: boolean;
}

export default function ImageUploadCard({
  selectedImageUrl,
  selectedImageId,
  selectedImageFile,
  onSelectImageFile,
  onSelectPreset,
  onCameraCapture,
  onClearImage,
  presets,
  onVerify,
  isLoading,
}: ImageUploadCardProps) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-[28px] bg-white border border-[#F2E8E3] shadow-[0_12px_36px_rgba(28,25,23,0.05)] p-6 sm:p-8 space-y-6">
      {/* Brand Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F2E8E3] gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E85D44] via-[#F27059] to-[#D4472E] text-white shadow-md shadow-[#E85D44]/25 shrink-0">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-[#18181B]">
                DermaGuard <span className="text-[#E85D44] font-bold">Clinical</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-[#E85D44]/10 text-[#E85D44]">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] font-medium leading-none mt-0.5">
              Autonomous Dermatology & Multi-Agent Triage Platform
            </p>
          </div>
        </div>

        {/* 2D Standard vs 3D Relief Topography Toggle (Active when image selected) */}
        {selectedImageUrl && (
          <div className="flex items-center p-1 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("2d")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === "2d"
                  ? "bg-white text-[#18181B] shadow-sm border border-[#E5DCD4]"
                  : "text-[#78716C] hover:text-[#18181B]"
              }`}
            >
              Standard 2D
            </button>
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                viewMode === "3d"
                  ? "bg-[#E85D44] text-white shadow-sm"
                  : "text-[#78716C] hover:text-[#18181B]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Relief</span>
            </button>
          </div>
        )}
      </div>

      {/* Title & Instructions */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-[#E85D44] uppercase tracking-wider block">
          Dermoscopy Intake
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight">
          Upload Patient Dermoscopy Scan
        </h1>
        <p className="text-xs text-[#78716C]">
          Upload an image, capture via smart camera, or choose a benchmark case below. Click <strong>Verify</strong> to run multi-agent evaluation.
        </p>
      </div>

      {/* Main Interactive Image Stage / Drag-and-Drop Area (Live Feed Hosted Here Directly) */}
      <div
        onDragOver={(e) => {
          if (isCameraActive) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (isCameraActive) return;
          handleDrop(e);
        }}
        className={`relative w-full rounded-[24px] overflow-hidden border-2 transition-all ${
          isCameraActive
            ? "aspect-[16/10] max-h-[380px] border-[#0D9488]/40 bg-stone-950 shadow-md"
            : selectedImageUrl
            ? "h-[240px] sm:h-[300px] border-[#F2E8E3] bg-[#FAF4F0]"
            : dragOver
            ? "h-[140px] sm:h-[160px] border-[#E85D44] bg-[#FCEAE3]/40"
            : "h-[140px] sm:h-[160px] border-[#F2E8E3] border-dashed bg-[#FAF4F0]/60 hover:border-[#E85D44]/60 hover:bg-[#FCEAE3]/20"
        } flex items-center justify-center`}
      >
        {isCameraActive ? (
          <GuidedSmartCamera
            inline
            onCapture={(blob, dataUrl) => {
              onCameraCapture(blob, dataUrl);
              setIsCameraActive(false);
            }}
            onClose={() => setIsCameraActive(false)}
            className="w-full h-full"
          />
        ) : selectedImageUrl ? (
          viewMode === "2d" ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={selectedImageUrl}
                alt="Selected Dermoscopy Scan"
                className="w-full h-full object-contain rounded-[18px]"
              />
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Scan ID: {selectedImageId || "Custom Upload"}</span>
              </div>
              {onClearImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearImage();
                  }}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#E11D48] text-xs font-bold flex items-center gap-1.5 shadow-md border border-[#F2E8E3] transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Scan</span>
                </button>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full">
              <TactileSkinDepthMesh imageUrl={selectedImageUrl} className="w-full h-full" />
              {onClearImage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearImage();
                  }}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#E11D48] text-xs font-bold flex items-center gap-1.5 shadow-md border border-[#F2E8E3] transition-all z-10"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Scan</span>
                </button>
              )}
            </div>
          )
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="text-center p-4 sm:p-5 space-y-2 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-[#F2E8E3] flex items-center justify-center mx-auto text-[#E85D44] group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#18181B] group-hover:text-[#E85D44] transition-colors leading-tight">
                Drag & Drop Dermoscopy Scan Here
              </h3>
              <p className="text-[11px] text-[#78716C] mt-0.5">
                Or click anywhere in this area to browse from your device (JPEG, PNG, TIFF up to 25MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Row: Upload Scan, Live Camera, & Hidden File Input */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] shadow-sm hover:shadow transition-all"
        >
          <Upload className="w-4 h-4 text-[#E85D44]" />
          <span>Upload From Device</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCameraActive((prev) => !prev)}
          className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border text-xs font-bold shadow-sm transition-all ${
            isCameraActive
              ? "bg-[#E11D48]/10 border-[#E11D48] text-[#E11D48] hover:bg-[#E11D48]/15"
              : "bg-white border-[#F2E8E3] hover:border-[#E5DCD4] text-[#18181B] hover:shadow"
          }`}
        >
          <Camera className={`w-4 h-4 ${isCameraActive ? "text-[#E11D48]" : "text-[#0D9488]"}`} />
          <span>{isCameraActive ? "Close Live Camera" : "Smart Guided Camera"}</span>
        </button>
      </div>

      {/* Quick-Load Hospital Clinical Presets */}
      <div className="space-y-2.5 pt-3 border-t border-[#F2E8E3]">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#E85D44]" />
            <span>Select Benchmark Hospital Cases (5 Clinical Scenarios)</span>
          </label>
          <span className="text-[10px] text-[#A8A29E] font-medium">Click to select scan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {presets.map((preset) => {
            const isSelected = selectedImageId === preset.image_id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm ring-1 ring-[#E85D44]"
                    : "bg-[#FAF4F0] border-[#F2E8E3] hover:border-[#E5DCD4]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-[#18181B] truncate">
                    {preset.patient_name || preset.disease_name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                      preset.badge_color === "rose"
                        ? "bg-[#E11D48]/15 text-[#E11D48]"
                        : preset.badge_color === "amber"
                        ? "bg-[#F59E0B]/15 text-[#B45309]"
                        : "bg-[#10B981]/15 text-[#047857]"
                    }`}
                  >
                    {preset.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#78716C] line-clamp-1">
                  {preset.scenario_title || preset.clinical_history}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Verification Action Button */}
      <div className="pt-4 border-t border-[#F2E8E3] space-y-2">
        <button
          type="button"
          disabled={isLoading || !selectedImageUrl}
          onClick={onVerify}
          className={`w-full py-4 px-6 rounded-2xl text-sm font-extrabold tracking-wide flex items-center justify-center gap-3 transition-all duration-300 shadow-md ${
            !selectedImageUrl
              ? "bg-[#E5DCD4] text-[#A8A29E] cursor-not-allowed"
              : isLoading
              ? "bg-[#E85D44]/80 text-white cursor-wait"
              : "bg-gradient-to-r from-[#E85D44] via-[#F27059] to-[#E85D44] text-white hover:shadow-xl hover:shadow-[#E85D44]/30 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying Scan Quality & Advancing to Diagnostics...</span>
            </>
          ) : !selectedImageUrl ? (
            <>
              <Scan className="w-5 h-5" />
              <span>Upload or Select a Scan Above to Verify</span>
            </>
          ) : (
            <>
              <Scan className="w-5 h-5" />
              <span>Verify Scan & Proceed to Clinical Diagnostics</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-[11px] text-[#A8A29E] text-center font-medium">
          {selectedImageUrl ? (
            <>
              Clicking <strong>Verify</strong> certifies optical quality and unlocks the full diagnostic workstation and navigation options.
            </>
          ) : (
            <>Please upload or select a dermoscopy scan above to enable the verification sequence.</>
          )}
        </p>
      </div>

    </div>
  );
}
