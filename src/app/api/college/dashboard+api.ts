import { preflight, withCors } from "@/server/cors";
import { ensureSchema, sqlClient } from "@/server/db";
import { buildDashboard, type RawDashboard } from "@/server/collegeStats";
import { limited } from "@/server/rateLimit";
import { requireUser } from "@/server/session";

// Staff of an approved college: anonymous totals of what its students chose to share. One query; the privacy
// rules (minimum group size, noise, rounding) are applied in collegeStats.ts before anything leaves the server.
const WINDOWS = [14, 30, 90];

async function handleGET(req: Request) {
  if (limited(req, "college-dash", 30)) return Response.json({ error: "rate" }, { status: 429 });
  const sql = sqlClient();
  if (!sql) return Response.json({ error: "not-configured" }, { status: 503 });
  await ensureSchema(sql);
  const userId = await requireUser(req, sql);
  if (!userId) return Response.json({ error: "unauthorised" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const days = WINDOWS.includes(Number(url.searchParams.get("days"))) ? Number(url.searchParams.get("days")) : 30;

  const rows = await sql`with c as (
      select c.id from colleges c join college_staff s on s.college_id = c.id join users u on s.email = lower(u.email)
      where c.id = ${id} and u.id = ${userId} and c.status = 'approved'),
    p as (select * from college_pulse where college_id = (select id from c) and day > current_date - ${days}::int),
    q as (select * from college_pulse where college_id = (select id from c)
      and day <= current_date - ${days}::int and day > current_date - ${days * 2}::int)
    select (select id from c) as id,
      (select json_build_object('n', count(distinct anon), 'mood', avg(mood), 'sleep', avg(sleep), 'stress', avg(stress),
        'heavy', avg((stress >= 4)::int), 'poorSleep', avg((sleep <= 2)::int), 'low', avg((mood <= 2)::int)) from p) as now,
      (select json_build_object('n', count(distinct anon), 'mood', avg(mood), 'sleep', avg(sleep), 'stress', avg(stress)) from q) as prev,
      (select json_agg(w) from (select date_trunc('week', day)::date::text as week, count(distinct anon) as n,
        avg(mood) as mood, avg(sleep) as sleep, avg(stress) as stress from p group by 1) w) as weeks,
      (select json_agg(t) from (select tag, count(distinct anon) as n from p, unnest(tags) as tag group by tag) t) as sources,
      (select json_agg(y) from (select year, count(distinct anon) as n, avg(mood) as mood, avg(sleep) as sleep, avg(stress) as stress
        from p where year is not null group by year) y) as years`;
  const r = rows[0];
  if (!r?.id) return Response.json({ error: "forbidden" }, { status: 403 });
  const stamp = new Date().toISOString().slice(0, 10);
  return Response.json({ days, ...buildDashboard(r as RawDashboard, `${r.id}:${days}:${stamp}`) });
}

// the website's college dashboard calls these from the browser (src/server/cors.ts)
export const GET = withCors(handleGET);
export const OPTIONS = preflight;
