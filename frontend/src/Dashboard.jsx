import React, { useState, useEffect, useCallback } from "react";
import { fetchConsultations, approveConsultation, updateConsultationSoap } from "./api";

const FLAG_META = {
  green:  { emoji: "✅", label: "No flags",          approveLabel: "Approve" },
  amber:  { emoji: "⚠️", label: "Missing fields",    approveLabel: "Review & Approve" },
  red:    { emoji: "🔴", label: "Red flag / Drug Rx", approveLabel: null },
};

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ConsultationCard({ c, onApprove, onSoapUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedSoap, setEditedSoap] = useState(c.soap);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const meta = FLAG_META[c.flagLevel] || FLAG_META.green;

  async function handleDoneEditing(e) {
    e.stopPropagation();
    setSaving(true);
    try {
      await updateConsultationSoap(c.id, editedSoap);
      onSoapUpdate(c.id, editedSoap);
    } catch (err) {
      console.error("Soap update error:", err);
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  async function handleApprove(e) {
    e.stopPropagation();
    setApproving(true);
    try { await onApprove(c.id); } finally { setApproving(false); }
  }

  return (
    <div className={`dashboard-card ${c.approved ? "approved" : c.flagLevel}`} onClick={() => !editMode && setExpanded(x => !x)}>
      <div className="card-top-row">
        <span className="card-flag-emoji">{c.approved ? "✅" : meta.emoji}</span>
        <div className="card-main">
          <div className="card-complaint">{c.chiefComplaint || "Not discussed"}</div>
          <div className="card-meta">{formatTime(c.savedAt)} · ID {c.id.slice(-6)}</div>
        </div>
        <span className="card-chevron">{expanded ? "▲" : "▼"}</span>
      </div>

      {!c.approved && (c.redFlags || c.drugFlags || c.missing) && (
        <div className="card-flag-snippet">
          {c.redFlags  && <div>🔴 {c.redFlags.slice(0, 120)}{c.redFlags.length > 120 ? "…" : ""}</div>}
          {c.drugFlags && <div>⚠️ {c.drugFlags.slice(0, 120)}{c.drugFlags.length > 120 ? "…" : ""}</div>}
          {c.missing   && <div>📋 {c.missing.slice(0, 120)}{c.missing.length > 120 ? "…" : ""}</div>}
        </div>
      )}

      {expanded && (
        <div onClick={e => e.stopPropagation()}>
          {editMode ? (
            <textarea
              className="large card-soap-textarea"
              value={editedSoap}
              onChange={e => setEditedSoap(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="soap-rendered card-soap-expanded">
              {editedSoap.split("\n").map((line, i) => (
                <div key={i}>{line || " "}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card-footer" onClick={e => e.stopPropagation()}>
        {c.approved ? (
          <span className="approved-stamp">✅ Approved {formatTime(c.approvedAt)}</span>
        ) : expanded && !editMode ? (
          <div className="card-footer-actions">
            <button className="edit-toggle" onClick={e => { e.stopPropagation(); setEditMode(true); }}>
              Edit Note
            </button>
            <button className="approve-btn" onClick={handleApprove} disabled={approving}>
              {approving ? "Saving…" : (meta.approveLabel || "Approve after review")}
            </button>
          </div>
        ) : expanded && editMode ? (
          <button className="approve-btn" onClick={handleDoneEditing} disabled={saving}>
            {saving ? "Saving…" : "Done Editing"}
          </button>
        ) : meta.approveLabel ? (
          <button className="approve-btn" onClick={handleApprove} disabled={approving}>
            {approving ? "Saving…" : meta.approveLabel}
          </button>
        ) : (
          <span className="review-required-note">Expand to review before approving</span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchConsultations(date);
      setConsultations(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id) {
    await approveConsultation(id);
    setConsultations(prev =>
      prev.map(c => c.id === id ? { ...c, approved: true, approvedAt: new Date().toISOString() } : c)
    );
  }

  function handleSoapUpdate(id, soap) {
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, soap } : c));
  }

  const approved = consultations.filter(c => c.approved).length;
  const pending = consultations.filter(c => !c.approved);
  const pendingCounts = { green: 0, amber: 0, red: 0 };
  pending.forEach(c => { if (pendingCounts[c.flagLevel] !== undefined) pendingCounts[c.flagLevel]++; });

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">End-of-Day Review</h2>
          <div className="dashboard-date-row">
            <input
              type="date"
              className="date-picker"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
            <button className="refresh-btn" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>
        {consultations.length > 0 && (
          <div className="count-chips">
            <span className="chip">{consultations.length} total</span>
            {approved > 0            && <span className="chip approved-chip">{approved} approved</span>}
            {pendingCounts.green > 0 && <span className="chip green-chip">{pendingCounts.green} ✅ pending</span>}
            {pendingCounts.amber > 0 && <span className="chip amber-chip">{pendingCounts.amber} ⚠️ pending</span>}
            {pendingCounts.red   > 0 && <span className="chip red-chip">{pendingCounts.red} 🔴 pending</span>}
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {!loading && consultations.length === 0 && (
        <div className="notice">No consultations recorded for {date}. Generate a SOAP note to see it here.</div>
      )}

      <div className="dashboard-grid">
        {consultations.map(c => (
          <ConsultationCard key={c.id} c={c} onApprove={handleApprove} onSoapUpdate={handleSoapUpdate} />
        ))}
      </div>
    </div>
  );
}
