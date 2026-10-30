import json
import torch
import numpy as np
from pathlib import Path
from backend.app.core.config import MALIGNANT_CLASSES, CLASSES
from backend.app.core.schemas import Agent5SafetyOutput, Agent6CoordinatorOutput

class SafetyAndCoordinatorSystem:
    def __init__(self):
        pass
        
    def evaluate_safety(self, a1_res, a2_res, a3_res, a4_res):
        triggers = []
        severity = "CLEAR"
        veto = False
        
        # 1. Quality Check Veto (Gate 1)
        is_usable = a1_res.get("is_usable", True) if isinstance(a1_res, dict) else getattr(a1_res, "is_usable", True)
        if not is_usable:
            return Agent5SafetyOutput(
                safety_flag=True,
                veto_auto_triage=True,
                severity="CRITICAL_VETO",
                triggers=["IMAGE_QUALITY_FAIL"],
                justification="Image quality is inadequate; re-imaging required.",
                conflict_detected=True,
            )
            
        pred_class = a2_res.get("predicted_class", "nv") if isinstance(a2_res, dict) else getattr(a2_res, "predicted_class", "nv")
        conf = a2_res.get("confidence", 0.0) if isinstance(a2_res, dict) else getattr(a2_res, "confidence", 0.0)
        mal_mass = a2_res.get("malignant_probability_mass", 0.0) if isinstance(a2_res, dict) else getattr(a2_res, "malignant_probability_mass", 0.0)
        
        # 2. Malignancy / Clinical Urgency Check (Malignant lesions must ALWAYS be referred)
        if pred_class in MALIGNANT_CLASSES:
            triggers.append(f"CONFIRMED_MALIGNANT_PATHOLOGY_{pred_class.upper()}")
            severity = "CRITICAL_VETO"
            veto = True
            
        if mal_mass > 0.22 and pred_class not in MALIGNANT_CLASSES:
            triggers.append("MALIGNANT_PROBABILITY_ELEVATED_CONFLICT")
            severity = "CRITICAL_VETO"
            veto = True

        if conf < 0.65:
            triggers.append("LOW_DIAGNOSTIC_CONFIDENCE")
            severity = "SAFETY_FLAG"
            veto = True
            
        # 3. ABCD Lesion vs Diagnosis Conflict
        suspicion = a3_res.get("suspicion_score", 0.0) if isinstance(a3_res, dict) else getattr(a3_res, "suspicion_score", 0.0)
        if suspicion > 0.65 and pred_class in {"nv", "bkl"}:
            triggers.append("HIGH_ABCD_SUSPICION_BENIGN_PREDICTION")
            severity = "SAFETY_FLAG"
            veto = True
            
        # 4. Context Risk Check
        risk = a4_res.get("risk_indicator", "LOW") if isinstance(a4_res, dict) else getattr(a4_res, "risk_indicator", "LOW")
        if risk == "HIGH" and pred_class in {"nv", "df", "vasc"}:
            triggers.append("HIGH_EPIDEMIOLOGICAL_RISK_MISMATCH")
            if severity == "CLEAR":
                severity = "CAUTION"
                
        conflict = len(triggers) > 0
        justification = f"Safety review complete. Triggers: {triggers if triggers else ['None']}."
        
        return Agent5SafetyOutput(
            safety_flag=conflict,
            veto_auto_triage=veto,
            severity=severity,
            triggers=triggers,
            justification=justification,
            conflict_detected=conflict,
        )

    def coordinate(self, image_id, a1_res, a2_res, a3_res, a4_res, a5_res):
        pred_class = a2_res.get("predicted_class", "nv") if isinstance(a2_res, dict) else getattr(a2_res, "predicted_class", "nv")
        conf = a2_res.get("confidence", 0.0) if isinstance(a2_res, dict) else getattr(a2_res, "confidence", 0.0)
        is_usable = a1_res.get("is_usable", True) if isinstance(a1_res, dict) else getattr(a1_res, "is_usable", True)
        
        veto = getattr(a5_res, "veto_auto_triage", None)
        if veto is None and isinstance(a5_res, dict):
            veto = a5_res.get("veto_auto_triage", False)
            
        severity = getattr(a5_res, "severity", None)
        if severity is None and isinstance(a5_res, dict):
            severity = a5_res.get("severity", "CLEAR")
            
        triggers = getattr(a5_res, "triggers", None)
        if triggers is None and isinstance(a5_res, dict):
            triggers = a5_res.get("triggers", [])
            
        safety_flag = getattr(a5_res, "safety_flag", None)
        if safety_flag is None and isinstance(a5_res, dict):
            safety_flag = a5_res.get("safety_flag", False)

        # Decision Policy Logic
        if not is_usable:
            decision = "RE_IMAGE"
            rule = "Gate 1: Inadequate image quality"
            rationale = "Image quality is inadequate (blur, glare, or poor lighting); requesting another image capture."
        elif veto or severity in {"SAFETY_FLAG", "CRITICAL_VETO"}:
            decision = "REFER"
            rule = "Gate 2: Safety veto or conflicting evidence"
            rationale = f"Suspicion, uncertainty, or clinical pathology warrants expert clinical referral. Active triggers: {', '.join(triggers) if triggers else 'None'}."
        else:
            decision = "AUTO_TRIAGE"
            rule = "Gate 3: Reliable evidence & high diagnostic confidence"
            rationale = f"Sufficient reliable evidence for automated screening disposition. Benign lesion confirmed with high diagnostic confidence ({conf * 100:.1f}%)."
            
        card_summary = {
            "A1": f"{a1_res.get('status', 'PASS') if isinstance(a1_res, dict) else getattr(a1_res, 'status', 'PASS')} - Image usable" if is_usable else "FAIL - Re-image required",
            "A2": f"{pred_class} • {conf:.2f}",
            "A3_A4": f"Suspicion: {a3_res.get('suspicion_label', 'LOW') if isinstance(a3_res, dict) else getattr(a3_res, 'suspicion_label', 'LOW')} | Risk: {a4_res.get('risk_indicator', 'LOW') if isinstance(a4_res, dict) else getattr(a4_res, 'risk_indicator', 'LOW')}",
            "A5": "SAFETY FLAG" if safety_flag else "CLEAR",
            "A6": decision,
        }
        
        return Agent6CoordinatorOutput(
            image_id=str(image_id),
            prediction=pred_class,
            decision=decision,
            policy_rule_triggered=rule,
            traceable_rationale=rationale,
            card_summary=card_summary,
        )
