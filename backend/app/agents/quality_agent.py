"""
Agent 1: Image Quality Assessment Agent
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Deterministic physics-based quality evaluation (~5ms per image):
1. Vignette detection & central ROI extraction.
2. Focus & blur assessment via Laplacian variance.
3. CIE-LAB illumination & contrast measurement.
4. HSV specular reflection / flash glare quantification.
5. Morphological Black-Hat hair & ruler obstruction detection.
"""

from pathlib import Path
from typing import Union, List, Tuple
import cv2
import numpy as np

from backend.app.core.schemas import Agent1QualityOutput
from backend.app.core.config import (
    STANDARD_IMAGE_HEIGHT,
    STANDARD_IMAGE_WIDTH,
    QUALITY_THRESHOLDS,
)


class ImageQualityAgent:
    """
    Evaluates raw clinical dermoscopy images against strict diagnostic acquisition standards.
    Determines whether an image is usable or requires re-acquisition (RE_IMAGE).
    """

    def __init__(
        self,
        target_height: int = STANDARD_IMAGE_HEIGHT,
        target_width: int = STANDARD_IMAGE_WIDTH,
    ):
        self.target_height = target_height
        self.target_width = target_width
        self.structuring_element = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))

    def evaluate(self, image_input: Union[str, Path, np.ndarray]) -> Agent1QualityOutput:
        """
        Evaluate image quality deterministically.
        Args:
            image_input: File path (str or Path) or pre-loaded BGR numpy array.
        Returns:
            Agent1QualityOutput with status, scores, ratios, and clinical reasons.
        """
        # 1. Load Image
        if isinstance(image_input, (str, Path)):
            img_path = str(image_input)
            img = cv2.imread(img_path)
            if img is None:
                return Agent1QualityOutput(
                    status="FAIL",
                    quality_score=0.0,
                    blur_score=0.0,
                    illumination_score=0.0,
                    glare_ratio=0.0,
                    obstruction_ratio=1.0,
                    vignette_ratio=1.0,
                    reasons=[f"File corrupted or unreadable: {img_path}"],
                    is_usable=False,
                )
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            raise ValueError(f"Unsupported image_input type: {type(image_input)}")

        # 2. Resize to standard working resolution for consistent scale
        h, w = img.shape[:2]
        if h != self.target_height or w != self.target_width:
            img = cv2.resize(
                img,
                (self.target_width, self.target_height),
                interpolation=cv2.INTER_AREA if (h > self.target_height) else cv2.INTER_LINEAR,
            )

        # 3. Vignette Detection & Circular ROI Extraction
        # Create elliptical central mask to insulate physics metrics from dermatoscope lens barrel
        center_x, center_y = self.target_width // 2, self.target_height // 2
        radius_x, radius_y = int(self.target_width * 0.47), int(self.target_height * 0.47)

        vignette_mask = np.zeros((self.target_height, self.target_width), dtype=np.uint8)
        cv2.ellipse(
            vignette_mask,
            (center_x, center_y),
            (radius_x, radius_y),
            0,
            0,
            360,
            255,
            -1,
        )

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Calculate dark corners outside central ellipse
        corner_pixels = (vignette_mask == 0)
        total_pixels = self.target_height * self.target_width
        corner_dark_pixels = corner_pixels & (gray < 45)
        vignette_ratio = float(np.sum(corner_dark_pixels) / total_pixels)

        # Adaptive ROI: Central ellipse excluding any extreme black border margins
        roi_mask = (vignette_mask > 0) & (gray > 15)
        roi_pixel_count = int(np.sum(roi_mask))
        if roi_pixel_count == 0:
            return Agent1QualityOutput(
                status="FAIL",
                quality_score=0.0,
                blur_score=0.0,
                illumination_score=0.0,
                glare_ratio=0.0,
                obstruction_ratio=1.0,
                vignette_ratio=1.0,
                reasons=["Completely dark or unlit frame"],
                is_usable=False,
            )

        # 4. Blur / Sharpness Metric (Variance of Laplacian)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        roi_laplacian = laplacian[roi_mask]
        laplacian_var = float(np.var(roi_laplacian))
        # Non-linear logarithmic scaling calibrated to dermoscopy distribution:
        # Typical sharp fluid-immersion dermoscopy (var ~50-100) scores 0.75 - 0.95
        blur_score = float(np.clip(np.log1p(laplacian_var) / np.log1p(100.0), 0.0, 1.0))

        # 5. Illumination & Contrast (CIE-LAB L* channel)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel = lab[:, :, 0]
        roi_l = l_channel[roi_mask]
        l_mean = float(np.mean(roi_l))
        l_std = float(np.std(roi_l))

        # Optimal mean L* is ~115-180 with std >= 15
        l_mean_dist = abs(l_mean - 145.0)
        mean_penalty = max(0.0, (l_mean_dist - 35.0) / 100.0)
        std_penalty = max(0.0, (18.0 - l_std) / 18.0) if l_std < 18.0 else 0.0
        illumination_score = float(np.clip(1.0 - (mean_penalty + 0.4 * std_penalty), 0.0, 1.0))

        # 6. Specular Glare (HSV Color Space: High V, Low S)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        s_channel = hsv[:, :, 1]
        v_channel = hsv[:, :, 2]
        glare_pixels = (v_channel > 242) & (s_channel < 28) & roi_mask
        glare_ratio = float(np.sum(glare_pixels) / roi_pixel_count)

        # 7. Morphological Black-Hat (Hair & Ruler Obstruction)
        blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, self.structuring_element)
        obstruction_pixels = (blackhat > 25) & roi_mask
        obstruction_ratio = float(np.sum(obstruction_pixels) / roi_pixel_count)

        # 8. Decision Logic & Human-Readable Reasons
        reasons: List[str] = []
        is_fail = False
        is_warn = False

        # Sharpness checks
        if laplacian_var < QUALITY_THRESHOLDS["laplacian_var_fail"]:
            is_fail = True
            reasons.append(
                f"Severe blur / out-of-focus acquisition (Laplacian variance {laplacian_var:.1f} < {QUALITY_THRESHOLDS['laplacian_var_fail']})"
            )
        elif laplacian_var < QUALITY_THRESHOLDS["laplacian_var_warn"]:
            is_warn = True
            reasons.append(
                f"Borderline softness detected (Laplacian variance {laplacian_var:.1f})"
            )

        # Illumination checks
        if l_mean < QUALITY_THRESHOLDS["illumination_underexposed"]:
            is_fail = True
            reasons.append(
                f"Critically underexposed / dark field (L* mean {l_mean:.1f} < {QUALITY_THRESHOLDS['illumination_underexposed']})"
            )
        elif l_mean > QUALITY_THRESHOLDS["illumination_overexposed"]:
            is_fail = True
            reasons.append(
                f"Severe flash overexposure / washout (L* mean {l_mean:.1f} > {QUALITY_THRESHOLDS['illumination_overexposed']})"
            )
        elif l_mean < 60.0:
            is_warn = True
            reasons.append(f"Suboptimal lighting: underexposed (L* mean {l_mean:.1f})")
        elif l_mean > 218.0:
            is_warn = True
            reasons.append(f"Suboptimal lighting: high exposure (L* mean {l_mean:.1f})")

        if l_std < QUALITY_THRESHOLDS["illumination_low_contrast"]:
            is_warn = True
            reasons.append(f"Low contrast field of view (L* std dev {l_std:.1f})")

        # Glare checks
        if glare_ratio > QUALITY_THRESHOLDS["glare_ratio_fail"]:
            is_fail = True
            reasons.append(
                f"Excessive specular flash glare ({glare_ratio*100:.1f}% > {QUALITY_THRESHOLDS['glare_ratio_fail']*100:.0f}%) obscuring lesion center"
            )
        elif glare_ratio > QUALITY_THRESHOLDS["glare_ratio_warn"]:
            is_warn = True
            reasons.append(
                f"Noticeable specular reflection ({glare_ratio*100:.1f}% area)"
            )

        # Obstruction checks
        if obstruction_ratio > QUALITY_THRESHOLDS["obstruction_ratio_fail"]:
            is_fail = True
            reasons.append(
                f"Severe hair / artifact obstruction ({obstruction_ratio*100:.1f}% > {QUALITY_THRESHOLDS['obstruction_ratio_fail']*100:.0f}%)"
            )
        elif obstruction_ratio > QUALITY_THRESHOLDS["obstruction_ratio_warn"]:
            is_warn = True
            reasons.append(
                f"Moderate hair density detected ({obstruction_ratio*100:.1f}% area) - digital inpainting recommended"
            )

        # Overall Status
        if is_fail:
            status = "FAIL"
            is_usable = False
        elif is_warn:
            status = "WARN"
            is_usable = True
        else:
            status = "PASS"
            is_usable = True
            reasons.append("Image meets all diagnostic sharpness, illumination, and clarity criteria.")

        # Aggregate Quality Score [0.0 - 1.0]
        quality_score = float(
            np.clip(
                0.35 * blur_score
                + 0.35 * illumination_score
                + 0.15 * max(0.0, 1.0 - (glare_ratio / 0.15))
                + 0.15 * max(0.0, 1.0 - (obstruction_ratio / 0.20)),
                0.0,
                1.0,
            )
        )
        if status == "FAIL":
            quality_score = min(quality_score, 0.45)

        return Agent1QualityOutput(
            status=status,
            quality_score=round(quality_score, 4),
            blur_score=round(blur_score, 4),
            illumination_score=round(illumination_score, 4),
            glare_ratio=round(glare_ratio, 4),
            obstruction_ratio=round(obstruction_ratio, 4),
            vignette_ratio=round(vignette_ratio, 4),
            reasons=reasons,
            is_usable=is_usable,
        )
