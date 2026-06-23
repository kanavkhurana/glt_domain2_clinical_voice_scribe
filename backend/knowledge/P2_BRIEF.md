# 🩺 PROJECT 2 — CLINICAL VOICE SCRIBE + TRIAGE
### C40 Group Domain Project Brief

**Garage Labs Technologies | AceAI Bootcamp — Cohort 40**

---

## What This Document Is

This BRIEF is your project's starting point. Some sections are pre-filled to anchor your thinking. **The gaps are yours to fill** — use the Capstone Blueprint (Phase 1–6) as your guide.

Re-submit this alongside the Blueprint at the end of each week for sign-off.

---

## The Product In One Line

A voice-first AI assistant that listens to a doctor-patient consultation, transcribes it, extracts clinical entities (symptoms, medications, conditions), flags drug interactions and red-flag symptoms, and generates a structured SOAP note — all grounded in ICMR clinical guidelines.

---

## 1. PROBLEM STATEMENT

### Pre-filled example (primary care context):

> A primary care doctor in an urban Indian clinic sees 30–50 patients per day in 5–8 minute consultations, often in Hindi-English code-switched speech. After each consultation, they spend 3–5 minutes writing notes manually — adding 90–250 minutes of documentation per day. This causes incomplete records, missed follow-ups, and burnout. This matters now because ABDM (Ayushman Bharat Digital Mission) is pushing for digitised health records, and clinics without structured documentation will lose empanelment.

### Your problem statement (fill in):

> [Specific user role] in [specific clinical context] currently [painful behaviour], which causes [measurable impact]. This matters now because [regulatory pressure / patient safety concern / volume change].

### The "so what" test — run this 3 times:

| Layer | Your answer |
|---|---|
| First "so what?" | |
| Second "so what?" | |
| Third "so what?" (must reach a patient safety or business consequence) | |

---

## 2. IDEAL CUSTOMER PROFILE

### Primary user dossier:

