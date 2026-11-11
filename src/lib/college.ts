import { apiFetch } from "./api";
import { getState, update, type CollegeLink } from "./store";

// The student side of sharing with a college (docs/plan/M15): look up a College ID, share, stop. The staff dashboard
// moved out of the app (11 Nov 2026, owner): it will live on the MAX website, on the same server routes.

// ---- students ----

type PublicCollege = { id: string; name: string; city: string; state: string; counsellor: CollegeLink["counsellor"] | null; exams: { name: string; date: string }[] };

export async function lookupCollege(q: { code: string } | { id: string }): Promise<{ ok: true; college: PublicCollege } | { ok: false; reason: "unknown" | "offline" | "not-configured" }> {
  try {
    const qs = "code" in q ? `code=${encodeURIComponent(q.code)}` : `id=${encodeURIComponent(q.id)}`;
    const res = await apiFetch(`/api/college/join?${qs}`, {}, 12_000);
    if (res.status === 404 || res.status === 400) return { ok: false, reason: "unknown" };
    if (res.status === 503) return { ok: false, reason: "not-configured" };
    if (!res.ok) return { ok: false, reason: "offline" };
    return { ok: true, college: await res.json() };
  } catch (e) {
    return { ok: false, reason: (e as Error).message === "no-server" ? "not-configured" : "offline" };
  }
}

const linkFrom = (c: PublicCollege, year?: number): CollegeLink => ({
  id: c.id,
  name: c.name,
  city: c.city,
  ...(year ? { year } : {}),
  ...(c.counsellor ? { counsellor: { name: c.counsellor.name, phone: c.counsellor.phone, ...(c.counsellor.hours ? { hours: c.counsellor.hours } : {}) } } : {}),
  exams: c.exams,
  joinedAt: Date.now(),
});

/** The student said yes. From now on each check-in is shared (see sendPulse in api.ts). */
export function joinCollege(c: PublicCollege, year?: number) {
  update(() => ({ college: linkFrom(c, year) }));
}

/** Stop sharing; with `erase`, also delete everything this phone shared. Returns false if the delete didn't reach the server. */
export async function leaveCollege(erase: boolean): Promise<boolean> {
  const anon = getState().anonId;
  update(() => ({ college: undefined, campus: undefined }));
  if (!erase) return true;
  try {
    const res = await apiFetch("/api/pulse", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anon }) }, 12_000);
    return res.status === 204;
  } catch {
    return false;
  }
}

let refreshed = 0;
/** Picks up a changed counsellor contact or new exam dates, at most every 6 hours. */
export async function refreshCollege() {
  const link = getState().college;
  if (!link || link.gone || Date.now() - refreshed < 6 * 3600_000) return;
  refreshed = Date.now();
  const r = await lookupCollege({ id: link.id });
  if (r.ok) update((s) => (s.college ? { college: { ...linkFrom(r.college, s.college.year), joinedAt: s.college.joinedAt } } : {}));
  else if (r.reason === "unknown") update((s) => (s.college ? { college: { ...s.college, gone: true } } : {}));
}
