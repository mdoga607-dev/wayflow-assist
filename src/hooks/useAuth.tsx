import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'head_manager' | 'manager' | 'courier' | 'shipper' | 'user' | 'guest';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isHeadManager: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error || !data) return 'user' as AppRole;
      return data.role as AppRole;
    } catch (e) { 
      return 'user' as AppRole; 
    }
  };

  useEffect(() => {
    // التحقق الأولي من الجلسة
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        }
      } finally {
        setLoading(false); // نضمن توقف التحميل دائماً
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      setSession(_session);
      setUser(_session?.user ?? null);
      if (_session?.user) {
        const userRole = await fetchUserRole(_session.user.id);
        setRole(userRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  const isHeadManager = role === 'head_manager';

  return (
    <AuthContext.Provider value={{ user, session, role, loading, isHeadManager, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};