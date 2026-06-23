import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const knowledgeDir = path.join(__dirname, "..", "knowledge");

function read(file) {
  return fs.readFileSync(path.join(knowledgeDir, file), "utf8");
}

function splitChunks(text, source, chunkSize = 1800) {
  const paragraphs = text.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > chunkSize && current) {
      chunks.push({ source, text: current });
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push({ source, text: current });
  return chunks;
}

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function score(queryTokens, chunkText) {
  const text = chunkText.toLowerCase();
  let s = 0;
  for (const t of queryTokens) if (text.includes(t)) s += 1;
  return s;
}

let cachedChunks = null;
export function loadKnowledgeChunks() {
  if (cachedChunks) return cachedChunks;

  const chunks = [];
  chunks.push(...splitChunks(read("P2_icmr_clinical_protocols.txt"), "P2_icmr_clinical_protocols.txt"));
  chunks.push(...splitChunks(read("P2_soap_note_examples.txt"), "P2_soap_note_examples.txt"));
  chunks.push(...splitChunks(read("P2_BRIEF.md"), "P2_BRIEF.md"));

  const interactions = JSON.parse(read("P2_drug_interactions_db.json"));
  for (const item of interactions) {
    chunks.push({
      source: "P2_drug_interactions_db.json",
      text: `${item.id}: ${item.drug_a} + ${item.drug_b}\nSeverity: ${item.severity}\nMechanism: ${item.mechanism}\nClinical effect: ${item.clinical_effect}\nRecommendation: ${item.recommendation}\nSource: ${item.source}`
    });
  }

  cachedChunks = chunks;
  return chunks;
}

export function retrieveContext({ transcript = "", entities = "", topK = 8 }) {
  const query = `${transcript}\n${entities}`;
  const tokens = tokenize(query);
  const chunks = loadKnowledgeChunks()
    .map(chunk => ({ ...chunk, score: score(tokens, chunk.text) }))
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    chunks,
    contextText: chunks.map((c, i) => `SOURCE ${i + 1}: ${c.source}\n${c.text}`).join("\n\n---\n\n") || "No high-confidence context retrieved from knowledge artefacts."
  };
}

export function listKnowledgeFiles() {
  return fs.readdirSync(knowledgeDir).filter(f => !f.startsWith("."));
}
