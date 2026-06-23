import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { listKnowledgeFiles } from "../services/rag.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const knowledgeDir = path.join(__dirname, "..", "knowledge");

router.get("/knowledge", (_req, res) => res.json({ files: listKnowledgeFiles() }));

router.get("/demo-transcripts", (_req, res) => {
  const raw = fs.readFileSync(path.join(knowledgeDir, "P2_consultations_transcripts.json"), "utf8");
  const data = JSON.parse(raw);
  res.json(data.slice(0, 10).map(x => ({ id: x.id, specialty: x.specialty, language: x.language, complexity: x.complexity, transcript: x.transcript })));
});

export default router;
