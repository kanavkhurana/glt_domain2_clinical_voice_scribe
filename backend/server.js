import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fs from "fs";
import transcribeRouter from "./routes/transcribe.js";
import soapRouter from "./routes/soap.js";
import patientSlipRouter from "./routes/patientSlip.js";
import evalRouter from "./routes/eval.js";



const app = express();
const port = process.env.PORT || 5000;
fs.mkdirSync("uploads", { recursive: true });

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "*" }));
app.use(cors({
  origin: [/^http:\/\/localhost:\d+$/],
  credentials: true
}));
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => res.json({ ok: true, service: "Clinical Scribe Backend" }));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/transcribe", transcribeRouter);
app.use("/api/soap", soapRouter);
app.use("/api/patient-slip", patientSlipRouter);
app.use("/api/eval", evalRouter);

app.listen(port, () => console.log(`Clinical Scribe backend running on ${port}`));
