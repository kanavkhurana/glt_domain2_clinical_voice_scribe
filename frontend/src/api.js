import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function transcribeAudio(audioFile) {
  const form = new FormData();
  form.append("audio", audioFile);
  const res = await axios.post(`${API_URL}/api/transcribe`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
}

export async function generateSoap(transcript) {
  const res = await axios.post(`${API_URL}/api/soap`, { transcript });
  return res.data;
}

export async function generatePatientSlip(soap, language) {
  const res = await axios.post(`${API_URL}/api/patient-slip`, { soap, language });
  return res.data;
}

export async function fetchDemoTranscripts() {
  const res = await axios.get(`${API_URL}/api/eval/demo-transcripts`);
  return res.data;
}

export async function fetchKnowledgeFiles() {
  const res = await axios.get(`${API_URL}/api/eval/knowledge`);
  return res.data.files;
}

export async function fetchConsultations(date) {
  const res = await axios.get(`${API_URL}/api/consultations`, { params: { date } });
  return res.data.consultations;
}

export async function approveConsultation(id) {
  const res = await axios.post(`${API_URL}/api/consultations/${id}/approve`);
  return res.data;
}

export async function updateConsultationSoap(id, soap) {
  const res = await axios.patch(`${API_URL}/api/consultations/${id}/soap`, { soap });
  return res.data;
}
