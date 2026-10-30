"""
Agentic DermaGuard API Main Entrypoint
Jaypee Agentic AI International Summit 2026
"""

from fastapi import FastAPI

app = FastAPI(
    title="Agentic DermaGuard Clinical Screening Platform",
    description="Multi-Agent Skin Lesion Screening & Triage Clinical Platform",
    version="1.0.0",
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Agentic DermaGuard"}
