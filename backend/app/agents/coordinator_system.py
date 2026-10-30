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
        
        # 1. Quality Check Veto
        if not a1_res.get("is_usable", True):
            return Agent5SafetyOutput(
                safety_flag=True, veto_auto_triage=True, severity="CRITICAL_VETO",
                triggers=["IMAGE_QUALITY_FAIL"], justification="Image quality is inadequate; re-imaging required.", conflict_detected=True
            )
            
        pred_class = a2_res.get("predicted_class", "nv")
        conf = a2_res.get("confidence", 0.0)
        mal_mass = a2_res.get("malignant_probability_mass", 0.0)
        
        # 2. Malignancy / Uncertainty Check
        if pred_class in MALIGNANT_CLASSES and conf < 0.75:
            triggers.append("LOW_CONFIDENCE_MALIGNANCY")
            severity = "SAFETY_FLAG"
            veto = True
            
        if mal_mass > 0.22 and pred_class not in MALIGNANT_CLASSES:
            triggers.append("MALIGNANT_PROBABILITY_ELEVATED_CONFLICT")
            severity = "CRITICAL_VETO"
            veto = True
            
        # 3. ABCD Lesion vs Diagnosis Conflict
        suspicion = a3_res.get("suspicion_score", 0.0)
        if suspicion > 0.65 and pred_class in {"nv", "bkl"}:
            triggers.append("HIGH_ABCD_SUSPICION_BENIGN_PREDICTION")
            severity = "SAFETY_FLAG"
            veto = True
            
        # 4. Context Risk Check
        risk = a4_res.get("risk_indicator", "LOW")
        if risk == "HIGH" and pred_class in {"nv", "df", "vasc"}:
            triggers.append("HIGH_EPIDEMIOLOGICAL_RISK_MISMATCH")
            if severity == "CLEAR":
                severity = "CAUTION"
                
        conflict = len(triggers) > 0
        justification = f"Safety review complete. Triggers: {triggers if triggers else ['None']}."
        
        return Agent5SafetyOutput(
            safety_flag=conflict, veto_auto_triage=veto, severity=severity,
            triggers=triggers, justification=justification, conflict_detected=conflict
        )

    def coordinate(self, image_id, a1_res, a2_res, a3_res, a4_res, a5_res):
        pred_class = a2_res.get("predicted_class", "nv")
        conf = a2_res.get("confidence", 0.0)
        
        # Decision Policy Logic matching problem brief
        if not a1_res.get("is_usable", True):
            decision = "RE_IMAGE"
            rule = "Gate 1: Inadequate image quality"
            rationale = "Image quality is inadequate; requesting another image capture."
        elif a5_res.veto_auto_triage or a5_res.severity in {"SAFETY_FLAG", "CRITICAL_VETO"}:
            decision = "REFER"
            rule = "Gate 2: Safety veto or conflicting evidence"
            rationale = f"Suspicion, uncertainty, or conflicting evidence warrants expert review. Triggers: {a5_res.triggers}"
        else:
            decision = "AUTO_TRIAGE"
            rule = "Gate 3: Reliable evidence & high diagnostic confidence"
            rationale = f"Sufficient reliable evidence for automated screening disposition. Predicted class: {pred_class} (Conf: {conf:.2f})."
            
        card_summary = {
            "A1": f"{a1_res.get('status', 'PASS')} - Image is usable" if a1_res.get('is_usable') else "FAIL - Re-image required",
            "A2": f"{pred_class} • {conf:.2f}",
            "A3_A4": f"Suspicion: {a3_res.get('suspicion_label', 'LOW')} | Risk: {a4_res.get('risk_indicator', 'LOW')}",
            "A5": "SAFETY FLAG" if a5_res.safety_flag else "CLEAR",
            "A6": decision
        }
        
        return Agent6CoordinatorOutput(
            image_id=image_id, prediction=pred_class, decision=decision,
            policy_rule_triggered=rule, traceable_rationale=rationale, card_summary=card_summary
        )

print("=== SAFETY & COORDINATOR SYSTEM SAVED ===")
