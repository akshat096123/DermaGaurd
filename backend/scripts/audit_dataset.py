"""
Dataset Discovery & Hardware Audit Script
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Responsibilities:
1. Verify PyTorch version and Apple Silicon MPS backend availability.
2. Discover HAM10000 CSV files and image folders across the workspace.
3. Audit metadata schemas, row counts, class distributions (dx), missing demographics.
4. Verify 1-to-1 match between metadata image_id entries and physical .jpg files on disk.
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np


def audit_hardware():
    print("=" * 80)
    print("1. HARDWARE & ACCELERATOR AUDIT (Apple Silicon M4)")
    print("=" * 80)
    
    try:
        import torch
        print(f"PyTorch Version:         {torch.__version__}")
        mps_built = torch.backends.mps.is_built()
        mps_available = torch.backends.mps.is_available()
        print(f"MPS Built in Binary:     {mps_built}")
        print(f"MPS Device Available:    {mps_available}")

        if mps_available:
            device = torch.device("mps")
            # Quick tensor allocation on MPS to verify hardware functionality
            x = torch.ones((3, 3), device=device)
            y = x * 2.0
            print(f"MPS Tensor Sanity Check: SUCCESS (Allocated and multiplied on {device})")
        else:
            print("WARNING: MPS backend is NOT available. Falling back to CPU.")
    except ImportError:
        print("PyTorch is not installed in the active environment.")
    except Exception as e:
        print(f"Error testing MPS backend: {e}")
    print()


def find_ham10000_datasets(search_roots: List[Path]) -> List[Tuple[Path, Path]]:
    """
    Search directory trees for CSV files with HAM10000 schema:
    [image_id, lesion_id, dx, age, sex, localization]
    and associate them with their respective image directories.
    """
    expected_cols = {"image_id", "lesion_id", "dx", "age", "sex", "localization"}
    found_datasets = []

    for root in search_roots:
        if not root.exists():
            continue
        for csv_path in root.rglob("*.csv"):
            # Avoid scanning inside virtualenvs or hidden directories
            parts = csv_path.parts
            if any(p.startswith(".") or p in {"venv", ".venv", "site-packages", "node_modules"} for p in parts):
                continue
            try:
                # Read header
                df_head = pd.read_csv(csv_path, nrows=5)
                cols = set(df_head.columns)
                if expected_cols.issubset(cols):
                    # Locate corresponding images directory
                    # Check parent/images, parent, or subfolder
                    img_dir = None
                    candidate_dirs = [
                        csv_path.parent / "images",
                        csv_path.parent / "img",
                        csv_path.parent,
                    ]
                    for c_dir in candidate_dirs:
                        if c_dir.exists() and c_dir.is_dir():
                            # Check if it contains .jpg files
                            sample_jpgs = list(c_dir.glob("*.jpg"))
                            if sample_jpgs:
                                img_dir = c_dir
                                break
                    found_datasets.append((csv_path, img_dir))
            except Exception:
                continue

    # Deduplicate by resolved CSV path
    seen = set()
    deduped = []
    for csv_p, img_p in found_datasets:
        r_p = csv_p.resolve()
        if r_p not in seen:
            seen.add(r_p)
            deduped.append((csv_p, img_p))

    return deduped


def audit_single_split(csv_path: Path, img_dir: Optional[Path], workspace_root: Path):
    rel_csv = os.path.relpath(csv_path, workspace_root)
    abs_csv = csv_path.resolve()

    print("-" * 80)
    print(f"DATASET SPLIT AUDIT: {csv_path.parent.name.upper()} ({rel_csv})")
    print("-" * 80)
    print(f"Relative CSV Path:  {rel_csv}")
    print(f"Absolute CSV Path:  {abs_csv}")
    print(f"File Size:          {csv_path.stat().st_size:,} bytes")

    if img_dir:
        rel_img = os.path.relpath(img_dir, workspace_root)
        abs_img = img_dir.resolve()
        print(f"Relative Image Dir: {rel_img}")
        print(f"Absolute Image Dir: {abs_img}")
    else:
        print("Associated Image Dir: NOT FOUND")

    df = pd.read_csv(csv_path)
    total_rows = len(df)
    print(f"\nTotal Row Count:    {total_rows:,}")
    print(f"Columns ({len(df.columns)}):     {list(df.columns)}")
    print(f"Unique Lesions:     {df['lesion_id'].nunique():,} unique lesion_ids")
    print(f"Unique Images:      {df['image_id'].nunique():,} unique image_ids")

    # Class distribution
    print("\n--- Class Distribution (dx) ---")
    class_counts = df["dx"].value_counts()
    for dx_class, count in class_counts.items():
        pct = (count / total_rows) * 100
        print(f"  {dx_class:<8}: {count:>5} ({pct:>5.1f}%)")

    # Demographic Missingness Analysis
    print("\n--- Demographics & Missingness Audit ---")
    demographic_cols = ["age", "sex", "localization"]
    for col in demographic_cols:
        if col in df.columns:
            # Check NaN
            nan_count = int(df[col].isna().sum())
            non_null_series = df[col].dropna().astype(str).str.strip().str.lower()
            unknown_count = int(non_null_series.isin(["unknown", "nan", "null", "none", ""]).sum())
            total_missing = nan_count + unknown_count
            pct_missing = (total_missing / total_rows) * 100

            unique_vals = [v for v in df[col].dropna().unique() if str(v).lower() not in ["unknown", "nan", "null", "none", ""]]
            print(f"  Column '{col}':")
            print(f"    - Null / NaN:     {nan_count}")
            print(f"    - 'unknown' text: {unknown_count}")
            print(f"    - Total Missing:  {total_missing} ({pct_missing:.2f}%)")
            print(f"    - Distinct Values ({len(unique_vals)}): {unique_vals[:8]}{'...' if len(unique_vals) > 8 else ''}")

    # Image Disk Verification
    print("\n--- Image Integrity on Disk ---")
    if img_dir and img_dir.exists():
        files_on_disk = set(f.name for f in img_dir.glob("*.jpg"))
        expected_files = set(df["image_id"] + ".jpg")

        matched = expected_files.intersection(files_on_disk)
        missing_from_disk = expected_files - files_on_disk
        extra_on_disk = files_on_disk - expected_files

        print(f"  Total .jpg files in folder: {len(files_on_disk):,}")
        print(f"  Expected from CSV metadata: {len(expected_files):,}")
        print(f"  Matched on Disk:            {len(matched):,} / {len(expected_files):,} ({(len(matched)/len(expected_files))*100:.1f}%)")
        print(f"  Missing from Disk:          {len(missing_from_disk)}")
        if missing_from_disk:
            print(f"    Examples missing: {list(missing_from_disk)[:5]}")
        print(f"  Extra unindexed images:     {len(extra_on_disk)}")
    else:
        print("  SKIPPED: Image directory not available on disk.")
    print()


def main():
    workspace_root = Path(__file__).resolve().parent.parent.parent

    # 1. Hardware audit
    audit_hardware()

    # 2. Dataset discovery
    print("=" * 80)
    print("2. HAM10000 DATASET DISCOVERY")
    print("=" * 80)
    search_dirs = [workspace_root, workspace_root / "data"]
    datasets = find_ham10000_datasets(search_dirs)

    if not datasets:
        print("No extracted HAM10000 CSV files found in workspace.")
        print("Checking for raw archives in workspace...")
        zips = list(workspace_root.glob("*.zip"))
        for z in zips:
            print(f"  Found Archive: {z.name} ({z.stat().st_size:,} bytes)")
        return

    print(f"Found {len(datasets)} HAM10000 metadata partition(s):")
    for csv_p, img_p in datasets:
        print(f"  - CSV: {csv_p.relative_to(workspace_root)} | Images: {img_p.relative_to(workspace_root) if img_p else 'N/A'}")
    print()

    # 3. Audit each split
    for csv_p, img_p in datasets:
        audit_single_split(csv_p, img_p, workspace_root)

    print("=" * 80)
    print("AUDIT COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
