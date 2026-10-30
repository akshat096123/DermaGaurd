"use client";

import React from "react";
import { TrendingUp, Award, CheckCircle2, ShieldCheck, HeartPulse, PieChart } from "lucide-react";
import { CLINIC_INSIGHTS_DATA } from "../data/clinicalData";

export default function InsightsView() {
  const {
    totalPatientsScreened,
    routineCareRate,
    specialistReferralRate,
    earlyDetectionAccuracy,
    overallDiagnosticAgreement,
    conditionsBreakdown,
    diagnosticMatrix,
  } = CLINIC_INSIGHTS_DATA;

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* 4 Clinic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[26px] border border-[#F3E8E2] p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A817C]">
                Total Screenings
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FDF3EF] text-[#F2765E] flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold tracking-tight text-[#1C1917]">
              {totalPatientsScreened.toLocaleString()}
            </div>
          </div>
          <p className="text-xs text-[#8A817C] font-medium mt-3">
            Patients evaluated across clinic network
          </p>
        </div>

        <div className="bg-white rounded-[26px] border border-[#F3E8E2] p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A817C]">
                Early Detection Recall
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#EBF7EE] text-[#2E7D32] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold tracking-tight text-[#2E7D32]">
              {earlyDetectionAccuracy}%
            </div>
          </div>
          <p className="text-xs text-[#2E7D32] font-semibold mt-3">
            Sensitivity for high-risk conditions
          </p>
        </div>

        <div className="bg-white rounded-[26px] border border-[#F3E8E2] p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A817C]">
                Routine Home Care
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FDF3EF] text-[#F2765E] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold tracking-tight text-[#1C1917]">
              {routineCareRate}%
            </div>
          </div>
          <p className="text-xs text-[#8A817C] font-medium mt-3">
            Safely cleared for self-monitoring
          </p>
        </div>

        <div className="bg-white rounded-[26px] border border-[#F3E8E2] p-6 shadow-[0_8px_30px_rgba(40,25,20,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A817C]">
                Specialist Referrals
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FDF2F0] text-[#D94838] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-extrabold tracking-tight text-[#D94838]">
              {specialistReferralRate}%
            </div>
          </div>
          <p className="text-xs text-[#8A817C] font-medium mt-3">
            Expedited to in-person dermatology visits
          </p>
        </div>
      </div>

      {/* Screened Conditions Prevalence Bar */}
      <div className="bg-white rounded-[28px] border border-[#F3E8E2] p-6 sm:p-8 shadow-[0_8px_30px_rgba(40,25,20,0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#F3E8E2]">
          <div>
            <h4 className="text-base font-bold text-[#1C1917]">
              Prevalence Across Screened Consultations
            </h4>
            <p className="text-xs text-[#8A817C] mt-0.5">
              Distribution of clinical skin conditions identified by the multi-agent screening system
            </p>
          </div>
          <span className="text-xs font-semibold text-[#F2765E] bg-[#FDF3EF] px-3.5 py-1.5 rounded-full border border-[#F3E8E2]">
            {totalPatientsScreened} Total Patients
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {conditionsBreakdown.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#1C1917]">{item.name}</span>
                <span className="font-bold text-[#8A817C]">
                  {item.count} cases ({item.share}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#FAF4F0] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(item.share, 2)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic Agreement & Hospital Protocol Matrix */}
      <div className="bg-white rounded-[28px] border border-[#F3E8E2] p-6 sm:p-8 shadow-[0_8px_30px_rgba(40,25,20,0.04)] space-y-4">
        <div>
          <h4 className="text-base font-bold text-[#1C1917]">
            Specialist Concordance &amp; Care Routing Standards
          </h4>
          <p className="text-xs text-[#8A817C] mt-0.5">
            Standard clinical care pathways and diagnostic agreement across major lesion categories
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#F3E8E2] text-[#8A817C] pb-2">
                <th className="py-3 px-4 font-semibold">Skin Condition</th>
                <th className="py-3 px-4 font-semibold">Clinic Cohort</th>
                <th className="py-3 px-4 font-semibold">Diagnostic Concordance</th>
                <th className="py-3 px-4 font-semibold">Autonomous Routing Pathway</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E8E2]/60">
              {diagnosticMatrix.map((row) => (
                <tr key={row.condition} className="hover:bg-[#FFFDFB]">
                  <td className="py-3.5 px-4 font-bold text-[#1C1917]">
                    {row.condition}
                  </td>
                  <td className="py-3.5 px-4 text-[#8A817C] font-medium">
                    {row.cases} patients
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#F2765E]">
                    {row.agreement}%
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF5F2] text-[#4A4543] border border-[#F3E8E2]">
                      {row.specialistAction}
                    </span>
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
