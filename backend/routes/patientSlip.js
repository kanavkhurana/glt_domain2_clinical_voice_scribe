import express from "express";
import patientSlipPrompt from "../prompts/patientSlipPrompt.js";
import { callOpenAI } from "../services/openaiClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { soap, language = "English" } = req.body;
    if (!soap?.trim()) return res.status(400).json({ error: "SOAP note is required" });

    const slip = await callOpenAI({
      model: process.env.OPENAI_EXTRACT_MODEL || "gpt-4o-mini",
      prompt: patientSlipPrompt(soap, language),
      maxTokens: 1200
    });

    res.json({ slip });
  } catch (error) {
    console.error("Patient slip error", error.message);
    res.status(500).json({ error: "Patient slip generation failed", details: error.message });
  }
});

export default router;
