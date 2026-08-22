import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  agencyId: string | null;
  role: string | null;
  isDeveloper: boolean;
  isAdmin: boolean;
  displayName: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  agencyId: null,
  role: null,
  isDeveloper: false,
  isAdmin: false,
  displayName: null,
});

// 30 Minutes Inactivity Timeout = 30 * 60 * 1000 ms
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_RESET_KEY = "pronaf_session_reset_v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── 1. FORCE DISCONNECT PREVIOUS SESSIONS (LOGOFF DE SESSÕES ANTERIORES) ──
  useEffect(() => {
    if (!localStorage.getItem(SESSION_RESET_KEY)) {
      supabase.auth.signOut().then(() => {
        localStorage.setItem(SESSION_RESET_KEY, "true");
      });
    }
  }, []);

  // ── 2. 30-MINUTE INACTIVITY AUTO-LOGOUT ──
  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }

    const handleInactivityLogout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setAgencyId(null);
      setRole(null);
      setDisplayName(null);

      toast({
        title: "⏰ Sessão Expirada por Inatividade",
        description: "Você esteve inativo por 30 minutos. Por favor, faça login novamente para continuar.",
        variant: "destructive",
      });
    };

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));

    // Start timer initially on login
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [user]);

  // ── 3. AUTH STATE & USER DATA FETCHING ──
  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('agency_id, display_name, full_name')
        .or(`user_id.eq.${uid},id.eq.${uid}`)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', uid)
        .maybeSingle();

      if (profile) {
        const newAgencyId = (profile as any).agency_id;
        const newDisplayName = (profile as any).display_name || (profile as any).full_name || null;
        setAgencyId(prev => prev !== newAgencyId ? newAgencyId : prev);
        setDisplayName(prev => prev !== newDisplayName ? newDisplayName : prev);
      }
      if (roleData) {
        const newRole = roleData.role;
        setRole(prev => prev !== newRole ? newRole : prev);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setSession(session);
        
        if (currentUser?.id !== userRef.current?.id) {
          setUser(currentUser);
          if (currentUser) {
            await fetchUserData(currentUser.id);

            const roleChannel = supabase
              .channel(`user-role-${currentUser.id}`)
              .on(
                'postgres_changes',
                {
                  event: '*',
                  schema: 'public',
                  table: 'user_roles',
                  filter: `user_id=eq.${currentUser.id}`
                },
                (payload: any) => {
                  if (payload.new && payload.new.role) {
                    setRole(prev => prev !== payload.new.role ? payload.new.role : prev);
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
            setDisplayName(null);
          }
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setSession(session);
      if (currentUser?.id !== userRef.current?.id) {
        setUser(currentUser);
        if (currentUser) await fetchUserData(currentUser.id);
        else {
          setAgencyId(null);
          setRole(null);
          setDisplayName(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAgencyId(null);
    setRole(null);
    setDisplayName(null);
  };

  const isDeveloper = role === 'developer';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, agencyId, role, isDeveloper, isAdmin, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
