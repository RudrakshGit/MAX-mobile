import { preflight, withCors } from "@/server/cors";
import { ensureSchema, sqlClient } from "@/server/db";
import { endSession } from "@/server/session";

async function handlePOST(req: Request) {
  const sql = sqlClient();
  if (!sql) return new Response(null, { status: 204 });
  await ensureSchema(sql);
  await endSession(req, sql);
  return new Response(null, { status: 204 });
}

// the website's college dashboard calls these from the browser (src/server/cors.ts)
export const POST = withCors(handlePOST);
export const OPTIONS = preflight;
