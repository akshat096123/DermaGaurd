"""
Agent 4: Context Reasoning & Epidemiological Prior Agent
Agentic DermaGuard - Track 2 Healthcare (Jaypee Agentic AI International Summit 2026)

Responsibilities:
1. Load training metadata and compile an Empirical Bayes Epidemiological Prior Engine.
2. Group clinical ages into risk brackets (<20, 20-39, 40-54, 55-69, 70+, missing).
3. Compute smoothed conditional likelihoods P(dx | age), P(dx | sex), P(dx | localization).
4. Persist precomputed priors to backend/outputs/context_priors.json for <0.1ms inference.
5. Ingest patient demographic factors, detect missing fields, and compute relative risk shifts.
6. Generate nuanced epidemiological evidence strings supporting clinical triage.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
import json
import numpy as np
import pandas as pd

from backend.app.core.schemas import Agent4ContextOutput
from backend.app.core.config import (
    TRAIN_CSV_PATH,
    OUTPUT_PATH,
    CLASSES,
    MALIGNANT_CLASSES,
    CONTEXT_MALIGNANCY_BASELINE,
)


class ContextReasoningAgent:
    """
    Empirical Bayes prior engine that integrates patient clinical context
    (age, biological sex, anatomical site) to modulate diagnostic priors.
    """

    AGE_BRACKETS: List[str] = ["<20", "20-39", "40-54", "55-69", "70+", "missing"]

    def __init__(
        self,
        train_csv_path: Optional[Path] = None,
        cache_json_path: Optional[Path] = None,
    ):
        self.train_csv_path = train_csv_path or TRAIN_CSV_PATH
        self.cache_json_path = cache_json_path or (OUTPUT_PATH / "context_priors.json")
        self.priors: Dict[str, Any] = {}
        self._load_or_build_priors()

    def _get_age_bracket(self, age: Optional[float]) -> str:
        """Map continuous age into standard clinical risk brackets."""
        if age is None or pd.isna(age) or str(age).strip().lower() in ["unknown", "nan", "none", ""]:
            return "missing"
        try:
            val = float(age)
            if val < 20.0:
                return "<20"
            elif val < 40.0:
                return "20-39"
            elif val < 55.0:
                return "40-54"
            elif val < 70.0:
                return "55-69"
            else:
                return "70+"
        except (ValueError, TypeError):
            return "missing"

    def _clean_str(self, val: Any) -> str:
        """Normalize categorical demographic string."""
        if val is None or pd.isna(val):
            return "unknown"
        s = str(val).strip().lower()
        if s in ["nan", "none", "", "null"]:
            return "unknown"
        return s

    def _load_or_build_priors(self) -> None:
        """Load cached prior tables if available, otherwise compile from training metadata."""
        if self.cache_json_path.exists():
            try:
                with open(self.cache_json_path, "r", encoding="utf-8") as f:
                    self.priors = json.load(f)
                    return
            except Exception:
                pass

        self._build_and_cache_priors()

    def _build_and_cache_priors(self) -> None:
        """Compile Bayesian conditional distribution tables from training partition."""
        if not self.train_csv_path.exists():
            # If train csv not found, build fallback uniform priors
            self._build_fallback_priors()
            return

        df = pd.read_csv(self.train_csv_path)
        total_n = len(df)

        # Baseline class priors P(dx)
        class_counts = df["dx"].value_counts().to_dict()
        base_priors = {cls_name: (class_counts.get(cls_name, 0) / total_n) for cls_name in CLASSES}

        # Add age bracket column
        df["age_bracket"] = df["age"].apply(self._get_age_bracket)
        df["sex_clean"] = df["sex"].apply(self._clean_str)
        df["loc_clean"] = df["localization"].apply(self._clean_str)

        # 1. P(dx | age_bracket) with Laplace smoothing (alpha=1.0)
        p_dx_given_age = {}
        for bracket in self.AGE_BRACKETS:
            sub = df[df["age_bracket"] == bracket]
            sub_n = len(sub)
            p_dx_given_age[bracket] = {}
            for cls_name in CLASSES:
                k = (sub["dx"] == cls_name).sum()
                prob = (k + 1.0) / (sub_n + len(CLASSES))
                p_dx_given_age[bracket][cls_name] = float(prob)

        # 2. P(dx | sex) with Laplace smoothing
        p_dx_given_sex = {}
        all_sexes = sorted(list(df["sex_clean"].unique()))
        for sx in all_sexes:
            sub = df[df["sex_clean"] == sx]
            sub_n = len(sub)
            p_dx_given_sex[sx] = {}
            for cls_name in CLASSES:
                k = (sub["dx"] == cls_name).sum()
                prob = (k + 1.0) / (sub_n + len(CLASSES))
                p_dx_given_sex[sx][cls_name] = float(prob)

        # 3. P(dx | localization) with Laplace smoothing
        p_dx_given_loc = {}
        all_locs = sorted(list(df["loc_clean"].unique()))
        for lc in all_locs:
            sub = df[df["loc_clean"] == lc]
            sub_n = len(sub)
            p_dx_given_loc[lc] = {}
            for cls_name in CLASSES:
                k = (sub["dx"] == cls_name).sum()
                prob = (k + 1.0) / (sub_n + len(CLASSES))
                p_dx_given_loc[lc][cls_name] = float(prob)

        # Compile prior lookup dictionary
        self.priors = {
            "total_samples": total_n,
            "baseline_priors": base_priors,
            "p_dx_given_age": p_dx_given_age,
            "p_dx_given_sex": p_dx_given_sex,
            "p_dx_given_loc": p_dx_given_loc,
            "baseline_malignancy_rate": sum(base_priors[c] for c in MALIGNANT_CLASSES),
        }

        # Cache to disk
        self.cache_json_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_json_path, "w", encoding="utf-8") as f:
            json.dump(self.priors, f, indent=2)

    def _build_fallback_priors(self) -> None:
        """Fallback prior tables if dataset CSV is unavailable."""
        base_priors = {
            "nv": 0.671, "mel": 0.110, "bkl": 0.109,
            "bcc": 0.052, "akiec": 0.032, "vasc": 0.014, "df": 0.011
        }
        self.priors = {
            "total_samples": 7762,
            "baseline_priors": base_priors,
            "p_dx_given_age": {b: base_priors for b in self.AGE_BRACKETS},
            "p_dx_given_sex": {"male": base_priors, "female": base_priors, "unknown": base_priors},
            "p_dx_given_loc": {"unknown": base_priors},
            "baseline_malignancy_rate": CONTEXT_MALIGNANCY_BASELINE,
        }

    def evaluate(
        self,
        age: Optional[Union[float, int, str]],
        sex: Optional[str],
        localization: Optional[str],
    ) -> Agent4ContextOutput:
        """
        Evaluate clinical demographic factors and compute Bayesian prior shifts.
        """
        # 1. Parse and flag missing demographic fields
        missing_flags: List[str] = []
        parsed_age: Optional[float] = None

        if age is None or pd.isna(age) or str(age).strip().lower() in ["unknown", "nan", "none", ""]:
            missing_flags.append("MISSING_AGE")
        else:
            try:
                parsed_age = float(age)
            except (ValueError, TypeError):
                missing_flags.append("INVALID_AGE_FORMAT")

        clean_sex = self._clean_str(sex)
        if clean_sex == "unknown":
            missing_flags.append("UNKNOWN_SEX")

        clean_loc = self._clean_str(localization)
        if clean_loc == "unknown":
            missing_flags.append("UNKNOWN_LOCALIZATION")

        # 2. Extract conditional probability vectors
        age_bracket = self._get_age_bracket(parsed_age)
        p_age = self.priors["p_dx_given_age"].get(age_bracket, self.priors["baseline_priors"])
        p_sex = self.priors["p_dx_given_sex"].get(clean_sex, self.priors["baseline_priors"])
        p_loc = self.priors["p_dx_given_loc"].get(clean_loc, self.priors["baseline_priors"])
        base = self.priors["baseline_priors"]

        # 3. Clinical Bayesian Posterior Ratio Shift Calculation
        # Damping weights: age=0.45, localization=0.35, sex=0.20
        # Prevents demographic bias from overpowering visual evidence while accurately reflecting epidemiological odds
        w_age = 0.45 if ("MISSING_AGE" not in missing_flags and age_bracket != "missing") else 0.0
        w_loc = 0.35 if "UNKNOWN_LOCALIZATION" not in missing_flags else 0.0
        w_sex = 0.20 if "UNKNOWN_SEX" not in missing_flags else 0.0

        raw_shifts: Dict[str, float] = {}
        for cls_name in CLASSES:
            base_p = max(0.005, base.get(cls_name, 0.05))
            ratio_age = (p_age.get(cls_name, base_p) / base_p) if w_age > 0 else 1.0
            ratio_loc = (p_loc.get(cls_name, base_p) / base_p) if w_loc > 0 else 1.0
            ratio_sex = (p_sex.get(cls_name, base_p) / base_p) if w_sex > 0 else 1.0

            # Geometric weighted odds shift
            shift = (ratio_age ** w_age) * (ratio_loc ** w_loc) * (ratio_sex ** w_sex)
            raw_shifts[cls_name] = float(shift)

        # Normalize posterior probability distribution
        unnorm_posteriors = {c: base[c] * raw_shifts[c] for c in CLASSES}
        norm_sum = sum(unnorm_posteriors.values())
        posteriors = {c: float(unnorm_posteriors[c] / norm_sum) for c in CLASSES}

        # 4. Malignancy Prior Multiplier
        # Ratio of posterior malignant mass vs. population baseline (19.4%)
        malignant_posterior = sum(posteriors[c] for c in MALIGNANT_CLASSES)
        baseline_malignancy = self.priors.get("baseline_malignancy_rate", CONTEXT_MALIGNANCY_BASELINE)
        malignancy_multiplier = float(malignant_posterior / max(0.01, baseline_malignancy))

        # 5. Risk Indicator Categorization
        if malignancy_multiplier >= 1.60:
            risk_indicator = "HIGH"
        elif malignancy_multiplier >= 1.22:
            risk_indicator = "ELEVATED"
        elif malignancy_multiplier >= 0.85:
            risk_indicator = "MODERATE"
        else:
            risk_indicator = "LOW"

        # 6. Epidemiological Evidence Generation
        context_evidence: List[str] = []

        # Age evidence
        if parsed_age is not None:
            if parsed_age >= 70.0:
                context_evidence.append(
                    f"Advanced patient age ({parsed_age:.0f}y, geriatric bracket) markedly elevates cutaneous carcinoma (BCC/AKIEC) likelihood ({raw_shifts.get('bcc', 1.0):.2f}x BCC shift)"
                )
            elif parsed_age >= 55.0:
                context_evidence.append(
                    f"Patient age ({parsed_age:.0f}y, older adult) carries elevated baseline incidence for keratinocyte carcinomas and melanoma"
                )
            elif parsed_age < 30.0:
                context_evidence.append(
                    f"Young patient age ({parsed_age:.0f}y) strongly favors benign melanocytic nevi ({raw_shifts.get('nv', 1.0):.2f}x NV shift)"
                )
        else:
            context_evidence.append(
                "Patient age absent from clinical record; population mean prior applied"
            )

        # Localization evidence
        if clean_loc != "unknown":
            sun_exposed_sites = {"face", "scalp", "ear", "neck", "hand"}
            if clean_loc in sun_exposed_sites:
                context_evidence.append(
                    f"Anatomical site '{clean_loc}' represents high cumulative ultraviolet solar radiation exposure, increasing AKIEC/BCC prior"
                )
            elif clean_loc in ["back", "chest", "trunk"]:
                context_evidence.append(
                    f"Anatomical site '{clean_loc}' is a frequent clinical predilection for superficial spreading melanoma in both sexes"
                )
            else:
                context_evidence.append(
                    f"Anatomical site '{clean_loc}' recorded with localized distribution priors"
                )
        else:
            context_evidence.append(
                "Lesion localization not specified; generalized anatomical prior applied"
            )

        # Composite summary evidence
        context_evidence.append(
            f"Composite demographic profile yields a {malignancy_multiplier:.2f}x malignancy risk adjustment ({risk_indicator} risk)"
        )

        return Agent4ContextOutput(
            age=parsed_age,
            sex=clean_sex,
            localization=clean_loc,
            missing_field_flags=missing_flags,
            malignancy_prior_multiplier=round(malignancy_multiplier, 4),
            class_prior_shifts={k: round(v, 4) for k, v in raw_shifts.items()},
            risk_indicator=risk_indicator,
            context_evidence=context_evidence,
        )
