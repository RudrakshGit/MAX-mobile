import { neon } from "@neondatabase/serverless";

// Postgres (Neon) for optional Google backup. Created on first use; every statement is a single round trip
// over Neon's HTTP driver, so nothing here needs a transaction.
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, any>[]>;

let client: Sql | null = null;
let override: Sql | null = null;
let ready: Promise<void> | undefined;

export function sqlClient(): Sql | null {
  if (override) return override;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  client ??= neon(url) as unknown as Sql;
  return client;
}

/** Test harness only: run the same SQL against a local Postgres. */
export function __useSqlForTests(sql: Sql | null) {
  override = sql;
  ready = undefined;
}

export function ensureSchema(sql: Sql): Promise<void> {
  // One statement (a DO block), so a cold start costs one database round trip, not eight.
  ready ??= sql`do $$ begin
    create table if not exists users (
      id text primary key,
      google_sub text unique not null,
      email text not null,
      name text,
      created_at timestamptz not null default now());
    create table if not exists sessions (
      token_hash text primary key,
      user_id text not null references users(id) on delete cascade,
      created_at timestamptz not null default now(),
      expires_at timestamptz not null);
    create index if not exists sessions_user_idx on sessions(user_id);
    create table if not exists user_state (
      user_id text primary key references users(id) on delete cascade,
      rev integer not null,
      envelope text not null,
      updated_at timestamptz not null default now());
    create table if not exists deletion_requests (
      email text not null,
      created_at timestamptz not null default now());
    -- M15: colleges, their staff, exam dates, and the opt-in anonymous check-ins students share with them
    create table if not exists colleges (
      id text primary key,
      name text not null,
      city text not null,
      state text not null,
      aishe text,
      website text,
      applicant_role text not null,
      applicant_phone text not null,
      applicant_email text not null,
      status text not null default 'pending',
      join_code text unique,
      counsellor_name text,
      counsellor_phone text,
      counsellor_hours text,
      created_by text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      reviewed_at timestamptz,
      review_note text);
    create table if not exists college_staff (
      college_id text not null references colleges(id) on delete cascade,
      email text not null,
      role text not null default 'staff',
      added_at timestamptz not null default now(),
      primary key (college_id, email));
    create table if not exists college_exams (
      id text primary key,
      college_id text not null references colleges(id) on delete cascade,
      name text not null,
      date date not null);
    create table if not exists college_pulse (
      anon text not null,
      college_id text not null references colleges(id) on delete cascade,
      day date not null,
      mood smallint not null,
      sleep smallint not null,
      stress smallint not null,
      year smallint,
      tags text[] not null default '{}',
      primary key (anon, day));
    create index if not exists college_pulse_college_day on college_pulse(college_id, day);
  end $$`
    .then(() => undefined)
    .catch((e) => {
      ready = undefined; // try again on the next request
      throw e;
    });
  return ready;
}
