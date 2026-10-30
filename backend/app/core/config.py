"""
Core Configuration and Clinical Constants
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)
"""

import os
from pathlib import Path
from typing import Dict, List, Set

# Base Workspace Directory
BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent

# Dataset & Output Paths (both relative strings and absolute Paths)
TRAIN_CSV: str = "data/raw/Health/training/metadata.csv"
TRAIN_IMG_DIR: str = "data/raw/Health/training/images"
EVAL_CSV: str = "data/raw/Health/eval/metadata.csv"
EVAL_IMG_DIR: str = "data/raw/Health/eval/images"
OUTPUT_DIR: str = "backend/outputs"

TRAIN_CSV_PATH: Path = BASE_DIR / TRAIN_CSV
TRAIN_IMG_PATH: Path = BASE_DIR / TRAIN_IMG_DIR
EVAL_CSV_PATH: Path = BASE_DIR / EVAL_CSV
EVAL_IMG_PATH: Path = BASE_DIR / EVAL_IMG_DIR
OUTPUT_PATH: Path = BASE_DIR / OUTPUT_DIR

# Ensure output directory exists
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)

# 7 Canonical Lesion Classes
CLASSES: List[str] = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
CLASS_TO_IDX: Dict[str, int] = {cls_name: idx for idx, cls_name in enumerate(CLASSES)}
IDX_TO_CLASS: Dict[int, str] = {idx: cls_name for idx, cls_name in enumerate(CLASSES)}

# Malignancy Stratification
MALIGNANT_CLASSES: Set[str] = {"mel", "bcc", "akiec"}
BENIGN_CLASSES: Set[str] = {"nv", "bkl", "df", "vasc"}

# Clinical Taxonomy & Lexicon
CLASS_NAMES: Dict[str, str] = {
    "akiec": "Actinic Keratosis / Bowen's Disease",
    "bcc": "Basal Cell Carcinoma",
    "bkl": "Benign Keratosis",
    "df": "Dermatofibroma",
    "mel": "Melanoma",
    "nv": "Melanocytic Nevus",
    "vasc": "Vascular Lesion",
}

CLASS_DESCRIPTIONS: Dict[str, str] = {
    "akiec": "Pre-malignant or early intraepithelial carcinoma (squamous cell lineage). Requires clinical intervention / biopsy.",
    "bcc": "Common malignant epidermal skin cancer arising from basal cells. Locally aggressive, requiring dermatologic excision or Mohs surgery.",
    "bkl": "Benign non-melanocytic epidermal lesion encompassing seborrheic keratosis, solar lentigo, and lichen-planus-like keratosis.",
    "df": "Benign mesenchymal fibrohistiocytic dermal nodule, typically presenting with central dimpling on lateral compression.",
    "mel": "Highly aggressive malignant neoplasm of pigment-producing melanocytes. Critical urgency for early diagnosis and wide surgical excision.",
    "nv": "Benign melanocytic proliferation (common pigmented mole) exhibiting structured architectural symmetry and uniform pigment network.",
    "vasc": "Benign vascular malformation or proliferation (hemangioma, cherry angioma, pyogenic granuloma) characterized by vascular lacunae.",
}

# Image Processing Defaults
STANDARD_IMAGE_HEIGHT: int = 450
STANDARD_IMAGE_WIDTH: int = 600

# Agent 1 Quality Thresholds
QUALITY_THRESHOLDS = {
    "laplacian_var_fail": 30.0,       # Extreme blur
    "laplacian_var_warn": 85.0,       # Moderate softness / borderline blur
    "illumination_underexposed": 40.0,# Extremely dark
    "illumination_overexposed": 235.0,# Severe blowout
    "illumination_low_contrast": 22.0,# Low L standard deviation
    "glare_ratio_fail": 0.18,         # >18% specular flash reflection
    "glare_ratio_warn": 0.08,         # 8-18% noticeable glare
    "obstruction_ratio_fail": 0.28,   # >28% covered in heavy hair/ruler markings
    "obstruction_ratio_warn": 0.12,   # 12-28% noticeable hair presence
    "vignette_ratio_max": 0.25,       # Vignette border proportion
}

# Agent 3 Lesion Analysis ABCD Weights
ABCD_WEIGHTS = {
    "asymmetry": 0.35,
    "border": 0.30,
    "color": 0.35,
}

# Agent 4 Context Risk Thresholds
CONTEXT_MALIGNANCY_BASELINE: float = 0.1944  # Baseline training malignancy rate (1505 / 7762)
