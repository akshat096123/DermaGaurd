/**
 * Clinical Data Contracts & TypeScript Types
 * Agentic DermaGuard - FDA-Grade SaMD Diagnostic Workstation
 */

export type ClinicalDecision = "AUTO_TRIAGE" | "REFER" | "RE_IMAGE";
export type QualityStatus = "PASS" | "WARN" | "FAIL";
export type SuspicionLevel = "LOW" | "MODERATE" | "SUSPICIOUS" | "HIGH";
export type RiskLevel = "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
export type SafetySeverity = "CLEAR" | "CAUTION" | "SAFETY_FLAG" | "CRITICAL_VETO";

export interface Agent1QualityOutput {
  status: QualityStatus;
  quality_score: number;
  blur_score: number;
  illumination_score: number;
  glare_ratio: number;
  obstruction_ratio: number;
  vignette_ratio: number;
  reasons: string[];
  is_usable: boolean;
}

export interface Agent2DiagnosisOutput {
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  top2_class: string;
  top2_confidence: number;
  entropy: number;
  malignant_probability_mass: number;
}

export interface Agent3LesionOutput {
  asymmetry_score: number;
  border_irregularity_score: number;
  color_variation_score: number;
  distinct_color_zones: string[];
  suspicion_score: number;
  suspicion_label: SuspicionLevel;
  feature_evidence: string[];
  reliability_flags: string[];
  lesion_area_ratio: number;
}

export interface Agent4ContextOutput {
  age: number | null;
  sex: string;
  localization: string;
  missing_field_flags: string[];
  malignancy_prior_multiplier: number;
  class_prior_shifts: Record<string, number>;
  risk_indicator: RiskLevel;
  context_evidence: string[];
}

export interface Agent5SafetyOutput {
  safety_flag: boolean;
  veto_auto_triage: boolean;
  severity: SafetySeverity;
  triggers: string[];
  justification: string;
  conflict_detected: boolean;
}

export interface Agent6CoordinatorOutput {
  image_id: string;
  prediction: string;
  decision: ClinicalDecision;
  policy_rule_triggered: string;
  traceable_rationale: string;
  card_summary: {
    A1: string;
    A2: string;
    A3_A4: string;
    A5: string;
    A6: string;
  };
}

export interface FullPipelineResult {
  image_id: string;
  metadata: {
    lesion_id?: string;
    age?: number;
    sex?: string;
    localization?: string;
    dx?: string;
    [key: string]: any;
  };
  agent1_quality: Agent1QualityOutput;
  agent2_diagnosis: Agent2DiagnosisOutput;
  agent3_lesion: Agent3LesionOutput;
  agent4_context: Agent4ContextOutput;
  agent5_safety: Agent5SafetyOutput;
  agent6_coordinator: Agent6CoordinatorOutput;
  execution_time_ms: number;
  imageUrl?: string;
}

export interface ClinicalClassInfo {
  code: string;
  name: string;
  isMalignant: boolean;
  color: string;
  description: string;
  prevalence: string;
}

export interface SampleCase {
  id: string;
  label: string;
  dx: string;
  age: number;
  sex: "male" | "female" | "unknown";
  localization: string;
  imageUrl: string;
  clinicalDescription: string;
  pipelineResult: FullPipelineResult;
}

export interface BatchItem {
  id: string;
  image_id: string;
  age: number;
  sex: string;
  localization: string;
  prediction: string;
  confidence: number;
  decision: ClinicalDecision;
  latency_ms: number;
  triggers: string[];
  status: "pending" | "processing" | "completed";
}

export interface ConfusionMatrixCell {
  actual: string;
  predicted: string;
  count: number;
  percentage: number;
}
