import React, { useState } from "react";
import { useEffect} from "react";
import { fetchDemoTranscripts, fetchKnowledgeFiles, generatePatientSlip, generateSoap, transcribeAudio } from "./api";

export default function App() {
  const [mediaRecorder, setMediaRecorder] = useState(null);
const [recording, setRecording] = useState(false);
const [chunks, setChunks] = useState([]);

const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const localChunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) localChunks.push(event.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(localChunks, { type: "audio/webm" });
    const file = new File([blob], "consultation.webm", { type: "audio/webm" });
    setAudio(file);
  };

  recorder.start();
  setMediaRecorder(recorder);
  setChunks(localChunks);
  setRecording(true);
};

const stopRecording = () => {
  mediaRecorder?.stop();
  setRecording(false);
};

  const [audio, setAudio] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [soap, setSoap] = useState("");
  const [slip, setSlip] = useState("");
  const [sources, setSources] = useState([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [demoCases, setDemoCases] = useState([]);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchKnowledgeFiles().then(setKnowledgeFiles).catch(() => {});
    fetchDemoTranscripts().then(setDemoCases).catch(() => {});
  }, []);

<div className="recordBox">
  {!recording ? (
    <button onClick={startRecording}>🎙️ Start Recording</button>
  ) : (
    <button onClick={stopRecording}>⏹️ Stop Recording</button>
  )}

  {audio && (
    <p>Audio ready: {audio.name}</p>
  )}
</div>

  async function handleTranscribe() {
    if (!audio) return setError("Please upload an audio file first, or paste a transcript directly.");
    setError("");
    setLoading("Transcribing audio with Sarvam...");
    try {
      const result = await transcribeAudio(audio);
      setTranscript(result.transcript || "");
    } catch (e) {
      setError(e.response?.data?.details || e.response?.data?.error || e.message);
    } finally {
      setLoading("");
    }
  }

  async function handleSoap() {
    if (!transcript.trim()) return setError("Please upload/transcribe audio or paste a transcript first.");
    setError("");
    setLoading("Generating extraction + RAG-grounded SOAP note...");
    try {
      const result = await generateSoap(transcript);
      setSoap(result.soap || "");
      setSources(result.sources || []);
      setSlip("");
    } catch (e) {
      setError(e.response?.data?.details || e.response?.data?.error || e.message);
    } finally {
      setLoading("");
    }
  }

  async function handleSlip() {
    if (!soap.trim()) return setError("Generate and review the SOAP note first.");
    setError("");
    setLoading("Generating patient slip...");
    try {
      const result = await generatePatientSlip(soap, language);
      setSlip(result.slip || "");
    } catch (e) {
      setError(e.response?.data?.details || e.response?.data?.error || e.message);
    } finally {
      setLoading("");
    }
  }

  function loadDemoCase(e) {
    const item = demoCases.find(x => x.id === e.target.value);
    if (item) {
      setTranscript(item.transcript);
      setSoap("");
      setSlip("");
      setSources([]);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AI Bootcamp Capstone · Clinical Voice Scribe</p>
          <h1>Clinical Voice Scribe + Triage</h1>
          <p className="subtitle">Audio or transcript → extraction → RAG safety checks → editable SOAP note → patient slip.</p>
        </div>
        <div className="badge">Doctor approval required</div>
      </header>

      {loading && <div className="notice">{loading}</div>}
      {error && <div className="error">{error}</div>}

      <section className="grid two">
        <div className="card">
          <h2>1. Consultation Input</h2>
          <label>Upload audio for Sarvam STT</label>
          <div className="recordBox">
  {!recording ? (
    <button type="button" onClick={startRecording}>
      🎙️ Start Recording
    </button>
  ) : (
    <button type="button" onClick={stopRecording}>
      ⏹️ Stop Recording
    </button>
  )}

  {audio && <p>Audio ready: {audio.name}</p>}
</div>
          <input type="file" accept="audio/*" onChange={e => setAudio(e.target.files?.[0] || null)} />
          <button onClick={handleTranscribe}>Transcribe Audio</button>
          

          <label>Or load a provided demo transcript</label>
          <select onChange={loadDemoCase} defaultValue="">
            <option value="" disabled>Select demo case</option>
            {demoCases.map(c => <option key={c.id} value={c.id}>{c.id} · {c.specialty} · {c.complexity}</option>)}
          </select>

          <label>Transcript</label>
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste Hinglish/English consultation transcript here..." />
          <button className="primary" onClick={handleSoap}>Generate SOAP Note</button>
        </div>

        <div className="card muted-card">
          <h2>Knowledge Artefacts Used</h2>
          <p>This build reads your original bootcamp artefacts from <code>backend/knowledge</code>.</p>
          <ul>
            {knowledgeFiles.map(f => <li key={f}>{f}</li>)}
          </ul>
          <p className="tiny">For Demo Day, use pre-recorded or provided transcripts instead of relying on noisy live audio.</p>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>2. Editable SOAP Review</h2>
          <textarea className="large" value={soap} onChange={e => setSoap(e.target.value)} placeholder="SOAP note will appear here. Doctor can edit before approval." />
          <div className="row">
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              <option>English</option>
              <option>Hindi</option>
            </select>
            <button onClick={handleSlip}>Generate Patient Slip</button>
          </div>
        </div>

        <div className="card">
          <h2>3. Retrieved RAG Sources</h2>
          {sources.length === 0 ? <p>No sources yet.</p> : sources.map((s, idx) => (
            <div className="source" key={`${s.source}-${idx}`}>
              <strong>{idx + 1}. {s.source}</strong>
              <span>score {s.score}</span>
              <p>{s.preview}...</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>4. Patient Slip</h2>
        <textarea className="medium" value={slip} onChange={e => setSlip(e.target.value)} placeholder="Patient-friendly slip will appear here." />
      </section>
    </main>
  );
}
