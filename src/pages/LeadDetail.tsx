import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, Calendar, User, MessageSquare, ClipboardList, Loader2, Plus, Trash2, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState("");
  const [tagInput, setTagInput] = useState("");

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          tasks (*),
          assigned_user:profiles (full_name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['team', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('workspace_id', profile.workspace_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const updateLead = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success("Lead updated");
    }
  });

  const addTag = async () => {
    if (!tagInput || !lead) return;
    const currentTags = lead.tags || [];
    if (currentTags.includes(tagInput.trim())) {
      setTagInput("");
      return;
    }
    
    const newTags = [...currentTags, tagInput.trim()];
    updateLead.mutate({ tags: newTags });
    setTagInput("");
  };

  const removeTag = async (tagToRemove: string) => {
    if (!lead) return;
    const newTags = (lead.tags || []).filter((t: string) => t !== tagToRemove);
    updateLead.mutate({ tags: newTags });
  };

  const createTask = useMutation({
    mutationFn: async (title: string) => {
      if (!profile?.workspace_id) return;
      const { error } = await supabase
        .from('tasks')
        .insert([{
          title,
          lead_id: id,
          workspace_id: profile.workspace_id,
          status: 'todo'
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setTaskTitle("");
      toast.success("Task added");
    }
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success("Task deleted");
    }
  });

  const deleteLead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead deleted");
      navigate('/leads');
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

  if (!lead) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Lead not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="animate-slide-in max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-muted-foreground hover:bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            {/* Header Card */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-card-foreground">{lead.full_name || 'No Name'}</h1>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{lead.source}</p>
                </div>
                <div className="flex items-center gap-2">
                  <LeadStatusBadge status={lead.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm("Are you sure you want to delete this lead?")) deleteLead.mutate();
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Phone</p>
                      <p className="text-sm text-card-foreground">{lead.phone || 'No phone'}</p>
                    </div>
                  </div>
                  {lead.phone && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-green-600 hover:bg-green-500/10 h-8"
                      onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Email</p>
                    <p className="text-sm text-card-foreground">{lead.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Assignee</p>
                    <Select 
                      value={lead.assigned_to || ""} 
                      onValueChange={(val) => updateLead.mutate({ assigned_to: val === "unassigned" ? null : val })}
                    >
                      <SelectTrigger className="h-8 border-none p-0 bg-transparent text-sm focus:ring-0">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members.map(member => (
                          <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Created</p>
                    <p className="text-sm text-card-foreground">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Data Card */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-card-foreground">Meta Data</h2>
              </div>
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                {lead.meta_data?.raw_fields ? (
                  Object.entries(lead.meta_data.raw_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-xs pb-2 border-b last:border-0 last:pb-0">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-card-foreground font-medium">{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No additional meta data found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Tasks & Remarks */}
          <div className="w-full md:w-80 space-y-6">
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-card-foreground">Remark</h2>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-primary hover:bg-primary/10" onClick={() => {
                  const remark = prompt("Add/Edit remark:", lead.remark || "");
                  if (remark !== null) updateLead.mutate({ remark });
                }}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm text-card-foreground p-3 bg-muted/30 rounded-lg">
                {lead.remark ? (
                  <p className="whitespace-pre-wrap">{lead.remark}</p>
                ) : (
                  <p className="text-muted-foreground italic text-xs">No remark added yet.</p>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-card-foreground">Tags</h2>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['Completed', 'Connected', 'Pending', 'Follow up'].map((qTag) => (
                  <button
                    key={qTag}
                    onClick={() => { setTagInput(qTag); setTimeout(addTag, 0); }}
                    className="text-[9px] px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors uppercase font-bold"
                  >
                    + {qTag}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-4 border-t pt-3">
                {(lead.tags || []).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-[10px] flex items-center gap-1 bg-primary/5 text-primary border-primary/10">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <Plus className="h-3 w-3 rotate-45" />
                    </button>
                  </Badge>
                ))}
                {(lead.tags || []).length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">No tags assigned</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input 
                  placeholder="Add tag (e.g. Called)..." 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={addTag}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-card-foreground">Tasks</h2>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="New task..." 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && taskTitle && createTask.mutate(taskTitle)}
                  className="h-8 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => taskTitle && createTask.mutate(taskTitle)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-3">
                {lead.tasks && lead.tasks.length > 0 ? (
                  lead.tasks.map((task: any) => (
                    <div key={task.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className={`mt-1 h-3 w-3 rounded-full border ${task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask.mutate(task.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">No tasks yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
