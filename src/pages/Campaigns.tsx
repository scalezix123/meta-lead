import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Megaphone, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Campaigns() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "meta",
    ad_spend: "0",
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (!profile?.workspace_id) return;
      const { error } = await supabase
        .from('campaigns')
        .insert([{
          ...newCampaign,
          ad_spend: parseFloat(newCampaign.ad_spend),
          workspace_id: profile.workspace_id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-campaigns'] });
      setIsAdding(false);
      setNewCampaign({ name: "", platform: "meta", ad_spend: "0" });
      toast.success("Campaign added! ROI will be recalculated.");
    }
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-campaigns'] });
      toast.success("Campaign deleted");
    }
  });

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
      <div className="animate-slide-in max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaign Ad Spend</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your marketing costs to track accurate ROAS and ROI.</p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
            <Plus className="h-4 w-4" /> {isAdding ? "Cancel" : "Add Spends"}
          </Button>
        </div>

        {isAdding && (
          <div className="bg-card border rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-sm font-bold uppercase text-muted-foreground mb-4">Add Daily/Campaign Spend</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold">Campaign Name</label>
                <Input 
                  placeholder="e.g. Summer Sale 2024" 
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold">Platform</label>
                <Select 
                  value={newCampaign.platform}
                  onValueChange={(val) => setNewCampaign({...newCampaign, platform: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta">Meta (Facebook/IG)</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold">Ad Spend (₹)</label>
                <Input 
                  type="number" 
                  placeholder="5000" 
                  value={newCampaign.ad_spend}
                  onChange={(e) => setNewCampaign({...newCampaign, ad_spend: e.target.value})}
                />
              </div>
              <Button onClick={() => createCampaign.mutate()} disabled={!newCampaign.name || createCampaign.isPending}>
                {createCampaign.isPending ? "Adding..." : "Save Campaign"}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Campaign Name</TableHead>
                <TableHead className="font-bold">Platform</TableHead>
                <TableHead className="font-bold">Total Spend</TableHead>
                <TableHead className="font-bold">Date Added</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                    No ad spend data available. Add your first campaign to see ROI analytics.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((camp: any) => (
                  <TableRow key={camp.id}>
                    <TableCell className="font-medium">{camp.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border
                        ${camp.platform === 'meta' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                          camp.platform === 'google' ? 'bg-red-50 text-red-600 border-red-200' : 
                          'bg-muted text-muted-foreground border-muted-foreground/20'}`}>
                        {camp.platform}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-red-600">₹{camp.ad_spend.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(camp.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                            if(confirm("Delete this campaign spend record?")) deleteCampaign.mutate(camp.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
