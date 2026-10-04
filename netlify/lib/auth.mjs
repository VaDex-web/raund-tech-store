import crypto from "node:crypto";

export async function checkAuth(req) {
  const real = (globalThis.Netlify?.env?.get("ADMIN_PASSWORD")) || process.env.ADMIN_PASSWORD || "";
  if (!real) return Response.json({ error: "На хостинге не задан пароль ADMIN_PASSWORD" }, { status: 500 });
  const given = req.headers.get("x-admin-password") || "";
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    await new Promise(r => setTimeout(r, 1000));
    return Response.json({ error: "Неверный пароль" }, { status: 401 });
  }
  return null;
}