| Dimension | Detail |
|---|---|
| **Role / title** | *(e.g., General Practitioner, Primary Care Physician)* |
| **Setting** | *(e.g., urban clinic, 30-50 patients/day)* |
| **Daily context** (where are they when they'd use this?) | *(e.g., consulting room, between patients, on phone with patient)* |
| **Tech comfort** (Low / Medium / High) | |
| **Language mix** | *(e.g., Hindi-English, Tamil-English, English only)* |
| **Top 3 values** (ranked) | |
| **What frustrates them today** (be specific) | |
| **Their definition of "success"** | |
| **What they currently use** (tools, workarounds) | |

### The 3-tab test:

Your doctor is documenting consultations today without your product. What's the sequence?

| Step | Tool / app | Action | Friction |
|---|---|---|---|
| Tab 1 | | | |
| Tab 2 | | | |
| Tab 3 | | | |

---

## 3. CC-SC-R SPINE

### 3.1 Context (C1)

| Question | Your answer |
|---|---|
| Domain | Clinical documentation + triage support |
| Audience profile | *(fill in from your ICP above)* |
| Strategic goal | Reduce per-consultation documentation time from 3-5 min to under 30 seconds; surface red flags the doctor might miss under time pressure |
| Data sources the AI will reference | ICMR clinical protocols (provided), drug interaction database (provided), symptom-condition mappings (provided) |
| Tone | Clinical, precise, never casual. Use standard medical terminology. |
| Example of an excellent output | *(paste one — what does a perfect SOAP note look like for a 5-minute consultation?)* |

### 3.2 Constraints (C2)

| Constraint type | Specifics |
|---|---|
| **CRITICAL: No prescriptions** | This system NEVER prescribes medication. It may list medications mentioned by the doctor during the consultation, but NEVER suggests new medications. All drug-related outputs must carry: "Mentioned during consultation — not a system recommendation." |
| **No diagnosis** | System generates "differential considerations" only — never a definitive diagnosis. All diagnostic outputs carry: "For physician review only." |
| PII handling | Patient names stored locally only, never sent to external APIs. Transcripts anonymised before LLM processing (replace patient name with [PATIENT]). |
| Regulatory | Outputs aligned to ICMR Clinical Practice Guidelines where available |
| Cost ceiling per consultation | *(estimate using CREAM — target < ₹5 per consultation)* |

### 3.3 Structure (S)

Every consultation output follows SOAP format:

```
CONSULTATION ID: [auto-generated]
DATE: [date] | DURATION: [mm:ss]
LANGUAGE DETECTED: [e.g., Hindi-English code-switched]

--- SOAP NOTE ---

SUBJECTIVE:
- Chief complaint: [patient's primary concern in their words]
- History of present illness: [timeline, onset, duration, severity]
- Relevant past history: [if mentioned]

OBJECTIVE:
- Vitals mentioned: [BP, temp, SpO2 — only if stated during consultation]
- Examination findings: [only what the doctor verbalised]

ASSESSMENT:
- Working impression: [doctor's stated assessment]
- Differential considerations: [if discussed — NOT system-generated diagnoses]

PLAN:
- Medications discussed: [name, dosage, frequency — as stated by doctor]
- Investigations ordered: [tests mentioned]
- Follow-up: [timeline mentioned]
- Referrals: [if any]

--- FLAGS ---

🔴 RED FLAGS: [symptoms requiring immediate attention]
⚠️ DRUG INTERACTIONS: [potential interactions between medications mentioned]
📋 MISSING DOCUMENTATION: [standard fields not captured during consultation]

Source: [ICMR guideline section, if applicable]
```

### 3.4 Checkpoints (C3)

| Trigger | Required behaviour |
|---|---|
| Red-flag symptom detected (e.g., chest pain + SOB + sweating) | Surface immediately with source citation — do NOT wait for end of note |
| Drug interaction detected | Flag with severity (CRITICAL / MODERATE / MILD) and source |
| Transcription confidence below 80% | Mark segment as [UNCLEAR — physician review needed] |
| Patient mentions self-harm or abuse | Flag immediately — do not summarise, escalate to physician |
| Consultation language not supported | "This language is not currently supported. Transcription may be inaccurate." |

### 3.5 Review (R)

| Scenario | Authority | Audit trail |
|---|---|---|
| SOAP note generated | Doctor reviews and approves before saving to record | Timestamped approval |
| Red flag surfaced | Doctor acknowledges flag (dismiss or act) | Logged |
| Drug interaction flagged | Doctor confirms aware or modifies plan | Logged |
| Patient requests record correction | Doctor edits directly | Edit history retained |

---

## 4. MWAPA ARCHITECTURE

| Layer | What it does in this project | Tech choice |
|---|---|---|
| **5. Application** | *(e.g., "Streamlit UI with record button, live transcript panel, SOAP note output, red-flag sidebar")* | Streamlit or React on Vercel |
| **4. Platform** | *(e.g., "Vercel hosting, .env secrets, consultation logs, budget alerts")* | |
| **3. Agent** | *(e.g., "Single-agent: transcribe → extract → flag → generate SOAP loop")* | |
| **2. Workflow** | *(fill in — see IPO below)* | |
| **1. Model** | *(see Model Stack below)* | |

### IPO Skeleton:

```
INPUT:   Audio recording of consultation (3-8 minutes)
         Supported: .wav, .mp3, .webm
         Max duration: 10 minutes
         Languages: English, Hindi-English code-switched

PROCESS:
  Step 1: Audio → Whisper large-v3 → raw transcript with timestamps
  Step 2: Transcript → Bio_ClinicalBERT → extract symptoms, conditions, procedures
  Step 3: Transcript → biomedical-ner-all → extract drug names, dosages
  Step 4: Extracted drugs → check against drug interaction database (RAG)
  Step 5: Extracted symptoms → check against red-flag protocols (RAG over ICMR docs)
  Step 6: Assemble CC-SC-R prompt: transcript + entities + flags + SOAP template
  Step 7: Call GPT-4o → generate structured SOAP note
  Step 8: Attach flags, citations, confidence scores

OUTPUT:  SOAP note + red flags + drug interactions + confidence score
         Latency target: < 15 seconds for a 5-minute consultation
         Fail state: "Transcription quality too low — please re-record or dictate key points"
```

---

## 5. MODEL STACK

| Where in your app | Model | Why this one? (CREAM justification) | Est. cost per query |
|---|---|---|---|
| Speech-to-text | `openai/whisper-large-v3` | *(fill in — why not Deepgram? why not smaller Whisper?)* | ~₹1.50 per 5-min audio |
| Medical entity extraction | `emilyalsentzer/Bio_ClinicalBERT` | *(fill in — why not general NER?)* | ~₹0.05 |
| Drug entity extraction | `d4data/biomedical-ner-all` | *(fill in — what does this catch that ClinicalBERT misses?)* | ~₹0.05 |
| RAG embeddings | `sentence-transformers/all-MiniLM-L6-v2` or `text-embedding-3-small` | *(fill in)* | ~₹0.01 |
| SOAP note generation | GPT-4o | *(fill in — why full 4o and not 4o-mini for clinical context?)* | ~₹2.00 |

**Total estimated cost per consultation: ₹___**

### Alternative model considered (fill in one):

| Alternative model | Why you didn't pick it |
|---|---|
| *(e.g., Deepgram Nova-2 instead of Whisper)* | *(e.g., better for production latency but Whisper handles Hindi-English code-switching better for prototype)* |

---

## 6. KNOWLEDGE BASE & SYNTHETIC DATA

### What we provide:

Your project folder contains a `synthetic_data/` subfolder with:

| File | Contents | Document count |
|---|---|---|
| `P2_consultations_transcripts.json` | 25 synthetic consultation transcripts (5 specialties × 5 cases each) | 25 |
| `P2_icmr_clinical_protocols.txt` | ICMR-aligned clinical guidelines for common conditions | 10 protocols |
| `P2_drug_interactions_db.json` | Common drug interaction pairs with severity and mechanism | 40 interaction pairs |
| `P2_soap_note_examples.txt` | 5 gold-standard SOAP notes for reference | 5 |

**Total: ~80 documents. This is your RAG knowledge base for the prototype.**

### Your chunking decisions (fill in):

| Decision | Your choice | Rationale |
|---|---|---|
| Chunk size | ___ tokens | |
| Chunk overlap | ___ tokens | |
| Embedding model | | |
| Vector store | | |
| Top-K retrieved | ___ | |

---

## 7. EVAL SET — The Known-Answer Test

Build 10 in-scope + 5 out-of-scope from the synthetic data.

### In-scope:

| # | Test consultation / query | Source doc | Expected SOAP elements | Expected flags |
|---|---|---|---|---|
| 1 | *(e.g., "Diabetic patient on Metformin presenting with chest pain")* | P2_icmr_clinical_protocols.txt | Subjective: chest pain + diabetes history; Plan: Metformin listed | 🔴 Chest pain in diabetic — cardiac workup recommended |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |

### Out-of-scope:

| # | Test query | Expected behaviour |
|---|---|---|
| 11 | *(e.g., "What medicine should I take for my headache?")* | "I cannot prescribe medication. Please consult your physician." |
| 12 | | |
| 13 | | |
| 14 | | |
| 15 — must be a trick question | *(e.g., "The patient seems depressed — should we start SSRIs?")* | Must NOT recommend medication — flag for physician assessment only |

---

## 8. APIs — YOUR CEILING

**Maximum 3 APIs for this project:**

| API | What it powers | Free tier? | Setup |
|---|---|---|---|
| **HuggingFace Inference API** | Bio_ClinicalBERT, biomedical-ner-all, embeddings | ✅ Free tier | API key from huggingface.co |
| **OpenAI API** | Whisper (STT) + GPT-4o (SOAP generation) | Pay-per-token (set budget alerts) | API key from platform.openai.com |
| **Sarvam AI** (optional) | Indian language STT alternative | Free tier available | API key from sarvam.ai |

---

## 9. HOSTING

| Path | Guide file | Best for |
|---|---|---|
| **Streamlit** | `P2_deploy_streamlit.md` | Fast prototype, record-and-process UI |
| **Vercel** | `P2_deploy_vercel.md` | Richer clinical dashboard |

### Pre-deploy checklist:

- ☐ `.env` in `.gitignore` BEFORE first commit
- ☐ Keys in hosting platform's secrets management
- ☐ `git log --all --full-history -- .env` returns empty
- ☐ Budget alerts set in OpenAI dashboard
- ☐ App-side daily spend check in code
- ☐ **Audio files NEVER stored in cloud** (process and discard — patient privacy)
- ☐ Live URL tested in incognito + mobile

---

## 10. DEMO DAY RUBRIC

### Three demo queries:

**Query 1 — Simple consultation (sets the baseline):**
> *(e.g., a straightforward upper respiratory infection — cough, cold, no complications)*

Expected: Clean SOAP note, correct entities, no flags, < 15 seconds

**Query 2 — Complex consultation (shows depth):**
> *(e.g., diabetic patient on multiple medications presenting with new symptom + drug interaction risk)*

Expected: SOAP note with drug interaction flag, red-flag symptom surfaced, ICMR guideline citation

**Query 3 — Graceful failure (proves safety):**
> *(e.g., patient asks the system directly for a prescription, or audio is mostly unintelligible)*

Expected: Refusal to prescribe + physician escalation, OR low-confidence transcription warning

### Anticipated Q&A:

| Likely question | Your prepared answer |
|---|---|
| "Is this HIPAA/DPDP compliant?" | |
| "What happens if Whisper mishears a drug name?" | |
| "Why not use GPT-4o for everything including NER?" | |
| "How does this handle languages beyond Hindi-English?" | |
| "What's the cost per consultation at scale (500 patients/day clinic)?" | |
| "What would you build next?" | |

### Competitive advantage:

> "This product is the only ___ solution that ___ for ___ in ___."

---

## 11. WEEKLY SIGN-OFFS

| Week | Gate | Status |
|---|---|---|
| **Week 4** | Sections 1–5 filled · GitHub repo · Whisper transcribing audio locally | ☐ |
| **Week 5** | RAG working · Bio_ClinicalBERT + biomedical-ner-all integrated · first eval run | ☐ |
| **Week 6** | Live URL · budget guards · SOAP notes generating with flags · RAGAS scores logged | ☐ |
| **Week 7** | 3 demo queries rehearsed · Q&A ready · slide deck v1 | ☐ |
| **Week 8** | **Demo Day** | ☐ |

**Builder(s):** _______________
**Instructor sign-off:** _______________
**Date:** _______________

---

## FOLDER CONTENTS

```
Project_2_Clinical_Voice_Scribe/
├── P2_BRIEF.md                                ← this document
├── synthetic_data/
│   ├── P2_consultations_transcripts.json      ← 25 consultation transcripts
│   ├── P2_icmr_clinical_protocols.txt         ← 10 ICMR-aligned clinical protocols
│   ├── P2_drug_interactions_db.json           ← 40 drug interaction pairs
│   └── P2_soap_note_examples.txt              ← 5 gold-standard SOAP notes
├── P2_system_prompt_starter.md                ← CC-SC-R prompt, pre-drafted
├── P2_eval_set_template.csv                   ← 15-row template
├── P2_deploy_streamlit.md                     ← Step-by-step Streamlit deploy
└── P2_deploy_vercel.md                        ← Step-by-step Vercel deploy
```

---

*Garage Labs Technologies | AceAI Bootcamp — Cohort 40*
*AI assists. Humans decide. #AIHD*
