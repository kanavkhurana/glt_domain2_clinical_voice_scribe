import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude({ model, system, prompt, maxTokens = 2000, temperature = 0 }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing");

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: "user", content: prompt }]
  });

  return response.content?.[0]?.text || "";
}
