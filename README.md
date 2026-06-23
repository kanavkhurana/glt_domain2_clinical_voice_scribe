# Clinical Voice Scribe + Triage

VS Code-ready full-stack MVP for the AI Bootcamp clinical scribe project.

## Architecture

- `frontend/` — React + Vite app for Vercel
- `backend/` — Node/Express API for Railway
- `backend/prompts/` — separated prompts
- `backend/knowledge/` — original knowledge artefacts provided for the project

## Original knowledge artefacts included

- `P2_BRIEF.md`
- `P2_icmr_clinical_protocols.txt`
- `P2_drug_interactions_db.json`
- `P2_soap_note_examples.txt`
- `P2_consultations_transcripts.json`
- `P2_eval_set_template.csv`

## Local setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Update `backend/.env` with:

```env
OPENAI_KEY=your_key
SARVAM_API_KEY=your_key
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the local Vite URL.

## Deployment

### Railway backend

1. Create a Railway project.
2. Set root directory to `backend`.
3. Add env vars:
   - `OPENAI_KEY`
   - `SARVAM_API_KEY`
   - `FRONTEND_ORIGIN=https://your-vercel-url.vercel.app`
4. Deploy.

### Vercel frontend

1. Import repo/project.
2. Set root directory to `frontend`.
3. Add env var:
   - `VITE_API_URL=https://your-railway-url.up.railway.app`
4. Deploy.

## Important clinical safety notes

This is a prototype for demo/education. It must not be used for real clinical care without proper compliance, validation, security review, clinician sign-off, and regulatory/legal review.

The app is designed to:
- avoid diagnosis by AI
- avoid prescribing by AI
- list only medication mentioned by the doctor
- require physician review before saving
- use provided knowledge artefacts for RAG-style retrieval
