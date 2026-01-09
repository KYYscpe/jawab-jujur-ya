import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const OWNER_PASSWORD = process.env.OWNER_PASSWORD;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OWNER_PASSWORD) {
      return res.status(500).json({ error: "Server not configured" });
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

    if (!token || token !== OWNER_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("love_answers")
      .select("id, created_at, q1, q2")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return res.status(500).json({ error: "DB read failed" });
    }

    return res.status(200).json({ rows: data || [] });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
