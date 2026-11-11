// M11 server check against a REAL Postgres (not run by `npm test`; it needs a database).
//   docker run -d --name max-m11-pg -e POSTGRES_PASSWORD=test -p 127.0.0.1:55432:5432 postgres:17-bookworm
//   mkdir -p /tmp/m11 && (cd /tmp/m11 && npm init -y >/dev/null && npm i pg@8 tsx@4) && ln -sf "$PWD/node_modules/jose" /tmp/m11/node_modules/jose
//   cp scripts/m11-server-check.mts /tmp/m11/ && /tmp/m11/node_modules/.bin/tsx --tsconfig tsconfig.json /tmp/m11/m11-server-check.mts
//   docker rm -f max-m11-pg
// Google is replaced by a locally generated key pair through the test-only hooks in src/server/google.ts and db.ts.
// Integration test of the M11 server routes against a real Postgres 17 (docker max-m11-pg).
import pg from "pg";
import assert from "node:assert/strict";
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet } from "jose";
const P = process.cwd() + "/src";
const { __useSqlForTests } = await import(`${P}/server/db.ts`);
const { __useJwksForTests } = await import(`${P}/server/google.ts`);
const google = await import(`${P}/app/api/auth/google+api.ts`);
const signout = await import(`${P}/app/api/auth/signout+api.ts`);
const sync = await import(`${P}/app/api/sync+api.ts`);
const account = await import(`${P}/app/api/account+api.ts`);
const delpage = await import(`${P}/app/api/delete-account+api.ts`);

const pool = new pg.Pool({ connectionString: "postgres://postgres:test@127.0.0.1:55432/postgres" });
await pool.query("drop table if exists user_state, sessions, deletion_requests, users cascade");
const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  let text = strings[0];
  values.forEach((_, i) => (text += `$${i + 1}` + strings[i + 1]));
  return pool.query(text, values as any[]).then((r) => r.rows);
};
__useSqlForTests(sql as any);
process.env.GOOGLE_WEB_CLIENT_ID = "test-client.apps.googleusercontent.com";

const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
__useJwksForTests(createLocalJWKSet({ keys: [jwk] }));
const idToken = (sub: string, email: string, o: Record<string, unknown> = {}) =>
  new SignJWT({ email, email_verified: true, name: "Test " + sub, ...o })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer((o.iss as string) ?? "https://accounts.google.com")
    .setAudience((o.aud as string) ?? process.env.GOOGLE_WEB_CLIENT_ID!)
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime((o.exp as string) ?? "1h")
    .sign(privateKey);

let n = 0;
const ip = () => ({ "x-forwarded-for": `10.0.0.${++n % 250}` });
const req = (url: string, init: RequestInit & { token?: string } = {}) =>
  new Request("http://localhost" + url, { ...init, headers: { ...ip(), ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...(init.headers ?? {}) } });
const signIn = async (t: string) => google.POST(req("/api/auth/google", { method: "POST", body: JSON.stringify({ idToken: t }), headers: { "content-type": "application/json" } }));

// 1. sign-in
let r = await signIn(await idToken("sub-A", "a@gmail.com"));
assert.equal(r.status, 200);
const A = (await r.json()).token as string;
r = await signIn(await idToken("sub-B", "b@gmail.com"));
const B = (await r.json()).token as string;
assert.ok(A && B && A !== B);
assert.equal((await signIn("not-a-jwt")).status, 401, "garbage token");
assert.equal((await signIn(await idToken("sub-C", "c@gmail.com", { aud: "someone-else" }))).status, 401, "wrong audience");
assert.equal((await signIn(await idToken("sub-C", "c@gmail.com", { iss: "https://evil.example" }))).status, 401, "wrong issuer");
assert.equal((await signIn(await idToken("sub-C", "c@gmail.com", { email_verified: false }))).status, 401, "unverified email");
assert.equal((await signIn(await idToken("sub-C", "c@gmail.com", { exp: "-1m" }))).status, 401, "expired");
console.log("ok  sign-in: valid tokens accepted; garbage, wrong audience/issuer, unverified email, expired rejected");

