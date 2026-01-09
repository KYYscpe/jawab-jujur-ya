import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const q1 = !!body?.q1;
    const q2 = String(body?.q2 || "").trim();
    const meta = body?.meta && typeof body.meta === "object" ? body.meta : {};

    // validasi
    if (q2.length < 3 || q2.length > 700) {
      return res.status(400).json({ error: "Invalid answer length" });
    }

    // anti-spam: block payload kalau ada field aneh
    if (body?.website && String(body.website).trim()) {
      return res.status(400).json({ error: "Spam detected" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase
      .from("love_answers")
      .insert([{ q1, q2, meta }]);

    if (error) {
      return res.status(500).json({ error: "DB insert failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
