import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Medication, AdherenceLog, EscalationAlert, PatientNote } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with named parameter and correct telemetry headers as instructed.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Seed Initial Data programmatically for high fidelity demonstration
let medications: Medication[] = [
  {
    id: "med-1",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    times: ["08:00", "20:00"],
    category: "Diabetes",
    startDate: "2026-01-10",
    notes: "Take with meals to minimize stomach upset.",
    isActive: true,
    recipientEmail: "sarah.care@example.com",
    recipientPhone: "+1 (555) 019-9281",
    doctorName: "Dr. Evans (Endocrinologist)"
  },
  {
    id: "med-2",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Daily (Morning)",
    times: ["08:00"],
    category: "Heart & Pressure",
    startDate: "2026-02-15",
    notes: "Avoid eating grapefruit or drinking grapefruit juice.",
    isActive: true,
    recipientEmail: "sarah.care@example.com",
    recipientPhone: "+1 (555) 019-9281",
    doctorName: "Dr. Evans (Cardiologist)"
  },
  {
    id: "med-3",
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Daily (Night)",
    times: ["21:00"],
    category: "Cholesterol",
    startDate: "2026-02-15",
    notes: "Take consistently before sleeping.",
    isActive: true,
    recipientEmail: "sarah.care@example.com",
    recipientPhone: "+1 (555) 019-9281",
    doctorName: "Dr. Evans (Cardiologist)"
  },
  {
    id: "med-4",
    name: "Vitamin D3",
    dosage: "1000 IU",
    frequency: "Daily",
    times: ["12:00"],
    category: "Vitamins",
    startDate: "2025-11-01",
    notes: "Support bone health.",
    isActive: true,
    recipientEmail: "sarah.care@example.com",
    recipientPhone: "",
    doctorName: "Dr. Evans (Family Dr)"
  }
];

// Generate past adherence logs programmatically for the last 5 days
let adherenceLogs: AdherenceLog[] = [];
let defaultAlerts: EscalationAlert[] = [];
let patientNotes: PatientNote[] = [
  {
    id: "note-1",
    date: "2026-06-12",
    noteText: "Took the Metformin in the evening, but felt mild nausea afterwards. Ate some crackers and it got better.",
    sentiment: "Neutral & Mild Symptom",
    riskLevel: "Low",
    sideEffects: "Mild nausea",
    riskAnalysis: "The patient is experiencing minor gastrointestinal distress which was manageable with food. No non-compliance behavior identified yet.",
    recommendations: "Encourage taking Metformin with a full meal, not on an empty stomach. Monitor if nausea worsens."
  },
  {
    id: "note-2",
    date: "2026-06-13",
    noteText: "Forgot my morning blood pressure pill (Lisinopril) because we went out for an early breakfast and I left the bottle at home. Felt a minor headache around noon, took it as soon as we got back around 2 PM.",
    sentiment: "Apprehensive / Delayed Taken",
    riskLevel: "Medium",
    sideEffects: "Headache around noon",
    riskAnalysis: "Forgetting medications when leaving the house is a common barrier. The pressure delay can trigger transient symptoms like headaches.",
    recommendations: "Suggest caregiver prepare a small portable medicine container for travel. Set a double-alarm reminder on the phone."
  }
];

// Helper to calculate past dates relative to 2026-06-14 (as per metadata clock)
const seedAdherenceLogs = () => {
  const dates = [
    "2026-06-10",
    "2026-06-11",
    "2026-06-12",
    "2026-06-13",
    "2026-06-14"
  ];

  dates.forEach(d => {
    medications.forEach(med => {
      med.times.forEach(time => {
        // Decide status - make a realistic record
        let status: 'taken' | 'missed' | 'pending' = 'taken';
        let patientNote = "";
        let timestamp = `${d}T${time}:12.000Z`;

        if (d === "2026-06-13") {
          if (med.name === "Metformin" && time === "20:00") {
            status = 'missed'; // simulated missed dose
            timestamp = "";
          }
        }
        if (d === "2026-06-14") {
          // Today's doses
          const timeHour = parseInt(time.split(":")[0]);
          if (timeHour > 12) {
            status = 'pending'; // Future doses today
            timestamp = "";
          } else {
            status = 'taken';
          }
        }

        adherenceLogs.push({
          id: `log-${med.id}-${d}-${time}`,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          scheduledTime: time,
          date: d,
          status,
          timestamp: timestamp || undefined,
          patientNotes: status === 'taken' && d === "2026-06-12" && med.name === "Metformin" ? "Felt mild nausea but took it" : undefined
        });
      });
    });
  });

  // Seed one recent alert matching the 2026-06-13 missed Metformin 20:00 dose
  defaultAlerts.push({
    id: "alert-1",
    medicationId: "med-1",
    medicationName: "Metformin",
    scheduledTime: "20:00",
    date: "2026-06-13",
    severity: "high",
    status: "notified",
    notifiedRole: "Caregiver (Sarah)",
    message: "CRITICAL OVERDUE escalation: Patient William missed evening Metformin (500mg) scheduled for 20:00. Caregiver Sarah (+1-555-019-9281) notified via SMS/Email.",
    timestamp: "2026-06-13T21:15:00.000Z"
  });
};

