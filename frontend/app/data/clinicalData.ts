export interface ClinicalCondition {
  code: string;
  name: string;
  humanName: string;
  category: "Benign" | "Malignant" | "Pre-Malignant";
  color: string;
  description: string;
}

export const CLINICAL_CONDITIONS: Record<string, ClinicalCondition> = {
  nv: {
    code: "nv",
    name: "Melanocytic Nevus",
    humanName: "Benign Mole",
    category: "Benign",
    color: "#F2765E",
    description: "Common harmless mole with balanced pigment network and symmetrical boundaries.",
  },
  mel: {
    code: "mel",
    name: "Malignant Melanoma",
    humanName: "Melanoma",
    category: "Malignant",
    color: "#D94838",
    description: "Atypical skin lesion requiring prompt in-person dermatologic evaluation.",
  },
  bcc: {
    code: "bcc",
    name: "Basal Cell Carcinoma",
    humanName: "Basal Cell Carcinoma",
    category: "Malignant",
    color: "#E56353",
    description: "Common skin condition arising from basal cells, exhibiting translucent micro-vessels.",
  },
  bkl: {
    code: "bkl",
    name: "Benign Keratosis",
    humanName: "Seborrheic Keratosis",
    category: "Benign",
    color: "#8DA798",
    description: "Gentle non-cancerous skin growth with keratin plugs and distinct contours.",
  },
  akiec: {
    code: "akiec",
    name: "Actinic Keratosis",
    humanName: "Actinic Keratosis",
    category: "Pre-Malignant",
    color: "#E29578",
    description: "Sun-induced pre-cancerous scaly spot warranting preventative skin care.",
  },
  vasc: {
    code: "vasc",
    name: "Vascular Lesion",
    humanName: "Vascular Lesion",
    category: "Benign",
    color: "#DDA15E",
    description: "Harmless cluster of blood vessels (cherry angioma) showing benign red lacunae.",
  },
  df: {
    code: "df",
    name: "Dermatofibroma",
    humanName: "Dermatofibroma",
    category: "Benign",
    color: "#BC6C25",
    description: "Firm, harmless dermal nodule with soft peripheral pigment ring.",
  },
};

export interface AgentCareCheckpoint {
  stepNumber: number;
  title: string;
  simpleExplanation: string;
  statusText: string;
  statusType: "success" | "warning" | "neutral" | "caution";
  detailNote: string;
}

export interface PatientCase {
  id: string;
  scanId: string;
  patientName: string;
  patientInitials: string;
  avatarBg: string;
  age: number;
  sex: "Female" | "Male";
  location: string;
  imageUrl: string;
  detectedCondition: string;
  humanConditionName: string;
  confidence: number;
  confidenceLabel: string;
  riskLevel: "Low Risk" | "Moderate Risk" | "High Risk";
  riskSubtitle: string;
  careAction: "Safe — Routine Self-Check" | "Book Dermatologist Visit" | "Retake Clearer Photo";
  careActionPill: string;
  careActionReason: string;
  symmetryScore: string;
  borderScore: string;
  colorScore: string;
  careTeamCheckpoints: AgentCareCheckpoint[];
  doctorNote: {
    title: string;
    guidance: string;
    recommendedTimeline: string;
    sunCareTip: string;
  };
  conditionSpectrum: { name: string; percentage: number; isTop?: boolean }[];
}

