"""
Deterministic Benchmark & Verification Script: Agents 1, 3, and 4
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Tests:
1. Initialize Agents 1, 3, and 4.
2. Run comprehensive pipeline on 20 stratified evaluation samples from data/raw/Health/eval/metadata.csv
   (covering diverse classes: mel, nv, bcc, akiec, bkl, vasc, df, plus missing demographic edge-cases).
3. Benchmark Agent 1 image quality throughput across all 1,942 images in eval partition.
4. Output detailed per-image diagnostics and full-dataset quality distributions.
"""

import os
import sys
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.config import (
    EVAL_CSV_PATH,
    EVAL_IMG_PATH,
    CLASSES,
    MALIGNANT_CLASSES,
)
from backend.app.agents.quality_agent import ImageQualityAgent
from backend.app.agents.lesion_analysis_agent import LesionAnalysisAgent
from backend.app.agents.context_agent import ContextReasoningAgent


def run_benchmark():
    print("=" * 90)
    print("AGENTIC DERMAGUARD: PHASE 2 CLINICAL CONTRACT & AGENTS 1, 3, 4 VERIFICATION")
    print("=" * 90)

    # 1. Initialize Agents
    print("\n[1/3] Initializing Deterministic Agents...")
    t0 = time.perf_counter()
    agent1 = ImageQualityAgent()
    agent3 = LesionAnalysisAgent()
    agent4 = ContextReasoningAgent()
    init_time = (time.perf_counter() - t0) * 1000
    print(f"  All agents initialized in {init_time:.1f}ms (Priors loaded and cached).")

    # 2. Load Evaluation Metadata
    if not EVAL_CSV_PATH.exists():
        print(f"Error: Evaluation metadata not found at {EVAL_CSV_PATH}")
        return

    df_eval = pd.read_csv(EVAL_CSV_PATH)
    total_eval = len(df_eval)
    print(f"\n[2/3] Loaded Evaluation Split: {total_eval} total records from {EVAL_CSV_PATH.name}")

    # Select 20 stratified diverse samples
    # Ensure representation from each class + missing metadata
    sample_indices = []
    for cls_name in CLASSES:
        cls_rows = df_eval[df_eval["dx"] == cls_name]
        if not cls_rows.empty:
            sample_indices.extend(cls_rows.index[:2].tolist())

    # Add cases with missing age or unknown localization
    missing_age_rows = df_eval[df_eval["age"].isna()]
    if not missing_age_rows.empty:
        sample_indices.extend(missing_age_rows.index[:3].tolist())

    unknown_loc_rows = df_eval[df_eval["localization"] == "unknown"]
    if not unknown_loc_rows.empty:
        sample_indices.extend(unknown_loc_rows.index[:3].tolist())

    # Deduplicate while preserving order and take exactly 20
    seen = set()
    deduped_indices = []
    for idx in sample_indices:
        if idx not in seen:
            seen.add(idx)
            deduped_indices.append(idx)
        if len(deduped_indices) == 20:
            break

    # If fewer than 20, fill with remaining random samples
    if len(deduped_indices) < 20:
        for idx in df_eval.index:
            if idx not in seen:
                seen.add(idx)
                deduped_indices.append(idx)
            if len(deduped_indices) == 20:
                break

    sample_df = df_eval.loc[deduped_indices]

    print("\n" + "=" * 90)
    print("DETAILED 20-SAMPLE CLINICAL EVALUATION MATRIX (Agents 1, 3, 4)")
    print("=" * 90)

    results_table = []
    sample_start_time = time.perf_counter()

    for idx, row in sample_df.iterrows():
        img_id = str(row["image_id"])
        img_file = EVAL_IMG_PATH / f"{img_id}.jpg"
        dx = str(row["dx"])
        age = row["age"]
        sex = row["sex"]
        loc = row["localization"]

        t_row_start = time.perf_counter()

        # Agent 1
        q_out = agent1.evaluate(img_file)

        # Agent 3
        l_out = agent3.evaluate(img_file)

        # Agent 4
        c_out = agent4.evaluate(age=age, sex=sex, localization=loc)

        row_latency = (time.perf_counter() - t_row_start) * 1000

        results_table.append({
            "image_id": img_id,
            "dx": dx,
            "is_malignant": dx in MALIGNANT_CLASSES,
            "demographics": f"{age if not pd.isna(age) else 'NA'}/{sex[:1].upper() if sex else '?'}/{loc[:6]}",
            "A1_status": q_out.status,
            "A1_quality": q_out.quality_score,
            "A1_blur": q_out.blur_score,
            "A1_usable": q_out.is_usable,
            "A3_suspicion": l_out.suspicion_score,
            "A3_label": l_out.suspicion_label,
            "A3_colors": len(l_out.distinct_color_zones),
            "A4_risk": c_out.risk_indicator,
            "A4_mult": c_out.malignancy_prior_multiplier,
            "A4_missing": len(c_out.missing_field_flags),
            "latency_ms": row_latency,
        })

        # Print detailed individual audit for first 4 diverse cases
        if len(results_table) <= 4:
            print(f"\n--- Case {len(results_table)}: {img_id} (True dx: {dx.upper()}) ---")
            print(f"Demographics: Age={age}, Sex={sex}, Localization={loc}")
            print(f"Agent 1 (Quality):    Status={q_out.status} (score={q_out.quality_score:.2f}, blur={q_out.blur_score:.2f}, glare={q_out.glare_ratio*100:.1f}%, obstruct={q_out.obstruction_ratio*100:.1f}%)")
            print(f"                      Reasons: {q_out.reasons}")
            print(f"Agent 3 (Lesion ABCD): Suspicion={l_out.suspicion_score:.2f} [{l_out.suspicion_label}] (A={l_out.asymmetry_score:.2f}, B={l_out.border_irregularity_score:.2f}, C={l_out.color_variation_score:.2f})")
            print(f"                      Colors ({len(l_out.distinct_color_zones)}): {l_out.distinct_color_zones}")
            print(f"                      Evidence: {l_out.feature_evidence[:2]}")
            print(f"Agent 4 (Context):    Prior Risk={c_out.risk_indicator} (Multiplier={c_out.malignancy_prior_multiplier:.2f}x)")
            print(f"                      Flags: {c_out.missing_field_flags if c_out.missing_field_flags else 'None'}")
            print(f"                      Evidence: {c_out.context_evidence[0]}")
            print(f"Combined Processing Latency: {row_latency:.1f}ms")

    # Display 20-sample summary table
    print("\n" + "-" * 90)
    print(f"{'Image ID':<13} {'True Dx':<8} {'Demographics':<14} {'A1 Qual':<8} {'A1 Stat':<8} {'A3 Susp':<8} {'A3 Rating':<11} {'A4 Mult':<8} {'A4 Risk':<8} {'Time(ms)':<8}")
    print("-" * 90)
    for r in results_table:
        print(f"{r['image_id']:<13} {r['dx'].upper():<8} {r['demographics']:<14} {r['A1_quality']:<8.2f} {r['A1_status']:<8} {r['A3_suspicion']:<8.2f} {r['A3_label']:<11} {r['A4_mult']:<8.2f} {r['A4_risk']:<8} {r['latency_ms']:<8.1f}")
    print("-" * 90)

    # 3. High-Throughput Audit of Agent 1 across all 1,942 eval images
    print("\n[3/3] Benchmarking Agent 1 Quality Across Entire 1,942-Image Eval Partition...")
    
    all_img_paths = [EVAL_IMG_PATH / f"{row['image_id']}.jpg" for _, row in df_eval.iterrows()]

    t_eval_start = time.perf_counter()
    # Use ThreadPoolExecutor for concurrent disk I/O and fast OpenCV C++ execution
    with ThreadPoolExecutor(max_workers=8) as executor:
        all_q_results = list(executor.map(agent1.evaluate, all_img_paths))
    eval_elapsed = time.perf_counter() - t_eval_start

    # Tally statuses
    status_counts = {"PASS": 0, "WARN": 0, "FAIL": 0}
    usable_count = 0
    blur_scores = []
    glare_ratios = []
    obstruction_ratios = []

    for res in all_q_results:
        status_counts[res.status] += 1
        if res.is_usable:
            usable_count += 1
        blur_scores.append(res.blur_score)
        glare_ratios.append(res.glare_ratio)
        obstruction_ratios.append(res.obstruction_ratio)

    throughput_fps = total_eval / eval_elapsed
    avg_latency_ms = (eval_elapsed / total_eval) * 1000

    print("\n" + "=" * 90)
    print("AGENT 1 FULL VALIDATION SET (1,942 IMAGES) AUDIT SUMMARY")
    print("=" * 90)
    print(f"Total Images Processed:       {total_eval:,}")
    print(f"Total Processing Time:        {eval_elapsed:.2f} seconds")
    print(f"Overall Throughput:           {throughput_fps:.1f} images/second ({avg_latency_ms:.2f} ms/image)")
    print(f"Usable for ML Inference:      {usable_count:,} / {total_eval:,} ({(usable_count/total_eval)*100:.1f}%)")
    print("\nQuality Status Distribution:")
    for status, count in status_counts.items():
        pct = (count / total_eval) * 100
        print(f"  - {status:<5}: {count:>5} ({pct:>5.1f}%)")

    print("\nMetric Means across Evaluation Cohort:")
    print(f"  - Mean Blur / Sharpness Score:   {np.mean(blur_scores):.3f} (std={np.std(blur_scores):.3f})")
    print(f"  - Mean Specular Glare Ratio:     {np.mean(glare_ratios)*100:.2f}% (std={np.std(glare_ratios)*100:.2f}%)")
    print(f"  - Mean Obstruction (Hair) Ratio: {np.mean(obstruction_ratios)*100:.2f}% (std={np.std(obstruction_ratios)*100:.2f}%)")

    print("\n" + "=" * 90)
    print("VERIFICATION COMPLETED SUCCESSFULLY")
    print("=" * 90)


if __name__ == "__main__":
    run_benchmark()
