/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

// الأدوار المعرفة في قاعدة البيانات: head_manager, user, guest
// لكن في الكود نستخدم أدوار إضافية للتوافق مع الواجهة
export type AppRole = 'head_manager' | 'manager' | 'courier' | 'shipper' | 'user' | 'guest';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isHeadManager: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error || !data?.role) {
        console.warn('No role found for user, defaulting to "user"', error);
        return 'user';
      }
      
      const validRoles: AppRole[] = ['head_manager', 'manager', 'courier', 'shipper', 'user', 'guest'];
      return validRoles.includes(data.role as AppRole) ? (data.role as AppRole) : 'user';
    } catch (e) {
      console.error('Error fetching user role:', e);
      return 'user';
    }
  };

  useEffect(() => {
    let isMounted = true;
    let roleTimeout: NodeJS.Timeout | null = null;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setRole(null);
          }
        } else if (initialSession?.user) {
          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession.user);
          }
          
          // مهلة 5 ثواني لجلب الرتبة
          roleTimeout = setTimeout(() => {
            if (isMounted) {
              console.warn('Role fetch timeout, defaulting to "user"');
              setRole('user');
              setLoading(false);
            }
          }, 5000);

          const userRole = await fetchUserRole(initialSession.user.id);
          
          if (isMounted) {
            if (roleTimeout) clearTimeout(roleTimeout);
            setRole(userRole);
          }
        } else {
          if (isMounted) {
            setSession(null);
            setUser(null);
            setRole(null);
          }
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setRole(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false); // ⚠️ هذا السطر حاسم - يضمن إنهاء التحميل دائمًا
        }
        if (roleTimeout) clearTimeout(roleTimeout);
      }
    };

    initAuth();

    // مراقبة تغييرات الحالة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (!isMounted) return;
      
      console.log('Auth event:', event);
      setSession(_session);
      setUser(_session?.user ?? null);
      
      if (_session?.user) {
        fetchUserRole(_session.user.id).then(userRole => {
          if (isMounted) setRole(userRole);
        });
      } else {
        setRole(null);
      }
    });

    return () => {
      isMounted = false;
      if (roleTimeout) clearTimeout(roleTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data.session?.user) {
      const userRole = await fetchUserRole(result.data.session.user.id);
      setRole(userRole);
    }
    return result;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isHeadManager = role === 'head_manager';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        role, 
        loading, 
        isHeadManager, 
        signIn, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};