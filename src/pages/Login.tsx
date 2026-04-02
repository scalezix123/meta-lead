import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        // Handle Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // 1. Check for invitations
          const { data: invite, error: inviteError } = await supabase
            .from('workspace_invites')
            .select('*')
            .eq('email', email)
            .is('accepted_at', null)
            .maybeSingle();

          let targetWorkspaceId;

          if (invite) {
            // Join existing workspace
            targetWorkspaceId = invite.workspace_id;
            
            // Mark invite as accepted
            await supabase
              .from('workspace_invites')
              .update({ accepted_at: new Date().toISOString() })
              .eq('id', invite.id);
          } else {
            // Create New Workspace
            const { data: wsData, error: wsError } = await supabase
              .from('workspaces')
              .insert({ 
                name: workspaceName || (email.split('@')[0] + "'s Workspace"),
                slug: (workspaceName || email.split('@')[0]).toLowerCase().replace(/ /g, '-')
              })
              .select()
              .single();

            if (wsError) throw wsError;
            targetWorkspaceId = wsData.id;
          }

          // 2. Create Profile
          const { error: profError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              workspace_id: targetWorkspaceId,
              full_name: email.split('@')[0],
              role: invite ? invite.role : 'admin'
            });

          if (profError) throw profError;

          toast.success(invite ? "Joined workspace successfully!" : "Workspace created successfully!");
          navigate("/dashboard");
        }
      } else {
        // Handle Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email");
      setIsResetMode(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Scalezix</span>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-1">
            {isResetMode ? 'Reset your password' : isSignup ? 'Create your workspace' : 'Welcome back'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isResetMode ? 'We will send a reset link to your email' : isSignup ? 'Start managing your Meta leads today' : 'Sign in to your CRM'}
          </p>

          {!isResetMode ? (
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignup && (
                <div>
                  <Label htmlFor="workspace" className="text-sm">Workspace Name</Label>
                  <Input 
                    id="workspace" 
                    placeholder="My Company" 
                    className="mt-1.5" 
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required={isSignup}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@company.com" 
                  className="mt-1.5" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <button 
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="mt-1.5" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignup ? 'Create Workspace' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@company.com" 
                  className="mt-1.5" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => setIsResetMode(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
              >
                Back to Login
              </button>
            </form>
          )}

          {!isResetMode && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="text-primary font-medium hover:underline"
                disabled={loading}
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
