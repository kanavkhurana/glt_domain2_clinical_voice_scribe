# Simplification Suggestions (from /simplify review)

Generated after the Pinecone RAG + citation markers session.

---

## 1. Merge split React imports — `frontend/src/App.jsx` lines 1–2
**Status: Applied**

```js
// Before
import React, { useState } from "react";
import { useEffect} from "react";

// After
import React, { useState, useEffect, useRef } from "react";
```

---

## 2. Regex recreated per line per render — `frontend/src/App.jsx` line 192
**Status: Pending**

The `/\[S(\d+)\]/g` regex is compiled fresh for every line of the SOAP note on every render.

```js
// Before (inside .map() callback)
const re = /\[S(\d+)\]/g;

// After — move to module level, reset lastIndex before each loop
const CITE_RE = /\[S(\d+)\]/g;
// ...inside .map():
CITE_RE.lastIndex = 0;
while ((m = CITE_RE.exec(line)) !== null) { ... }
```

Note: Must reset `lastIndex = 0` before each loop because the `/g` flag retains state across calls on the same object.

---

## 3. Duplicate recording UI markup — `frontend/src/App.jsx` lines 55–65 and 139–151
**Status: Pending**

The recording start/stop button block appears twice. Extract into a small component:

```jsx
function RecordingBox({ recording, onStart, onStop, audio }) {
  return (
    <div className="recordBox">
      {!recording
        ? <button onClick={onStart}>🎙️ Start Recording</button>
        : <button onClick={onStop}>⏹️ Stop Recording</button>
      }
      {audio && <p>Audio ready: {audio.name}</p>}
    </div>
  );
}
```

---

## 4. Unnecessary ternary for empty line rendering — `frontend/src/App.jsx` line 214
**Status: Pending**

```jsx
// Before
return <div key={li}>{parts.length > 0 ? parts : " "}</div>;

// After — use a non-breaking space for truly empty lines
return <div key={li}>{parts.length > 0 ? parts : " "}</div>;
```

Minor: current `" "` (regular space) collapses in HTML. ` ` (non-breaking space) preserves blank line height reliably.

---

## 5. Long inline onClick on citation badge — `frontend/src/App.jsx` lines 198–209
**Status: Applied (addressed by change 4 — handler now calls `setScrollToSourceIdx(idx)`)**

The onClick was a deeply nested closure with two `setTimeout` calls. Replaced with a two-line handler via the `scrollToSourceIdx` state + `useEffect` approach.
