# Admin panel — setup, security model, and scaling notes

This app is a **static frontend + Supabase** project — there is no server you
run yourself. That shapes everything below, so read this before deploying.

## 1. What was added

- **`profiles` table** (`supabase/schema.sql`) — one row per user, holding
  `role` (`user`/`admin`), `status` (`active`/`suspended`), signup time, and
  last-seen time. Created automatically on signup by a trigger.
- **`admin_audit_log` table** — every privileged action (role change,
  suspend, delete) is recorded with who did it and when.
- **`admin-api` Edge Function** (`supabase/functions/admin-api`) — the only
  place that can list every user, change roles, suspend, or delete accounts.
- **Admin UI** at `/admin`, `/admin/users`, `/admin/activity` — dashboard
  stats, a searchable/paginated user table, and a live activity feed.

## 2. Deploying it

```bash
# 1. Push the schema (adds profiles, admin_audit_log, RLS, indexes)
supabase db push          # or paste supabase/schema.sql into the SQL Editor

# 2. Deploy the edge function
supabase functions deploy admin-api

# 3. Promote your own account to admin (do this once, in the SQL Editor,
#    AFTER you've signed up normally through the app)
update public.profiles set role = 'admin' where email = 'you@example.com';
```

There is intentionally **no "become admin" button anywhere in the app** —
that would be a privilege-escalation hole. The first admin is always made by
hand in SQL; every admin after that can be promoted from Admin → Users.

## 3. The security model — please read this carefully

You asked for an admin page "no one should easily access" and that can't be
manipulated "even in devtools." Here is exactly how that's achieved, and
what its limits are, so expectations are accurate:

**Hiding the `/admin` link and redirecting non-admins (`AdminRoute.tsx`) is
UX, not security.** Anyone can view your JavaScript, and a browser's
devtools can always change local state, call any function directly, or hit
any URL. No amount of frontend code can stop that — this is true of every
website, not just this one. **The actual gate has to live somewhere the
visitor's browser cannot touch it**, so it lives in two places:

1. **Row Level Security (RLS) in Postgres** — every table checks
   `is_admin()` (a function that reads the `profiles` table) before allowing
   a query. A non-admin's request for other users' data is refused *by the
   database itself*, regardless of what the frontend code does or doesn't
   check.
2. **The `admin-api` Edge Function** — listing all users, changing roles,
   suspending, and deleting accounts require the Supabase *service-role*
   key, which has no RLS restrictions at all. That key **must never appear
   in frontend code** (anything shipped to the browser is public, full
   stop). So those operations run in the Edge Function instead, which:
   - runs on Supabase's servers, not the visitor's device,
   - independently re-checks that the caller's token belongs to an
     `active` `admin` in the database before doing anything,
   - logs the action to `admin_audit_log`.

So even someone who rebuilds the frontend from scratch, disables all client
checks, or calls your Supabase project directly with curl gets nothing more
than an ordinary logged-in user would — the database and the Edge Function
enforce the real boundary independently of any code running in a browser.

**What this doesn't cover, and what to add if this app handles anything
sensitive:**
- **A stolen admin password still works.** Turn on Supabase Auth's
  **multi-factor authentication (MFA/TOTP)** for admin accounts —
  Authentication → Policies in the Supabase dashboard — and consider
  requiring it specifically for the `admin` role.
- **Brute-force login attempts.** Supabase Auth already rate-limits
  sign-in attempts; for extra protection put the site behind Cloudflare (or
  similar) and enable a WAF/rate-limit rule on `/auth/v1/token`.
- **Public sign-up abuse (bot accounts).** Turn on **CAPTCHA** for
  sign-up/sign-in — Authentication → Settings → "Enable CAPTCHA protection"
  in Supabase, using hCaptcha or Turnstile.
- The `admin-api` function includes a basic per-user rate limit as a second
  layer, but Supabase's platform-level rate limits are still your main
  defense against abuse.

## 4. "No frontend validation" — what that actually means here

