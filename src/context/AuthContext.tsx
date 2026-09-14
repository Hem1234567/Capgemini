import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthResult {
  error: string | null;
  needsEmailConfirmation?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  roll_no: string | null;
  register_no: string | null;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
  last_seen_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  cloudEnabled: boolean;
  /**
   * True only when the database says this account's role is 'admin'.
   * This is READ from the `profiles` table, never set by the client -- a
   * user cannot make themselves admin by editing state, localStorage, or
   * anything else visible in devtools. The Edge Function re-checks this
   * independently server-side before doing anything privileged, so this
   * flag is UX convenience (show/hide the Admin link), not the security
   * boundary itself.
   */
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  loading: false,
  cloudEnabled: false,
  isAdmin: false,
  signUp: async () => ({ error: 'Supabase is not configured.' }),
  signIn: async () => ({ error: 'Supabase is not configured.' }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (!error && data) setProfile(data as Profile);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
        // Best-effort activity heartbeat; failures are silent and harmless.
        supabase?.rpc('touch_last_seen').then(undefined, () => {});
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
        supabase?.rpc('touch_last_seen').then(undefined, () => {});
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Supabase is not configured. See README.md.' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If email confirmation is required, Supabase returns a user with no session yet.
    const needsEmailConfirmation = Boolean(data.user && !data.session);
    return { error: null, needsEmailConfirmation };
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Supabase is not configured. See README.md.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const { data: prof } = await supabase.from('profiles').select('status').eq('id', data.user.id).single();
      if (prof?.status === 'suspended') {
        await supabase.auth.signOut();
        return { error: 'This account has been suspended. Contact an administrator.' };
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        cloudEnabled: isSupabaseConfigured,
        isAdmin: profile?.role === 'admin' && profile?.status === 'active',
        signUp,
        signIn,
        signOut,
        refreshProfile: async () => {
          if (session?.user) await loadProfile(session.user.id);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
