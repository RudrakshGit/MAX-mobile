import { ensureSchema, sqlClient } from "@/server/db";
import { INFLUENCE_IDS } from "@/content/feelings";
import { K } from "@/server/collegeStats";
import { limited } from "@/server/rateLimit";
import { acceptableDay, noisyMean } from "@/server/pulseNoise";

// Sharing with your college (docs/history.md): opt-in, anonymous, aggregate only. A phone sends a random id, the
// college it joined, and today's three numbers, optional year of study and journal categories. Never text.

const level = (n: unknown) => (Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5 ? (n as number) : null);
const anonOf = (v: unknown) => (typeof v === "string" && /^[a-z0-9]{8,40}$/.test(v) ? v : null);
const idOf = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/.test(v) ? v : null);

export async function POST(req: Request) {
  if (limited(req, "pulse", 6)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  const b = await req.json().catch(() => null);
  const college = idOf(b?.college);
  const anon = anonOf(b?.anon);
  const [mood, sleep, stress] = [level(b?.mood), level(b?.sleep), level(b?.stress)];
  // Only today's check-in counts; back-filled days would let one person fill a college's history.
  const day = typeof b?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.day) && acceptableDay(b.day) ? b.day : null;
  const year = Number.isInteger(b?.year) && b.year >= 1 && b.year <= 6 ? b.year : null;
  const tags = Array.isArray(b?.tags) ? [...new Set(b.tags.filter((t: unknown) => typeof t === "string" && INFLUENCE_IDS.includes(t as never)))].slice(0, 6) : [];
  if (!college || !anon || !day || !mood || !sleep || !stress) return Response.json({ error: "invalid" }, { status: 400 });
  await ensureSchema(sql);
  const rows = await sql`insert into college_pulse (anon, college_id, day, mood, sleep, stress, year, tags)
    select ${anon}, c.id, ${day}::date, ${mood}, ${sleep}, ${stress}, ${year}, ${tags}::text[] from colleges c
    where c.id = ${college} and c.status = 'approved'
    on conflict (anon, day) do update set college_id = excluded.college_id, mood = excluded.mood, sleep = excluded.sleep,
      stress = excluded.stress, year = excluded.year, tags = excluded.tags
    returning college_id`;
  if (!rows[0]) return Response.json({ error: "unknown-college" }, { status: 404 });
  return Response.json({ ok: true });
}

/** Withdrawing consent: everything this phone shared is deleted. */
export async function DELETE(req: Request) {
  if (limited(req, "pulse-delete", 6)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  const anon = anonOf((await req.json().catch(() => null))?.anon);
  if (!anon) return Response.json({ error: "invalid" }, { status: 400 });
  await ensureSchema(sql);
  await sql`delete from college_pulse where anon = ${anon}`;
  return new Response(null, { status: 204 });
}

/** For students: how their college is doing over the last 14 days (same privacy rules as the staff view). */
export async function GET(req: Request) {
  if (limited(req, "pulse-read", 20)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  const college = idOf(new URL(req.url).searchParams.get("college"));
  if (!college) return Response.json({ error: "invalid" }, { status: 400 });
  await ensureSchema(sql);
  const rows = await sql`with p as (select p.* from college_pulse p join colleges c on c.id = p.college_id
      where p.college_id = ${college} and c.status = 'approved' and p.day > current_date - 14)
    select (select json_build_object('n', count(distinct anon), 'mood', avg(mood), 'sleep', avg(sleep), 'stress', avg(stress)) from p) as all,
      (select json_agg(d) from (select day::text as day, avg(mood) as mood from p group by day having count(distinct anon) >= ${K} order by day) d) as days`;
  const all = rows[0]?.all;
  if (!all || Number(all.n) < K) return Response.json({ enough: false });
  const n = Number(all.n);
  const seed = (what: string) => `${college}:${new Date().toISOString().slice(0, 10)}:${what}`;
  return Response.json({
    enough: true,
    students: Math.floor(n / 5) * 5,
    mood: noisyMean(Number(all.mood), n, seed("mood")),
    sleep: noisyMean(Number(all.sleep), n, seed("sleep")),
    stress: noisyMean(Number(all.stress), n, seed("stress")),
    days: (rows[0].days ?? []).map((d: { day: string; mood: number }) => ({ day: d.day, mood: noisyMean(Number(d.mood), K, seed(`day:${d.day}`)) })),
  });
}
