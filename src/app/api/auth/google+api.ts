import { preflight, withCors } from "@/server/cors";
import { ensureSchema, sqlClient } from "@/server/db";
import { verifyGoogleIdToken } from "@/server/google";
import { limited } from "@/server/rateLimit";
import { createSession } from "@/server/session";

// Exchanges a Google ID token for a MAX session token. Never logs tokens or email addresses.
async function handlePOST(req: Request) {
  if (limited(req, "auth", 10)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  const audience = process.env.GOOGLE_WEB_CLIENT_ID;
  if (!sql || !audience) return Response.json({ error: "not-configured" }, { status: 503 });

  const body = await req.json().catch(() => null);
  const user = await verifyGoogleIdToken(typeof body?.idToken === "string" ? body.idToken : "", audience);
  if (!user) return Response.json({ error: "invalid-token" }, { status: 401 });

  await ensureSchema(sql);
  const newId = crypto.randomUUID();
  const rows = await sql`insert into users (id, google_sub, email, name) values (${newId}, ${user.sub}, ${user.email}, ${user.name ?? null})
    on conflict (google_sub) do update set email = excluded.email, name = excluded.name
    returning id`;
  const token = await createSession(sql, rows[0].id as string);
  return Response.json({ token, email: user.email, name: user.name ?? null });
}

// the website's college dashboard calls these from the browser (src/server/cors.ts)
export const POST = withCors(handlePOST);
export const OPTIONS = preflight;
