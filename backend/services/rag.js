import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX);

async function embed(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function retrieveContext({ transcript = "", entities = "", topK = 8 }) {
  const queryVector = await embed(`${transcript}\n${entities}`);

  const result = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  const chunks = result.matches.map(match => ({
    source: match.metadata.source,
    text: match.metadata.text,
    score: match.score,
  }));

  const contextText =
    chunks.length > 0
      ? chunks.map((c, i) => `SOURCE ${i + 1}: ${c.source}\n${c.text}`).join("\n\n---\n\n")
      : "No high-confidence context retrieved from knowledge artefacts.";

  return { chunks, contextText };
}
