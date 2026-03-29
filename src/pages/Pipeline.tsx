import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LeadStatusBadge, stageLabels } from "@/components/LeadStatusBadge";
import { useNavigate } from "react-router-dom";

const pipelineStages = ['new', 'contacted', 'qualified', 'won', 'lost'];
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { Loader2, Plus, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Pipeline() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['pipeline-leads', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', profile.workspace_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-leads'] });
      toast.success("Lead status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update lead");
    }
  });

  const handleDragStart = (leadId: string) => setDraggedLead(leadId);

  const handleDrop = (stage: string) => {
    if (!draggedLead) return;
    updateLeadStatus.mutate({ id: draggedLead, status: stage });
    setDraggedLead(null);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag leads between stages</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {pipelineStages.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage);
            return (
              <div
                key={stage}
                className="bg-muted/40 rounded-xl p-3 min-h-[500px] w-72 shrink-0 border border-transparent hover:border-muted-foreground/10 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stageLabels[stage as keyof typeof stageLabels]}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                  </div>
                  <CreateLeadDialog 
                    initialStatus={stage}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary">
                        <Plus className="h-3 w-3" />
                      </Button>
                    }
                  />
                </div>
                <div className="space-y-3">
                  {stageLeads.length === 0 && (
                    <div className="h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                      <p className="text-[10px] text-muted-foreground italic">No leads here</p>
                    </div>
                  )}
                  {stageLeads.map(lead => {
                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="bg-card rounded-lg border shadow-sm p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/20 transition-all group relative border-l-4"
                        style={{ borderLeftColor: stage === 'won' ? '#22c55e' : stage === 'lost' ? '#ef4444' : 'transparent' }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors leading-tight">
                            {lead.full_name || 'Unnamed Lead'}
                          </p>
                        </div>
                        
                        <div className="space-y-1.5">
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] uppercase font-medium">{lead.source}</span>
                            <span className="italic opacity-70">
                              {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
