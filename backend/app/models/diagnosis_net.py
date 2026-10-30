"""
Multi-Modal Dermatologic Vision + Metadata Neural Network (Agent 2)
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Architecture:
1. Vision Backbone: ConvNeXt-Small (pretrained on ImageNet-22k fine-tuned on 1k), 768-dim features.
2. Tabular Metadata Branch: 2-layer MLP (20 -> 64) with Metadata Dropout (p=0.25) for missingness robustness.
3. Late-Fusion Classifier: 832-dim concatenated representation -> LayerNorm -> Dropout(0.3) -> 7 classes.
4. Post-Training Logit Calibration: Integrated temperature scaling and prior shift adjustment.
"""

from typing import Dict, List, Optional, Tuple, Union, Any
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import timm

from backend.app.core.config import CLASSES


# Canonical demographic categories for stable one-hot encoding
SEX_CATEGORIES: List[str] = ["male", "female", "unknown"]
LOCALIZATION_CATEGORIES: List[str] = [
    "abdomen",
    "acral",
    "back",
    "chest",
    "ear",
    "face",
    "foot",
    "genital",
    "hand",
    "lower extremity",
    "neck",
    "scalp",
    "trunk",
    "upper extremity",
    "unknown",
]

# Total metadata input feature dimension: 2 (age + missing_flag) + 3 (sex) + 15 (loc) = 20
METADATA_DIM: int = 2 + len(SEX_CATEGORIES) + len(LOCALIZATION_CATEGORIES)


def encode_metadata_tensor(
    age: Optional[Union[float, int]],
    sex: Optional[str],
    localization: Optional[str],
    device: Optional[torch.device] = None,
) -> torch.Tensor:
    """
    Encode demographic metadata into a normalized 20-dimensional float tensor.
    Shape: (1, 20) or (20,)
    """
    vec = [0.0] * METADATA_DIM

    # 1. Age encoding (Normalized [0, 1] with missing indicator)
    if age is None or (isinstance(age, float) and (age != age or age < 0)):
        vec[0] = 0.5  # Mean population imputation
        vec[1] = 1.0  # Missing age indicator = 1.0
    else:
        try:
            val = float(age)
            vec[0] = float(min(1.0, max(0.0, val / 100.0)))
            vec[1] = 0.0  # Missing age indicator = 0.0
        except (ValueError, TypeError):
            vec[0] = 0.5
            vec[1] = 1.0

    # 2. Sex one-hot encoding (dim 2 to 4)
    clean_sex = str(sex).strip().lower() if sex is not None else "unknown"
    if clean_sex not in SEX_CATEGORIES:
        clean_sex = "unknown"
    sex_idx = SEX_CATEGORIES.index(clean_sex)
    vec[2 + sex_idx] = 1.0

    # 3. Localization one-hot encoding (dim 5 to 19)
    clean_loc = str(localization).strip().lower() if localization is not None else "unknown"
    if clean_loc not in LOCALIZATION_CATEGORIES:
        clean_loc = "unknown"
    loc_idx = LOCALIZATION_CATEGORIES.index(clean_loc)
    vec[5 + loc_idx] = 1.0

    tensor = torch.tensor(vec, dtype=torch.float32)
    if device is not None:
        tensor = tensor.to(device)
    return tensor


class TabularMetadataEncoder(nn.Module):
    """
    Encodes demographic metadata into a rich 64-dimensional latent embedding.
    Includes Metadata Dropout (p=0.25) during training.
    """

    def __init__(
        self,
        in_features: int = METADATA_DIM,
        hidden_dim: int = 64,
        out_dim: int = 64,
        metadata_dropout_p: float = 0.25,
    ):
        super().__init__()
        self.metadata_dropout_p = metadata_dropout_p
        self.mlp = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, out_dim),
            nn.LayerNorm(out_dim),
            nn.GELU(),
        )

    def forward(self, metadata: Optional[torch.Tensor] = None) -> torch.Tensor:
        if metadata is None:
            batch_size = 1
            device = next(self.parameters()).device
            return torch.zeros((batch_size, 64), device=device)

        # Apply metadata dropout during training (randomly zeroing out metadata vector)
        if self.training and self.metadata_dropout_p > 0:
            batch_size = metadata.shape[0]
            # Bernoulli mask for each batch sample
            mask = (torch.rand(batch_size, 1, device=metadata.device) > self.metadata_dropout_p).float()
            metadata = metadata * mask

        return self.mlp(metadata)


class DermaDiagnosisNet(nn.Module):
    """
    Multi-modal ConvNeXt-Small + Clinical Demographics Late-Fusion Classifier.
    """

    def __init__(
        self,
        backbone_name: str = "convnext_small.fb_in22k_ft_in1k",
        pretrained: bool = True,
        num_classes: int = len(CLASSES),
        drop_path_rate: float = 0.2,
        metadata_dropout_p: float = 0.25,
    ):
        super().__init__()
        self.num_classes = num_classes

        # 1. Vision Backbone
        self.backbone = timm.create_model(
            backbone_name,
            pretrained=pretrained,
            num_classes=0,
            drop_path_rate=drop_path_rate,
        )
        vision_dim = self.backbone.num_features  # 768 for convnext_small

        # 2. Metadata Encoder
        self.metadata_encoder = TabularMetadataEncoder(
            in_features=METADATA_DIM,
            hidden_dim=64,
            out_dim=64,
            metadata_dropout_p=metadata_dropout_p,
        )
        meta_dim = 64

        # 3. Late-Fusion Classifier
        fusion_dim = vision_dim + meta_dim  # 768 + 64 = 832
        self.classifier = nn.Sequential(
            nn.LayerNorm(fusion_dim),
            nn.Dropout(0.3),
            nn.Linear(fusion_dim, num_classes),
        )

        # 4. Calibration Parameters (Stored as non-gradient buffers)
        self.register_buffer("temperature", torch.tensor(1.0, dtype=torch.float32))
        self.register_buffer("logit_adjustments", torch.zeros(num_classes, dtype=torch.float32))

    def extract_features(
        self, images: torch.Tensor, metadata: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Extract concatenated 832-dim multi-modal feature vectors."""
        v_feat = self.backbone(images)  # (B, 768)
        if metadata is not None:
            m_feat = self.metadata_encoder(metadata)  # (B, 64)
        else:
            m_feat = torch.zeros((v_feat.shape[0], 64), device=v_feat.device)
        return torch.cat([v_feat, m_feat], dim=-1)

    def forward(
        self, images: torch.Tensor, metadata: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Raw uncalibrated logits."""
        fused = self.extract_features(images, metadata)
        logits = self.classifier(fused)
        return logits

    def forward_calibrated(
        self, images: torch.Tensor, metadata: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """Returns calibrated probability distribution after temperature and logit adjustments."""
        logits = self.forward(images, metadata)
        calibrated_logits = (logits / self.temperature) + self.logit_adjustments
        return F.softmax(calibrated_logits, dim=-1)

    def set_calibration(self, temperature: float, logit_adjustments: Union[List[float], np.ndarray, torch.Tensor]):
        """Set temperature scaling and prior adjustment offsets."""
        self.temperature.copy_(torch.tensor(float(temperature), dtype=torch.float32))
        adj = torch.as_tensor(logit_adjustments, dtype=torch.float32)
        self.logit_adjustments.copy_(adj)
