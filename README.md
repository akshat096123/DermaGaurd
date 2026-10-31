# DermaGuard

> A multi-agent clinical screening platform for skin lesions that evaluates photos through 6 specialized agents and a 4-page triage workflow.

---

## What is DermaGuard?

Most skin cancer screening apps send a photo directly to a single neural network and return a raw percentage. In real clinical practice, that's dangerous:
- If the camera photo is blurry or has flash glare, a standard neural net still guesses, often getting it wrong.
- A model might predict a "benign mole" with 70% confidence while ignoring that the lesion is jagged, bleeding, or located on a high-risk patient.

**DermaGuard** treats screening like a real dermatology clinic. Instead of relying on one black-box model, it passes every case through **6 specialized agents** across a **4-page step-by-step workflow**. Each agent handles one specific medical question: from image quality and neural classification to ABCD geometry, patient demographics, and safety guardrails.

---

## System Architecture

```
                    +---------------------------------------------------+
                    |                 PATIENT SCAN                      |
                    |  Dermoscopic photo + Age, Sex, Lesion Location    |
                    +---------------------------------------------------+
                                              |
                                              v
+===================================================================================+
| PAGE 1: INTAKE        Upload Photo / Smart Camera Capture + Clinical Profile      |
+===================================================================================+
                                              |
                                              v
+===================================================================================+
| PAGE 2: ACQUISITION & NEURAL CLASSIFICATION                                       |
|                                                                                   |
|  [ Image Quality Agent ]                                                          |
|    - Blur check (Laplacian variance)                                              |
|    - Glare & lighting (HSV thresholding & entropy)                                |
|    - Hair / ruler obstruction (Black-hat transform)                               |
|            |                                                                      |
|            +---> If Quality Fails ----> [ GATE 1: RE-IMAGE (Workflow Halts) ]     |
|            |                                                                      |
|            v (If Quality Passes)                                                  |
|  [ Diagnosis Agent ]                                                              |
|    - ConvNeXt-Small deep neural net                                               |
|    - 7-class differential diagnosis (Melanoma, Nevus, BCC, AKIEC, BKL, DF, VASC)  |
+===================================================================================+
                                              |
                                              v
+===================================================================================+
| PAGE 3: LESION MORPHOMETRY & PATIENT CONTEXT                                      |
|                                                                                   |
|  [ Lesion Analysis Agent ]                                                        |
|    - Asymmetry index (contour & moment analysis)                                  |
|    - Border irregularity (compactness & perimeter score)                          |
|    - Color variegation (RGB/HSV standard deviation)                               |
|    - Diameter estimation in millimeters                                           |
|                                                                                   |
|  [ Reasoning / Context Agent ]                                                    |
|    - Patient age group risk multipliers                                           |
|    - Biological sex incidence weighting                                          |
|    - Anatomical lesion location risk (scalp, torso, extremities)                 |
+===================================================================================+
                                              |
                                              v
+===================================================================================+
| PAGE 4: SAFETY GUARDRAILS & CHIEF COORDINATOR                                     |
|                                                                                   |
|  [ Safety Agent ]                                                                 |
|    - Checks uncertainty & entropy spikes                                          |
|    - Compares Agent 2 prediction vs Agent 3 ABCD scores                           |
|    - Flags malignant tail risk (even low-probability melanoma triggers audit)     |
|    - Can trigger an autonomous SAFETY VETO                                        |
|                                                                                   |
|  [ Coordinator Agent ]                                                            |
|    - Combines outputs from Agents 1 through 5                                     |
|    - Assigns final triage verdict via 3 Clinical Decision Gates                   |
+===================================================================================+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
       +----------------------------+                    +----------------------------+
       |       GATE 2: REFER        |                    |    GATE 3: AUTO-TRIAGE     |
       |  Suspected malignancy,     |                    |  Confirmed benign nevus,   |
       |  high ABCD score, or       |                    |  clear margins, low risk,  |
       |  active safety veto.       |                    |  zero safety vetoes.       |
       |  -> Urgent Derm Referral   |                    |  -> Routine monitoring     |
       +----------------------------+                    +----------------------------+
```

---

## The 6 Agents Explained

### Image Quality Agent
Before running any diagnosis, this agent validates that the photo is actually readable.
- **How it works:** Uses OpenCV algorithms (Laplacian variance for blur, HSV brightness masks for specular flash glare, Shannon entropy for exposure, and black-hat morphology for hair/ruler obstruction).
- **Why it matters:** If an image is too blurry or covered by glare, the pipeline immediately halts at **Gate 1 (RE-IMAGE)** so the system never makes a false medical call on bad data.

### Diagnosis Agent
Calculates the statistical likelihood of 7 recognized dermatological conditions using an optimized **ConvNeXt-Small** neural network.
- **7 Diagnostic Classes:**
  1. `mel` - Melanoma
  2. `nv` - Melanocytic Nevus (common mole)
  3. `bcc` - Basal Cell Carcinoma
  4. `akiec` - Actinic Keratosis / Bowen's Disease
  5. `bkl` - Benign Keratosis (seborrheic keratosis, solar lentigo)
  6. `df` - Dermatofibroma
  7. `vasc` - Vascular Lesion (angioma, pyogenic granuloma)

