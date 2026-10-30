"""
Pydantic v2 Clinical Data Contracts & Pipeline Schemas
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)
"""

from typing import Dict, List, Literal, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


# ==============================================================================
# Agent 1: Image Quality Assessment Contract
# ==============================================================================
class Agent1QualityOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["PASS", "WARN", "FAIL"] = Field(
        ..., description="Overall image quality certification status"
    )
    quality_score: float = Field(
        ..., ge=0.0, le=1.0, description="Aggregate physics-based image quality score [0, 1]"
    )
    blur_score: float = Field(
        ..., ge=0.0, description="Normalized focus/sharpness metric derived from Laplacian variance"
    )
    illumination_score: float = Field(
        ..., ge=0.0, le=1.0, description="Normalized lighting uniformity and contrast fidelity"
    )
    glare_ratio: float = Field(
        ..., ge=0.0, le=1.0, description="Proportion of ROI obscured by specular flash reflection"
    )
    obstruction_ratio: float = Field(
        ..., ge=0.0, le=1.0, description="Proportion of ROI obscured by hair, ruler, or artifacts"
    )
    vignette_ratio: float = Field(
        ..., ge=0.0, le=1.0, description="Proportion of outer field darkened by dermatoscope barrel"
    )
    reasons: List[str] = Field(
        default_factory=list, description="Clinical quality audit observations and reject causes"
    )
    is_usable: bool = Field(
        ..., description="True if image possesses sufficient diagnostic quality for ML inference"
    )


# ==============================================================================
# Agent 2: Primary Lesion Classifier Contract
# ==============================================================================
class Agent2DiagnosisOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    predicted_class: str = Field(
        ..., description="Top-1 predicted HAM10000 class identifier"
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Calibrated confidence for top-1 prediction"
    )
    probabilities: Dict[str, float] = Field(
        ..., description="Full 7-class calibrated probability distribution summing to 1.0"
    )
    top2_class: str = Field(
        ..., description="Second highest probability class candidate"
    )
    top2_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Calibrated confidence for top-2 prediction"
    )
    entropy: float = Field(
        ..., ge=0.0, description="Shannon entropy across the 7-class probability vector"
    )
    malignant_probability_mass: float = Field(
        ..., ge=0.0, le=1.0, description="Cumulative probability assigned to mel + bcc + akiec"
    )


# ==============================================================================
# Agent 3: Lesion Analysis (ABCD Morphometrics) Contract
# ==============================================================================
class Agent3LesionOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    asymmetry_score: float = Field(
        ..., ge=0.0, le=1.0, description="Biaxial geometric asymmetry index [0=symmetric, 1=asymmetric]"
    )
    border_irregularity_score: float = Field(
        ..., ge=0.0, le=1.0, description="Normalized Polsby-Popper compactness and boundary indentation"
    )
    color_variation_score: float = Field(
        ..., ge=0.0, le=1.0, description="Normalized color entropy across dermatoscopic pigment prototypes"
    )
    distinct_color_zones: List[str] = Field(
        default_factory=list, description="Clinically detected color prototypes (>=3% lesion area)"
    )
    suspicion_score: float = Field(
        ..., ge=0.0, le=1.0, description="Composite weighted ABCD dermoscopic suspicion index"
    )
    suspicion_label: Literal["LOW", "MODERATE", "SUSPICIOUS", "HIGH"] = Field(
        ..., description="Categorical clinical suspicion rating from morphologic criteria"
    )
    feature_evidence: List[str] = Field(
        default_factory=list, description="Descriptive morphologic evidence supporting suspicion score"
    )
    reliability_flags: List[str] = Field(
        default_factory=list, description="Technical flags (e.g., BORDER_TOUCHING_LESION, LOW_CONTRAST)"
    )
    lesion_area_ratio: float = Field(
        ..., ge=0.0, le=1.0, description="Fraction of ROI occupied by segmented lesion"
    )


# ==============================================================================
# Agent 4: Context Reasoning & Epidemiological Prior Contract
# ==============================================================================
class Agent4ContextOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    age: Optional[float] = Field(
        None, ge=0.0, le=130.0, description="Patient age in years (None if missing/unknown)"
    )
    sex: str = Field(
        ..., description="Patient biological sex ('male', 'female', or 'unknown')"
    )
    localization: str = Field(
        ..., description="Anatomic lesion site (e.g., 'back', 'face', 'scalp', 'unknown')"
    )
    missing_field_flags: List[str] = Field(
        default_factory=list, description="Flags for missing/unknown clinical demographic fields"
    )
    malignancy_prior_multiplier: float = Field(
        ..., ge=0.0, description="Relative risk multiplier for malignancy relative to baseline prior"
    )
    class_prior_shifts: Dict[str, float] = Field(
        default_factory=dict, description="Bayesian posterior shift ratio per class given demographics"
    )
    risk_indicator: Literal["LOW", "MODERATE", "ELEVATED", "HIGH"] = Field(
        ..., description="Demographic context risk level for cutaneous malignancy"
    )
    context_evidence: List[str] = Field(
        default_factory=list, description="Epidemiological rationale supporting the context adjustment"
    )


# ==============================================================================
# Agent 5: Safety & Regulatory Guardrail Contract
# ==============================================================================
class Agent5SafetyOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    safety_flag: bool = Field(
        ..., description="True if any high-risk clinical safety condition is violated"
    )
    veto_auto_triage: bool = Field(
        ..., description="Mandatory veto prohibiting autonomous benign discharge"
    )
    severity: Literal["CLEAR", "CAUTION", "SAFETY_FLAG", "CRITICAL_VETO"] = Field(
        ..., description="Hierarchical clinical safety escalation level"
    )
    triggers: List[str] = Field(
        default_factory=list, description="Specific deterministic safety rules triggered"
    )
    justification: str = Field(
        ..., description="Synthesized clinical justification for human review referral"
    )
    conflict_detected: bool = Field(
        ..., description="True if Agent 2 benign prediction conflicts with Agent 3 or 4 high risk"
    )


# ==============================================================================
# Agent 6: Chief Clinical Coordinator Output Contract
# ==============================================================================
class Agent6CoordinatorOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_id: str = Field(
        ..., description="Canonical image identifier"
    )
    prediction: str = Field(
        ..., description="Final diagnostic consensus prediction (e.g., 'nv', 'mel')"
    )
    decision: Literal["AUTO_TRIAGE", "REFER", "RE_IMAGE"] = Field(
        ..., description="Actionable clinical triage decision"
    )
    policy_rule_triggered: str = Field(
        ..., description="Identifier of the deterministic policy branch applied"
    )
    traceable_rationale: str = Field(
        ..., description="Comprehensive clinical audit trail explaining the triage decision"
    )
    card_summary: Dict[str, Any] = Field(
        ..., description="Exact 5-card dictionary mapping for UI display (A1, A2, A3_A4, A5, A6)"
    )


# ==============================================================================
# Full Multi-Agent Pipeline Result Contract
# ==============================================================================
class FullPipelineResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_id: str = Field(..., description="Canonical image identifier")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Original row metadata")
    agent1_quality: Agent1QualityOutput
    agent2_diagnosis: Optional[Agent2DiagnosisOutput] = None
    agent3_lesion: Optional[Agent3LesionOutput] = None
    agent4_context: Optional[Agent4ContextOutput] = None
    agent5_safety: Optional[Agent5SafetyOutput] = None
    agent6_coordinator: Optional[Agent6CoordinatorOutput] = None
    execution_time_ms: float = Field(..., ge=0.0, description="Total pipeline latency in milliseconds")