seedAdherenceLogs();

// API Endpoints

// Get all medications
app.get("/api/medications", (req, res) => {
  res.json(medications);
});

// Add medication
app.post("/api/medications", (req, res) => {
  const newMed: Medication = {
    id: `med-${Date.now()}`,
    ...req.body,
    isActive: true
  };
  medications.push(newMed);

  // Automatically update logs for current date to include pending slots for this new medication
  const today = "2026-06-14";
  newMed.times.forEach(time => {
    adherenceLogs.push({
      id: `log-${newMed.id}-${today}-${time}`,
      medicationId: newMed.id,
      medicationName: newMed.name,
      dosage: newMed.dosage,
      scheduledTime: time,
      date: today,
      status: 'pending'
    });
  });

  res.status(201).json(newMed);
});

// Update medication
app.put("/api/medications/:id", (req, res) => {
  const { id } = req.params;
  const index = medications.findIndex(m => m.id === id);
  if (index !== -1) {
    medications[index] = { ...medications[index], ...req.body };
    res.json(medications[index]);
  } else {
    res.status(404).json({ error: "Medication not found" });
  }
});

// Delete medication
app.delete("/api/medications/:id", (req, res) => {
  const { id } = req.params;
  medications = medications.filter(m => m.id !== id);
  adherenceLogs = adherenceLogs.filter(l => l.medicationId !== id);
  res.json({ success: true });
});

// Get adherence logs
app.get("/api/adherence", (req, res) => {
  res.json(adherenceLogs);
});

// Record taking a dose
app.post("/api/adherence/take", (req, res) => {
  const { medicationId, scheduledTime, date, patientNotes } = req.body;
  const logId = `log-${medicationId}-${date}-${scheduledTime}`;
  
  let log = adherenceLogs.find(l => l.medicationId === medicationId && l.scheduledTime === scheduledTime && l.date === date);
  
  if (!log) {
    const med = medications.find(m => m.id === medicationId);
    log = {
      id: logId,
      medicationId,
      medicationName: med ? med.name : "Unknown",
      dosage: med ? med.dosage : "Dosage",
      scheduledTime,
      date,
      status: 'taken'
    };
    adherenceLogs.push(log);
  }

  log.status = 'taken';
  log.timestamp = new Date().toISOString();
  if (patientNotes) {
    log.patientNotes = patientNotes;
  }

  // Resolve any high/medium alerts for this medicine today/yesterday if any
  defaultAlerts = defaultAlerts.map(alert => {
    if (alert.medicationId === medicationId && alert.date === date && alert.scheduledTime === scheduledTime) {
      return { ...alert, status: 'resolved' };
    }
    return alert;
  });

  res.json(log);
});

// Record missed dose
app.post("/api/adherence/miss", (req, res) => {
  const { medicationId, scheduledTime, date } = req.body;
  const logId = `log-${medicationId}-${date}-${scheduledTime}`;
  
  let log = adherenceLogs.find(l => l.medicationId === medicationId && l.scheduledTime === scheduledTime && l.date === date);
  
  if (!log) {
    const med = medications.find(m => m.id === medicationId);
    log = {
      id: logId,
      medicationId,
      medicationName: med ? med.name : "Unknown",
      dosage: med ? med.dosage : "Dosage",
      scheduledTime,
      date,
      status: 'missed'
    };
    adherenceLogs.push(log);
  } else {
    log.status = 'missed';
  }

  // Generate an escalation alert immediately as missed dose escalation logic
  const med = medications.find(m => m.id === medicationId);
  if (med) {
    const contactInfo = med.recipientPhone ? `Caregiver Sarah (${med.recipientPhone})` : "Caregiver notified";
    const emergencyMsg = `ESCALATION: William missed ${med.name} (${med.dosage}) scheduled for ${scheduledTime} on ${date}. Automated text & email sent to ${contactInfo}.`;
    
    const newAlert: EscalationAlert = {
      id: `alert-${Date.now()}`,
      medicationId,
      medicationName: med.name,
      scheduledTime,
      date,
      severity: 'high',
      status: 'notified',
      notifiedRole: med.recipientPhone ? "Caregiver (Sarah)" : "Doctor / Caregiver",
      message: emergencyMsg,
      timestamp: new Date().toISOString()
    };
    defaultAlerts.push(newAlert);
  }

  res.json(log);
});

