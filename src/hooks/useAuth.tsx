import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  agencyId: string | null;
  role: string | null;
  isDeveloper: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => { },
  agencyId: null,
  role: null,
  isDeveloper: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      // Robust profile fetch: user_id is the preferred link, but id might be synced
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id')
        .or(`user_id.eq.${uid},id.eq.${uid}`)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', uid)
        .maybeSingle();

      if (profile) setAgencyId((profile as any).agency_id);
      if (roleData) setRole(roleData.role);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserData(session.user.id);

          // Subscribe to role changes for the current user
          const roleChannel = supabase
            .channel(`user-role-${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'user_roles',
                filter: `user_id=eq.${session.user.id}`
              },
              (payload: any) => {
                if (payload.new && payload.new.role) {
                  setRole(payload.new.role);
                }
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(roleChannel);
          };
        } else {
          setAgencyId(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchUserData(session.user.id);
      else {
        setAgencyId(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setAgencyId(null);
    setRole(null);
  };

  const isDeveloper = role === 'developer';

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, agencyId, role, isDeveloper }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
