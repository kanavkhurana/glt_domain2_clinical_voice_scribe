import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "../../data/consultations.json");

function readAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeAll(records) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

export async function saveConsultation(data) {
  const records = readAll();
  records.push(data);
  writeAll(records);
  return data.id;
}

export async function getConsultations(date) {
  const records = readAll();
  if (!date) return records;
  return records.filter(r => r.date === date);
}

export async function approveConsultation(id) {
  const records = readAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) throw new Error(`Consultation ${id} not found`);
  records[idx].approved = true;
  records[idx].approvedAt = new Date().toISOString();
  writeAll(records);
}

export async function updateConsultationSoap(id, soap) {
  const records = readAll();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) throw new Error(`Consultation ${id} not found`);
  records[idx].soap = soap;
  records[idx].updatedAt = new Date().toISOString();
  writeAll(records);
}