// Get escalation alerts
app.get("/api/alerts", (req, res) => {
  res.json(defaultAlerts);
});

// Resolve escalation alert
app.post("/api/alerts/resolve/:id", (req, res) => {
  const { id } = req.params;
  const alert = defaultAlerts.find(a => a.id === id);
  if (alert) {
    alert.status = 'resolved';
    res.json(alert);
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

// Get patient journal notes
app.get("/api/patient-notes", (req, res) => {
  res.json(patientNotes);
});

// AI analysis schema helper using @google/genai types
const AnalysisSchemaType = {
  type: Type.OBJECT,
  description: "Structure for analyzing medication adherence feedback notes",
  properties: {
    sentiment: {
      type: Type.STRING,
      description: "Brief sentiment tag, e.g. 'Frustrated', 'Neutral', 'Grateful', 'Adherence At Risk'"
    },
    riskLevel: {
      type: Type.STRING,
      description: "Risk calculation of missing future doses. Select strictly from: Low, Medium, High"
    },
    riskAnalysis: {
      type: Type.STRING,
      description: "Detailed evaluation of why the patient is expressing reluctance or experiencing problems with their medicines."
    },
    sideEffects: {
      type: Type.STRING,
      description: "Identify any negative medical side effects explicitly or implicitly described (e.g., drowsiness, nausea, vertigo). Write 'None reported' if none."
    },
    recommendations: {
      type: Type.STRING,
      description: "Suggestions for caretakers, family, or clinicians to help circumvent this issue (e.g., changes to timing, diet, organizer boxes)."
    }
  },
  required: ["sentiment", "riskLevel", "riskAnalysis", "sideEffects", "recommendations"]
};

// Insert patient journal note & run AI analysis with Gemini
app.post("/api/patient-notes", async (req, res) => {
  const { noteText, date } = req.body;
  if (!noteText) {
    return res.status(400).json({ error: "Note text is required" });
  }

  const newNote: PatientNote = {
    id: `note-${Date.now()}`,
    date: date || "2026-06-14",
    noteText
  };

  try {
    const prompt = `You are an AI-powered medication adherence clinical safety assistant. Evaluate the following patient/caregiver journal feedback log regarding their medications:
    "${noteText}"
    
    Assess sentiment, risk of missing doses (Low, Medium, or High), identify side effects, explain are there clinical risks, and suggest corrective recommendations. Be precise and empathetic.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: AnalysisSchemaType,
        systemInstruction: "You are an intelligent clinical feedback processor. Categorize symptoms, calculate adherence danger risk levels carefully, and output structured advice."
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text.trim());
      newNote.sentiment = parsed.sentiment;
      newNote.riskLevel = parsed.riskLevel;
      newNote.riskAnalysis = parsed.riskAnalysis;
      newNote.sideEffects = parsed.sideEffects;
      newNote.recommendations = parsed.recommendations;
    } else {
      throw new Error("No response text from Gemini");
    }
  } catch (err: any) {
    console.error("Gemini analysis failed:", err);
    // Fallback if API key is not configured or fails
    newNote.sentiment = "Feedback Logged";
    newNote.riskLevel = "Low";
    newNote.riskAnalysis = "Primary log stored. Cognitive analysis could not be calculated because the AI service reported an error: " + (err.message || "Unknown error");
    newNote.sideEffects = "Awaiting review";
    newNote.recommendations = "Ensure caregiver monitors daily doses closely.";
  }

  patientNotes.unshift(newNote);
  res.status(201).json(newNote);
});

// Start server
async function startServer() {
  // Vite setup for developer server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
