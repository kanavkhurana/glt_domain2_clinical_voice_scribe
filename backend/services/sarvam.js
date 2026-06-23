import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { SarvamAIClient } from "sarvamai";

// Switch: "rest" for audio under 30s, "batch" for longer recordings
// Read at call time (not module load time) so dotenv has already populated process.env
export async function transcribeWithSarvam(filePath) {
  const mode = process.env.SARVAM_API_MODE || "rest";
  if (mode === "batch") {
    return transcribeWithSarvamBatch(filePath);
  }
  return transcribeWithSarvamRest(filePath);
}

async function transcribeWithSarvamRest(filePath) {
  if (!process.env.SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY is missing");
  }

  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));
  formData.append("model", "saaras:v3");
  formData.append("mode", "transcribe");
  formData.append("language_code", "en-IN");
  formData.append("with_timestamps", "false");

  const response = await axios.post(
    "https://api.sarvam.ai/speech-to-text",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        "api-subscription-key": process.env.SARVAM_API_KEY,
      },
      maxBodyLength: Infinity,
      timeout: 120000,
    }
  );

  return response.data;
}

async function transcribeWithSarvamBatch(filePath) {
  if (!process.env.SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY is missing");
  }

  const client = new SarvamAIClient({
    apiSubscriptionKey: process.env.SARVAM_API_KEY,
  });

  const job = await client.speechToTextJob.createJob({
    model: "saaras:v3",
    mode: "transcribe",
    languageCode: "en-IN",
  });

  await job.uploadFiles([filePath]);
  await job.start();
  await job.waitUntilComplete();

  const fileResults = await job.getFileResults();

  const transcript = fileResults.successful
    ?.map((r) => r.transcript)
    .filter(Boolean)
    .join(" ") || "";

  return { transcript };
}