export const CLINIC_PATIENTS: PatientCase[] = [
  {
    id: "patient-1",
    scanId: "#24693",
    patientName: "Eleanor Vance",
    patientInitials: "EV",
    avatarBg: "from-[#FAD0C4] to-[#FFD1FF]",
    age: 45,
    sex: "Female",
    location: "Upper Arm",
    imageUrl: "/samples/ISIC_0024693.jpg",
    detectedCondition: "Melanocytic Nevus",
    humanConditionName: "Benign Mole",
    confidence: 94,
    confidenceLabel: "94% Confidence",
    riskLevel: "Low Risk",
    riskSubtitle: "Symmetric Shape • Baseline Population Risk",
    careAction: "Safe — Routine Self-Check",
    careActionPill: "Safe for Routine Monitoring",
    careActionReason: "Regular borders and harmonious pigmentation show no warning signs. Safe for regular home monitoring.",
    symmetryScore: "92% Regular",
    borderScore: "Smooth & Defined",
    colorScore: "Even Tone",
    careTeamCheckpoints: [
      {
        stepNumber: 1,
        title: "Photo Clarity",
        simpleExplanation: "Sharp focus & lighting verified",
        statusText: "Optimal Clarity",
        statusType: "success",
        detailNote: "Dermoscopic photo meets clarity standards with zero motion blur or light reflection.",
      },
      {
        stepNumber: 2,
        title: "Visual Analysis",
        simpleExplanation: "Matches benign mole pattern",
        statusText: "94% Match",
        statusType: "success",
        detailNote: "Cellular texture and pigment distribution align with healthy melanocytic tissue.",
      },
      {
        stepNumber: 3,
        title: "Shape & Borders",
        simpleExplanation: "Symmetric shape, even tone",
        statusText: "Balanced",
        statusType: "neutral",
        detailNote: "Both horizontal and vertical axes show architectural harmony without jagged edges.",
      },
      {
        stepNumber: 4,
        title: "Patient Profile",
        simpleExplanation: "Low risk for age & body area",
        statusText: "Typical Profile",
        statusType: "success",
        detailNote: "Demographics on upper arm site show low historical frequency of skin irregularities.",
      },
      {
        stepNumber: 5,
        title: "Safety Check",
        simpleExplanation: "Double-checked — no red flags",
        statusText: "Cleared",
        statusType: "success",
        detailNote: "All 5 safety guardrails confirmed zero signs of atypical cell expansion.",
      },
    ],
    doctorNote: {
      title: "Self-Check Guidelines",
      guidance: "This mole displays healthy characteristics. Check your skin once a month using a mirror, looking for any unexpected shifts in size, shape, or shade.",
      recommendedTimeline: "Annual routine skin wellness exam",
      sunCareTip: "Apply broad-spectrum SPF 30+ when exposed to direct sunlight.",
    },
    conditionSpectrum: [
      { name: "Benign Mole", percentage: 94, isTop: true },
      { name: "Seborrheic Keratosis", percentage: 3 },
      { name: "Melanoma", percentage: 1 },
      { name: "Basal Cell Carcinoma", percentage: 1 },
      { name: "Vascular Lesion", percentage: 1 },
    ],
  },
  {
    id: "patient-2",
    scanId: "#31023",
    patientName: "Bruce William",
    patientInitials: "BW",
    avatarBg: "from-[#FEE140] to-[#FA709A]",
    age: 60,
    sex: "Male",
    location: "Chest Wall",
    imageUrl: "/samples/ISIC_0031023.jpg",
    detectedCondition: "Malignant Melanoma",
    humanConditionName: "Melanoma",
    confidence: 89,
    confidenceLabel: "89% Suspicion",
    riskLevel: "High Risk",
    riskSubtitle: "Asymmetrical Edge • Trunk Site Priority",
    careAction: "Book Dermatologist Visit",
    careActionPill: "Priority Specialist Review",
    careActionReason: "Irregular boundaries and pigment variegation require immediate in-person dermatologic evaluation.",
    symmetryScore: "42% Asymmetric",
    borderScore: "Notched & Jagged",
    colorScore: "Multi-Toned Dark",
    careTeamCheckpoints: [
      {
        stepNumber: 1,
        title: "Photo Clarity",
        simpleExplanation: "Sharp focus, optimal pigment visibility",
        statusText: "Optimal Clarity",
        statusType: "success",
        detailNote: "Dermoscopy provides high-resolution visualization across atypical zones.",
      },
      {
        stepNumber: 2,
        title: "Visual Analysis",
        simpleExplanation: "Displays atypical pigment network",
        statusText: "Attention Flag",
        statusType: "warning",
        detailNote: "Identified marked atypical pigment network requiring diagnostic confirmation.",
      },
      {
        stepNumber: 3,
        title: "Shape & Borders",
        simpleExplanation: "Multi-colored with uneven borders",
        statusText: "High Variance",
        statusType: "warning",
        detailNote: "Four distinct color zones identified alongside scalloped borders.",
      },
      {
        stepNumber: 4,
        title: "Patient Profile",
        simpleExplanation: "Higher risk area for patient profile",
        statusText: "Elevated Risk",
        statusType: "caution",
        detailNote: "Trunk localization in patients over 55 carries heightened melanoma prevalence.",
      },
      {
        stepNumber: 5,
        title: "Safety Check",
        simpleExplanation: "Safety protocol triggered referral",
        statusText: "Review Mandated",
        statusType: "warning",
        detailNote: "Guardrail prevents automated discharge and dispatches priority referral.",
      },
    ],
    doctorNote: {
      title: "Specialist Consultation Advisory",
      guidance: "Due to noticeable variations in color and border contours, an in-person dermatoscope assessment and potential biopsy are strongly advised.",
      recommendedTimeline: "Schedule within the next 7 business days",
      sunCareTip: "Keep the area covered and shielded from UV exposure until examined.",
    },
    conditionSpectrum: [
      { name: "Melanoma", percentage: 89, isTop: true },
      { name: "Seborrheic Keratosis", percentage: 5 },
      { name: "Benign Mole", percentage: 4 },
      { name: "Actinic Keratosis", percentage: 1 },
      { name: "Basal Cell Carcinoma", percentage: 1 },
    ],
  },
  {
    id: "patient-3",
    scanId: "#28155",
    patientName: "Arthur Pendelton",
    patientInitials: "AP",
    avatarBg: "from-[#A18CD1] to-[#FBC2EB]",
    age: 50,
    sex: "Male",
    location: "Upper Back",
    imageUrl: "/samples/ISIC_0028155.jpg",
    detectedCondition: "Basal Cell Carcinoma",
    humanConditionName: "Basal Cell Carcinoma",
    confidence: 91,
    confidenceLabel: "91% Match",
    riskLevel: "Moderate Risk",
    riskSubtitle: "Pearly Papule • Sun-Exposed Back",
    careAction: "Book Dermatologist Visit",
    careActionPill: "Clinic Visit Recommended",
    careActionReason: "Pearly texture and delicate micro-vessels characteristic of basal cell carcinoma require clinical margin check.",
    symmetryScore: "58% Irregular",
    borderScore: "Telangiectatic Edge",
    colorScore: "Translucent White-Pink",
    careTeamCheckpoints: [
      {
        stepNumber: 1,
        title: "Photo Clarity",
        simpleExplanation: "Sharp epidermal surface detail",
        statusText: "Optimal Clarity",
        statusType: "success",
        detailNote: "Fine superficial micro-vascular structures clearly resolved.",
      },
      {
        stepNumber: 2,
        title: "Visual Analysis",
        simpleExplanation: "Characteristic basal cell signature",
        statusText: "91% Match",
        statusType: "warning",
        detailNote: "Micro-vessel branching matches non-melanoma carcinoma presentation.",
      },
      {
        stepNumber: 3,
        title: "Shape & Borders",
        simpleExplanation: "Subtle central depression observed",
        statusText: "Moderate Relief",
        statusType: "caution",
        detailNote: "Surface elevation exhibits classic pearly borders.",
      },
      {
        stepNumber: 4,
        title: "Patient Profile",
        simpleExplanation: "Upper back site with sun exposure",
        statusText: "Elevated Risk",
        statusType: "caution",
        detailNote: "Cumulative sun exposure on upper back elevates non-melanoma skin risk.",
      },
      {
        stepNumber: 5,
        title: "Safety Check",
        simpleExplanation: "Protocol dispatched for in-clinic review",
        statusText: "Doctor Referral",
        statusType: "warning",
        detailNote: "Automated triage safely withheld to ensure proper professional removal.",
      },
    ],
    doctorNote: {
      title: "Clinic Visit Guidance",
      guidance: "Basal cell lesions are very slow growing and highly treatable with simple outpatient excision. Avoid picking or scratching the site.",
      recommendedTimeline: "Consultation recommended within 2 to 3 weeks",
      sunCareTip: "Wear UPF sun-protective clothing on the back and shoulders.",
    },
    conditionSpectrum: [
      { name: "Basal Cell Carcinoma", percentage: 91, isTop: true },
      { name: "Actinic Keratosis", percentage: 4 },
      { name: "Melanoma", percentage: 2 },
      { name: "Benign Mole", percentage: 2 },
      { name: "Seborrheic Keratosis", percentage: 1 },
    ],
  },
  {
    id: "patient-4",
    scanId: "#26769",
    patientName: "Claire Laurent",
    patientInitials: "CL",
    avatarBg: "from-[#84FAB0] to-[#8FD3F4]",
    age: 80,
    sex: "Male",
    location: "Scalp",
    imageUrl: "/samples/ISIC_0026769.jpg",
    detectedCondition: "Benign Keratosis",
    humanConditionName: "Seborrheic Keratosis",
    confidence: 89,
    confidenceLabel: "89% Certainty",
    riskLevel: "Low Risk",
    riskSubtitle: "Stuck-on Keratin • Non-Cancerous",
    careAction: "Safe — Routine Self-Check",
    careActionPill: "Harmless Growth",
    careActionReason: "Classic seborrheic keratosis features. Completely benign non-cancerous growth that requires no surgical removal.",
    symmetryScore: "86% Rounded",
    borderScore: "Distinct Contours",
    colorScore: "Uniform Tan-Brown",
    careTeamCheckpoints: [
      {
        stepNumber: 1,
        title: "Photo Clarity",
        simpleExplanation: "High resolution capture of keratin plugs",
        statusText: "Optimal Clarity",
        statusType: "success",
        detailNote: "Distinct pseudo-horn cysts clearly captured without shadow flare.",
      },
      {
        stepNumber: 2,
        title: "Visual Analysis",
        simpleExplanation: "Consistent with seborrheic keratosis",
        statusText: "89% Match",
        statusType: "success",
        detailNote: "Epithelial architecture matches harmless age-related keratosis.",
      },
      {
        stepNumber: 3,
        title: "Shape & Borders",
        simpleExplanation: "Well-circumscribed stuck-on plaque",
        statusText: "Stable Shape",
        statusType: "neutral",
        detailNote: "No invasive border transitions detected into surrounding dermis.",
      },
      {
        stepNumber: 4,
        title: "Patient Profile",
        simpleExplanation: "Very common in senior demographics",
        statusText: "Expected Feature",
        statusType: "success",
        detailNote: "Extremely common benign growth in mature adults; zero malignancy markers.",
      },
      {
        stepNumber: 5,
        title: "Safety Check",
        simpleExplanation: "Cleared without health concern",
        statusText: "Approved",
        statusType: "success",
        detailNote: "Malignancy probability mass remains at negligible 4.5%.",
      },
    ],
    doctorNote: {
      title: "Reassurance & Skin Care",
      guidance: "Seborrheic keratoses are natural, harmless spots that often appear as we mature. They do not turn into skin cancer and can be left alone safely.",
      recommendedTimeline: "Standard annual wellness exam",
      sunCareTip: "Wear a wide-brimmed hat outdoors to protect scalp skin from sunburn.",
    },
    conditionSpectrum: [
      { name: "Seborrheic Keratosis", percentage: 89, isTop: true },
      { name: "Benign Mole", percentage: 6 },
      { name: "Melanoma", percentage: 2 },
      { name: "Actinic Keratosis", percentage: 2 },
      { name: "Basal Cell Carcinoma", percentage: 1 },
    ],
  },
  {
    id: "patient-5",
    scanId: "#29360",
    patientName: "David Miller",
    patientInitials: "DM",
    avatarBg: "from-[#FF9A8B] to-[#FF6A88]",
    age: 70,
    sex: "Male",
    location: "Forearm",
    imageUrl: "/samples/ISIC_0029360.jpg",
    detectedCondition: "Actinic Keratosis",
    humanConditionName: "Actinic Keratosis",
    confidence: 85,
    confidenceLabel: "85% Match",
    riskLevel: "Moderate Risk",
    riskSubtitle: "Pre-Cancerous Scaly Spot • Sun Exposure",
    careAction: "Book Dermatologist Visit",
    careActionPill: "Preventative Treatment Advised",
    careActionReason: "Rough scaly texture from sun exposure. Simple preventative cryotherapy or topical cream resolves the spot before it progresses.",
    symmetryScore: "68% Moderate",
    borderScore: "Rosette Scaly Edge",
    colorScore: "Pink Erythematous",
    careTeamCheckpoints: [
      {
        stepNumber: 1,
        title: "Photo Clarity",
        simpleExplanation: "Clear focus on dermal scale texture",
        statusText: "Optimal Clarity",
        statusType: "success",
        detailNote: "Superficial flaking and follicular openings well resolved.",
      },
      {
        stepNumber: 2,
        title: "Visual Analysis",
        simpleExplanation: "Identifies actinic keratosis markers",
        statusText: "85% Match",
        statusType: "caution",
        detailNote: "Matches early sun-induced intraepidermal dysplasia.",
      },
      {
        stepNumber: 3,
        title: "Shape & Borders",
        simpleExplanation: "Mild irregular redness with dry scales",
        statusText: "Superficial",
        statusType: "caution",
        detailNote: "Strawberry pattern background typical of actinic sun spots.",
      },
      {
        stepNumber: 4,
        title: "Patient Profile",
        simpleExplanation: "Common in sun-exposed forearm skin",
        statusText: "Sun History",
        statusType: "caution",
        detailNote: "Long-term UV exposure increases likelihood of solar keratosis.",
      },
      {
        stepNumber: 5,
        title: "Safety Check",
        simpleExplanation: "Preventative checkup recommended",
        statusText: "Review Flag",
        statusType: "warning",
        detailNote: "Preventative dermatology consultation advised to clear pre-cancerous cells.",
      },
    ],
    doctorNote: {
      title: "Preventative Care Advice",
      guidance: "Actinic keratoses are very easy to treat in clinic using gentle liquid nitrogen freezing or soothing prescription creams.",
      recommendedTimeline: "Consultation recommended within 3 to 4 weeks",
      sunCareTip: "Apply mineral sunscreen daily to forearms and backs of hands.",
    },
    conditionSpectrum: [
      { name: "Actinic Keratosis", percentage: 85, isTop: true },
      { name: "Basal Cell Carcinoma", percentage: 7 },
      { name: "Seborrheic Keratosis", percentage: 5 },
      { name: "Melanoma", percentage: 2 },
      { name: "Benign Mole", percentage: 1 },
    ],
  },
  {
    id: "patient-6",
    scanId: "#31197",
    patientName: "Sophia Zhang",
    patientInitials: "SZ",
    avatarBg: "from-[#FFECD2] to-[#FCB69F]",
    age: 20,
    sex: "Female",
    location: "Forearm",
    imageUrl: "/samples/ISIC_0031197.jpg",
    detectedCondition: "Vascular Lesion",
    humanConditionName: "Vascular Lesion",
    confidence: 96,
    confidenceLabel: "96% Certainty",
    riskLevel: "Low Risk",
    riskSubtitle: "Cherry Angioma • Innocent Vessel Cluster",
    careAction: "Safe — Routine Self-Check",
    careActionPill: "Harmless Blood Vessel",
    careActionReason: "Healthy red-purple lacunae confirm a completely harmless vascular angioma with zero cancer risk.",
    symmetryScore: "95% Circular",
    borderScore: "Smooth & Distinct",
    colorScore: "Deep Wine Red",
    careTeamCheckpoints: [
      {
        stepNumber: 1,
        title: "Photo Clarity",
        simpleExplanation: "Vivid color fidelity and crisp margin",
        statusText: "Optimal Clarity",
        statusType: "success",
        detailNote: "Rich red-blue vascular pools captured with high illumination fidelity.",
      },
      {
        stepNumber: 2,
        title: "Visual Analysis",
        simpleExplanation: "Matches vascular angioma profile",
        statusText: "96% Match",
        statusType: "success",
        detailNote: "Vascular lacunae verified with zero melanocytic pigment network.",
      },
      {
        stepNumber: 3,
        title: "Shape & Borders",
        simpleExplanation: "Compact, well-defined oval perimeter",
        statusText: "Symmetrical",
        statusType: "neutral",
        detailNote: "No spreading or bleeding contours noted.",
      },
      {
        stepNumber: 4,
        title: "Patient Profile",
        simpleExplanation: "Healthy baseline with minimal risk",
        statusText: "Normal Profile",
        statusType: "success",
        detailNote: "Young patient profile with negligible risk index (0.45x baseline).",
      },
      {
        stepNumber: 5,
        title: "Safety Check",
        simpleExplanation: "Zero flags — fully cleared",
        statusText: "Approved",
        statusType: "success",
        detailNote: "Malignancy probability mass remains at an innocent 1.1%.",
      },
    ],
    doctorNote: {
      title: "Patient Reassurance Note",
      guidance: "Cherry angiomas are innocent collections of tiny capillary vessels. They are completely harmless and require no medical intervention.",
      recommendedTimeline: "Annual wellness checkup",
      sunCareTip: "Standard daily sunscreen protection.",
    },
    conditionSpectrum: [
      { name: "Vascular Lesion", percentage: 96, isTop: true },
      { name: "Benign Mole", percentage: 2 },
      { name: "Melanoma", percentage: 1 },
      { name: "Seborrheic Keratosis", percentage: 1 },
    ],
  },
];

