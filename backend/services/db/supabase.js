// Supabase adapter — collaborator setup instructions:
//
// 1. cd backend && npm install @supabase/supabase-js
// 2. Create a `consultations` table in your Supabase project:
//      id TEXT PRIMARY KEY
//      date TEXT NOT NULL
//      saved_at TIMESTAMPTZ NOT NULL
//      chief_complaint TEXT
//      soap TEXT
//      flag_level TEXT CHECK (flag_level IN ('green','amber','red'))
//      red_flags TEXT
//      drug_flags TEXT
//      missing TEXT
//      approved BOOLEAN DEFAULT false
//      approved_at TIMESTAMPTZ
// 3. Fill in the function bodies below using your Supabase client.
// 4. In .env set: DB_PROVIDER=supabase  SUPABASE_URL=...  SUPABASE_KEY=...
// 5. In backend/services/db/adapter.js uncomment the supabaseDB import and swap it in.
//
// No other files need to change.

// import { createClient } from "@supabase/supabase-js";
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function saveConsultation(_data) {
  throw new Error("Supabase adapter not configured — see supabase.js for setup instructions.");
}

export async function getConsultations(_date) {
  throw new Error("Supabase adapter not configured — see supabase.js for setup instructions.");
}

export async function approveConsultation(_id) {
  throw new Error("Supabase adapter not configured — see supabase.js for setup instructions.");
}

export async function updateConsultationSoap(_id, _soap) {
  throw new Error("Supabase adapter not configured — see supabase.js for setup instructions.");
}
