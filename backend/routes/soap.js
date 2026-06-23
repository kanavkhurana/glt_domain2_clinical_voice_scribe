import express from "express";
import extractionPrompt from "../prompts/extractionPrompt.js";
import SOAP_SYSTEM_PROMPT from "../prompts/soapSystemPrompt.js";
import { callOpenAI } from "../services/openaiClient.js";
import { retrieveContext } from "../services/rag.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ error: "Transcript is required" });

    const safeTranscript = transcript.replace(/[A-Z][a-z]+\s[A-Z][a-z]+/g, "[PATIENT]");

    const extraction = await callOpenAI({
      model: process.env.OPENAI_EXTRACT_MODEL || "gpt-4o-mini",
      prompt: extractionPrompt(safeTranscript),
      maxTokens: 1500
    });

    const { contextText, chunks } = retrieveContext({ transcript: safeTranscript, entities: extraction, topK: 8 });

    const synthesisPrompt = `
CONSULTATION_ID: ${Date.now()}
DATE: ${new Date().toISOString().slice(0, 10)}

TRANSCRIPT:
${safeTranscript}

EXTRACTED STRUCTURED FACTS:
${extraction}

RETRIEVED KNOWLEDGE ARTEFACTS:
${contextText}

Now produce the final SOAP note using the required CC-SC-R output format.
`;

    const soap = await callOpenAI({
      model: process.env.OPENAI_SYNTHESIS_MODEL || "gpt-4o-mini",
      system: SOAP_SYSTEM_PROMPT,
      prompt: synthesisPrompt,
      maxTokens: 3000
    });

    res.json({ soap, extraction, sources: chunks.map(c => ({ source: c.source, score: c.score, preview: c.text.slice(0, 240) })) });
  } catch (error) {
    console.error("SOAP generation error", error.message);
    res.status(500).json({ error: "SOAP generation failed", details: error.message });
  }
});

export default router;
