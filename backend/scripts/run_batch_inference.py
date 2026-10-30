#!/usr/bin/env python3
"""
Standalone Clinical Batch Inference & Quality Assurance CLI
DermaGuard Clinical Platform

Executes the full 6-agent clinical consensus pipeline over a directory of dermoscopy images:
1. Agent 1: Optical Quality Gate (Blur, Illumination, Specular Glare)
2. Agent 2: Primary Lesion Classifier (Trained EfficientNet-B0 + Demographic Fusion)
3. Agent 3: Lesion Morphological Analysis (Biaxial Asymmetry, Border, Color Variegation)
4. Agent 4: Epidemiological Risk Reasoning (Age, Sex, Anatomical Site Prior)
5. Agent 5: Autonomous Safety & Conflict Guardrail (Deterministic Veto)
6. Agent 6: Chief Clinical Coordinator (Auto-Triage, Specialist Referral, Recapture)

Outputs a clean, strictly-validated CSV file (image_id,prediction,decision) with zero missing
or duplicate rows, and reports cohort-level triage performance metrics.
"""

import sys
import os
import argparse
import time
from pathlib import Path
import pandas as pd
import numpy as np
import cv2

# Add repository root to path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.core.config import CLASSES, MALIGNANT_CLASSES
from backend.app.agents.quality_agent import ImageQualityAgent
from backend.app.agents.diagnosis_agent import DiagnosisAgent
from backend.app.agents.lesion_analysis_agent import LesionAnalysisAgent
from backend.app.agents.context_agent import ContextReasoningAgent
from backend.app.agents.coordinator_system import SafetyAndCoordinatorSystem


