/**
 * src/contexts/AuthContext.tsx
 * Production-Grade Supabase Authentication & Profile Context for AgriOptima AI
 *
 * Capabilities:
 * - Real email & password authentication (Sign in & Sign up)
 * - Automatic session persistence across reloads (localStorage)
 * - Synchronized user profile management (Name, Email, Preferred Language)
 * - Client-side upsert fallback for resilience
 * - Human-friendly farmer-oriented error translation
 * - Seamless demo fallback support
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, UserProfile } from '@/lib/supabase';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemo: boolean;
  userName: string;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    preferredLanguage?: string
  ) => Promise<{ error: string | null; emailConfirmationRequired: boolean }>;
  signOut: () => Promise<void>;
  updateLanguagePreference: (langCode: string) => Promise<void>;
  continueAsDemo: (name?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Transforms technical Supabase/network auth errors into friendly user messages.
 */
export function formatAuthError(error: AuthError | Error | unknown, lang = 'en'): string {
  const isHi = lang === 'hi';
  if (!error) return '';

  const msg = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as any).message).toLowerCase()
    : String(error).toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
    return isHi
      ? 'ईमेल या पासवर्ड गलत है। कृपया पुनः प्रयास करें।'
      : 'Email or password is incorrect. Please try again.';
  }

  if (msg.includes('user already registered') || msg.includes('email already in use')) {
    return isHi
      ? 'इस ईमेल से पहले से खाता मौजूद है। कृपया साइन इन करें।'
      : 'An account with this email already exists. Please sign in.';
  }

  if (msg.includes('email not confirmed')) {
    return isHi
      ? 'कृपया साइन इन करने से पहले अपने ईमेल पर भेजे गए लिंक से पुष्टि करें।'
      : 'Please confirm your email address before signing in.';
  }

  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return isHi
      ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
      : 'Password must be at least 6 characters long.';
  }

  if (msg.includes('invalid email') || msg.includes('valid email')) {
    return isHi
      ? 'कृपया एक मान्य ईमेल पता दर्ज करें।'
      : 'Please enter a valid email address.';
  }

  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
    return isHi
      ? 'सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।'
      : 'Unable to reach server. Please check your internet connection.';
  }

  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return isHi
      ? 'बहुत सारे प्रयास किए गए हैं। कृपया थोड़ी देर बाद प्रयास करें।'
      : 'Too many attempts. Please wait a few moments and try again.';
  }

  return isHi
    ? 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।'
    : 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    try {
      return localStorage.getItem('agrioptima_is_demo_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [demoName, setDemoName] = useState<string>(() => {
    try {
      return localStorage.getItem('agrioptima_demo_name_v1') || 'Demo Farmer';
    } catch {
      return 'Demo Farmer';
    }
  });

  /**
   * Loads or creates user profile from public.profiles table.
   */
  const loadOrCreateProfile = useCallback(async (authUser: User, defaultName?: string, defaultLang = 'en') => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        setProfile(data as UserProfile);
        return;
      }

      // If profile does not exist yet (e.g. trigger not yet executed in Supabase), create it
      const metaName = authUser.user_metadata?.full_name || defaultName || authUser.email?.split('@')[0] || 'Farmer';
      const metaLang = authUser.user_metadata?.preferred_language || defaultLang || 'en';

      const newProfile: UserProfile = {
        id: authUser.id,
        full_name: metaName,
        email: authUser.email || '',
        preferred_language: metaLang,
        updated_at: new Date().toISOString(),
      };

      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .maybeSingle();

      if (inserted) {
        setProfile(inserted as UserProfile);
      } else {
        setProfile(newProfile);
      }
    } catch (err) {
      console.warn('Profile fetch/create fallback notice:', err);
      setProfile({
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Farmer',
        email: authUser.email || '',
        preferred_language: 'en',
      });
    }
  }, []);

  // Initialize and listen to Auth state changes
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        setIsDemo(false);
        try {
          localStorage.removeItem('agrioptima_is_demo_v1');
        } catch {}
        loadOrCreateProfile(initialSession.user);
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Session initial load error:', err);
      if (isMounted) setLoading(false);
    });

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        setIsDemo(false);
        try {
          localStorage.removeItem('agrioptima_is_demo_v1');
        } catch {}
        await loadOrCreateProfile(newSession.user);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadOrCreateProfile]);

  // Sign In with email & password
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (!isSupabaseConfigured) {
        return {
          error: 'Supabase credentials are not configured yet. Please check .env or continue as demo.',
        };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { error: formatAuthError(error) };
        }

        if (data.user) {
          setIsDemo(false);
          try {
            localStorage.removeItem('agrioptima_is_demo_v1');
          } catch {}
          await loadOrCreateProfile(data.user);
        }

        return { error: null };
      } catch (err) {
        return { error: formatAuthError(err) };
      }
    },
    [loadOrCreateProfile]
  );

  // Sign Up new account
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      preferredLanguage = 'en'
    ): Promise<{ error: string | null; emailConfirmationRequired: boolean }> => {
      if (!isSupabaseConfigured) {
        return {
          error: 'Supabase credentials are not configured yet. Please check .env or continue as demo.',
          emailConfirmationRequired: false,
        };
      }

      try {
        const cleanName = fullName.trim() || 'Farmer';
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: cleanName,
              preferred_language: preferredLanguage,
            },
          },
        });

        if (error) {
          return { error: formatAuthError(error), emailConfirmationRequired: false };
        }

        // Check if session was created immediately or confirmation email is required
        const emailConfirmationRequired = Boolean(data.user && !data.session);

        if (data.user) {
          setIsDemo(false);
          try {
            localStorage.removeItem('agrioptima_is_demo_v1');
          } catch {}
          await loadOrCreateProfile(data.user, cleanName, preferredLanguage);
        }

        return { error: null, emailConfirmationRequired };
      } catch (err) {
        return { error: formatAuthError(err), emailConfirmationRequired: false };
      }
    },
    [loadOrCreateProfile]
  );

  // Sign Out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsDemo(false);
      try {
        localStorage.removeItem('agrioptima_is_demo_v1');
        localStorage.removeItem('agrioptima_demo_name_v1');
        localStorage.removeItem('agrioptima_session_state_v1');
      } catch {}
    }
  }, []);

  // Update language preference in Supabase profile
  const updateLanguagePreference = useCallback(
    async (langCode: string): Promise<void> => {
      if (!user || !isSupabaseConfigured) return;
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            preferred_language: langCode,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (!error) {
          setProfile((prev) => (prev ? { ...prev, preferred_language: langCode } : null));
        }
      } catch (err) {
        console.warn('Could not sync language preference to Supabase:', err);
      }
    },
    [user]
  );

  // Continue as Demo
  const continueAsDemo = useCallback((name = 'Demo Farmer') => {
    setIsDemo(true);
    setDemoName(name);
    try {
      localStorage.setItem('agrioptima_is_demo_v1', 'true');
      localStorage.setItem('agrioptima_demo_name_v1', name);
    } catch {}
  }, []);

  // Compute active user display name
  const activeUserName = useMemo(() => {
    if (isDemo) return demoName;
    if (profile?.full_name?.trim()) return profile.full_name.trim();
    if (user?.user_metadata?.full_name?.trim()) return user.user_metadata.full_name.trim();
    if (user?.email) return user.email.split('@')[0];
    return 'Farmer';
  }, [isDemo, demoName, profile, user]);

  const value = useMemo(
    () => ({
      user,
      profile,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      isDemo,
      userName: activeUserName,
      signIn,
      signUp,
      signOut,
      updateLanguagePreference,
      continueAsDemo,
    }),
    [
      user,
      profile,
      session,
      loading,
      isDemo,
      activeUserName,
      signIn,
      signUp,
      signOut,
      updateLanguagePreference,
      continueAsDemo,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
