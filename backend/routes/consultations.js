import express from "express";
import { getConsultations, approveConsultation, updateConsultationSoap } from "../services/db/adapter.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const consultations = await getConsultations(date);
    res.json({ consultations });
  } catch (error) {
    console.error("Consultations fetch error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    await approveConsultation(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error("Approve error", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/soap", async (req, res) => {
  try {
    const { soap } = req.body;
    if (!soap?.trim()) return res.status(400).json({ error: "soap is required" });
    await updateConsultationSoap(req.params.id, soap);
    res.json({ ok: true });
  } catch (error) {
    console.error("Soap update error", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