def parse_args():
    parser = argparse.ArgumentParser(
        description="DermaGuard 6-Agent Clinical Batch Inference CLI"
    )
    parser.add_argument(
        "--input_dir",
        "--image_dir",
        type=str,
        default="data/raw/Health/eval/images",
        help="Path to folder containing dermoscopic images (.jpg, .jpeg, .png)",
    )
    parser.add_argument(
        "--metadata_csv",
        type=str,
        default="data/raw/Health/eval/metadata.csv",
        help="Optional path to metadata.csv with columns (image_id, age, sex, localization)",
    )
    parser.add_argument(
        "--output_csv",
        type=str,
        default="batch_inference_results.csv",
        help="Path to save the output CSV (default: batch_inference_results.csv)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit on number of images to evaluate (e.g. 200)",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    input_dir = Path(args.input_dir)

    print("\n" + "=" * 76)
    print("  DERMAGUARD CLINICAL PLATFORM — 6-AGENT BATCH INFERENCE & AUDIT")
    print("=" * 76)

    if not input_dir.exists():
        print(f"[!] Error: Input directory does not exist: {input_dir}")
        sys.exit(1)

    # 1. Discover image files
    valid_exts = {".jpg", ".jpeg", ".png"}
    image_files = sorted([p for p in input_dir.iterdir() if p.suffix.lower() in valid_exts])

    if not image_files:
        print(f"[!] Error: No valid image files (.jpg, .jpeg, .png) found in {input_dir}")
        sys.exit(1)

    if args.limit and args.limit > 0:
        image_files = image_files[:args.limit]

    print(f"[*] Discovered {len(image_files)} dermoscopy images in: {input_dir}")

    # 2. Load demographic metadata if available
    metadata_lookup = {}
    if args.metadata_csv and Path(args.metadata_csv).exists():
        try:
            df_meta = pd.read_csv(args.metadata_csv)
            for _, row in df_meta.iterrows():
                metadata_lookup[str(row["image_id"])] = {
                    "age": row.get("age") if not pd.isna(row.get("age")) else 50.0,
                    "sex": str(row.get("sex", "unknown")),
                    "localization": str(row.get("localization", "unknown")),
                }
            print(f"[*] Loaded clinical demographics for {len(metadata_lookup)} cohort records.")
        except Exception as e:
            print(f"[!] Warning: Failed reading metadata CSV ({e}); using neutral demographic priors.")

    # 3. Initialize all 6 Clinical Agents
    print("[*] Initializing 6-Agent Clinical System...")
    quality_agent = ImageQualityAgent()
    diagnosis_agent = DiagnosisAgent()
    lesion_agent = LesionAnalysisAgent()
    context_agent = ContextReasoningAgent()
    coordinator = SafetyAndCoordinatorSystem()
    print("    [✓] Agent 1: Image Quality Certification")
    print("    [✓] Agent 2: EfficientNet-B0 Multi-Modal Neural Classifier")
    print("    [✓] Agent 3: Lesion ABCD Morphological Geometry")
    print("    [✓] Agent 4: Epidemiological Demographic Prior")
    print("    [✓] Agent 5: Autonomous Safety & Conflict Guardrail")
    print("    [✓] Agent 6: Chief Clinical Coordinator")

    # 4. Run Batch Pipeline
    results = []
    decision_counts = {"AUTO_TRIAGE": 0, "REFER": 0, "RE_IMAGE": 0}
    class_counts = {c: 0 for c in CLASSES}
    start_time = time.time()

    print("\n[*] Processing clinical cases...")
    for idx, img_path in enumerate(image_files, 1):
        image_id = img_path.stem

        img_bgr = cv2.imread(str(img_path))
        if img_bgr is None:
            # Fallback for unreadable files
            results.append({
                "image_id": image_id,
                "prediction": "nv",
                "decision": "RE_IMAGE",
            })
            decision_counts["RE_IMAGE"] += 1
            continue

        patient_meta = metadata_lookup.get(image_id, {
            "age": 50.0,
            "sex": "unknown",
            "localization": "unknown",
        })

        age = patient_meta.get("age")
        sex = patient_meta.get("sex")
        loc = patient_meta.get("localization")

        try:
            # 1. Quality Certification
            a1 = quality_agent.evaluate(img_bgr).model_dump()

            # 2. Neural Inference
            a2 = diagnosis_agent.evaluate(
                img_bgr, image_id=image_id, age=age, sex=sex, localization=loc
            ).model_dump()

            # 3. ABCD Morphometry
            a3 = lesion_agent.evaluate(img_bgr).model_dump()

            # 4. Context Priors
            a4 = context_agent.evaluate(age=age, sex=sex, localization=loc).model_dump()

            # 5. Safety Guardrail
            a5_obj = coordinator.evaluate_safety(a1, a2, a3, a4)

            # 6. Final Coordination
            a6 = coordinator.coordinate(image_id, a1, a2, a3, a4, a5_obj)

            pred = a6.prediction
            decision = a6.decision

            results.append({
                "image_id": image_id,
                "prediction": pred,
                "decision": decision,
            })

            decision_counts[decision] = decision_counts.get(decision, 0) + 1
            class_counts[pred] = class_counts.get(pred, 0) + 1

        except Exception as e:
            print(f"[!] Error processing {image_id}: {e}")
            results.append({
                "image_id": image_id,
                "prediction": "nv",
                "decision": "RE_IMAGE",
            })
            decision_counts["RE_IMAGE"] += 1

        if idx % 20 == 0 or idx == len(image_files):
            pct = (idx / len(image_files)) * 100
            last_item = results[-1]
            print(f"    [{idx:4d}/{len(image_files)}] {pct:5.1f}% | Case {last_item['image_id']} -> {last_item['prediction'].upper()} [{last_item['decision']}]")

    elapsed = time.time() - start_time
    fps = len(image_files) / max(elapsed, 0.001)

    # 5. Validate Output DataFrame
    df_out = pd.DataFrame(results)

    # Strict schema validation
    assert list(df_out.columns) == ["image_id", "prediction", "decision"], "Invalid CSV columns!"
    assert len(df_out["image_id"].unique()) == len(df_out), "Duplicate image_id entries detected!"
    assert not df_out.isnull().values.any(), "Missing or NaN values in results!"
    assert set(df_out["decision"].unique()).issubset({"AUTO_TRIAGE", "REFER", "RE_IMAGE"}), "Invalid triage decision!"
    assert set(df_out["prediction"].unique()).issubset(set(CLASSES)), "Invalid diagnostic class prediction!"

    out_path = Path(args.output_csv)
    df_out.to_csv(out_path, index=False)

    print("\n" + "=" * 76)
    print("  CLINICAL BATCH INFERENCE SUMMARY")
    print("=" * 76)
    print(f"  Total Images Processed: {len(results):,}")
    print(f"  Processing Time:        {elapsed:.2f} seconds ({fps:.1f} images/sec)")
    print(f"  Output CSV File:        {out_path.resolve()}")
    print(f"  Data Integrity Check:   PASSED (0 missing, 0 duplicates, 100% ID parity)")
    print("-" * 76)
    print("  TRIAGE DISTRIBUTION:")
    print(f"    • Safe Autonomous Triage (AUTO_TRIAGE): {decision_counts['AUTO_TRIAGE']:4d} ({decision_counts['AUTO_TRIAGE']/len(results)*100:5.1f}%)")
    print(f"    • Dermatologist Referral  (REFER):       {decision_counts['REFER']:4d} ({decision_counts['REFER']/len(results)*100:5.1f}%)")
    print(f"    • Optical Recapture Req.  (RE_IMAGE):    {decision_counts['RE_IMAGE']:4d} ({decision_counts['RE_IMAGE']/len(results)*100:5.1f}%)")
    print("-" * 76)
    print("  DIAGNOSTIC CONDITION BREAKDOWN:")
    for c in CLASSES:
        count = class_counts.get(c, 0)
        pct = (count / max(len(results), 1)) * 100
        print(f"    • {c.upper():5s}: {count:4d} ({pct:5.1f}%)")
    print("=" * 76 + "\n")


if __name__ == "__main__":
    main()
