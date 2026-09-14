import { supabase } from './supabaseClient';

export interface AdminStats {
  totalUsers: number;
  admins: number;
  suspended: number;
  totalAttempts: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  newThisWeek: number;
  signupsByDay: Record<string, number>;
  gameBreakdown: { gameName: string; attempts: number; avgAccuracy: number }[];
}

export interface AdminUserRow {
  id: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  department: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
  last_seen_at: string;
  attemptCount: number;
}

export interface AdminActivityRow {
  id: string;
  user_id: string;
  email: string;
  game_name: string;
  difficulty: string;
  mode: string;
  score: number;
  accuracy: number;
  created_at: string;
}

// Every call here goes through Supabase's own edge-function gateway, which
// forwards the caller's real access token. The Edge Function independently
// re-verifies that token and the caller's admin status server-side (see
// supabase/functions/admin-api) — nothing here can be trusted on its own,
// and nothing here ever touches a service-role key.
async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('Cloud sync is not configured.');
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message || 'Admin request failed');
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const adminApi = {
  stats: () => call<AdminStats>('stats'),

  listUsers: (page: number, pageSize: number, search: string) =>
    call<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }>('list_users', {
      page,
      pageSize,
      search,
    }),

  recentActivity: (limit = 50) => call<{ activity: AdminActivityRow[] }>('recent_activity', { limit }),

  setRole: (userId: string, role: 'user' | 'admin') => call<{ ok: true }>('set_role', { userId, role }),

  setStatus: (userId: string, status: 'active' | 'suspended') =>
    call<{ ok: true }>('set_status', { userId, status }),

  deleteUser: (userId: string) => call<{ ok: true }>('delete_user', { userId }),
};