// Clinic Directory Queue Data (for Tab 2: Clinic Records)
export interface ClinicRecordEntry {
  id: string;
  patientName: string;
  patientInitials: string;
  avatarBg: string;
  age: number;
  sex: "Female" | "Male";
  scanDate: string;
  location: string;
  conditionName: string;
  confidence: number;
  status: "Routine Care" | "Doctor Referral" | "Review Required";
  statusColor: "emerald" | "coral" | "amber";
  imageUrl: string;
}

export const RECENT_CLINIC_RECORDS: ClinicRecordEntry[] = [
  {
    id: "rec-1",
    patientName: "Eleanor Vance",
    patientInitials: "EV",
    avatarBg: "from-[#FAD0C4] to-[#FFD1FF]",
    age: 45,
    sex: "Female",
    scanDate: "Today, 10:15 AM",
    location: "Upper Arm",
    conditionName: "Benign Mole",
    confidence: 94,
    status: "Routine Care",
    statusColor: "emerald",
    imageUrl: "/samples/ISIC_0024693.jpg",
  },
  {
    id: "rec-2",
    patientName: "Bruce William",
    patientInitials: "BW",
    avatarBg: "from-[#FEE140] to-[#FA709A]",
    age: 60,
    sex: "Male",
    scanDate: "Today, 09:30 AM",
    location: "Chest Wall",
    conditionName: "Melanoma (Suspect)",
    confidence: 89,
    status: "Doctor Referral",
    statusColor: "coral",
    imageUrl: "/samples/ISIC_0031023.jpg",
  },
  {
    id: "rec-3",
    patientName: "Arthur Pendelton",
    patientInitials: "AP",
    avatarBg: "from-[#A18CD1] to-[#FBC2EB]",
    age: 50,
    sex: "Male",
    scanDate: "Yesterday, 04:20 PM",
    location: "Upper Back",
    conditionName: "Basal Cell Carcinoma",
    confidence: 91,
    status: "Doctor Referral",
    statusColor: "coral",
    imageUrl: "/samples/ISIC_0028155.jpg",
  },
  {
    id: "rec-4",
    patientName: "Claire Laurent",
    patientInitials: "CL",
    avatarBg: "from-[#84FAB0] to-[#8FD3F4]",
    age: 80,
    sex: "Male",
    scanDate: "Yesterday, 02:45 PM",
    location: "Scalp",
    conditionName: "Seborrheic Keratosis",
    confidence: 89,
    status: "Routine Care",
    statusColor: "emerald",
    imageUrl: "/samples/ISIC_0026769.jpg",
  },
  {
    id: "rec-5",
    patientName: "David Miller",
    patientInitials: "DM",
    avatarBg: "from-[#FF9A8B] to-[#FF6A88]",
    age: 70,
    sex: "Male",
    scanDate: "Oct 29, 11:10 AM",
    location: "Forearm",
    conditionName: "Actinic Keratosis",
    confidence: 85,
    status: "Doctor Referral",
    statusColor: "coral",
    imageUrl: "/samples/ISIC_0029360.jpg",
  },
  {
    id: "rec-6",
    patientName: "Sophia Zhang",
    patientInitials: "SZ",
    avatarBg: "from-[#FFECD2] to-[#FCB69F]",
    age: 20,
    sex: "Female",
    scanDate: "Oct 29, 09:15 AM",
    location: "Forearm",
    conditionName: "Vascular Lesion",
    confidence: 96,
    status: "Routine Care",
    statusColor: "emerald",
    imageUrl: "/samples/ISIC_0031197.jpg",
  },
  {
    id: "rec-7",
    patientName: "Julian Thorne",
    patientInitials: "JT",
    avatarBg: "from-[#C1DFC4] to-[#DEECDD]",
    age: 34,
    sex: "Male",
    scanDate: "Oct 28, 03:50 PM",
    location: "Lower Leg",
    conditionName: "Dermatofibroma",
    confidence: 83,
    status: "Routine Care",
    statusColor: "emerald",
    imageUrl: "/samples/ISIC_0024693.jpg",
  },
  {
    id: "rec-8",
    patientName: "Helena Rostova",
    patientInitials: "HR",
    avatarBg: "from-[#FFD1FF] to-[#FAD0C4]",
    age: 58,
    sex: "Female",
    scanDate: "Oct 28, 01:25 PM",
    location: "Collarbone",
    conditionName: "Benign Mole",
    confidence: 92,
    status: "Routine Care",
    statusColor: "emerald",
    imageUrl: "/samples/ISIC_0026769.jpg",
  },
];

