// M15 server check (colleges, dashboard, sharing) against REAL Postgres, run in-process with PGlite: no Docker,
// no port, nothing left running. Not part of `npm test` (it needs extra packages):
//   D=$(mktemp -d) && (cd $D && npm init -y >/dev/null && npm i @electric-sql/pglite@0.3 tsx@4) && ln -sf "$PWD/node_modules/jose" $D/node_modules/jose
//   cp scripts/college-server-check.mts $D/ && $D/node_modules/.bin/tsx --tsconfig tsconfig.json $D/college-server-check.mts
// Google is replaced by a locally generated key pair through the test-only hooks in src/server/google.ts and db.ts.
import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet } from "jose";
const P = process.cwd() + "/src";
const { __useSqlForTests } = await import(`${P}/server/db.ts`);
const { __useJwksForTests } = await import(`${P}/server/google.ts`);
const google = await import(`${P}/app/api/auth/google+api.ts`);
const account = await import(`${P}/app/api/account+api.ts`);
const college = await import(`${P}/app/api/college/index+api.ts`);
const join = await import(`${P}/app/api/college/join+api.ts`);
const dash = await import(`${P}/app/api/college/dashboard+api.ts`);
const admin = await import(`${P}/app/api/college/admin+api.ts`);
const pulse = await import(`${P}/app/api/pulse+api.ts`);

const db = new PGlite();
const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  let text = strings[0];
  values.forEach((_, i) => (text += `$${i + 1}` + strings[i + 1]));
  return db.query(text, values as any[]).then((r) => r.rows as Record<string, any>[]);
};
__useSqlForTests(sql as any);
process.env.GOOGLE_WEB_CLIENT_ID = "test-client.apps.googleusercontent.com";
process.env.ADMIN_EMAILS = "owner@max.test";