// 2. sync
assert.equal((await sync.GET(req("/api/sync"))).status, 401);
assert.equal((await sync.GET(req("/api/sync", { token: "x".repeat(43) }))).status, 401);
assert.deepEqual(await (await sync.GET(req("/api/sync", { token: A }))).json(), { rev: 0, envelope: null });
const env = (s: string) => JSON.stringify({ version: 3, state: { note: s } });
const put = (t: string, base: number, body: string) => sync.PUT(req(`/api/sync?base=${base}`, { method: "PUT", token: t, body }));
r = await put(A, 0, env("a1"));
assert.deepEqual(await r.json(), { rev: 1 });
r = await put(A, 0, env("a-stale"));
assert.equal(r.status, 409);
assert.deepEqual(await r.json(), { error: "conflict", rev: 1 });
assert.deepEqual(await (await put(A, 1, env("a2"))).json(), { rev: 2 });
assert.equal((await put(A, 1, env("a-stale2"))).status, 409);
assert.deepEqual(await (await sync.GET(req("/api/sync?rev=2", { token: A }))).json(), { rev: 2, unchanged: true });
const got = await (await sync.GET(req("/api/sync?rev=1", { token: A }))).json();
assert.equal(got.rev, 2);
assert.equal(JSON.parse(got.envelope).state.note, "a2");
assert.deepEqual(await (await sync.GET(req("/api/sync", { token: B }))).json(), { rev: 0, envelope: null }, "B never sees A's data");
assert.equal((await put(A, 2, "not json")).status, 400);
assert.equal((await put(A, 2, '{"version":3,"state":"' + "x".repeat(3 * 1024 * 1024) + '"}')).status, 413);
assert.equal((await sync.PUT(req("/api/sync?base=-1", { method: "PUT", token: A, body: env("x") }))).status, 400);
console.log("ok  sync: 401 without/with unknown token; first write; stale writes 409; unchanged; isolation A/B; bad body 400; >3 MB 413");

// 3. same Google account signing in again (new phone) keeps the same backup
r = await signIn(await idToken("sub-A", "a@gmail.com"));
const A2 = (await r.json()).token as string;
assert.equal(JSON.parse((await (await sync.GET(req("/api/sync", { token: A2 }))).json()).envelope).state.note, "a2");
console.log("ok  second phone with the same Google account sees the same backup");

// 4. sign-out ends only that session
assert.equal((await signout.POST(req("/api/auth/signout", { method: "POST", token: A2 }))).status, 204);
assert.equal((await sync.GET(req("/api/sync", { token: A2 }))).status, 401);
assert.equal((await sync.GET(req("/api/sync", { token: A }))).status, 200);
console.log("ok  sign-out ends that phone's session only");

// 5. account info and deletion
const info = await (await account.GET(req("/api/account", { token: A }))).json();
assert.equal(info.email, "a@gmail.com");
assert.equal(info.rev, 2);
assert.equal((await account.DELETE(req("/api/account", { method: "DELETE", token: A }))).status, 204);
const left = await pool.query("select (select count(*) from users where google_sub='sub-A') u, (select count(*) from user_state s join users x on x.id=s.user_id where x.google_sub='sub-A') s, (select count(*) from sessions) sess");
assert.deepEqual(left.rows[0], { u: "0", s: "0", sess: "1" }, "A's user, backup and sessions gone; B's session stays");
assert.equal((await sync.GET(req("/api/sync", { token: A }))).status, 401);
console.log("ok  delete account removes user, backup and all its sessions (B untouched)");

// 6. web deletion page
const html = await (await delpage.GET()).text();
assert.match(html, /Delete your MAX account/);
const posted = await (await delpage.POST(req("/api/delete-account", { method: "POST", body: "email=Someone%40Gmail.com", headers: { "content-type": "application/x-www-form-urlencoded" } }))).text();
assert.match(posted, /Request received/);
assert.match(posted, /someone@gmail\.com/);
const xss = await (await delpage.POST(req("/api/delete-account", { method: "POST", body: "email=" + encodeURIComponent("<script>@x.com") }))).text();
assert.doesNotMatch(xss, /<script>/);
assert.equal((await pool.query("select email from deletion_requests")).rows[0].email, "someone@gmail.com");
console.log("ok  web deletion page: form works, request stored, input escaped");

await pool.end();
console.log("ALL SERVER CHECKS PASSED");
