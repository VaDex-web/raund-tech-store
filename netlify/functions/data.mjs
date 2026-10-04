import { getStore } from "@netlify/blobs";
import { checkAuth } from "../lib/auth.mjs";

export default async (req) => {
  const store = getStore({ name: "site", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get("data", { type: "json" });
    return Response.json(data ?? null, { headers: { "cache-control": "no-store" } });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const denied = await checkAuth(req);
    if (denied) return denied;
    if (new URL(req.url).searchParams.has("check")) return Response.json({ ok: true });

    const text = await req.text();
    if (text.length > 1_000_000) return Response.json({ error: "Слишком большой объём данных" }, { status: 413 });
    let data;
    try { data = JSON.parse(text); } catch { return Response.json({ error: "Повреждённые данные" }, { status: 400 }); }
    if (!data || !Array.isArray(data.products) || !data.contacts || !data.hero) {
      return Response.json({ error: "Не хватает обязательных разделов" }, { status: 400 });
    }

    const prev = await store.get("data", { type: "json" });
    if (prev) await store.setJSON("data-prev", prev);

    data.updatedAt = new Date().toISOString();
    await store.setJSON("data", data);
    return Response.json({ ok: true, updatedAt: data.updatedAt });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/data" };
