"""
Agent 3: Lesion Analysis Agent (ABCD Dermatoscopic Morphometrics)
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Deterministic clinical feature extraction:
1. Hair inpainting (Telea algorithm) on Black-Hat hair mask.
2. Robust adaptive lesion segmentation (CIE-LAB delta-E + Otsu + Morphological closing).
3. A - Asymmetry: Principal moment rotation and biaxial XOR fold overlap.
4. B - Border Irregularity: Polsby-Popper compactness + radial distance variance.
5. C - Color Variation: Dermatoscopic pigment prototype clustering (6 classic zones).
6. Suspicion scoring, clinical evidence synthesis, and boundary reliability flags.
"""

from pathlib import Path
from typing import Union, List, Tuple, Dict, Any, Optional
import math
import cv2
import numpy as np

from backend.app.core.schemas import Agent3LesionOutput
from backend.app.core.config import (
    STANDARD_IMAGE_HEIGHT,
    STANDARD_IMAGE_WIDTH,
    ABCD_WEIGHTS,
)


class LesionAnalysisAgent:
    """
    Extracts objective ABCD dermatoscopic features from dermoscopy images.
    Provides interpretable morphologic evidence to assist triage and risk stratification.
    """

    def __init__(
        self,
        target_height: int = STANDARD_IMAGE_HEIGHT,
        target_width: int = STANDARD_IMAGE_WIDTH,
    ):
        self.target_height = target_height
        self.target_width = target_width
        self.hair_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))

    def evaluate(self, image_input: Union[str, Path, np.ndarray]) -> Agent3LesionOutput:
        """
        Extract ABCD morphometrics deterministically.
        Args:
            image_input: File path (str or Path) or pre-loaded BGR numpy array.
        Returns:
            Agent3LesionOutput with ABCD metrics, evidence, and reliability flags.
        """
        # 1. Load Image
        if isinstance(image_input, (str, Path)):
            img = cv2.imread(str(image_input))
            if img is None:
                return self._fallback_output(f"Failed to read image: {image_input}")
        elif isinstance(image_input, np.ndarray):
            img = image_input
        else:
            raise ValueError(f"Unsupported image_input type: {type(image_input)}")

        h, w = img.shape[:2]
        if h != self.target_height or w != self.target_width:
            img = cv2.resize(
                img,
                (self.target_width, self.target_height),
                interpolation=cv2.INTER_AREA if (h > self.target_height) else cv2.INTER_LINEAR,
            )

        # 2. Central Elliptical Field Mask (insulate from vignette barrel)
        cx, cy = self.target_width // 2, self.target_height // 2
        rx, ry = int(self.target_width * 0.46), int(self.target_height * 0.46)
        field_mask = np.zeros((self.target_height, self.target_width), dtype=np.uint8)
        cv2.ellipse(field_mask, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        roi_mask = (field_mask > 0) & (gray > 20)
        roi_area = float(np.sum(roi_mask))
        if roi_area < 500:
            return self._fallback_output("Image frame too dark to isolate ROI")

        # 3. Hair Inpainting Pre-step
        blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, self.hair_kernel)
        hair_mask = ((blackhat > 24) & roi_mask).astype(np.uint8) * 255
        # Telea inpainting removes hair interference on borders
        if np.sum(hair_mask) > 100:
            inpainted = cv2.inpaint(img, hair_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
        else:
            inpainted = img.copy()

        # 4. Lesion Segmentation
        lesion_mask, reliability_flags = self._segment_lesion(inpainted, roi_mask, cx, cy)
        lesion_pixel_count = int(np.sum(lesion_mask > 0))
        lesion_area_ratio = float(lesion_pixel_count / roi_area)

        if lesion_pixel_count < 100:
            reliability_flags.append("SEGMENTATION_COLLAPSE")
            return self._fallback_output("Lesion segmentation collapsed or unidentifiable", reliability_flags)

        # 5. A - Asymmetry Score Calculation
        asymmetry_score = self._compute_asymmetry(lesion_mask)

        # 6. B - Border Irregularity Calculation
        border_score = self._compute_border_irregularity(lesion_mask)

        # 7. C - Color Variation & Distinct Chromatic Zones
        color_score, color_zones = self._compute_color_variation(inpainted, lesion_mask)

        # 8. Composite Suspicion Score [0.0 - 1.0]
        suspicion_score = float(
            np.clip(
                ABCD_WEIGHTS["asymmetry"] * asymmetry_score
                + ABCD_WEIGHTS["border"] * border_score
                + ABCD_WEIGHTS["color"] * color_score,
                0.0,
                1.0,
            )
        )

        # Suspicion Label Stratification
        if suspicion_score >= 0.70:
            suspicion_label = "HIGH"
        elif suspicion_score >= 0.50:
            suspicion_label = "SUSPICIOUS"
        elif suspicion_score >= 0.32:
            suspicion_label = "MODERATE"
        else:
            suspicion_label = "LOW"

        # 9. Clinical Feature Evidence Generation
        feature_evidence: List[str] = []

        # Asymmetry evidence
        if asymmetry_score >= 0.55:
            feature_evidence.append(
                f"Marked structural asymmetry ({asymmetry_score:.2f}) across principal geometric axes"
            )
        elif asymmetry_score >= 0.35:
            feature_evidence.append(
                f"Moderate contour asymmetry ({asymmetry_score:.2f})"
            )
        else:
            feature_evidence.append(
                f"Well-preserved geometric symmetry ({asymmetry_score:.2f})"
            )

        # Border evidence
        if border_score >= 0.55:
            feature_evidence.append(
                f"Irregular, notched or scalloped boundary (compactness score {border_score:.2f})"
            )
        elif border_score >= 0.35:
            feature_evidence.append(
                f"Subtle edge indentation / mild boundary irregularity ({border_score:.2f})"
            )
        else:
            feature_evidence.append(
                f"Smooth, circumscribed lesion margin ({border_score:.2f})"
            )

        # Color evidence
        num_colors = len(color_zones)
        zone_str = ", ".join(color_zones) if color_zones else "uniform"
        if num_colors >= 4:
            feature_evidence.append(
                f"High variegation with {num_colors} distinct color zones: [{zone_str}]"
            )
        elif num_colors >= 2:
            feature_evidence.append(
                f"Moderate color variation with {num_colors} zones: [{zone_str}]"
            )
        else:
            feature_evidence.append(
                f"Monochromatic / uniform pigmentation: [{zone_str}]"
            )

        # High-risk chromatic markers
        if "black" in color_zones or "blue_gray" in color_zones:
            ominous = [c for c in ["blue_gray", "black"] if c in color_zones]
            feature_evidence.append(
                f"Ominous pigment pattern present: {', '.join(ominous)}"
            )

        return Agent3LesionOutput(
            asymmetry_score=round(asymmetry_score, 4),
            border_irregularity_score=round(border_score, 4),
            color_variation_score=round(color_score, 4),
            distinct_color_zones=color_zones,
            suspicion_score=round(suspicion_score, 4),
            suspicion_label=suspicion_label,
            feature_evidence=feature_evidence,
            reliability_flags=reliability_flags,
            lesion_area_ratio=round(lesion_area_ratio, 4),
        )

    def _segment_lesion(
        self, img: np.ndarray, roi_mask: np.ndarray, cx: int, cy: int
    ) -> Tuple[np.ndarray, List[str]]:
        """
        Segment the primary central lesion using CIE-LAB chrominance delta-E from normal skin,
        Otsu thresholding, and morphological filtering.
        """
        reliability_flags: List[str] = []

        # Convert to CIE-LAB
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_chan = lab[:, :, 0].astype(np.float32)
        a_chan = lab[:, :, 1].astype(np.float32)
        b_chan = lab[:, :, 2].astype(np.float32)

        # Sample peripheral skin ring (radius 0.38 to 0.44 of image width)
        h, w = img.shape[:2]
        r_inner = int(w * 0.36)
        r_outer = int(w * 0.45)
        skin_ring_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(skin_ring_mask, (cx, cy), r_outer, 255, -1)
        inner_circle = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(inner_circle, (cx, cy), r_inner, 255, -1)
        skin_ring_mask = (skin_ring_mask > 0) & (inner_circle == 0) & roi_mask

        if np.sum(skin_ring_mask) > 100:
            skin_l = float(np.median(l_chan[skin_ring_mask]))
            skin_a = float(np.median(a_chan[skin_ring_mask]))
            skin_b = float(np.median(b_chan[skin_ring_mask]))
        else:
            skin_l, skin_a, skin_b = 155.0, 135.0, 140.0

        # Contrast map: Euclidean distance from normal background skin in LAB
        delta_l = np.maximum(0.0, skin_l - l_chan)  # Lesions are darker than skin
        delta_ab = np.sqrt((a_chan - skin_a) ** 2 + (b_chan - skin_b) ** 2)
        contrast_map = 1.3 * delta_l + 1.0 * delta_ab

        # Apply Gaussian smoothing to suppress fine texture noise
        blurred = cv2.GaussianBlur(contrast_map, (9, 9), 0)
        blurred_roi = blurred.copy()
        blurred_roi[~roi_mask] = 0

        # Normalize to 0-255 uint8 inside ROI
        roi_vals = blurred_roi[roi_mask]
        min_v, max_v = float(np.min(roi_vals)), float(np.max(roi_vals))
        if max_v - min_v < 10.0:
            reliability_flags.append("LOW_CONTRAST_BOUNDARY")
            norm_map = np.zeros((h, w), dtype=np.uint8)
        else:
            norm_map = np.clip(((blurred_roi - min_v) / (max_v - min_v)) * 255.0, 0, 255).astype(np.uint8)

        # Otsu thresholding on ROI pixels
        roi_pixel_vals = norm_map[roi_mask]
        if len(roi_pixel_vals) > 0:
            otsu_val, _ = cv2.threshold(roi_pixel_vals, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            bin_mask = (norm_map >= otsu_val) & roi_mask
        else:
            bin_mask = np.zeros((h, w), dtype=bool)

        bin_uint8 = bin_mask.astype(np.uint8) * 255

        # Morphological Closing to seal gaps and fill internal lacunae
        close_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
        closed = cv2.morphologyEx(bin_uint8, cv2.MORPH_CLOSE, close_kernel)

        # Find connected components and select the primary contour closest to center
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        final_mask = np.zeros((h, w), dtype=np.uint8)
        if contours:
            # Score each contour by area / (1 + distance_to_center)
            best_contour = None
            best_score = -1.0
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area < 80:
                    continue
                m = cv2.moments(cnt)
                if m["m00"] > 0:
                    cnt_x = m["m10"] / m["m00"]
                    cnt_y = m["m01"] / m["m00"]
                    dist = math.hypot(cnt_x - cx, cnt_y - cy)
                else:
                    dist = 1000.0
                score = area / (1.0 + 0.008 * dist)
                if score > best_score:
                    best_score = score
                    best_contour = cnt

            if best_contour is not None:
                cv2.drawContours(final_mask, [best_contour], -1, 255, -1)

                # Check if contour touches image margins
                x, y, bw, bh = cv2.boundingRect(best_contour)
                if x <= 5 or y <= 5 or (x + bw) >= (w - 5) or (y + bh) >= (h - 5):
                    reliability_flags.append("BORDER_TOUCHING_LESION")

                lesion_ratio = cv2.contourArea(best_contour) / max(1.0, float(np.sum(roi_mask)))
                if lesion_ratio < 0.02:
                    reliability_flags.append("SMALL_LESION_WARNING")
                elif lesion_ratio > 0.85:
                    reliability_flags.append("MASSIVE_LESION_DIFFUSE")

        return final_mask, reliability_flags

    def _compute_asymmetry(self, mask: np.ndarray) -> float:
        """
        Compute biaxial geometric asymmetry by aligning with principal inertia axis
        and calculating the non-overlapping XOR area ratio when flipped horizontally & vertically.
        """
        m = cv2.moments(mask, binaryImage=True)
        area = m["m00"]
        if area < 50:
            return 0.5

        cx = m["m10"] / area
        cy = m["m01"] / area

        # Calculate principal inertia axis angle theta
        mu20 = m["mu20"] / area
        mu02 = m["mu02"] / area
        mu11 = m["mu11"] / area
        theta = 0.5 * math.atan2(2.0 * mu11, mu20 - mu02)

        # Crop to bounding box with padding
        x, y, bw, bh = cv2.boundingRect(mask)
        pad = max(bw, bh) // 2 + 10
        x0, y0 = max(0, x - pad), max(0, y - pad)
        x1, y1 = min(mask.shape[1], x + bw + pad), min(mask.shape[0], y + bh + pad)
        crop = mask[y0:y1, x0:x1]

        # Shift centroid to crop center
        new_cx = cx - x0
        new_cy = cy - y0
        ch, cw = crop.shape[:2]
        shift_x = (cw / 2.0) - new_cx
        shift_y = (ch / 2.0) - new_cy

        # Affine rotation matrix centered on lesion centroid
        rot_mat = cv2.getRotationMatrix2D((cw / 2.0, ch / 2.0), -math.degrees(theta), 1.0)
        rot_mat[0, 2] += shift_x
        rot_mat[1, 2] += shift_y

        aligned = cv2.warpAffine(crop, rot_mat, (cw, ch), flags=cv2.INTER_NEAREST)
        aligned_area = float(np.sum(aligned > 0))
        if aligned_area < 50:
            return 0.5

        # Fold along horizontal axis (left vs right)
        flipped_lr = np.fliplr(aligned)
        xor_lr = np.bitwise_xor(aligned, flipped_lr)
        asym_lr = float(np.sum(xor_lr > 0) / (2.0 * aligned_area))

        # Fold along vertical axis (top vs bottom)
        flipped_ud = np.flipud(aligned)
        xor_ud = np.bitwise_xor(aligned, flipped_ud)
        asym_ud = float(np.sum(xor_ud > 0) / (2.0 * aligned_area))

        # Composite asymmetry normalized to [0, 1]
        asymmetry_score = float(np.clip(0.5 * asym_lr + 0.5 * asym_ud, 0.0, 1.0))
        return asymmetry_score

    def _compute_border_irregularity(self, mask: np.ndarray) -> float:
        """
        Compute boundary irregularity using Polsby-Popper compactness (P^2 / 4*pi*A)
        and radial contour distance variance from centroid.
        """
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        if not contours:
            return 0.5
        cnt = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(cnt)
        perimeter = cv2.arcLength(cnt, True)

        if area < 50 or perimeter < 10:
            return 0.5

        # 1. Polsby-Popper Compactness (Circle = 1.0, Irregular > 1.8)
        compactness = (perimeter * perimeter) / (4.0 * math.pi * area)
        comp_score = float(np.clip((compactness - 1.0) / 2.8, 0.0, 1.0))

        # 2. Radial Distance Variance from Centroid
        m = cv2.moments(cnt)
        if m["m00"] > 0:
            cx = m["m10"] / m["m00"]
            cy = m["m01"] / m["m00"]
            pts = cnt.reshape(-1, 2)
            distances = np.hypot(pts[:, 0] - cx, pts[:, 1] - cy)
            mean_dist = float(np.mean(distances))
            std_dist = float(np.std(distances))
            rad_ratio = (std_dist / max(1.0, mean_dist))
            rad_score = float(np.clip((rad_ratio - 0.08) / 0.28, 0.0, 1.0))
        else:
            rad_score = comp_score

        border_score = float(np.clip(0.55 * comp_score + 0.45 * rad_score, 0.0, 1.0))
        return border_score

    def _compute_color_variation(
        self, img: np.ndarray, mask: np.ndarray
    ) -> Tuple[float, List[str]]:
        """
        Map lesion pixels into 6 classic dermatoscopic pigment prototypes:
        light_brown, dark_brown, black, red_pink, blue_gray, white.
        """
        lesion_pixels_bgr = img[mask > 0]
        total_lesion_px = len(lesion_pixels_bgr)
        if total_lesion_px < 50:
            return 0.2, ["uniform"]

        # Convert lesion pixels to LAB and HSV
        lab_pixels = cv2.cvtColor(lesion_pixels_bgr.reshape(-1, 1, 3), cv2.COLOR_BGR2LAB).reshape(-1, 3)
        hsv_pixels = cv2.cvtColor(lesion_pixels_bgr.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV).reshape(-1, 3)

        l_val = lab_pixels[:, 0]
        a_val = lab_pixels[:, 1]
        b_val = lab_pixels[:, 2]

        h_val = hsv_pixels[:, 0]
        s_val = hsv_pixels[:, 1]
        v_val = hsv_pixels[:, 2]

        # Clinical prototype conditions (each covering >= 3% of lesion)
        min_cluster_ratio = 0.03
        min_count = int(total_lesion_px * min_cluster_ratio)

        color_zones: List[str] = []

        # 1. Black (L* < 50, V < 60)
        black_cnt = np.sum((l_val < 55) & (v_val < 65))
        if black_cnt >= min_count:
            color_zones.append("black")

        # 2. Dark Brown (L* in [55, 105], S >= 35, b* >= 130)
        dark_brown_cnt = np.sum((l_val >= 55) & (l_val < 105) & (s_val >= 35) & (b_val >= 130))
        if dark_brown_cnt >= min_count:
            color_zones.append("dark_brown")

        # 3. Light Brown / Tan (L* in [105, 175], S in [25, 160], b* >= 135)
        light_brown_cnt = np.sum((l_val >= 105) & (l_val < 175) & (s_val >= 25) & (b_val >= 135))
        if light_brown_cnt >= min_count:
            color_zones.append("light_brown")

        # 4. Red / Pink / Erythematous (elevated a* in LAB or hue near red/magenta with saturation)
        red_pink_cnt = np.sum((a_val > 146) | (((h_val < 10) | (h_val > 168)) & (s_val > 55) & (l_val > 80)))
        if red_pink_cnt >= min_count:
            color_zones.append("red_pink")

        # 5. Blue-Gray / Slate (L* in [65, 145], low b* cool tint < 128, low/mid saturation)
        blue_gray_cnt = np.sum((l_val >= 65) & (l_val < 145) & (b_val < 127) & (s_val < 80))
        if blue_gray_cnt >= min_count:
            color_zones.append("blue_gray")

        # 6. White / Hypopigmentation / Scar-like depigmentation (L* > 185, S < 35)
        white_cnt = np.sum((l_val > 185) & (s_val < 35))
        if white_cnt >= min_count:
            color_zones.append("white")

        if not color_zones:
            color_zones = ["light_brown"]

        # Color entropy and score scaling
        num_zones = len(color_zones)
        base_zone_score = {
            1: 0.18,
            2: 0.38,
            3: 0.60,
            4: 0.82,
            5: 0.95,
            6: 1.00,
        }.get(num_zones, 0.95)

        # Standard deviation in RGB color space
        std_rgb = float(np.mean(np.std(lesion_pixels_bgr, axis=0)))
        std_score = float(np.clip(std_rgb / 45.0, 0.0, 1.0))

        color_score = float(np.clip(0.70 * base_zone_score + 0.30 * std_score, 0.0, 1.0))
        return color_score, color_zones

    def _fallback_output(
        self, reason: str, flags: Optional[List[str]] = None
    ) -> Agent3LesionOutput:
        """Fallback output when image or contour is degraded."""
        return Agent3LesionOutput(
            asymmetry_score=0.5,
            border_irregularity_score=0.5,
            color_variation_score=0.5,
            distinct_color_zones=["indeterminate"],
            suspicion_score=0.5,
            suspicion_label="MODERATE",
            feature_evidence=[f"Morphometric analysis impaired: {reason}"],
            reliability_flags=flags or ["SEGMENTATION_DEGRADED"],
            lesion_area_ratio=0.0,
        )
