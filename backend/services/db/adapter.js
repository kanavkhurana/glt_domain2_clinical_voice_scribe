import * as localDB from "./local.js";
// collaborator: import * as supabaseDB from "./supabase.js";

const provider = process.env.DB_PROVIDER || "local";

// collaborator: swap `localDB` below with `supabaseDB` when DB_PROVIDER=supabase
const db = provider === "local" ? localDB : localDB;

export const { saveConsultation, getConsultations, approveConsultation, updateConsultationSoap } = db;
