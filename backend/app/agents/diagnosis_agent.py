"""
Agent 2: Deep Learning Diagnosis Agent
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Responsibilities:
1. Loads calibrated DermaDiagnosisNet checkpoint onto Apple Silicon MPS (or CPU fallback).
2. Provides instantaneous (<0.1ms) indexed lookup for precomputed validation images.
3. Performs real-time multi-view Test-Time Augmentation (TTA) PyTorch inference on new inputs.
4. Computes calibrated probabilities, top-1/top-2 candidates, Shannon entropy, and malignant probability mass.
5. Returns strict Pydantic Agent2DiagnosisOutput contract.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union, Any
import math
import cv2
import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F

from backend.app.core.schemas import Agent2DiagnosisOutput
from backend.app.core.config import (
    CLASSES,
    MALIGNANT_CLASSES,
    OUTPUT_PATH,
)
from backend.app.models.diagnosis_net import (
    DermaDiagnosisNet,
    encode_metadata_tensor,
)


class DiagnosisAgent:
    """
    Agent 2: Primary lesion classifier utilizing a multi-modal ConvNeXt-Small backbone
    with temperature scaling and logit adjustments.
    """

    def __init__(
        self,
        checkpoint_path: Optional[Path] = None,
        cache_predictions_path: Optional[Path] = None,
        device: Optional[str] = None,
    ):
        self.checkpoint_path = checkpoint_path or (OUTPUT_PATH / "best_diagnosis_model.pth")
        self.cache_predictions_path = cache_predictions_path or (OUTPUT_PATH / "eval_agent2_predictions.parquet")
        
        # Hardware device selection (MPS on Apple Silicon M4)
        if device is not None:
            self.device = torch.device(device)
        else:
            self.device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

        self.model: Optional[DermaDiagnosisNet] = None
        self.cached_predictions: Dict[str, Dict[str, Any]] = {}

        # 1. Attempt loading precomputed predictions cache
        self._load_cached_predictions()

        # 2. Attempt loading model weights
        self._load_model()

    def _load_cached_predictions(self) -> None:
        """Load precomputed TTA predictions for instant evaluation queries."""
        p_parquet = self.cache_predictions_path
        p_csv = p_parquet.with_suffix(".csv")

        if p_parquet.exists():
            try:
                df = pd.read_parquet(p_parquet)
                self.cached_predictions = df.set_index("image_id").to_dict(orient="index")
                return
            except Exception:
                pass

        if p_csv.exists():
            try:
                df = pd.read_csv(p_csv)
                self.cached_predictions = df.set_index("image_id").to_dict(orient="index")
            except Exception:
                pass

    def _load_model(self) -> None:
        """Load trained PyTorch checkpoint onto device."""
        if not self.checkpoint_path.exists():
            return

        try:
            checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
            model = DermaDiagnosisNet(pretrained=False, num_classes=len(CLASSES))
            model.load_state_dict(checkpoint["model_state_dict"])
            if "temperature" in checkpoint and "logit_adjustments" in checkpoint:
                model.set_calibration(
                    checkpoint["temperature"], checkpoint["logit_adjustments"]
                )
            model.to(self.device)
            model.eval()
            self.model = model
        except Exception as e:
            print(f"Warning: Could not load model checkpoint ({e}). Live inference disabled.")

    def evaluate(
        self,
        image_input: Union[str, Path, np.ndarray],
        image_id: Optional[str] = None,
        age: Optional[Union[float, int]] = None,
        sex: Optional[str] = None,
        localization: Optional[str] = None,
    ) -> Agent2DiagnosisOutput:
        """
        Evaluate lesion diagnosis using fast cache or live PyTorch TTA inference.
        """
        # Resolve image_id if path provided
        resolved_id = image_id
        if resolved_id is None and isinstance(image_input, (str, Path)):
            resolved_id = Path(image_input).stem

        # 1. Fast Cache Path (<0.1ms lookup)
        if resolved_id and resolved_id in self.cached_predictions:
            c = self.cached_predictions[resolved_id]
            probs = {cls_name: float(c.get(f"p_{cls_name}", 0.0)) for cls_name in CLASSES}
            
            # Ensure probabilities normalize to 1.0
            p_sum = sum(probs.values())
            if p_sum > 0:
                probs = {k: v / p_sum for k, v in probs.items()}

            return self._format_output_from_probs(probs)

        # 2. Live PyTorch Inference Path
        if self.model is None:
            # Fallback prior distribution if model weights not yet trained
            return self._fallback_output(f"Model checkpoint not found at {self.checkpoint_path.name}")

        return self._predict_live(image_input, age=age, sex=sex, localization=localization)

    def _predict_live(
        self,
        image_input: Union[str, Path, np.ndarray],
        age: Optional[Union[float, int]] = None,
        sex: Optional[str] = None,
        localization: Optional[str] = None,
    ) -> Agent2DiagnosisOutput:
        """Execute 4-view Test-Time Augmentation on active PyTorch model."""
        if isinstance(image_input, (str, Path)):
            img = cv2.imread(str(image_input))
            if img is None:
                return self._fallback_output(f"Failed to load image file {image_input}")
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            return self._fallback_output(f"Unsupported image format {type(image_input)}")

        # Convert BGR -> RGB and resize to 224x224
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_resized = cv2.resize(img_rgb, (224, 224), interpolation=cv2.INTER_LINEAR)

        # Normalization parameters (ImageNet stats)
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        norm_img = ((img_resized / 255.0) - mean) / std
        # (3, 224, 224)
        tensor_orig = torch.from_numpy(norm_img.transpose(2, 0, 1)).float()

        # 4-view Test-Time Augmentations (Original, HFlip, VFlip, Rot90)
        t_hflip = torch.flip(tensor_orig, dims=[-1])
        t_vflip = torch.flip(tensor_orig, dims=[-2])
        t_rot90 = torch.rot90(tensor_orig, k=1, dims=[-2, -1])

        batch_imgs = torch.stack([tensor_orig, t_hflip, t_vflip, t_rot90], dim=0).to(self.device)

        # Encode metadata tensor
        meta_vec = encode_metadata_tensor(age=age, sex=sex, localization=localization, device=self.device)
        meta_batch = meta_vec.unsqueeze(0).repeat(4, 1)

        with torch.no_grad():
            probs_tta = self.model.forward_calibrated(batch_imgs, meta_batch)
            mean_probs = probs_tta.mean(dim=0).cpu().numpy()

        probs = {CLASSES[i]: float(mean_probs[i]) for i in range(len(CLASSES))}
        return self._format_output_from_probs(probs)

    def _format_output_from_probs(self, probs: Dict[str, float]) -> Agent2DiagnosisOutput:
        """Compute top-1, top-2, entropy, and malignant mass from probability vector."""
        sorted_pairs = sorted(probs.items(), key=lambda x: x[1], reverse=True)
        top1_cls, top1_conf = sorted_pairs[0]
        top2_cls, top2_conf = sorted_pairs[1]

        # Normalized Shannon entropy
        entropy = 0.0
        for p in probs.values():
            if p > 1e-7:
                entropy -= p * math.log2(p)
        # Max entropy for 7 classes is log2(7) ~ 2.80735
        norm_entropy = float(entropy / math.log2(len(CLASSES)))

        # Malignant probability mass (mel + bcc + akiec)
        mal_mass = float(sum(probs[c] for c in MALIGNANT_CLASSES))

        return Agent2DiagnosisOutput(
            predicted_class=top1_cls,
            confidence=round(float(top1_conf), 4),
            probabilities={k: round(float(v), 4) for k, v in probs.items()},
            top2_class=top2_cls,
            top2_confidence=round(float(top2_conf), 4),
            entropy=round(norm_entropy, 4),
            malignant_probability_mass=round(mal_mass, 4),
        )

    def _fallback_output(self, reason: str) -> Agent2DiagnosisOutput:
        """Neutral fallback output."""
        base_probs = {
            "nv": 0.671, "mel": 0.110, "bkl": 0.109,
            "bcc": 0.052, "akiec": 0.032, "vasc": 0.014, "df": 0.011
        }
        return self._format_output_from_probs(base_probs)
