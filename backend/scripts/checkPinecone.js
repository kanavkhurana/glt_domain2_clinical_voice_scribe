import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX);

async function main() {
  // Check index stats
  const stats = await index.describeIndexStats();
  console.log("=== Index Stats ===");
  console.log("Total vectors:", stats.totalRecordCount);
  console.log("Namespaces:", JSON.stringify(stats.namespaces, null, 2));

  // Fetch a sample of records by ID to verify content
  console.log("\n=== Sample Records ===");
  const sample = await index.fetch({ ids: ["chunk_0", "chunk_1", "chunk_48"] });

  for (const [id, record] of Object.entries(sample.records)) {
    console.log(`\n[${id}]`);
    console.log("Source:", record.metadata.source);
    console.log("Text preview:", record.metadata.text.slice(0, 150) + "...");
    console.log("Vector length:", record.values.length);
  }

  // Count by source
  console.log("\n=== Source breakdown (via stats) ===");
  console.log("(Pinecone free tier doesn't support filtered counts — check manually below)");

  // Fetch all IDs in chunks to count by source
  const allIds = Array.from({ length: 49 }, (_, i) => `chunk_${i}`);
  const allRecords = await index.fetch({ ids: allIds });
  const counts = {};
  for (const record of Object.values(allRecords.records)) {
    const src = record.metadata.source;
    counts[src] = (counts[src] || 0) + 1;
  }
  console.log("Chunks by source:", counts);
}

main().catch(err => {
  console.error("Check failed:", err.message);
  process.exit(1);
});
