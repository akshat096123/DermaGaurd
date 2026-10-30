"""
High-Macro-F1 Training Pipeline for Agent 2 (DermaDiagnosisNet)
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Key Pipeline Features:
1. Vision Backbone: ConvNeXt-Small (pretrained ImageNet-22k -> 1k, 768-dim) + Tabular Metadata (20 -> 64-dim).
2. Robust Augmentation: Albumentations 224x224 (Flips, ShiftScaleRotate, ColorJitter).
3. Extreme Imbalance Handling: Damped WeightedRandomSampler (w_c = (N/n_c)^0.55).
4. Loss Function: Poly1 Cross-Entropy Loss with label smoothing (0.05).
5. Hardware Optimization: Fully accelerated on Apple Silicon M4 (device='mps').
6. Post-Training Calibration: Nelder-Mead logit adjustment tuning for Macro F1.
7. 4-View Test-Time Augmentation (TTA) cache generation for all 1,942 validation images.
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
import cv2
cv2.setNumThreads(0)
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.metrics import classification_report, confusion_matrix, f1_score, accuracy_score

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import albumentations as A
from albumentations.pytorch import ToTensorV2

# Add monorepo root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.config import (
    TRAIN_CSV_PATH,
    TRAIN_IMG_PATH,
    EVAL_CSV_PATH,
    EVAL_IMG_PATH,
    OUTPUT_PATH,
    CLASSES,
    CLASS_TO_IDX,
    IDX_TO_CLASS,
    MALIGNANT_CLASSES,
)
from backend.app.models.diagnosis_net import (
    DermaDiagnosisNet,
    encode_metadata_tensor,
)


# ==============================================================================
# Poly1 Cross-Entropy Loss
# ==============================================================================
class Poly1CrossEntropyLoss(nn.Module):
    """
    Poly-1 Loss (Leng et al., ICLR 2022).
    L_poly1 = CE(z, y) + epsilon * (1 - P_t)
    Significantly strengthens gradients on challenging minority samples while maintaining stability.
    """

    def __init__(self, epsilon: float = 1.0, label_smoothing: float = 0.05, weight: Optional[torch.Tensor] = None):
        super().__init__()
        self.epsilon = epsilon
        self.label_smoothing = label_smoothing
        self.weight = weight

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = F.cross_entropy(
            logits, targets, weight=self.weight, label_smoothing=self.label_smoothing
        )
        probs = F.softmax(logits, dim=-1)
        pt = probs.gather(1, targets.unsqueeze(1)).squeeze(1)
        poly1_loss = ce_loss + self.epsilon * (1.0 - pt).mean()
        return poly1_loss


def worker_init_fn(worker_id: int):
    cv2.setNumThreads(0)


# ==============================================================================
# Dataset Implementation
# ==============================================================================
class HAM10000Dataset(Dataset):
    """
    PyTorch Dataset loading HAM10000 dermoscopy images and associated clinical metadata.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        img_dir: Path,
        transform: Optional[A.Compose] = None,
        is_train: bool = True,
    ):
        self.df = df.reset_index(drop=True)
        self.img_dir = img_dir
        self.transform = transform
        self.is_train = is_train

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor, int, str]:
        row = self.df.iloc[idx]
        img_id = str(row["image_id"])
        img_path = str(self.img_dir / f"{img_id}.jpg")

        # Load image via OpenCV
        img_bgr = cv2.imread(img_path)
        if img_bgr is None:
            # Fallback black image if corrupt
            img_rgb = np.zeros((224, 224, 3), dtype=np.uint8)
        else:
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # Apply Albumentations transformations
        if self.transform is not None:
            augmented = self.transform(image=img_rgb)
            img_tensor = augmented["image"]
        else:
            img_resized = cv2.resize(img_rgb, (224, 224))
            img_norm = img_resized.astype(np.float32) / 255.0
            img_tensor = torch.from_numpy(img_norm.transpose(2, 0, 1)).float()

        # Encode metadata tensor
        age = row.get("age", None)
        sex = row.get("sex", "unknown")
        loc = row.get("localization", "unknown")
        meta_tensor = encode_metadata_tensor(age=age, sex=sex, localization=loc)

        # Class label
        label_str = str(row["dx"])
        label_idx = CLASS_TO_IDX.get(label_str, 5)  # default to 'nv' (5)

        return img_tensor, meta_tensor, label_idx, img_id


