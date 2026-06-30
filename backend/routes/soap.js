import express from "express";
import extractionPrompt from "../prompts/extractionPrompt.js";
import SOAP_SYSTEM_PROMPT from "../prompts/soapSystemPrompt.js";
import { callOpenAI, streamOpenAI } from "../services/openaiClient.js";
import { retrieveContext } from "../services/rag.js";
import { saveConsultation } from "../services/db/adapter.js";

function classifyFlags(soap) {
  const flagsIdx = soap.indexOf("--- FLAGS ---");
  if (flagsIdx === -1) return { flagLevel: "green", redFlags: null, drugFlags: null, missing: null };

  const flagText = soap.slice(flagsIdx);
  const isEmpty = s => !s?.trim() || /^(none|nil|not (applicable|identified|detected|present))\.?$/i.test(s.trim());

  const redMatch = /🔴 RED FLAGS:\s*(.+?)(?=⚠️|📋|---|$)/s.exec(flagText);
  const drugMatch = /⚠️ DRUG INTERACTIONS:\s*(.+?)(?=📋|---|$)/s.exec(flagText);
  const missingMatch = /📋 MISSING:\s*(.+?)(?=---|$)/s.exec(flagText);

  const redFlags = isEmpty(redMatch?.[1]) ? null : redMatch[1].trim();
  const drugFlags = isEmpty(drugMatch?.[1]) ? null : drugMatch[1].trim();
  const missing = isEmpty(missingMatch?.[1]) ? null : missingMatch[1].trim();

  let flagLevel = "green";
  if (redFlags || drugFlags) flagLevel = "red";
  else if (missing) flagLevel = "amber";

  return { flagLevel, redFlags, drugFlags, missing };
}

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

    const { contextText, chunks } = await retrieveContext({ transcript: safeTranscript, entities: extraction, topK: 8 });

    const id = String(Date.now());
    const date = new Date().toISOString().slice(0, 10);

    const synthesisPrompt = `
CONSULTATION_ID: ${id}
DATE: ${date}

TRANSCRIPT:
${safeTranscript}

EXTRACTED STRUCTURED FACTS:
${extraction}

RETRIEVED KNOWLEDGE ARTEFACTS:
${contextText}

Now produce the final SOAP note using the required CC-SC-R output format.
`;

    if (process.env.SOAP_STREAMING === "true") {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await streamOpenAI({
        model: process.env.OPENAI_SYNTHESIS_MODEL || "gpt-4o-mini",
        system: SOAP_SYSTEM_PROMPT,
        prompt: synthesisPrompt,
        maxTokens: 3000
      });

      let soap = "";
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || "";
        if (token) {
          soap += token;
          res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
        }
      }

      let chiefComplaint = "Not discussed";
      try { chiefComplaint = JSON.parse(extraction).chief_complaint || chiefComplaint; } catch {}
      const { flagLevel, redFlags, drugFlags, missing } = classifyFlags(soap);

      saveConsultation({
        id, date, savedAt: new Date().toISOString(),
        chiefComplaint, soap, flagLevel, redFlags, drugFlags, missing,
        approved: false, approvedAt: null
      }).catch(err => console.error("DB save error:", err));

      res.write(`data: ${JSON.stringify({ type: "done", consultationId: id, extraction, sources: chunks.map(c => ({ source: c.source, score: c.score, text: c.text })) })}\n\n`);
      res.end();

    } else {
      const soap = await callOpenAI({
        model: process.env.OPENAI_SYNTHESIS_MODEL || "gpt-4o-mini",
        system: SOAP_SYSTEM_PROMPT,
        prompt: synthesisPrompt,
        maxTokens: 3000
      });

      let chiefComplaint = "Not discussed";
      try { chiefComplaint = JSON.parse(extraction).chief_complaint || chiefComplaint; } catch {}

      const { flagLevel, redFlags, drugFlags, missing } = classifyFlags(soap);

      saveConsultation({
        id, date, savedAt: new Date().toISOString(),
        chiefComplaint, soap, flagLevel, redFlags, drugFlags, missing,
        approved: false, approvedAt: null
      }).catch(err => console.error("DB save error:", err));

      res.json({ soap, extraction, consultationId: id, sources: chunks.map(c => ({ source: c.source, score: c.score, text: c.text })) });
    }
  } catch (error) {
    console.error("SOAP generation error", error.message);
    res.status(500).json({ error: "SOAP generation failed", details: error.message });
  }
});

export default router;
