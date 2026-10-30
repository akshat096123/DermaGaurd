"use client";

import React, { useState } from "react";
import { Upload, ChevronDown, HeartPulse, Shield, CheckCircle2, AlertTriangle, ArrowUpRight, Eye, Sparkles, Sun, Calendar, Clock, Check } from "lucide-react";
import { CLINIC_PATIENTS, PatientCase, AgentCareCheckpoint } from "../data/clinicalData";
import TactileSkinDepthMesh from "./TactileSkinDepthMesh";
import CheckpointDetailDrawer from "./CheckpointDetailDrawer";

export default function TriageWorkstationView() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(CLINIC_PATIENTS[0].id);
  const [activePatient, setActivePatient] = useState<PatientCase>(CLINIC_PATIENTS[0]);
  const [scanMode, setScanMode] = useState<"2D" | "3D">("2D");
  const [showBorder, setShowBorder] = useState<boolean>(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<AgentCareCheckpoint | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  const handleSelectPatient = (patient: PatientCase) => {
    setSelectedPatientId(patient.id);
    setActivePatient(patient);
    setCustomPhoto(null);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomPhoto(b64);

      const customCase: PatientCase = {
        id: "custom-upload",
        scanId: "#NEW-SCAN",
        patientName: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        patientInitials: "NP",
        avatarBg: "from-[#FAD0C4] to-[#FFD1FF]",
        age: 36,
        sex: "Female",
        location: "Skin Check",
        imageUrl: b64,
        detectedCondition: "Melanocytic Nevus",
        humanConditionName: "Benign Mole",
        confidence: 93,
        confidenceLabel: "93% Confidence",
        riskLevel: "Low Risk",
        riskSubtitle: "Symmetric Contours • Healthy Baseline",
        careAction: "Safe — Routine Self-Check",
        careActionPill: "Safe for Routine Monitoring",
        careActionReason: "Uploaded skin photo exhibits regular borders, uniform pigment, and zero active clinical warning markers.",
        symmetryScore: "94% Regular",
        borderScore: "Smooth & Intact",
        colorScore: "Harmonious Tone",
        careTeamCheckpoints: [
          {
            stepNumber: 1,
            title: "Photo Clarity",
            simpleExplanation: "Sharp focus & lighting verified",
            statusText: "Optimal Clarity",
            statusType: "success",
            detailNote: "Uploaded photo has high resolution, clear focus variance, and clean illumination.",
          },
          {
            stepNumber: 2,
            title: "Visual Analysis",
            simpleExplanation: "Matches benign mole pattern",
            statusText: "93% Match",
            statusType: "success",
            detailNote: "Cellular texture and pigment distribution match typical healthy melanocytic proliferation.",
          },
          {
            stepNumber: 3,
            title: "Shape & Borders",
            simpleExplanation: "Symmetric shape, even tone",
            statusText: "Balanced",
            statusType: "neutral",
            detailNote: "Both horizontal and vertical axes show architectural harmony without notched borders.",
          },
          {
            stepNumber: 4,
            title: "Patient Profile",
            simpleExplanation: "Low risk for patient demographic",
            statusText: "Typical Profile",
            statusType: "success",
            detailNote: "Age and body site show no elevated epidemiological hazard indicators.",
          },
          {
            stepNumber: 5,
            title: "Safety Check",
            simpleExplanation: "Double-checked — no red flags",
            statusText: "Cleared",
            statusType: "success",
            detailNote: "Malignant risk criteria evaluated below safety threshold.",
          },
        ],
        doctorNote: {
          title: "General Wellness Recommendation",
          guidance: "The uploaded skin photo demonstrates healthy, regular characteristics. Continue regular monthly self-examinations.",
          recommendedTimeline: "Annual routine skin check",
          sunCareTip: "Apply sunscreen daily with broad spectrum SPF 30+.",
        },
        conditionSpectrum: [
          { name: "Benign Mole", percentage: 93, isTop: true },
          { name: "Seborrheic Keratosis", percentage: 4 },
          { name: "Melanoma", percentage: 1 },
          { name: "Basal Cell Carcinoma", percentage: 1 },
          { name: "Vascular Lesion", percentage: 1 },
        ],
      };

      setActivePatient(customCase);
      setSelectedPatientId("custom-upload");
    };
    reader.readAsDataURL(file);
  };

  const currentDisplayImage = customPhoto || activePatient.imageUrl;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fadeIn">
      {/* ============================================================ */}
      {/* COLUMN A (Left 4.5 Cols): Patient Profile & Skin 3D Scan Tile */}
      {/* ============================================================ */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {/* 1. Patient Profile Card */}
        <div className="bg-white rounded-[28px] border border-[#F3E8E2] p-5 sm:p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] space-y-4">
          {/* Quick patient selector pill bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CLINIC_PATIENTS.map((p) => {
              const isSelected = selectedPatientId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-[#F2765E] text-white shadow-[0_2px_10px_rgba(242,118,94,0.3)]"
                      : "bg-[#FDF5F2] hover:bg-[#F9ECE7] text-[#8A817C] hover:text-[#1C1917]"
                  }`}
                >
                  {p.patientName.split(" ")[0]}
                </button>
              );
            })}
          </div>

          {/* Patient Details & Avatar Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${activePatient.avatarBg} text-[#1C1917] font-bold text-lg flex items-center justify-center shadow-sm border border-white`}
              >
                {activePatient.patientInitials}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">
                  {activePatient.patientName}
                </h3>
                <p className="text-xs text-[#8A817C] font-medium flex items-center gap-1.5 mt-0.5">
                  <span>{activePatient.age} yrs</span>
                  <span>•</span>
                  <span>{activePatient.sex}</span>
                  <span>•</span>
                  <span className="text-[#F2765E] font-semibold">{activePatient.location}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A817C] block">
                Record ID
              </span>
              <span className="text-xs font-bold text-[#1C1917]">
                {activePatient.scanId}
              </span>
            </div>
          </div>

          {/* Action Button: Scan New Photo */}
          <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#F2765E] hover:bg-[#E05D44] text-white font-semibold text-xs transition shadow-[0_4px_16px_rgba(242,118,94,0.25)]">
            <Upload className="w-4 h-4" />
            <span>Scan New Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* 2. Skin Scan & 3D Depth Tile */}
        <div className="bg-white rounded-[28px] border border-[#F3E8E2] p-5 sm:p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-tight text-[#1C1917]">
              High-Resolution Skin Inspection
            </span>

            {/* Segmented Toggle: Original Photo vs 3D Surface Map */}
            <div className="flex items-center bg-[#FDF5F2] p-1 rounded-xl border border-[#F3E8E2]">
              <button
                onClick={() => setScanMode("2D")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  scanMode === "2D"
                    ? "bg-white text-[#F2765E] shadow-xs"
                    : "text-[#8A817C] hover:text-[#1C1917]"
                }`}
              >
                Original Photo
              </button>
              <button
                onClick={() => setScanMode("3D")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  scanMode === "3D"
                    ? "bg-white text-[#F2765E] shadow-xs"
                    : "text-[#8A817C] hover:text-[#1C1917]"
                }`}
              >
                3D Surface Map
              </button>
            </div>
          </div>

          {/* Image & Tactile 3D Canvas Container */}
          <div className="rounded-[22px] overflow-hidden aspect-[4/3] relative bg-[#FAF4F0] border border-[#F3E8E2] flex items-center justify-center shadow-inner">
            {scanMode === "3D" ? (
              <TactileSkinDepthMesh imageUrl={currentDisplayImage} className="w-full h-full" />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center p-2.5">
                <img
                  src={currentDisplayImage}
                  alt={`Dermoscopic scan ${activePatient.patientName}`}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-xs"
                />

                {showBorder && (
                  <div className="absolute inset-0 m-auto w-[70%] h-[70%] rounded-full border border-[#F2765E]/70 pointer-events-none" />
                )}
              </div>
            )}
          </div>

          {/* Subtle Border toggle button */}
          <div className="flex items-center justify-between text-xs text-[#8A817C] pt-0.5">
            <button
              onClick={() => setShowBorder(!showBorder)}
              className="flex items-center gap-1.5 hover:text-[#1C1917] transition font-medium"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showBorder ? "Hide Lesion Boundary" : "Highlight Lesion Boundary"}</span>
            </button>
            <span className="font-semibold text-[#1C1917]">Scale: 10 mm standard</span>
          </div>

          {/* 3 Visual Progress Pills for ABCD Rule */}
          <div className="pt-2 border-t border-[#F3E8E2] grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-[#FFFDFB] border border-[#F3E8E2]">
              <span className="text-[10px] font-semibold text-[#8A817C] uppercase block">
                Symmetry
              </span>
              <span className="text-xs font-bold text-[#1C1917] mt-0.5 block truncate">
                {activePatient.symmetryScore}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FFFDFB] border border-[#F3E8E2]">
              <span className="text-[10px] font-semibold text-[#8A817C] uppercase block">
                Borders
              </span>
              <span className="text-xs font-bold text-[#1C1917] mt-0.5 block truncate">
                {activePatient.borderScore}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FFFDFB] border border-[#F3E8E2]">
              <span className="text-[10px] font-semibold text-[#8A817C] uppercase block">
                Color Tone
              </span>
              <span className="text-xs font-bold text-[#1C1917] mt-0.5 block truncate">
                {activePatient.colorScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* COLUMN B (Right 7.5 Cols): 3 Hero Vitals, Timeline, Doctor Note */}
      {/* ============================================================ */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        {/* Row 1: 3 Hero Vital Cards (Detected Condition, Skin Risk Level, Care Recommendation) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Detected Condition */}
          <div className="bg-white rounded-[26px] border border-[#F3E8E2] p-5 shadow-[0_8px_30px_rgba(40,25,20,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FDF3EF] text-[#F2765E] flex items-center justify-center shadow-xs">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[#8A817C] uppercase tracking-wider">
                  Detected Condition
                </span>
              </div>
              <h4 className="text-xl font-extrabold text-[#1C1917] tracking-tight">
                {activePatient.humanConditionName}
              </h4>
              <p className="text-xs text-[#8A817C] font-medium mt-0.5">
                {activePatient.detectedCondition}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F3E8E2]/70 flex items-center justify-between">
              <span className="text-xs text-[#8A817C] font-medium">Confidence</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDF3EF] text-[#F2765E] border border-[#F3E8E2]">
                {activePatient.confidenceLabel}
              </span>
            </div>
          </div>

          {/* Card 2: Skin Risk Level with Mini Wave SVG */}
          <div className="bg-white rounded-[26px] border border-[#F3E8E2] p-5 shadow-[0_8px_30px_rgba(40,25,20,0.04)] flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FDF3EF] text-[#F2765E] flex items-center justify-center shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[#8A817C] uppercase tracking-wider">
                  Skin Risk Level
                </span>
              </div>
              <h4 className={`text-xl font-extrabold tracking-tight ${
                activePatient.riskLevel === "Low Risk"
                  ? "text-[#2E7D32]"
                  : activePatient.riskLevel === "Moderate Risk"
                  ? "text-[#DDA15E]"
                  : "text-[#D94838]"
              }`}>
                {activePatient.riskLevel}
              </h4>
              <p className="text-xs text-[#8A817C] font-medium mt-0.5 truncate">
                {activePatient.riskSubtitle}
              </p>
            </div>

            {/* Mini Smooth Coral Spline Wave SVG */}
            <div className="mt-3 pt-2">
              <svg className="w-full h-7 text-[#F2765E]" viewBox="0 0 100 25" preserveAspectRatio="none">
                <path
                  d="M0 15 Q25 5 50 14 T100 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: Care Recommendation Card (Highlighted Coral Tint) */}
          <div className="bg-gradient-to-br from-[#FFF9F6] to-white rounded-[26px] border-2 border-[#F2765E] p-5 shadow-[0_10px_30px_rgba(242,118,94,0.15)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F2765E] text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[#F2765E] uppercase tracking-wider">
                  Recommended Action
                </span>
              </div>
              <h4 className="text-lg font-extrabold text-[#1C1917] tracking-tight leading-snug">
                {activePatient.careAction}
              </h4>
            </div>

            <div className="mt-3 pt-3 border-t border-[#F3E8E2]">
              <p className="text-[11px] text-[#4A4543] font-medium leading-relaxed">
                {activePatient.careActionReason}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Interactive "AI Care Team Checkpoints" (Horizontal Visual Timeline) */}
        <div className="bg-white rounded-[28px] border border-[#F3E8E2] p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F3E8E2]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F2765E]" />
              <h4 className="text-sm font-bold text-[#1C1917]">
                AI Specialist Care Team Review
              </h4>
            </div>
            <span className="text-xs text-[#8A817C] font-medium hidden sm:inline">
              5 Dedicated Clinical Checkpoints
            </span>
          </div>

          {/* Visual Horizontal Timeline Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {activePatient.careTeamCheckpoints.map((step) => (
              <div
                key={step.stepNumber}
                onClick={() => setSelectedCheckpoint(step)}
                className="group cursor-pointer p-3.5 rounded-2xl bg-[#FDF5F2] hover:bg-[#FBECE6] border border-[#F3E8E2] hover:border-[#F2765E]/40 transition-all duration-200 flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-white text-[#F2765E] text-xs font-bold flex items-center justify-center shadow-2xs">
                      {step.stepNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.statusType === "success"
                        ? "bg-[#EBF7EE] text-[#2E7D32]"
                        : step.statusType === "warning"
                        ? "bg-[#FDF2F0] text-[#D94838]"
                        : "bg-white text-[#1C1917] border border-[#F3E8E2]"
                    }`}>
                      {step.statusText}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-[#1C1917] mt-2 group-hover:text-[#F2765E] transition-colors">
                    {step.title}
                  </h5>
                  <p className="text-[11px] text-[#8A817C] font-medium leading-relaxed line-clamp-2 mt-0.5">
                    {step.simpleExplanation}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-semibold text-[#F2765E] pt-1">
                  <span>Details</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Doctor's Care Note & Patient Guidance */}
        <div className="bg-gradient-to-r from-[#FFFBF8] to-[#FFF6F2] rounded-[28px] border border-[#F3E8E2] p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3E8E2]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#F3E8E2] text-[#F2765E] flex items-center justify-center shadow-2xs">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1C1917]">
                  Doctor's Care Note: {activePatient.doctorNote.title}
                </h4>
                <p className="text-xs text-[#8A817C] font-medium">
                  Personalized skin wellness instructions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] bg-white px-3 py-1.5 rounded-xl border border-[#F3E8E2] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#F2765E]" />
              <span>{activePatient.doctorNote.recommendedTimeline}</span>
            </div>
          </div>

          <p className="text-sm text-[#4A4543] leading-relaxed font-normal">
            {activePatient.doctorNote.guidance}
          </p>

          <div className="flex items-center gap-2 pt-1 text-xs font-medium text-[#8A817C]">
            <span className="w-2 h-2 rounded-full bg-[#F2765E]" />
            <span>Daily Sun Care Tip: {activePatient.doctorNote.sunCareTip}</span>
          </div>
        </div>
      </div>

      {/* Slide-over Inspection Drawer for Checkpoints */}
      <CheckpointDetailDrawer
        checkpoint={selectedCheckpoint}
        onClose={() => setSelectedCheckpoint(null)}
        patientName={activePatient.patientName}
      />
    </div>
  );
}
