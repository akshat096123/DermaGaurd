import os
os.environ["TQDM_DISABLE"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, WeightedRandomSampler
import timm
import pandas as pd
import numpy as np
import json
import gc
from pathlib import Path

print("=== STARTING MEMORY-SAFE TRAINING & EVALUATION ===")
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Using device: {device}")

# Load metadata
train_df = pd.read_csv("data/raw/Health/training/metadata.csv")
eval_df = pd.read_csv("data/raw/Health/eval/metadata.csv")
classes = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
class_to_idx = {c: i for i, c in enumerate(classes)}

print(f"Loaded train samples: {len(train_df)}, eval samples: {len(eval_df)}")
print("=== TRAINING COMPLETE PIPELINE READY ===")
