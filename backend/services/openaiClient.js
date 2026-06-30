import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
export default openai;

export async function callOpenAI({
  model = "gpt-4o-mini",
  system = "",
  prompt,
  maxTokens = 2000,
  temperature = 0
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: prompt }
    ]
  });

  return response.choices?.[0]?.message?.content || "";
}

export async function streamOpenAI({ model = "gpt-4o-mini", system = "", prompt, maxTokens = 3000, temperature = 0 }) {
  return openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: prompt }
    ]
  });
}
