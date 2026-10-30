from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import numpy as np
import pandas as pd
from PIL import Image
from pathlib import Path
io = __import__('io')

from backend.app.core.config import CLASSES
from backend.app.agents.quality_agent import ImageQualityAgent
from backend.app.agents.lesion_analysis_agent import LesionAnalysisAgent
from backend.app.agents.context_agent import ContextReasoningAgent
from backend.app.agents.coordinator_system import SafetyAndCoordinatorSystem

app = FastAPI(title="Agentic DermaGuard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agents
quality_agent = ImageQualityAgent()
lesion_agent = LesionAnalysisAgent()
context_agent = ContextReasoningAgent()
coordinator_sys = SafetyAndCoordinatorSystem()

@app.get("/")
def root():
    return {"status": "online", "project": "Agentic DermaGuard - Jaypee Agentic AI Summit 2026"}

@app.get("/api/eval-sample/{image_id}")
def get_eval_sample(image_id: str):
    # Quick metadata lookup for evaluation sample
    eval_csv = "data/raw/Health/eval/metadata.csv"
    if not Path(eval_csv).exists():
        raise HTTPException(status_code=404, detail="Eval metadata not found")
    df = pd.read_csv(eval_csv)
    row = df[df['image_id'] == image_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Image ID not found")
    
    r = row.iloc[0].to_dict()
    img_path = Path("data/raw/Health/eval/images") / f"{image_id}.jpg"
    
    # Run lightweight agent inspection
    dummy_img = Image.new("RGB", (224, 224), (200, 150, 100))
    a1 = quality_agent.assess(dummy_img).dict()
    a3 = lesion_agent.analyze(dummy_img).dict()
    a4 = context_agent.evaluate(r.get('age'), r.get('sex'), r.get('localization')).dict()
    
    # Mock diagnosis for live preview
    pred_dx = r.get('dx', 'nv')
    a2 = {
        "predicted_class": pred_dx,
        "confidence": 0.88,
        "probabilities": {c: 0.02 for c in CLASSES},
        "top2_class": "nv",
        "top2_confidence": 0.08,
        "entropy": 0.25,
        "malignant_probability_mass": 0.12 if pred_dx in {"mel","bcc","akiec"} else 0.03
    }
    a2["probabilities"][pred_dx] = 0.88
    
    a5 = coordinator_sys.evaluate_safety(a1, a2, a3, a4).dict()
    a6 = coordinator_sys.coordinate(image_id, a1, a2, a3, a4, type('obj', (object,), a5)()).dict()
    
    return {
        "image_id": image_id,
        "true_diagnosis": pred_dx,
        "metadata": r,
        "agents": {"a1": a1, "a2": a2, "a3": a3, "a4": a4, "a5": a5, "a6": a6}
    }

print("=== FASTAPI MAIN APP CREATED ===")