// Clinic Health Trends (Tab 3: Insights)
export const CLINIC_INSIGHTS_DATA = {
  totalPatientsScreened: 1944,
  routineCareRate: 53.4, // %
  specialistReferralRate: 46.6, // %
  earlyDetectionAccuracy: 96.4, // sensitivity on suspicious conditions
  overallDiagnosticAgreement: 83.3, // %
  conditionsBreakdown: [
    { name: "Benign Moles", count: 1294, share: 66.6, color: "#F2765E" },
    { name: "Seborrheic Keratoses", count: 213, share: 11.0, color: "#8DA798" },
    { name: "Melanomas Detected", count: 222, share: 11.4, color: "#D94838" },
    { name: "Basal Cell Carcinomas", count: 99, share: 5.1, color: "#E56353" },
    { name: "Actinic Keratoses", count: 67, share: 3.4, color: "#E29578" },
    { name: "Vascular Lesions", count: 27, share: 1.4, color: "#DDA15E" },
    { name: "Dermatofibromas", count: 22, share: 1.1, color: "#BC6C25" },
  ],
  diagnosticMatrix: [
    { condition: "Actinic Keratosis", cases: 67, agreement: 80.6, specialistAction: "100% Routed to Clinic" },
    { condition: "Basal Cell Carcinoma", cases: 99, agreement: 86.9, specialistAction: "100% Routed to Clinic" },
    { condition: "Seborrheic Keratosis", cases: 213, agreement: 83.6, specialistAction: "Autonomous Reassurance" },
    { condition: "Dermatofibroma", cases: 22, agreement: 72.7, specialistAction: "Autonomous Routine Care" },
    { condition: "Melanoma", cases: 222, agreement: 83.3, specialistAction: "100% Priority Referral" },
    { condition: "Benign Mole", cases: 1294, agreement: 92.0, specialistAction: "Safe Home Monitoring" },
    { condition: "Vascular Lesion", cases: 27, agreement: 96.3, specialistAction: "Autonomous Reassurance" },
  ],
};
