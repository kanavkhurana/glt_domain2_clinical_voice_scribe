import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ragDir = path.join(__dirname, "..", "knowledge", "rag");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX);

// ── 1. Build chunks from both knowledge files ──────────────────────────────

function splitIntoChunks(text, source, chunkSize = 1800) {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const p of paragraphs) {
    if (current && (current + "\n\n" + p).length > chunkSize) {
      chunks.push({ source, text: current });
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push({ source, text: current });
  return chunks;
}

function buildChunks() {
  const chunks = [];

  // ICMR protocols (plain text, split by paragraph)
  const icmr = fs.readFileSync(path.join(ragDir, "P2_icmr_clinical_protocols.txt"), "utf8");
  chunks.push(...splitIntoChunks(icmr, "icmr_protocols"));

  // Drug interactions (JSON — one chunk per entry)
  const drugs = JSON.parse(fs.readFileSync(path.join(ragDir, "P2_drug_interactions_db.json"), "utf8"));
  for (const item of drugs) {
    chunks.push({
      source: "drug_interactions",
      text: `${item.id}: ${item.drug_a} + ${item.drug_b}
Severity: ${item.severity}
Mechanism: ${item.mechanism}
Clinical effect: ${item.clinical_effect}
Recommendation: ${item.recommendation}
Source: ${item.source}`,
    });
  }

  return chunks;
}

// ── 2. Get embedding vector from OpenAI ───────────────────────────────────

async function embed(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// ── 3. Upload to Pinecone in batches of 50 ────────────────────────────────

async function uploadBatch(vectors) {
  await index.upsert({ records: vectors });
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  // Check env vars are loaded
  console.log("OPENAI_API_KEY set:", !!process.env.OPENAI_API_KEY);
  console.log("PINECONE_API_KEY set:", !!process.env.PINECONE_API_KEY);
  console.log("PINECONE_INDEX:", process.env.PINECONE_INDEX);

  // Test a single embed before doing anything
  console.log("Testing OpenAI embed...");
  const testVector = await embed("test");
  console.log("Embed works, vector length:", testVector.length);

  const chunks = buildChunks();
  console.log(`Found ${chunks.length} chunks. Starting upload...`);

  const batchSize = 50;
  let uploaded = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`Processing batch of ${batch.length} chunks...`);

    const vectors = await Promise.all(
      batch.map(async (chunk, j) => {
        const vector = await embed(chunk.text);
        return {
          id: `chunk_${i + j}`,
          values: vector,
          metadata: {
            source: chunk.source,
            text: chunk.text,
          },
        };
      })
    );

    console.log(`Vectors built: ${vectors.length}, upserting to Pinecone...`);
    await uploadBatch(vectors);
    uploaded += batch.length;
    console.log(`Uploaded ${uploaded}/${chunks.length} chunks`);
  }

  console.log("Done! All chunks are now in Pinecone.");
}

main().catch(err => {
  console.error("Upload failed:", err.message);
  console.error(err);
  process.exit(1);
});