const { publicKey, privateKey } = await generateKeyPair("RS256");
__useJwksForTests(createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" }] }));
const idToken = (sub: string, email: string) =>
  new SignJWT({ email, email_verified: true, name: "Test " + sub })
    .setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer("https://accounts.google.com")
    .setAudience(process.env.GOOGLE_WEB_CLIENT_ID!).setSubject(sub).setIssuedAt().setExpirationTime("1h").sign(privateKey);

let n = 0;
const req = (url: string, init: RequestInit & { token?: string; json?: unknown } = {}) =>
  new Request("http://localhost" + url, {
    ...init,
    ...(init.json !== undefined ? { body: JSON.stringify(init.json) } : {}),
    headers: { "x-forwarded-for": `10.0.${++n % 250}.${n % 200}`, "content-type": "application/json", ...(init.token ? { authorization: `Bearer ${init.token}` } : {}) },
  });
const login = async (sub: string, email: string) =>
  (await (await google.POST(req("/api/auth/google", { method: "POST", json: { idToken: await idToken(sub, email) } }))).json()).token as string;
const mine = async (t: string) => (await college.GET(req("/api/college", { token: t }))).json();
const patch = (t: string, body: unknown) => college.PATCH(req("/api/college", { method: "PATCH", token: t, json: body }));
const today = new Date().toISOString().slice(0, 10);

const C = await login("sub-c", "Counsellor@SVVV.edu.in");
const ADMIN = await login("sub-admin", "owner@max.test");
const X = await login("sub-x", "someone@gmail.com");

// 1. registration
const form = { name: "Shri Vaishnav Institute of IT", city: "Indore", state: "Madhya Pradesh", aishe: "C-12345", role: "counsellor", phone: "+91 98765 43210", agree: true };
assert.equal((await college.POST(req("/api/college", { method: "POST", json: form }))).status, 401, "needs sign-in");
assert.equal((await college.POST(req("/api/college", { method: "POST", token: C, json: { ...form, agree: false } }))).status, 400);
let r = await college.POST(req("/api/college", { method: "POST", token: C, json: form }));
assert.equal(r.status, 201);
const id = (await r.json()).id as string;
assert.equal((await college.POST(req("/api/college", { method: "POST", token: C, json: form }))).status, 409, "one pending at a time");
let m = await mine(C);
assert.equal(m.colleges[0].status, "pending");
assert.equal(m.colleges[0].role, "owner");
assert.equal(m.colleges[0].code, null, "no join code before approval");
assert.equal(m.admin, false);
console.log("ok  registration: sign-in needed, declaration needed, one pending per account, owner role, no code yet");

// 2. nothing reaches a pending college; admin review
const share = (anon: string, o: Record<string, unknown> = {}) =>
  pulse.POST(req("/api/pulse", { method: "POST", json: { college: id, anon, day: today, mood: 3, sleep: 3, stress: 4, ...o } }));
assert.equal((await share("pending0001")).status, 404, "pending college takes no data");
assert.equal((await admin.GET(req("/api/college/admin", { token: C }))).status, 403, "staff are not admins");
const list = await (await admin.GET(req("/api/college/admin", { token: ADMIN }))).json();
assert.equal(list.colleges[0].id, id);
assert.equal(list.colleges[0].email, "counsellor@svvv.edu.in");
r = await admin.POST(req("/api/college/admin", { method: "POST", token: ADMIN, json: { id, action: "approve" } }));
const code = (await r.json()).code as string;
assert.match(code, /^[2-9A-Z]{4}-[2-9A-Z]{4}$/);
m = await mine(C);
assert.equal(m.colleges[0].status, "approved");
assert.equal(m.colleges[0].code, code);
assert.equal((await mine(ADMIN)).admin, true);
console.log("ok  review: pending college takes no data, only admins review, approval creates a join code");

// 3. student lookup by code
r = await join.GET(req(`/api/college/join?code=${code.toLowerCase().replace("-", " ")}`));
let info = await r.json();
assert.equal(info.id, id);
assert.equal(info.name, form.name);
assert.equal((await join.GET(req("/api/college/join?code=ZZZZ-ZZZZ"))).status, 404);
assert.equal(JSON.stringify(info).includes("98765"), false, "the applicant's phone is never public");
console.log("ok  join: code typed loosely works, unknown code 404, applicant details not public");

// 4. settings and staff permissions
assert.equal((await patch(C, { id, set: "contact", counsellor: { name: "Dr. Mehta, Wellness cell", phone: "0731 2345678", hours: "Mon–Fri 10–5" } })).status, 200);
const exam = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
assert.equal((await patch(C, { id, set: "exams", exams: [{ name: "Mid-sem exams", date: exam }] })).status, 200);
assert.equal((await patch(C, { id, set: "addStaff", email: "Staff2@svvv.edu.in" })).status, 200);
const S2 = await login("sub-s2", "staff2@svvv.edu.in");
m = await mine(S2);
assert.equal(m.colleges[0].role, "staff");
assert.equal(m.colleges[0].staff, null, "only the owner sees the staff list");
assert.equal((await patch(S2, { id, set: "newCode" })).status, 403, "staff can't change the code");
assert.equal((await patch(S2, { id, set: "removeStaff", email: "counsellor@svvv.edu.in" })).status, 403);
assert.equal((await patch(X, { id, set: "contact", counsellor: { name: "Evil", phone: "9999999999" } })).status, 403, "outsiders can't edit");
info = await (await join.GET(req(`/api/college/join?code=${code}`))).json();
assert.equal(info.counsellor.name, "Dr. Mehta, Wellness cell");
assert.equal(info.exams[0].date, exam);
console.log("ok  settings: contact + exams reach students, owner adds staff, staff/outsiders can't change code or others");

// 5. dashboard privacy
const dget = (t: string, days = 30) => dash.GET(req(`/api/college/dashboard?id=${id}&days=${days}`, { token: t }));
assert.equal((await dget(X)).status, 403, "outsiders see nothing");
let d = await (await dget(C)).json();
assert.equal(d.enough, false);
for (let i = 0; i < 9; i++) assert.equal((await share(`stud${String(i).padStart(6, "0")}`, { year: 1, tags: ["studies", "career"] })).status, 200);
d = await (await dget(C)).json();
assert.equal(d.enough, false, "9 students: still nothing");
for (let i = 9; i < 12; i++) await share(`stud${String(i).padStart(6, "0")}`, { year: i < 10 ? 1 : 2, tags: ["studies", "<script>"] });
// an earlier window (31–60 days ago) written directly, as the API only takes today's check-in
for (let i = 0; i < 11; i++) await db.query(`insert into college_pulse (anon, college_id, day, mood, sleep, stress) values ($1, $2, current_date - 40, 4, 4, 2)`, [`old${String(i).padStart(6, "0")}`, id]);
d = await (await dget(C)).json();
assert.equal(d.enough, true);
assert.equal(d.students, 10, "12 students shown as 10");
assert.ok(d.now.stress >= 1 && d.now.stress <= 5);
assert.ok(d.prev, "earlier window with 11 students is shown");
assert.deepEqual(d.sources.map((s: any) => s.id).sort(), ["career", "studies"], "studies (12) and career (9) both have 5+ students");
assert.deepEqual(d.years, [], "year 2 has 2 students, so it and the one other group are hidden");
assert.equal(JSON.stringify(d).includes("stud0000"), false, "no student ids leave the server");
const tags = await db.query(`select tags from college_pulse where anon = 'stud000011'`);
assert.deepEqual((tags.rows[0] as any).tags, ["studies"], "unknown categories are dropped");
assert.equal((await share("late000001", { day: "2020-01-01" })).status, 400, "no back-filling");
assert.equal((await (await dget(S2, 14)).json()).days, 14);
console.log("ok  dashboard: outsiders 403, <10 students nothing, count rounded, small year groups hidden, bad tags dropped");

// 6. student summary, code change, withdrawal
const summary = await (await pulse.GET(req(`/api/pulse?college=${id}`))).json();
assert.equal(summary.enough, true);
assert.equal((await patch(C, { id, set: "newCode" })).status, 200);
assert.equal((await join.GET(req(`/api/college/join?code=${code}`))).status, 404, "the old code stops working");
assert.equal((await share("stud000001")).status, 200, "students who already joined keep sharing");
assert.equal((await pulse.DELETE(req("/api/pulse", { method: "DELETE", json: { anon: "stud000001" } }))).status, 204);
const left = await db.query(`select count(*)::int as n from college_pulse where anon = 'stud000001'`);
assert.equal((left.rows[0] as any).n, 0, "withdrawal deletes everything that phone shared");
console.log("ok  sharing: student summary, new code blocks the old one but keeps joined students, withdrawal deletes");

// 7. rejection, and deleting the owner's account
await college.POST(req("/api/college", { method: "POST", token: X, json: { ...form, name: "Fake College" } }));
const fake = (await mine(X)).colleges[0];
await admin.POST(req("/api/college/admin", { method: "POST", token: ADMIN, json: { id: fake.id, action: "reject", note: "Could not verify the AISHE code" } }));
m = await mine(X);
assert.equal(m.colleges[0].status, "rejected");
assert.equal(m.colleges[0].reviewNote, "Could not verify the AISHE code");
assert.equal(m.colleges[0].code, null);
assert.equal((await account.DELETE(req("/api/account", { method: "DELETE", token: C }))).status, 204);
const still = await db.query(`select status, created_by from colleges where id = $1`, [id]);
assert.equal((still.rows[0] as any).status, "approved", "the college outlives one staff account");
console.log("ok  review: rejection with a reason; deleting the owner's account keeps the college for its other staff");
console.log("ALL COLLEGE CHECKS PASSED");
