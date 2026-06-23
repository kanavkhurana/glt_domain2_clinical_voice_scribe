import express from "express";
import multer from "multer";
import fs from "fs";
import { transcribeWithSarvam } from "../services/sarvam.js";

const router = express.Router();
const upload = multer({ dest: "uploads/", limits: { fileSize: 25 * 1024 * 1024 } });

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });
    const result = await transcribeWithSarvam(req.file.path);
    fs.unlink(req.file.path, () => {});
    res.json({ transcript: result.transcript || result.text || JSON.stringify(result), raw: result });
  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    console.error("Transcription error", error?.response?.data || error.message);
    res.status(500).json({ error: "Transcription failed", details: error?.response?.data || error.message });
  }
});

export default router;
