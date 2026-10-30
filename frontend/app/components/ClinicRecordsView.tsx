"use client";

import React, { useState } from "react";
import { Upload, Search, Filter, CheckCircle2, AlertTriangle, User, Calendar, MapPin, Eye, ArrowUpRight, FolderPlus } from "lucide-react";
import { RECENT_CLINIC_RECORDS, ClinicRecordEntry } from "../data/clinicalData";

export default function ClinicRecordsView() {
  const [records, setRecords] = useState<ClinicRecordEntry[]>(RECENT_CLINIC_RECORDS);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [uploadCount, setUploadCount] = useState<number>(0);

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadCount(files.length);
    setTimeout(() => {
      // Add simulated imported patient entries
      const newEntries: ClinicRecordEntry[] = Array.from(files).map((f, i) => ({
        id: `bulk-${Date.now()}-${i}`,
        patientName: `Patient #${Math.floor(1000 + Math.random() * 9000)}`,
        patientInitials: "PT",
        avatarBg: "from-[#FAD0C4] to-[#FFD1FF]",
        age: Math.floor(25 + Math.random() * 55),
        sex: i % 2 === 0 ? "Female" : "Male",
        scanDate: "Just now",
        location: ["Back", "Forearm", "Shoulder", "Chest"][i % 4],
        conditionName: i % 3 === 0 ? "Melanoma (Suspect)" : "Benign Mole",
        confidence: Math.floor(88 + Math.random() * 10),
        status: i % 3 === 0 ? "Doctor Referral" : "Routine Care",
        statusColor: i % 3 === 0 ? "coral" : "emerald",
        imageUrl: "/samples/ISIC_0024693.jpg",
      }));

      setRecords((prev) => [...newEntries, ...prev]);
      setUploadCount(0);
    }, 800);
  };

  const filteredRecords = records.filter((r) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "ROUTINE" && r.status === "Routine Care") ||
      (filter === "REFERRAL" && r.status === "Doctor Referral");

    const matchesSearch =
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.conditionName.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Top Banner & Multi-Scan Upload Action */}
      <div className="bg-white rounded-[28px] border border-[#F3E8E2] p-6 sm:p-8 shadow-[0_8px_30px_rgba(40,25,20,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2765E]" />
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">
              Clinic Patient Directory &amp; Screening Queue
            </h3>
          </div>
          <p className="text-sm text-[#8A817C] font-normal leading-relaxed">
            Manage incoming dermoscopic consultations, monitor triaged patient queues, or screen multiple patient scans simultaneously.
          </p>
        </div>

        {/* Bulk Upload Button */}
        <label className="cursor-pointer flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#F2765E] hover:bg-[#E05D44] text-white font-semibold text-xs sm:text-sm transition shadow-[0_4px_16px_rgba(242,118,94,0.25)] shrink-0">
          <FolderPlus className="w-4 h-4" />
          <span>{uploadCount > 0 ? `Processing ${uploadCount} scans...` : "Bulk Upload Patient Scans"}</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleBulkUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Directory Filter & Search Header */}
      <div className="bg-white rounded-[28px] border border-[#F3E8E2] p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#F3E8E2]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A817C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient name, condition, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl bg-[#FDF5F2] border border-[#F3E8E2] text-xs font-medium text-[#1C1917] placeholder-[#8A817C] focus:outline-none focus:border-[#F2765E]/50 w-full sm:w-80 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#FDF5F2] p-1 rounded-xl border border-[#F3E8E2]">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === "ALL" ? "bg-white text-[#F2765E] shadow-xs" : "text-[#8A817C] hover:text-[#1C1917]"
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => setFilter("ROUTINE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === "ROUTINE" ? "bg-white text-[#F2765E] shadow-xs" : "text-[#8A817C] hover:text-[#1C1917]"
              }`}
            >
              Routine Care
            </button>
            <button
              onClick={() => setFilter("REFERRAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === "REFERRAL" ? "bg-white text-[#F2765E] shadow-xs" : "text-[#8A817C] hover:text-[#1C1917]"
              }`}
            >
              Doctor Referral
            </button>
          </div>
        </div>

        {/* Patient Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F3E8E2] text-[#8A817C]">
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Scan Date</th>
                <th className="py-3 px-4 font-semibold">Skin Location</th>
                <th className="py-3 px-4 font-semibold">Detected Condition</th>
                <th className="py-3 px-4 font-semibold">Certainty</th>
                <th className="py-3 px-4 font-semibold">Care Status</th>
                <th className="py-3 px-4 text-right font-semibold">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E8E2]/60">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-[#FFFDFB] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.avatarBg} text-[#1C1917] font-bold text-xs flex items-center justify-center border border-white shadow-2xs shrink-0`}
                      >
                        {item.patientInitials}
                      </div>
                      <div>
                        <span className="font-bold text-[#1C1917] block">
                          {item.patientName}
                        </span>
                        <span className="text-[11px] text-[#8A817C] font-medium">
                          {item.age} yrs • {item.sex}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#8A817C] font-medium">
                    {item.scanDate}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#1C1917]">
                    {item.location}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#1C1917]">
                    {item.conditionName}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#F2765E]">
                    {item.confidence}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Routine Care"
                          ? "bg-[#EBF7EE] text-[#2E7D32]"
                          : "bg-[#FDF2F0] text-[#D94838]"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-block w-9 h-9 rounded-xl overflow-hidden border border-[#F3E8E2] shadow-2xs">
                      <img
                        src={item.imageUrl}
                        alt={item.patientName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