### Lesion Analysis Agent
Evaluates the physical geometry of the lesion using the clinical **ABCD Rule**:
- **A (Asymmetry):** Measures contour symmetry across primary and secondary axes.
- **B (Border):** Calculates edge scalloping and perimeter-to-area irregularity.
- **C (Color):** Measures color variegation across red, blue, brown, black, and white channels.
- **D (Diameter):** Estimates lesion diameter in millimeters against calibration markers.

### Reasoning / Context Agent
Adjusts risk based on who the patient is, not just what the lesion looks like.
- **Inputs:** Age, biological sex, and anatomical location (e.g., sun-exposed scalp vs. torso vs. lower extremities).
- **How it works:** Applies Bayesian prior adjustments so that older patients or high-risk body sites receive tighter clinical scrutiny.

### Safety Agent
The system's safety auditor. Its sole job is to catch edge cases and prevent false negatives.
- Checks prediction entropy (detects when the neural net is guessing).
- Detects discordance (for example, if Agent 2 predicts a benign nevus, but Agent 3 finds high border asymmetry and dark variegation).
- If any red flag appears, it triggers an autonomous **Safety Veto**, overriding a benign classification and escalating to a dermatologist.

### Coordinator Agent
The lead clinician agent that arbitrates all 5 prior agent reports and determines the final triage verdict under three deterministic gates:

| Decision Gate | Trigger Conditions | Clinical Action |
|---|---|---|
| **Gate 1: RE-IMAGE** | Image Quality Agent score below threshold (blur, glare, obstruction) | Workflow halts at Page 2. User must retake photo. |
| **Gate 2: REFER** | High malignancy probability, severe ABCD irregularity, high demographic risk, or Safety Agent veto | Flagged for urgent dermatologist evaluation. |
| **Gate 3: AUTO-TRIAGE** | High-confidence benign condition, clean ABCD scores, concordant agents, zero vetoes | Low-risk reassurance with standard clinical warning. |

---

## 4-Page Workflow Breakdown

```
Page 1: Intake                 Page 2: Quality & Diagnosis
[Upload / Smart Camera]  --->  [Quality Gate: PASS / FAIL]
[Age, Sex, Body Site]          [ConvNeXt 7-Class Predictions]
         |                                  |
         v                                  v
Page 4: Safety & Coordinator   Page 3: Lesion & Context
[Safety Veto Arbitration] <--- [ABCD Geometry Quantification]
[Gate 1 / 2 / 3 Final Triage]  [Bayesian Risk Context]
```

1. **Page 1 (Intake):** Drag-and-drop dermoscopic image upload, real-time camera capture with guidance frame, and patient demographics form.
2. **Page 2 (Quality & Diagnosis):** Displays optical quality check metrics. If usable, unlocks the 7-class probability breakdown.
3. **Page 3 (Lesion & Context):** Displays interactive ABCD radar and metric bars alongside patient epidemiological risk context.
4. **Page 4 (Safety & Coordinator):** Displays the cross-agent concordance audit, safety veto status, and the executive triage decision card with printable summary.

---

## Project Structure

```
DermaGuard/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── quality_agent.py      # Agent 1: OpenCV blur, glare & hair checks
│   │   │   ├── diagnosis_agent.py    # Agent 2: ConvNeXt deep learning model
│   │   │   ├── lesion_agent.py       # Agent 3: ABCD morphometry extraction
│   │   │   ├── context_agent.py      # Agent 4: Bayesian demographic risk
│   │   │   ├── safety_agent.py       # Agent 5: Safety guardrails & veto logic
│   │   │   └── coordinator_agent.py  # Agent 6: Chief triage gate arbiter
│   │   ├── core/
│   │   │   ├── config.py             # Quality thresholds & gating policies
│   │   │   └── schemas.py            # Pydantic data contracts for all 6 agents
│   │   └── main.py                   # FastAPI server & pipeline endpoint
│   └── requirements.txt
│
└── frontend/
    ├── app/
    │   ├── components/
    │   │   ├── Page1Intake.tsx               # Page 1: Upload & patient info
    │   │   ├── Page2QualityDiagnosis.tsx     # Page 2: Agent 1 & Agent 2
    │   │   ├── Page3LesionContext.tsx        # Page 3: Agent 3 & Agent 4
    │   │   ├── Page4SafetyCoordinator.tsx    # Page 4: Agent 5 & Agent 6
    │   │   ├── WorkflowHeader.tsx            # 4-stage stepper navigation
    │   │   └── GuidedSmartCamera.tsx         # Live camera capture with alignment
    │   ├── globals.css                       # Styling & custom themes
    │   └── page.tsx                          # Main workflow state container
    ├── package.json
    └── tailwind.config.ts
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Backend (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`. You can test endpoints via Swagger docs at `http://localhost:8000/docs`.

### 2. Start the Frontend (Next.js)

```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Medical Disclaimer

DermaGuard is an assistive clinical decision-support and screening research project. It does **not** provide definitive medical diagnoses. Any patient with a skin lesion that is evolving, bleeding, itching, or displaying irregular characteristics should consult a licensed dermatologist or medical professional regardless of automated screening results.
