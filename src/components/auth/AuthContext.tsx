import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  workspace_id: string | null;
  role: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const fetchProfile = async (userId: string) => {
    // 1. Try to fetch existing profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // 2. If profile exists and has a workspace, we're good
    if (!profileError && profileData?.workspace_id) {
      setProfile(profileData);
      return;
    }

    // 3. Self-healing: Create a workspace if missing
    console.log("Self-healing: Profile or Workspace missing, creating default...");
    
    // Create a default workspace
    const { data: wsData, error: wsError } = await supabase
      .from('workspaces')
      .insert({ 
        name: "My Workspace",
        slug: `workspace-${Math.random().toString(36).substring(7)}`
      })
      .select()
      .single();
    
    if (wsError) {
      console.error("Self-healing: Workspace creation failed.", {
        message: wsError.message,
        code: wsError.code,
        details: wsError.details,
        hint: wsError.hint
      });
      return;
    }

    // Update or Create the profile with the new workspace ID
    const { data: newProfile, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        workspace_id: wsData.id,
        full_name: user?.email?.split('@')[0] || "User",
        role: 'admin'
      })
      .select()
      .single();

    if (upsertError) {
      console.error("Self-healing: Profile update failed.", upsertError);
    } else {
      console.log("Self-healing: Successfully initialized workspace and profile.");
      setProfile(newProfile);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized.current) return;
      initialized.current = true;

      // Safety timeout: Don't let the app hang forever if Supabase is stuck
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn("AuthContext: Initialization timed out. Forcing load completion.");
          setLoading(false);
        }
      }, 10000); // Increased to 10s for slow networks


      try {
        console.log("AuthContext: Starting initialization...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (sessionError.message.includes('Lock')) {
            console.warn("AuthContext: Lock conflict detected, retrying in 1s...");
            setTimeout(() => { initialized.current = false; initializeAuth(); }, 1000);
            return;
          }
          throw sessionError;
        }

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id).catch(e => console.error("Initial profile fetch failed:", e));
        }
      } catch (error) {
        console.error("AuthContext: Initialization error:", error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: Auth state changed:", event);
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser && event === 'SIGNED_IN') {
        fetchProfile(currentUser.id).catch(err => 
          console.error("AuthContext: Background profile fetch error:", err)
        );
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("AuthContext: SignOut error:", error);
    } finally {
      // Force clear all local state to escape "stuck" sessions
      setSession(null);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('sb-iijukoizlrztgxozieav-auth-token');
      window.location.href = '/login';
    }
  };


  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm font-medium animate-pulse">Initializing SCALEZIX...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );

};

export const useAuth = () => useContext(AuthContext);
