import type { Sql } from "./db.ts";

// Validation and permissions for college registration (docs/history.md). Pure helpers, so they can be tested.

export const ROLES = ["counsellor", "psychologist", "wellness", "faculty", "head"] as const;
export type StaffRole = "owner" | "staff";
export const MAX_STAFF = 10;
export const MAX_EXAMS = 20;

const PHONE = /^\+?[0-9][0-9 -]{5,17}$/;
const EMAIL = /^[^\s@]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/;
// no 0/O, 1/I/L, so a code read off a poster can't be mistyped into another college's
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

const text = (v: unknown, min: number, max: number) => {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();
  return s.length >= min && s.length <= max ? s : null;
};

export function cleanRegistration(b: any) {
  const name = text(b?.name, 3, 120), city = text(b?.city, 2, 60), state = text(b?.state, 2, 40);
  const role = ROLES.includes(b?.role) ? (b.role as (typeof ROLES)[number]) : null;
  const phone = typeof b?.phone === "string" && PHONE.test(b.phone.trim()) ? b.phone.trim() : null;
  const aisheRaw = typeof b?.aishe === "string" ? b.aishe.trim().toUpperCase().replace(/\s/g, "") : "";
  const aishe = aisheRaw === "" ? null : /^[CUS]-?\d{3,6}$/.test(aisheRaw) ? aisheRaw.replace(/^([CUS])-?/, "$1-") : undefined;
  const siteRaw = typeof b?.website === "string" ? b.website.trim() : "";
  const website = siteRaw === "" ? null : /^https?:\/\/[^\s<>"]{3,120}$/i.test(siteRaw) ? siteRaw : undefined;
  if (!name || !city || !state || !role || !phone || aishe === undefined || website === undefined || b?.agree !== true) return null;
  return { name, city, state, role, phone, aishe, website };
}

export function cleanContact(b: any) {
  const name = text(b?.name, 2, 60), hours = b?.hours ? text(b.hours, 2, 60) : null;
  const phone = typeof b?.phone === "string" && PHONE.test(b.phone.trim()) ? b.phone.trim() : null;
  if (!name || !phone || (b?.hours && !hours)) return null;
  return { name, phone, hours };
}

export function cleanExams(list: unknown) {
  if (!Array.isArray(list) || list.length > MAX_EXAMS) return null;
  const out: { name: string; date: string }[] = [];
  for (const e of list) {
    const name = text((e as any)?.name, 2, 60);
    const date = typeof (e as any)?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test((e as any).date) && !Number.isNaN(Date.parse((e as any).date)) ? (e as any).date : null;
    if (!name || !date) return null;
    out.push({ name, date });
  }
  return out;
}

export const cleanEmail = (v: unknown) => (typeof v === "string" && EMAIL.test(v.trim().toLowerCase()) ? v.trim().toLowerCase() : null);

/** "K7QX-29MD": 8 random characters, ~10^12 codes, so guessing a college's code is hopeless. */
export function newJoinCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(8));
  const c = [...b].map((x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join("");
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}
export const cleanCode = (v: unknown) => {
  if (typeof v !== "string") return null;
  const s = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length === 8 && [...s].every((ch) => CODE_ALPHABET.includes(ch)) ? `${s.slice(0, 4)}-${s.slice(4)}` : null;
};

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((s: string) => s.trim()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** The signed-in user's email and their role at a college (null if they aren't staff there). */
export async function staffOf(sql: Sql, userId: string, collegeId: string) {
  const rows = await sql`select lower(u.email) as email, s.role, c.status from users u
    left join college_staff s on s.email = lower(u.email) and s.college_id = ${collegeId}
    left join colleges c on c.id = s.college_id
    where u.id = ${userId}`;
  const r = rows[0];
  return r ? { email: r.email as string, role: (r.role ?? null) as StaffRole | null, status: (r.status ?? null) as string | null } : null;
}
