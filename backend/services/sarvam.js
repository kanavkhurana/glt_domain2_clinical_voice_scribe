import axios from "axios";
import fs from "fs";
import path from "path";
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

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
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
    withDiarization: true,
    numSpeakers: 2,
  });

  await job.uploadFiles([filePath]);
  await job.start();
  await job.waitUntilComplete();

  const outputDir = `uploads/batch_${Date.now()}`;
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    await job.downloadOutputs(outputDir);

    const filesInDir = fs.readdirSync(outputDir);
    console.log("Files written by downloadOutputs:", filesInDir);

    // SDK saves output as {input_filename}.json (SpeechToTextJobInstance.js:205)
    const inputFileName = path.basename(filePath);
    const outputPath = path.join(outputDir, `${inputFileName}.json`);
    console.log("Expecting file at:", outputPath, "| Exists:", fs.existsSync(outputPath));

    const raw = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    console.log("Batch output raw:", JSON.stringify(raw, null, 2));

    if (raw.diarized_transcript?.entries?.length) {
      const transcript = raw.diarized_transcript.entries
        .map((seg) => {
          const start = formatTime(seg.start_time_seconds);
          const end = formatTime(seg.end_time_seconds);
          return `[Speaker ${parseInt(seg.speaker_id) + 1}] [${start} - ${end}]: ${seg.transcript}`;
        })
        .join("\n");
      return { transcript };
    }

    return { transcript: raw.transcript || raw.text || "" };
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
}
