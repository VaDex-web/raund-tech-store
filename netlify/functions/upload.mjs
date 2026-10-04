import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import { checkAuth } from "../lib/auth.mjs";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const denied = await checkAuth(req);
  if (denied) return denied;

  const type = (req.headers.get("content-type") || "").split(";")[0].trim();
  if (!TYPES[type]) return Response.json({ error: "Можно загружать только JPG, PNG или WEBP" }, { status: 415 });
  const buf = await req.arrayBuffer();
  if (buf.byteLength > 5 * 1024 * 1024) return Response.json({ error: "Фото больше 5 МБ" }, { status: 413 });

  const key = Date.now().toString(36) + "-" + crypto.randomBytes(5).toString("hex") + "." + TYPES[type];
  await getStore("images").set(key, buf, { metadata: { type } });
  return Response.json({ url: "/api/img/" + key });
};

export const config = { path: "/api/upload" };