A pure static site *cannot* have server-side validation of its own, because
there is no server of its own — Supabase's Postgres **is** the backend here.
So "no frontend validation, everything enforced properly" translates to:
**move every rule that matters into the database**, which `schema.sql` now
does:
- `CHECK` constraints (accuracy 0–100, non-negative scores/times, counts
  that must add up) reject bad data no matter who/what sends it.
- RLS policies mean a user's insert/update is rejected outright if it
  isn't their own row — editing the request in devtools changes nothing.
- The `profiles.role` update policy blocks users from changing their own
  role, even by crafting the request manually.

Keep the existing frontend validation too (it's still good for instant
feedback/UX) — just don't rely on it for security, and this schema doesn't.

## 5. Handling "thousands of users at once" without slowing down

This app splits cleanly into two things that scale very differently:

**The frontend (the game itself)** is a static Vite build — plain HTML/JS/
CSS with no server rendering. Deployed to Vercel, Netlify, or Cloudflare
Pages, it's served from a CDN edge network, so thousands of concurrent
visitors is a non-issue — static asset CDNs are built for exactly this.

**The database (Supabase/Postgres)** is the part that can actually get
slow under load, and where the real work is:
- Every hot query used by the admin panel and the game itself is now backed
  by an index (`schema.sql` adds them for `profiles` and `game_attempts`).
- The admin user list and activity feed are **paginated** (25–100 rows per
  request) — they never pull the whole table, so response time doesn't grow
  as your user base does.
- Supabase pools Postgres connections for you (Supavisor) by default —
  nothing to configure for typical traffic.
- If you expect genuinely high sustained concurrency, the levers are on
  Supabase's side, not the code's: upgrading your Supabase compute add-on
  (more CPU/RAM/connections), and enabling **Point-in-time recovery** isn't
  a scaling feature but is worth having anyway once real users are on it.
- The activity feed polls every 30s rather than holding an open connection
  per admin — cheap even with many admins watching it at once. If you later
  want it to be instant, Supabase Realtime can push changes instead, but
  that's an upgrade to make once you actually need it, not before.

## 6. Profile details & photo (new)

`profiles` now also stores `full_name`, `roll_no`, `register_no`,
`department`, `phone`, and `avatar_url`. Users edit these from **Account →
My Profile**. A few notes:

- **Photos** go to a Supabase Storage bucket called `avatars`, created by
  `schema.sql`. It's public-read (so the image URL just works in an `<img>`
  tag) but a user can only write into a folder named after their own user
  id — enforced by storage RLS policies, not by the upload code, and capped
  server-side at 2MB / image types only (the bucket itself rejects anything
  else, regardless of what the frontend sends).
- **Role and status can never be self-edited.** A database trigger
  (`protect_privileged_profile_fields`) resets `role`/`status` back to their
  current value on any update that doesn't come from the service-role key —
  so even a hand-crafted request to `PATCH /profiles` can't grant someone
  admin access.
- **Changing the login email** goes through Supabase Auth's own
  confirmation flow (a link sent to the new address) — the account page
  calls `supabase.auth.updateUser({ email })` rather than writing the
  `profiles.email` column directly, and that column only updates once the
  change is confirmed (kept in sync by a trigger on `auth.users`).

## 7. About blocking browser extensions

You also asked that browser extensions "should not be able to use" or
manipulate the site. This needs an honest, direct answer instead of a fake
fix: **a website cannot detect, block, or disable browser extensions.**
That's not a gap in this project — it's a hard boundary of how browsers
work, on every website that exists. Extensions run with more privilege than
the page itself, in a separate context the page's JavaScript is never given
access to. Anything a site tries to do about this (blocking right-click,
detecting devtools, obfuscating code) is easily bypassed and mainly ends up
breaking things for legitimate users — including people relying on screen
readers, translators, or password managers, which are extensions too.

The good news: **you don't need to solve this**, because it's already
covered by the design in section 3. If someone uses an extension (or
devtools, or a rewritten client, or `curl`) to alter what the page does or
sends, every request still lands on the same database with the same RLS
policies and the same Edge Function checks. An extension can change what a
user's *own browser* shows or sends — it cannot change what the *database*
accepts from that user, or grant them access to anyone else's data or to
admin actions. That's the actual security boundary, and it holds regardless
of what runs in the browser.

