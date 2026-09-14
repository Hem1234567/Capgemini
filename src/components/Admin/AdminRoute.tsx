import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Hides the admin UI from non-admins and redirects them away.
 *
 * IMPORTANT: this is a convenience for regular visitors, not the security
 * boundary. Someone editing React state or bypassing the router in devtools
 * would still hit a wall the moment any admin page tries to fetch data:
 *   - Direct table reads are blocked by Postgres Row Level Security (the
 *     `is_admin()` check baked into the policies in supabase/schema.sql).
 *   - Privileged actions (list all users, change roles, delete accounts)
 *     go through the `admin-api` Edge Function, which re-checks the
 *     caller's role against the database using the service-role key that
 *     never ships to the browser. No client-side flag can fake that check.
 * So even a modified/rebuilt frontend gains nothing without a real admin
 * account in the database.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, user, isAdmin, cloudEnabled } = useAuth();

  if (!cloudEnabled) return <Navigate to="/" replace />;
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