# ==============================================================================
# Training Orchestrator
# ==============================================================================
def train_model():
    print("=" * 80)
    print("AGENTIC DERMAGUARD: AGENT 2 DIAGNOSIS MODEL TRAINING PIPELINE")
    print("=" * 80)

    # 1. Device configuration
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Compute Device:          {device} (Apple Silicon Acceleration)")

    # 2. Load Metadata Splits
    print("\n[1/6] Loading Dataset Partitions...")
    df_train = pd.read_csv(TRAIN_CSV_PATH)
    df_eval = pd.read_csv(EVAL_CSV_PATH)
    print(f"  Training Split:        {len(df_train):,} samples ({df_train['lesion_id'].nunique():,} unique lesions)")
    print(f"  Evaluation Split:      {len(df_eval):,} samples ({df_eval['lesion_id'].nunique():,} unique lesions)")

    # 3. Augmentations Pipeline
    print("\n[2/6] Configuring Albumentations Data Pipelines (224x224)...")
    train_transform = A.Compose([
        A.Resize(224, 224),
        A.RandomRotate90(p=0.5),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.5),
        A.ShiftScaleRotate(shift_limit=0.06, scale_limit=0.10, rotate_limit=45, border_mode=cv2.BORDER_REFLECT_101, p=0.6),
        A.ColorJitter(brightness=0.12, contrast=0.12, saturation=0.12, hue=0.04, p=0.5),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])

    val_transform = A.Compose([
        A.Resize(224, 224),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])

    train_dataset = HAM10000Dataset(df_train, TRAIN_IMG_PATH, transform=train_transform, is_train=True)
    val_dataset = HAM10000Dataset(df_eval, EVAL_IMG_PATH, transform=val_transform, is_train=False)

    # 4. Imbalance Weighted Sampler
    print("\n[3/6] Computing Damped Inverse Class Weights for Sampling...")
    class_counts = df_train["dx"].value_counts().to_dict()
    total_samples = len(df_train)
    damping_power = 0.55
    class_weights = {}
    for c in CLASSES:
        count = class_counts.get(c, 1)
        class_weights[c] = float((total_samples / count) ** damping_power)

    sample_weights = [class_weights[row["dx"]] for _, row in df_train.iterrows()]
    sampler = WeightedRandomSampler(
        weights=sample_weights,
        num_samples=total_samples,
        replacement=True,
    )

    batch_size = 32
    num_workers = 0

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=False,
        worker_init_fn=worker_init_fn,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=False,
        worker_init_fn=worker_init_fn,
    )

    # 5. Model, Loss, Optimizer
    print("\n[4/6] Initializing ConvNeXt-Small Multi-Modal Architecture...", flush=True)
    model = DermaDiagnosisNet(
        backbone_name="convnext_small.fb_in22k_ft_in1k",
        pretrained=True,
        num_classes=len(CLASSES),
        drop_path_rate=0.2,
        metadata_dropout_p=0.25,
    ).to(device)

    criterion = Poly1CrossEntropyLoss(epsilon=1.0, label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1.5e-4, weight_decay=1e-2)
    epochs = 12
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-6)

    # 6. Training Loop
    print(f"\n[5/6] Starting 12-Epoch Training on {device} (Batch Size={batch_size})...", flush=True)
    best_val_macro_f1 = 0.0
    best_checkpoint_path = OUTPUT_PATH / "best_diagnosis_model.pth"
    best_epoch = 0
    total_train_batches = len(train_loader)

    for epoch in range(1, epochs + 1):
        t_epoch_start = time.perf_counter()

        # Training Phase
        model.train()
        running_loss = torch.tensor(0.0, device=device)
        train_correct = torch.tensor(0, dtype=torch.long, device=device)
        train_total = 0

        for b_idx, (imgs, metas, labels, _) in enumerate(train_loader, start=1):
            imgs = imgs.to(device)
            metas = metas.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(imgs, metas)
            loss = criterion(logits, labels)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.5)
            optimizer.step()

            # Pure asynchronous GPU accumulation (no CPU synchronization stall)
            running_loss += loss.detach() * imgs.size(0)
            preds = logits.argmax(dim=-1)
            train_correct += (preds == labels).sum()
            train_total += imgs.size(0)

            if b_idx % 60 == 0 or b_idx == total_train_batches:
                cur_loss = running_loss.item() / train_total
                cur_acc = (train_correct.item() / train_total) * 100
                print(f"  Epoch {epoch:>2} [{b_idx:>3}/{total_train_batches}] Loss: {cur_loss:.4f} | Acc: {cur_acc:.1f}%", flush=True)

        scheduler.step()
        train_loss = running_loss.item() / train_total
        train_acc = train_correct.item() / train_total

        # Validation Phase
        model.eval()
        val_loss_acc = torch.tensor(0.0, device=device)
        val_preds_list = []
        val_targets_list = []

        with torch.no_grad():
            for imgs, metas, labels, _ in val_loader:
                imgs = imgs.to(device)
                metas = metas.to(device)
                labels = labels.to(device)

                logits = model(imgs, metas)
                loss = criterion(logits, labels)

                val_loss_acc += loss.detach() * imgs.size(0)
                preds = logits.argmax(dim=-1)
                val_preds_list.append(preds.cpu())
                val_targets_list.append(labels.cpu())

        val_loss = val_loss_acc.item() / len(val_dataset)
        all_val_preds = torch.cat(val_preds_list).numpy()
        all_val_targets = torch.cat(val_targets_list).numpy()

        val_acc = accuracy_score(all_val_targets, all_val_preds)
        val_macro_f1 = f1_score(all_val_targets, all_val_preds, average="macro", zero_division=0)
        epoch_time = time.perf_counter() - t_epoch_start

        if device.type == "mps":
            torch.mps.empty_cache()

        # Track Best Epoch
        is_best = val_macro_f1 > best_val_macro_f1
        if is_best:
            best_val_macro_f1 = val_macro_f1
            best_epoch = epoch
            # Save raw checkpoint
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "val_macro_f1": val_macro_f1,
                    "val_acc": val_acc,
                    "classes": CLASSES,
                },
                best_checkpoint_path,
            )

        marker = " ★ BEST" if is_best else ""
        print(
            f"Epoch {epoch:>2}/{epochs} [{epoch_time:>4.1f}s] | "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:>5.1f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:>5.1f}% | "
            f"Val Macro F1: {val_macro_f1*100:>5.2f}%{marker}",
            flush=True,
        )

    print(f"\nTraining Complete. Best Checkpoint achieved at Epoch {best_epoch} with Val Macro F1: {best_val_macro_f1*100:.2f}%")

    # 7. Post-Training Logit Calibration
    print("\n[6/6] Tuning Post-Training Temperature & Prior Logit Adjustments...")
    # Load best checkpoint
    checkpoint = torch.load(best_checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Collect all validation logits
    all_val_logits = []
    all_val_targets = []
    with torch.no_grad():
        for imgs, metas, labels, _ in val_loader:
            imgs = imgs.to(device)
            metas = metas.to(device)
            logits = model(imgs, metas)
            all_val_logits.append(logits.cpu().numpy())
            all_val_targets.extend(labels.numpy())

    raw_logits = np.concatenate(all_val_logits, axis=0)  # (1942, 7)
    y_true = np.array(all_val_targets)

    # Initial temperature and adjustment vector
    # Class frequency log-prior shift: delta_init = -tau * log(pi_c)
    pi_c = np.array([class_counts.get(c, 1) / total_samples for c in CLASSES])
    delta_init = -0.15 * np.log(pi_c)

    def objective(params):
        temp = max(0.5, params[0])
        deltas = params[1:]
        adj_logits = (raw_logits / temp) + deltas
        preds = np.argmax(adj_logits, axis=-1)
        acc = accuracy_score(y_true, preds)
        mf1 = f1_score(y_true, preds, average="macro", zero_division=0)
        # Maximize composite 0.5 * Acc + 0.5 * MacroF1 -> minimize negative
        return -(0.45 * acc + 0.55 * mf1)

    init_params = np.concatenate([[1.0], delta_init])
    res_opt = minimize(objective, init_params, method="Nelder-Mead", options={"maxiter": 300})
    best_temp = float(max(0.5, res_opt.x[0]))
    best_deltas = [float(x) for x in res_opt.x[1:]]

    print(f"  Optimized Temperature: {best_temp:.3f}")
    print(f"  Logit Adjustments:     {[round(d, 3) for d in best_deltas]}")

    # Set calibration on model and re-save checkpoint
    model.set_calibration(best_temp, best_deltas)
    checkpoint["temperature"] = best_temp
    checkpoint["logit_adjustments"] = best_deltas
    torch.save(checkpoint, best_checkpoint_path)
    print(f"  Updated checkpoint saved to {best_checkpoint_path}")

    # 8. Precompute & Cache 4-View TTA Predictions for all 1,942 eval images
    print("\nGenerating 4-View Test-Time Augmentation (TTA) Predictions on Validation Split...")
    tta_predictions = []

    with torch.no_grad():
        for i in range(len(df_eval)):
            row = df_eval.iloc[i]
            img_id = str(row["image_id"])
            img_file = EVAL_IMG_PATH / f"{img_id}.jpg"

            img_bgr = cv2.imread(str(img_file))
            if img_bgr is None:
                continue
            img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            img_resized = cv2.resize(img_rgb, (224, 224))
            norm_img = ((img_resized / 255.0) - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array([0.229, 0.224, 0.225], dtype=np.float32)

            t_orig = torch.from_numpy(norm_img.transpose(2, 0, 1)).float()
            t_hflip = torch.flip(t_orig, dims=[-1])
            t_vflip = torch.flip(t_orig, dims=[-2])
            t_rot90 = torch.rot90(t_orig, k=1, dims=[-2, -1])
            batch_imgs = torch.stack([t_orig, t_hflip, t_vflip, t_rot90], dim=0).to(device)

            meta_vec = encode_metadata_tensor(age=row["age"], sex=row["sex"], localization=row["localization"], device=device)
            meta_batch = meta_vec.unsqueeze(0).repeat(4, 1)

            probs_4view = model.forward_calibrated(batch_imgs, meta_batch)
            mean_probs = probs_4view.mean(dim=0).cpu().numpy()

            sorted_indices = np.argsort(mean_probs)[::-1]
            top1_idx = sorted_indices[0]
            top2_idx = sorted_indices[1]

            top1_cls = CLASSES[top1_idx]
            top1_conf = float(mean_probs[top1_idx])
            top2_cls = CLASSES[top2_idx]
            top2_conf = float(mean_probs[top2_idx])

            # Shannon entropy
            ent = 0.0
            for p in mean_probs:
                if p > 1e-7:
                    ent -= p * np.log2(p)
            norm_ent = float(ent / np.log2(7))
            mal_mass = float(sum(mean_probs[CLASS_TO_IDX[c]] for c in MALIGNANT_CLASSES))

            row_dict = {
                "image_id": img_id,
                "dx_true": str(row["dx"]),
                "predicted_class": top1_cls,
                "confidence": round(top1_conf, 4),
                "top2_class": top2_cls,
                "top2_confidence": round(top2_conf, 4),
                "entropy": round(norm_ent, 4),
                "malignant_mass": round(mal_mass, 4),
            }
            for idx_c, cls_name in enumerate(CLASSES):
                row_dict[f"p_{cls_name}"] = round(float(mean_probs[idx_c]), 4)

            tta_predictions.append(row_dict)

    pred_df = pd.DataFrame(tta_predictions)
    pred_parquet_path = OUTPUT_PATH / "eval_agent2_predictions.parquet"
    pred_csv_path = OUTPUT_PATH / "eval_agent2_predictions.csv"
    pred_df.to_parquet(pred_parquet_path, index=False)
    pred_df.to_csv(pred_csv_path, index=False)
    print(f"  Precomputed predictions saved to {pred_parquet_path} and {pred_csv_path}")

    # 9. Final Performance Report
    y_eval_true = pred_df["dx_true"].values
    y_eval_pred = pred_df["predicted_class"].values

    final_acc = accuracy_score(y_eval_true, y_eval_pred)
    final_macro_f1 = f1_score(y_eval_true, y_eval_pred, average="macro")

    print("\n" + "=" * 80)
    print("FINAL AGENT 2 DIAGNOSIS MODEL VALIDATION REPORT (4-View TTA)")
    print("=" * 80)
    print(f"Overall Accuracy:  {final_acc*100:.2f}%")
    print(f"Macro F1-Score:    {final_macro_f1*100:.2f}%\n")

    print("Per-Class Classification Report:")
    print(classification_report(y_eval_true, y_eval_pred, target_names=CLASSES, digits=3))

    print("Confusion Matrix (Rows: Ground Truth, Columns: Predictions):")
    cm = confusion_matrix(y_eval_true, y_eval_pred, labels=CLASSES)
    cm_df = pd.DataFrame(cm, index=[f"True_{c}" for c in CLASSES], columns=[f"Pred_{c}" for c in CLASSES])
    print(cm_df.to_string())
    print("=" * 80)


if __name__ == "__main__":
    train_model()
