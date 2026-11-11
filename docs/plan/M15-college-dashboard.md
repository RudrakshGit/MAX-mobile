# M15: College registration, counsellor dashboard, opt-in sharing

> **Update 11 Nov 2026 (owner):** the staff dashboard, college registration and admin review were taken out of the
> app. They will be rebuilt as a web dashboard on the MAX landing website, using the same server routes
> (`/api/college`, `/api/college/dashboard`, `/api/college/admin`), which stay. The removed app screens are kept outside
> the repo in `Major_Project/archive/college-dashboard-app-2026-11-11/` for reference. The app keeps only the student
> side: Settings → "Share stats with college" (College ID = the join code) and an optional College ID in onboarding.
> The student "How my college is doing" screen (`/campus`) was removed too.


Decided by Claude on 4 Nov 2026, at the owner's request ("research karke khud decide karna hai").

## Why
- India's Supreme Court (*Sukdeb Saha v. State of Andhra Pradesh*, 25 Jul 2025) requires every institution with 100+
  students to have a qualified counsellor. Those counsellors have no view of how their campus is doing between
  appointments. MAX already collects daily check-ins. With the student's consent, the counsellor can see anonymous
  totals and plan support around them, for example before exam weeks.
- What a college may see: only totals from at least **10 students**, the common minimum group size for student data.
  Subgroups under 10 are hidden, with a second group hidden when needed so a hidden one can't be worked out
  ("complementary suppression"). Published averages carry noise, as in `src/server/pulseNoise.ts`.

## Roles
| Role | Who | How they get it |
|---|---|---|
| Student | everyone | default |
| College staff | counsellor, psychologist, wellness-cell coordinator | signs in with Google, registers the college or is added by its owner |
| MAX admin | the app owner | Google email listed in the server's `ADMIN_EMAILS` |

## Registration and verification
1. Staff sign in with Google. A verified Google email is required.
2. Form: college name, city, state, AISHE code (optional; colleges have codes like `C-12345`, checkable on
   aishe.gov.in), website, the applicant's role and work phone, and a declaration that they are authorised and won't
   try to identify students.
3. The college stays **pending** until the MAX admin checks it: AISHE code on aishe.gov.in, website, a call to the
   work phone, and whether the Google email is on the college's own domain. The admin then approves or rejects it
   in the app. Nothing is shared with a pending college, and students can't join one.
4. On approval the college gets a random **join code** (`XXXX-XXXX`, no look-alike characters). Staff share it with
   students. The owner can create a new code if the old one leaks; existing students stay linked.
5. The owner adds or removes other staff by their Google email (at most 10).

## Students: Settings → Share with my college
- The student enters the code, and MAX shows the college's name and city ("verified by MAX") before anything is
  sent.
- What is listed before they agree: each day's check-in numbers (mood, sleep, study pressure); the "what affected
  this" categories picked in the journal (e.g. Exams, Hostel), never their words; and their year of study, if they
  choose. Never their name, email, journal text, chats or test results.
- Clear yes button. **Stop sharing**, and **Stop and delete what I've shared**, which deletes the rows by the phone's
  random ID. This meets the DPDP Act's rule that withdrawing consent is as easy as giving it.
- In return, the college's counsellor contact appears on the Help screen and its exam dates appear in Exams.

## Dashboard (in the app; staff only)
Students sharing (rounded down to 5); the last 14, 30 or 90 days against the window before it, for average mood,
sleep and study pressure; the share of check-ins with heavy pressure, poor sleep or low mood; a weekly trend with the
college's exam dates marked; what is affecting students (journal categories with at least 5 students); and
results by year of study (groups of 10 or more). Settings: counsellor contact shown to students, exam dates, staff,
join code. There is no per-student view, list, export or alert, by design: alerts on a single student would need a
different consent and a duty-of-care process.

## Entry points
- Onboarding, Google step: "I'm a college counsellor or staff", which opens the college sign-in. The welcome screen
  has the same link, so staff don't go through the student set-up.
- Profile → For college staff.

## Server
Tables `colleges`, `college_staff`, `college_exams`, `college_pulse`. Routes `api/college` (mine, register, update),
`api/college/join` (public lookup by code), `api/college/dashboard`, `api/college/admin`; `api/pulse` gets POST,
GET (the student-facing summary) and DELETE. Every route makes at most 3 database calls (schema, session, one
query), to stay within EAS Hosting's per-request limits. The old free-text `pulse` table is no longer written.

## Completion report (4 Nov 2026, Claude)
Built: server tables and routes as above; `src/server/college.ts` (validation, join codes, staff check),
`src/server/collegeStats.ts` (privacy rules). App: `src/app/college/{index,register,settings,admin,preview}.tsx`,
`src/components/college/CollegeDashboard.tsx`, `src/components/CollegeShare.tsx` (Settings), `src/lib/college.ts`.
Also: onboarding links, Profile → For college staff, the college counsellor on Help, college exam dates in Exams,
Learn → Your college, and Delete everything also deletes what the phone shared.

Checks:
- 8 unit tests (`src/server/collegeStats.test.ts`), red-checked.
- `scripts/college-server-check.mts` runs every route against real Postgres (PGlite, in-process: no Docker,
  no port). It covers registration, admin review, join, staff permissions, the dashboard's privacy rules, a new
  join code, withdrawal, rejection and account deletion. It passes, and removing the approval, staff or owner
  checks makes it fail.
- Emulator: dashboard layout with sample data (`/college/preview`, developer builds only); the sign-in screen and
  the student's Settings section when the server has no database.
- Not checked on a device: Google sign-in as staff, a real join and a real dashboard. These need the owner's steps
  below.

### Owner steps
1. Everything in the M11 owner steps (Google OAuth, Neon `DATABASE_URL`). The college tables are created
   automatically.
2. Server environment variable `ADMIN_EMAILS` = your Google email (comma-separated for more than one). That
   account sees "Review college registrations" in the College dashboard.
3. Deploy the server, rebuild the app, then try it: register a test college, approve it, join it from a second
   phone.
4. Before approving a real college: look its AISHE code up on aishe.gov.in, open its website, and call the work
   phone.

### End-to-end on the preview server (7 Nov 2026)
On the emulator with `apk/max-test-preview-1.5.1.apk` against `max-companion--cis6ho7h8e.expo.app` and the real Neon
database: Google sign-in as rudroidm@gmail.com, backup ("Backed up"), admin recognised, test college "TEST MAX Demo
College" registered → approved in the app → join code shown, student joined with the code, check-in saved, and
"Stop and delete" removed what was shared. A share/delete round trip by curl returned 200/204 and left nothing behind.
The test college stays in the database as a demo; reject it from the admin screen when it is no longer wanted.
