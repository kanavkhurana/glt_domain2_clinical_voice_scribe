import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export async function transcribeWithSarvam(filePath) {
  if (!process.env.SARVAM_API_KEY) {
    throw new Error("SARVAM_API_KEY is missing");
  }

  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));

  // From Saaras docs: use saaras:v3 + mode="transcribe" for standard STT
  formData.append("model", "saaras:v3");
  formData.append("mode", "transcribe");          // key piece from the Saaras docs
  formData.append("language_code", "en-IN");      // or "hi-IN" if your audio is actually Hindi
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