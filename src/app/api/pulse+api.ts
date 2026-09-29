import { neon } from "@neondatabase/serverless";

// Campus pulse: opt-in, anonymous, aggregate only. A campus sees nothing
// until at least K distinct students have contributed in the window.
const K = 10;
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
let ready: Promise<unknown> | undefined;
const init = () =>
  (ready ??= sql!`create table if not exists pulse (
    anon text not null, campus text not null, day date not null,
    mood smallint not null, sleep smallint not null, stress smallint not null,
    primary key (anon, day))`);

const campusOf = (s: unknown) => (typeof s === "string" && /^[A-Za-z0-9-]{2,20}$/.test(s.trim()) ? s.trim().toUpperCase() : null);
const level = (n: unknown) => (Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5 ? (n as number) : null);

export async function POST(req: Request) {
  if (!sql) return Response.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  const b = await req.json().catch(() => null);
  const campus = campusOf(b?.campus);
  const [mood, sleep, stress] = [level(b?.mood), level(b?.sleep), level(b?.stress)];
  const anon = typeof b?.anon === "string" && /^[a-z0-9]{8,40}$/.test(b.anon) ? b.anon : null;
  const day = typeof b?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.day) ? b.day : null;
  if (!campus || !anon || !day || !mood || !sleep || !stress) return Response.json({ error: "Invalid pulse" }, { status: 400 });
  await init();
  await sql`insert into pulse (anon, campus, day, mood, sleep, stress) values (${anon}, ${campus}, ${day}, ${mood}, ${sleep}, ${stress})
    on conflict (anon, day) do update set campus = excluded.campus, mood = excluded.mood, sleep = excluded.sleep, stress = excluded.stress`;
  return Response.json({ ok: true });
}

export async function GET(req: Request) {
  if (!sql) return Response.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  const campus = campusOf(new URL(req.url).searchParams.get("campus"));
  if (!campus) return Response.json({ error: "Invalid campus code" }, { status: 400 });
  await init();
  const [all] = await sql`select count(distinct anon)::int as n, avg(mood)::float as mood, avg(sleep)::float as sleep, avg(stress)::float as stress
    from pulse where campus = ${campus} and day > current_date - 14`;
  if (!all || all.n < K) return Response.json({ enough: false });
  // Per-day points only where that day alone clears K, so one day can't isolate anyone.
  const days = await sql`select day::text as day, avg(mood)::float as mood from pulse
    where campus = ${campus} and day > current_date - 14 group by day having count(distinct anon) >= ${K} order by day`;
  return Response.json({ enough: true, students: all.n, mood: all.mood, sleep: all.sleep, stress: all.stress, days });
}
