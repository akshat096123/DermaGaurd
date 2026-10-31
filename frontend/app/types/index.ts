export type WorkflowPage = 1 | 2 | 3 | 4;
export type ActiveView = "page1" | "page2" | "page3" | "page4" | "analytics" | "upload" | "diagnosis";
export type ActiveStage = "screening" | "analytics" | "intake" | "report";

export interface PresetCase {
  id: string;
  patient_name?: string;
  image_id: string;
  age: number | null;
  sex: string;
  localization: string;
  dx: string;
  disease_name: string;
  scenario_title?: string;
  category: string;
  clinical_history: string;
  expected_decision: "AUTO_TRIAGE" | "REFER" | "RE_IMAGE";
  expected_gate: string;
  badge_color: "emerald" | "rose" | "amber";
}

export interface PatientContext {
  age: number | null;
  sex: "male" | "female" | "unspecified" | "unknown";
  localization: string;
}

export interface Agent1Quality {
  status: "PASS" | "WARN" | "FAIL";
  quality_score: number;
  blur_score: number;
  illumination_score: number;
  glare_ratio: number;
  obstruction_ratio: number;
  vignette_ratio: number;
  reasons: string[];
  is_usable: boolean;
}

export interface Agent2Diagnosis {
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
  top2_class: string;
  top2_confidence: number;
  entropy: number;
  malignant_probability_mass: number;
}

export interface Agent3Lesion {
  asymmetry_score: number;
  border_irregularity_score: number;
  color_variegation_score?: number;
  color_variation_score?: number;
  diameter_compactness_score?: number;
  lesion_area_ratio?: number;
  suspicion_score: number;
  suspicion_label: "LOW" | "MODERATE" | "SUSPICIOUS" | "HIGH";
  dominant_colors?: string[];
  distinct_color_zones?: string[];
  geometry_details?: Record<string, any>;
}

export interface Agent4Context {
  age_factor?: number;
  sex_factor?: number;
  localization_factor?: number;
  prior_multiplier?: number;
  malignancy_prior_multiplier?: number;
  risk_indicator: "LOW" | "MODERATE" | "ELEVATED" | "HIGH";
  clinical_summary?: string;
  context_evidence?: string[];
}

export interface Agent5Safety {
  safety_flag: boolean;
  veto_auto_triage: boolean;
  severity: "CLEAR" | "CAUTION" | "SAFETY_FLAG" | "CRITICAL_VETO";
  triggers: string[];
  justification: string;
  conflict_detected: boolean;
}

export interface Agent6Coordinator {
  image_id: string;
  prediction: string;
  decision: "AUTO_TRIAGE" | "REFER" | "RE_IMAGE";
  policy_rule_triggered: string;
  traceable_rationale: string;
  card_summary: Record<string, string>;
}

export interface AnalysisVerdict {
  decision: "AUTO_TRIAGE" | "REFER" | "RE_IMAGE";
  prediction: string;
  disease_name: string;
  confidence: number;
  policy_rule_triggered: string;
  traceable_rationale: string;
}

export interface AnalysisResponse {
  image_id: string;
  timestamp: string;
  patient_context: PatientContext;
  verdict: AnalysisVerdict;
  agents: {
    a1: Agent1Quality;
    a2: Agent2Diagnosis;
    a3: Agent3Lesion;
    a4: Agent4Context;
    a5: Agent5Safety;
    a6: Agent6Coordinator;
  };
}
