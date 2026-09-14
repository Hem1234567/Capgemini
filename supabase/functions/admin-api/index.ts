// supabase/functions/admin-api/index.ts
//
// This is the ONLY place in the whole project that is allowed to see the
// Supabase service-role key. It runs on Supabase's servers (Deno Edge
// Runtime), never in the visitor's browser, so it cannot be read, copied,
// or bypassed from devtools — the browser only ever sees a normal user JWT.
//
// Every request is checked twice before anything happens:
//   1. The caller's JWT must belong to a real, currently-logged-in user
//      (verified via supabase.auth.getUser(token) against Supabase Auth).
//   2. That user's row in `public.profiles` must have role = 'admin' AND
//      status = 'active' (checked with the service-role client, which
//      ignores RLS — so this check itself can't be spoofed by RLS tricks).
// If either check fails: 401/403, no data, no action. Nothing here trusts
// anything the client claims about itself (no "isAdmin" flag sent from the
// browser is ever honoured).
//
// Deploy with:
//   supabase functions deploy admin-api
// It automatically has access to SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// as platform-managed secrets — you do not set those yourself, and they are
// never exposed to the frontend build.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Simple in-memory rate limit per admin user (best-effort; the platform's
// own gateway rate-limits by IP on top of this). Resets every 60s.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(key: string, limit = 60): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Missing authorization token' }, 401);

  // Service-role client: bypasses RLS. Only usable server-side, only after
  // we've independently verified the caller is an active admin below.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Who is making this request? (validates the JWT against Auth)
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: 'Invalid or expired session' }, 401);
  const caller = userData.user;

  if (rateLimited(caller.id)) return json({ error: 'Too many requests, slow down.' }, 429);

  // 2. Are they an active admin? Source of truth is the DB, not the client.
  const { data: callerProfile, error: profileErr } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', caller.id)
    .single();

  if (profileErr || !callerProfile || callerProfile.role !== 'admin' || callerProfile.status !== 'active') {
    return json({ error: 'Forbidden — admin access required' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const action = String(body.action ?? '');

  async function audit(action: string, targetId: string | null, targetEmail: string | null, detail: unknown) {
    await admin.from('admin_audit_log').insert({
      actor_id: caller.id,
      actor_email: caller.email,
      action,
      target_id: targetId,
      target_email: targetEmail,
      detail,
    });
  }

  try {
    switch (action) {
      // ── Dashboard summary stats ────────────────────────────────────────
      case 'stats': {
        const [{ count: totalUsers }, { count: admins }, { count: suspended }, { count: totalAttempts }] =
          await Promise.all([
            admin.from('profiles').select('*', { count: 'exact', head: true }),
            admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
            admin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
            admin.from('game_attempts').select('*', { count: 'exact', head: true }),
          ]);

        const now = Date.now();
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [{ count: activeToday }, { count: activeWeek }, { count: activeMonth }, { count: newThisWeek }] =
          await Promise.all([
            admin.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', dayAgo),
            admin.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', weekAgo),
            admin.from('profiles').select('*', { count: 'exact', head: true }).gte('last_seen_at', monthAgo),
            admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
          ]);

        // Signups per day for the last 14 days (for a simple trend chart).
        const fortnightAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentSignups } = await admin
          .from('profiles')
          .select('created_at')
          .gte('created_at', fortnightAgo);

        const signupsByDay: Record<string, number> = {};
        for (const row of recentSignups ?? []) {
          const day = new Date(row.created_at as string).toISOString().slice(0, 10);
          signupsByDay[day] = (signupsByDay[day] ?? 0) + 1;
        }

        // Attempts per game (all time) for a breakdown chart.
        const { data: attemptRows } = await admin.from('game_attempts').select('game_name, accuracy');
        const perGame: Record<string, { attempts: number; accuracySum: number }> = {};
        for (const row of attemptRows ?? []) {
          const g = (row.game_name as string) ?? 'Unknown';
          if (!perGame[g]) perGame[g] = { attempts: 0, accuracySum: 0 };
          perGame[g].attempts += 1;
          perGame[g].accuracySum += (row.accuracy as number) ?? 0;
        }
        const gameBreakdown = Object.entries(perGame).map(([gameName, v]) => ({
          gameName,
          attempts: v.attempts,
          avgAccuracy: v.attempts ? Math.round(v.accuracySum / v.attempts) : 0,
        }));

        return json({
          totalUsers: totalUsers ?? 0,
          admins: admins ?? 0,
          suspended: suspended ?? 0,
          totalAttempts: totalAttempts ?? 0,
          activeToday: activeToday ?? 0,
          activeWeek: activeWeek ?? 0,
          activeMonth: activeMonth ?? 0,
          newThisWeek: newThisWeek ?? 0,
          signupsByDay,
          gameBreakdown,
        });
      }

      // ── Paginated / searchable user list ───────────────────────────────
      case 'list_users': {
        const page = Math.max(0, Number(body.page ?? 0));
        const pageSize = Math.min(100, Math.max(1, Number(body.pageSize ?? 25)));
        const search = String(body.search ?? '').trim();

        let query = admin
          .from('profiles')
          .select('id, email, display_name, full_name, department, role, status, created_at, last_seen_at', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(page * pageSize, page * pageSize + pageSize - 1);

        if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,roll_no.ilike.%${search}%`);

        const { data, count, error } = await query;
        if (error) throw error;

        // Attach a lightweight attempt count per user for this page only
        // (keeps this cheap even with thousands of users, since we never
        // scan the whole game_attempts table — just the ids on this page).
        const ids = (data ?? []).map((u) => u.id);
        let attemptCounts: Record<string, number> = {};
        if (ids.length) {
          const { data: attemptRows } = await admin
            .from('game_attempts')
            .select('user_id')
            .in('user_id', ids);
          attemptCounts = (attemptRows ?? []).reduce((acc: Record<string, number>, row) => {
            const uid = row.user_id as string;
            acc[uid] = (acc[uid] ?? 0) + 1;
            return acc;
          }, {});
        }

        return json({
          users: (data ?? []).map((u) => ({ ...u, attemptCount: attemptCounts[u.id] ?? 0 })),
          total: count ?? 0,
          page,
          pageSize,
        });
      }

      // ── Recent activity feed across all users ──────────────────────────
      case 'recent_activity': {
        const limit = Math.min(200, Math.max(1, Number(body.limit ?? 50)));
        const { data, error } = await admin
          .from('game_attempts')
          .select('id, user_id, game_name, difficulty, mode, score, accuracy, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;

        const ids = [...new Set((data ?? []).map((r) => r.user_id as string))];
        let emailById: Record<string, string> = {};
        if (ids.length) {
          const { data: profs } = await admin.from('profiles').select('id, email').in('id', ids);
          emailById = (profs ?? []).reduce((acc: Record<string, string>, p) => {
            acc[p.id as string] = p.email as string;
            return acc;
          }, {});
        }

        return json({
          activity: (data ?? []).map((row) => ({ ...row, email: emailById[row.user_id as string] ?? 'unknown' })),
        });
      }

      // ── Change a user's role (promote/demote admin) ────────────────────
      case 'set_role': {
        const targetId = String(body.userId ?? '');
        const role = String(body.role ?? '');
        if (!targetId || !['user', 'admin'].includes(role)) return json({ error: 'Invalid request' }, 400);
        if (targetId === caller.id) return json({ error: "You can't change your own role." }, 400);

        const { data: target, error } = await admin
          .from('profiles')
          .update({ role })
          .eq('id', targetId)
          .select('email')
          .single();
        if (error) throw error;

        await audit('set_role', targetId, target?.email ?? null, { role });
        return json({ ok: true });
      }

      // ── Suspend / reactivate a user (blocks sign-in via a trigger you
      //    can extend, and is enforced by is_admin()/status checks) ───────
      case 'set_status': {
        const targetId = String(body.userId ?? '');
        const status = String(body.status ?? '');
        if (!targetId || !['active', 'suspended'].includes(status)) return json({ error: 'Invalid request' }, 400);
        if (targetId === caller.id) return json({ error: "You can't suspend your own account." }, 400);

        const { data: target, error } = await admin
          .from('profiles')
          .update({ status })
          .eq('id', targetId)
          .select('email')
          .single();
        if (error) throw error;

        // Also kick any active sessions immediately when suspending.
        if (status === 'suspended') {
          await admin.auth.admin.signOut(targetId, 'global').catch(() => {});
        }

        await audit('set_status', targetId, target?.email ?? null, { status });
        return json({ ok: true });
      }

      // ── Permanently delete a user and all their data ───────────────────
      case 'delete_user': {
        const targetId = String(body.userId ?? '');
        if (!targetId) return json({ error: 'Invalid request' }, 400);
        if (targetId === caller.id) return json({ error: "You can't delete your own account here." }, 400);

        const { data: target } = await admin.from('profiles').select('email').eq('id', targetId).single();

        // Deletes the auth.users row; `on delete cascade` on profiles/
        // game_attempts/game_progress removes the rest automatically.
        const { error } = await admin.auth.admin.deleteUser(targetId);
        if (error) throw error;

        await audit('delete_user', targetId, target?.email ?? null, null);
        return json({ ok: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error('[admin-api]', err);
    return json({ error: 'Internal error' }, 500);
  }
});
