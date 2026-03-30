import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Check, Copy, Loader2, Mail, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Team() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const queryClient = useQueryClient();

  const handleRemoveInvite = async (inviteId: string) => {
    toast.loading("Removing invitation...");
    const { error } = await supabase.from('workspace_invites').delete().eq('id', inviteId);
    toast.dismiss();
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Invitation removed structure");
      queryClient.invalidateQueries({ queryKey: ['workspace-invites'] });
    }
  };

  const { data: workspace } = useQuery({
    queryKey: ['workspace', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return null;
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', profile.workspace_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('workspace_id', profile.workspace_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });
  
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['invites', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('workspace_invites')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .is('accepted_at', null);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const copyToClipboard = () => {
    if (!profile?.workspace_id) return;
    navigator.clipboard.writeText(profile.workspace_id);
    setCopied(true);
    toast.success("Workspace ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.workspace_id || !inviteEmail) return;
    
    setIsInviting(true);
    const { error } = await supabase
      .from('workspace_invites')
      .insert({
        workspace_id: profile.workspace_id,
        email: inviteEmail,
        role: inviteRole,
        invited_by: profile.id
      });

    if (error) {
      toast.error(error.message);
    } else {
      const subject = encodeURIComponent("You've been invited to join our CRM Workspace!");
      const body = encodeURIComponent(
        `Hi there,\n\n` +
        `You have been invited to join our CRM workspace.\n\n` +
        `Please sign up at: ${window.location.origin}/signup\n` +
        `When prompted during registration, use this Workspace ID: ${profile.workspace_id}\n\n` +
        `Thanks!`
      );
      
      // Open the local email client
      window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;

      toast.success(`Opening email client to send invite to ${inviteEmail}`);
      setInviteEmail("");
    }
    setIsInviting(false);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{workspace?.name || 'Workspace'} Team</h1>
            <p className="text-sm text-muted-foreground mt-1">{members.length} active members</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite to Workspace</DialogTitle>
                <DialogDescription>
                  Share this Workspace ID with your team members. They can use it to join your workspace during signup.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 pt-4">
                <div className="grid flex-1 gap-2">
                  <div className="flex bg-muted p-2 rounded-md border text-xs font-mono break-all">
                    {profile?.workspace_id}
                  </div>
                </div>
                <Button size="sm" className="px-3" onClick={copyToClipboard}>
                  <span className="sr-only">Copy</span>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or invite via email</span>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-xs">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="teammate@company.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-xs">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-9" disabled={isInviting}>
                  {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <div key={member.id} className="bg-card rounded-xl border p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary uppercase">
                    {member.full_name?.substring(0, 2) || member.id.substring(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-card-foreground truncate capitalize">{member.full_name || 'Anonymous User'}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Active Member</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge variant={member.id === profile?.id ? "default" : "secondary"} className="text-[10px] uppercase font-bold px-2 py-0">
                  {member.id === profile?.id ? 'Admin' : 'Member'}
                </Badge>
                <span className="text-[10px] text-muted-foreground italic">
                  Joined {new Date(member.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          
          <div className="bg-card/50 rounded-xl border border-dashed p-5 flex flex-col items-center justify-center text-center min-h-[140px]">
            <p className="text-xs text-muted-foreground mb-3">Expanding your team?</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                  Add another
                </Button>
              </DialogTrigger>
              {/* Reuse the same DialogContent logic if needed or point to instructions */}
            </Dialog>
          </div>
        </div>

        {/* Pending Invites Section */}
        {pendingInvites.length > 0 && (
          <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-lg font-semibold text-foreground mb-4">Pending Invitations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingInvites.map((invite: any) => (
                <div key={invite.id} className="bg-muted/30 border border-dashed rounded-xl p-4 relative overflow-hidden group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted border flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{invite.email}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                        Role: {invite.role}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                      WAITING FOR SIGNUP
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveInvite(invite.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
