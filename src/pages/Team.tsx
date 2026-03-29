import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Team() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = () => {
    if (!profile?.workspace_id) return;
    navigator.clipboard.writeText(profile.workspace_id);
    setCopied(true);
    toast.success("Workspace ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
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
      </div>
    </AppLayout>
  );
}
