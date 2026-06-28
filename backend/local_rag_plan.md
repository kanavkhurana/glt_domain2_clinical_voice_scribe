# Local Semantic RAG — Design Plan

## Context
Replace the keyword token-overlap RAG in `backend/services/rag.js` with vector-embedding-based semantic search. Enables clinically equivalent terms ("dyspnoea" vs "shortness of breath") to match correctly. Index is built and stored locally first; cloud migration (e.g., Pinecone) comes later.

---

## Knowledge files (2 only)
- `backend/knowledge/rag/P2_icmr_clinical_protocols.txt`
- `backend/knowledge/rag/P2_drug_interactions_db.json`

P2_BRIEF.md and P2_soap_note_examples.txt are removed from RAG entirely.

---

## No new npm packages
`openai` SDK (`^4.104.0`) already installed — includes `client.embeddings.create()`.

---

## Embedding model
`text-embedding-3-small` — 1536 dimensions, $0.02/1M tokens, covered by existing OPENAI_API_KEY.

---

## Chunking strategy

| Source | Strategy |
|--------|----------|
| ICMR protocols TXT | Paragraph-based, accumulated up to ~1800 chars per chunk |
| Drug interactions JSON | One chunk per entry (40 entries → 40 chunks) |

Total corpus: ~70 chunks. Cosine similarity computed in memory — no vector DB needed at this scale.

Each chunk text preserves protocol headings (e.g., `## PROTOCOL 1: ACUTE CORONARY SYNDROME`) so the synthesis LLM can identify which protocol was retrieved without needing separate metadata.

---

## Index persistence (avoid re-embedding on every restart)

Cache stored at `backend/knowledge/rag/embeddings_cache.json` (gitignored).

On server startup:
1. SHA-256 checksum both knowledge files
2. If cache exists and checksums match → load embeddings from cache (fast)
3. If no cache or checksums differ → call OpenAI embeddings API for all ~70 chunks, write cache

Cache file format:
```json
{
  "checksums": {
    "P2_icmr_clinical_protocols.txt": "<sha256>",
    "P2_drug_interactions_db.json": "<sha256>"
  },
  "chunks": [
    {
      "source": "P2_icmr_clinical_protocols.txt",
      "text": "...",
      "embedding": [0.123, ...]
    }
  ]
}
```

---

## Query flow (per request)

Pipeline order:
1. Audio → transcript (Sarvam batch API)
2. Transcript → extraction (GPT-4o-mini, structured entities)
3. **RAG invoked** with `transcript + extraction output` as combined query
4. Query embedded via `text-embedding-3-small` (single API call)
5. Cosine similarity computed against all ~70 cached chunk vectors in memory
6. Top-K chunks returned as `contextText`
7. Transcript + extraction + `contextText` → synthesis prompt → SOAP note

The RAG does not identify red flags or drug interactions itself — it retrieves semantically similar chunks. The synthesis prompt interprets those chunks and decides what becomes a red flag, drug interaction flag, or missing field warning.

---

## Cosine similarity

```
cosine(A, B) = dot(A, B) / (|A| * |B|)
```

Score range: 0.0–1.0. Implemented as pure JS — no math library needed.

---

## Synthesis prompt context format (unchanged)

```
RETRIEVED KNOWLEDGE ARTEFACTS:

SOURCE 1: P2_icmr_clinical_protocols.txt
## PROTOCOL 1: ACUTE CORONARY SYNDROME...
### Red flags...

---

SOURCE 2: P2_drug_interactions_db.json
DI_001: Warfarin + Aspirin
Severity: CRITICAL
...
```

---

## Files to change

### 1. `backend/services/rag.js` — full replacement
- `initializeRAG()` — async, called at server startup; builds or loads the index
- `retrieveContext({ transcript, entities, topK })` — now async, returns `{ contextText, chunks }`
- `listKnowledgeFiles()` — reads the `rag/` subdir
- Path update: `knowledgeDir` → `backend/knowledge/rag/`

### 2. `backend/routes/soap.js` — one word change
```js
// before
const { contextText, chunks } = retrieveContext({ ... });
// after
const { contextText, chunks } = await retrieveContext({ ... });
```

### 3. `backend/server.js` — startup init
```js
import { initializeRAG } from "./services/rag.js";
await initializeRAG();
app.listen(PORT, ...);
```

### 4. `backend/.gitignore` — add cache file
```
backend/knowledge/rag/embeddings_cache.json
```

---

## Migration path to cloud RAG

`initializeRAG()` is the single seam to replace. When moving to cloud:
- Replace `initializeRAG()` to upsert chunks into the cloud index
- Replace in-memory cosine search in `retrieveContext()` with a cloud query call
- No changes needed in `soap.js` or `server.js`

---

## Verification checklist

1. First backend start → logs `[RAG] Building index...`, cache file appears in `rag/`
2. Second start → logs `[RAG] Loaded N chunks from cache` (fast, no API call)
3. POST `/soap` with transcript containing "dyspnoea" → ICMR respiratory chunks appear in `sources[]`
4. POST `/soap` with transcript mentioning "warfarin" and "aspirin" → drug interaction chunk appears in `sources[]`
5. Edit a knowledge file → restart → logs `[RAG] Checksums changed, rebuilding index...`
