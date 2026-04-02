import React, { createContext, useContext, useEffect, useState } from 'react';
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
    console.log("Profile or Workspace missing, self-healing started...");
    
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
      console.error("Self-healing: Failed to create workspace", wsError);
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
      console.error("Self-healing: Failed to update profile", upsertError);
    } else {
      setProfile(newProfile);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
