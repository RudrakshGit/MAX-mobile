import { ensureSchema, sqlClient } from "@/server/db";
import { limited } from "@/server/rateLimit";

// Public page for deleting a MAX account without the app (Google Play asks for such a link).
// Browser system colours (light or dark, as the visitor's phone is set): server code must not import the app's
// theme, which pulls in react-native.
const page = (body: string) => {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Delete your MAX account</title>
<style>:root{color-scheme:light dark}body{font-family:system-ui,sans-serif;max-width:34rem;margin:2rem auto;padding:0 1rem;line-height:1.5;color:CanvasText;background:Canvas}
input,button{font:inherit;padding:.6rem .8rem;border-radius:.6rem;border:1px solid GrayText}button{background:CanvasText;color:Canvas;border:0}
label{display:block;margin:.8rem 0 .3rem}</style></head><body>${body}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function GET() {
  return page(`<h1>Delete your MAX account</h1>
<p><b>With the app:</b> open MAX, go to Profile → Settings → Backup → <i>Delete my account and backup</i>. It happens at once.</p>
<p><b>Without the app:</b> enter the Gmail address you signed in with. To make sure nobody deletes someone else's account, we first email that address to confirm, then delete the account and its backup within 30 days of your reply.
Data that was only on your phone is not on our server; uninstalling MAX removes it.</p>
<form method="post"><label for="e">Gmail address</label><input id="e" name="email" type="email" required maxlength="120" autocomplete="email">
<p><button type="submit">Request deletion</button></p></form>
<p>Need help now? Call Tele-MANAS: 14416 (free, 24×7).</p>`);
}

export async function POST(req: Request) {
  if (limited(req, "delete-page", 5)) return page("<h1>Too many requests</h1><p>Please try again in a minute.</p>");
  // a plain HTML form posts application/x-www-form-urlencoded
  const form = new URLSearchParams((await req.text().catch(() => "")).slice(0, 2000));
  const email = (form.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,100}\.[a-z]{2,}$/i.test(email)) {
    return page(`<h1>That doesn't look like an email address</h1><p><a href="">Go back</a></p>`);
  }
  const sql = sqlClient();
  if (sql) {
    await ensureSchema(sql);
    await sql`insert into deletion_requests (email) values (${email})`;
  }
  return page(`<h1>Request received</h1><p>If <b>${esc(email)}</b> has a MAX account, we'll email it to confirm. After you reply, the account and its backup are deleted within 30 days.</p>`);
}
