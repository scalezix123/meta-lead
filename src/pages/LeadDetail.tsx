import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, Calendar, User, MessageSquare, ClipboardList, Loader2, Plus, Trash2, MessageCircle, History, Clock, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const QUICK_REPLIES = [
  {
    label: "👋 Intro",
    message: (name: string) => `Hi ${name}! I'm reaching out from our team. We received your inquiry and would love to connect. When's a good time to talk?`
  },
  {
    label: "🔁 Follow-up",
    message: (name: string) => `Hi ${name}, just following up on our previous conversation. Have you had a chance to consider our offer? Happy to answer any questions!`
  },
  {
    label: "💰 Quote Ready",
    message: (name: string) => `Hi ${name}! Your customized quote is ready. I'd love to walk you through the details. Can we schedule a quick call today?`
  },
  {
    label: "📞 Missed Call",
    message: (name: string) => `Hi ${name}, I tried reaching you but couldn't connect. Please call or WhatsApp back when convenient — looking forward to speaking with you!`
  },
  {
    label: "🤝 Closing",
    message: (name: string) => `Hi ${name}! This is a great time to move forward. We only have a few slots left this month. Shall we lock it in today?`
  },
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);

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
  
  const { data: activities = [] } = useQuery({
    queryKey: ['lead-activities', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          *,
          user:profiles (full_name)
        `)
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      
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
      queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
      toast.success("Lead updated");
    }
  });

  const logActivity = useMutation({
    mutationFn: async ({ type, content, metadata = {} }: { type: string, content: string, metadata?: any }) => {
      if (!profile?.workspace_id || !id) return;
      const { error } = await supabase
        .from('lead_activities')
        .insert([{
          lead_id: id,
          workspace_id: profile.workspace_id,
          user_id: profile.id,
          type,
          content,
          metadata
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities', id] });
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
                    <Select 
                      value={lead.status} 
                      onValueChange={(val) => {
                        updateLead.mutate({ status: val });
                        logActivity.mutate({ 
                          type: 'status_change', 
                          content: `Status updated to ${val.toUpperCase()}` 
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-[120px] ml-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['new', 'contacted', 'qualified', 'won', 'lost'].map(s => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <div className="flex gap-2">
                          <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:bg-primary/10 h-8"
                          onClick={() => {
                              logActivity.mutate({ type: 'call', content: 'Attempted Phone Call' });
                              window.open(`tel:${lead.phone.replace(/[^\d]/g, '')}`, '_self');
                          }}
                          >
                          <Phone className="h-4 w-4 mr-2" /> Call
                          </Button>
                          <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:bg-green-500/10 h-8"
                          onClick={() => {
                              logActivity.mutate({ type: 'whatsapp', content: 'Sent WhatsApp Message' });
                              window.open(`https://wa.me/${lead.phone.replace(/[^\d]/g, '')}`, '_blank');
                          }}
                          >
                          <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                          </Button>
                          <Button 
                          variant="outline"
                          size="sm" 
                          className="h-8 text-[10px] font-bold border-green-500/30 text-green-700 hover:bg-green-50"
                          onClick={() => setShowQuickReplies(v => !v)}
                          >
                          ⚡ Quick Reply
                          </Button>
                      </div>
                    )}
                  </div>
                  {showQuickReplies && lead.phone && (
                    <div className="col-span-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Select a template to send via WhatsApp:</p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_REPLIES.map((qr) => (
                          <button
                            key={qr.label}
                            className="text-xs px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/5 text-green-700 hover:bg-green-500/15 transition-colors font-medium"
                            onClick={() => {
                              const msg = encodeURIComponent(qr.message(lead.full_name || 'there'));
                              const cleanPhone = lead.phone.replace(/[^\d]/g, '');
                              logActivity.mutate({ type: 'whatsapp', content: `Quick Reply: ${qr.label}` });
                              window.open(`https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${msg}`, '_blank');
                            }}
                          >
                            {qr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                        onValueChange={(val) => {
                          const isUnassigned = val === "unassigned";
                          updateLead.mutate({ assigned_to: isUnassigned ? null : val });
                          const membersName = members.find(m => m.id === val)?.full_name || 'Unassigned';
                          logActivity.mutate({ 
                            type: 'assignment', 
                            content: `Lead assigned to ${membersName}` 
                          });
                        }}
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
                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Lead Value</p>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-green-600">₹</span>
                        <input 
                          type="number"
                          className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-green-600"
                          placeholder="0.00"
                          value={lead.lead_value || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateLead.mutate({ lead_value: val });
                          }}
                        />
                      </div>
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
            {/* Activity History Timeline */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center gap-2 mb-6">
                <History className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-card-foreground">Activity History</h2>
              </div>
              
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-muted">
                {activities.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic pl-8">No activities recorded yet.</p>
                ) : activities.map((activity: any, idx: number) => (
                  <div key={activity.id} className="relative pl-8 animate-in fade-in slide-in-from-left-2 transition-all">
                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center border bg-card z-10 
                      ${activity.type === 'whatsapp' ? 'text-green-500 border-green-200' : 
                        activity.type === 'status_change' ? 'text-blue-500 border-blue-200' : 
                        activity.type === 'call' ? 'text-primary border-primary/20' : 'text-muted-foreground'}`}>
                      {activity.type === 'whatsapp' ? <MessageCircle className="h-3 w-3" /> :
                       activity.type === 'call' ? <Phone className="h-3 w-3" /> :
                       activity.type === 'status_change' ? <Clock className="h-3 w-3" /> :
                       <History className="h-3 w-3" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-card-foreground">{activity.content}</span>
                        <span className="text-[10px] text-muted-foreground">• {new Date(activity.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">by {activity.user?.full_name || 'System'}</p>
                    </div>
                  </div>
                ))}
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
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select 
                    onValueChange={(val) => {
                      updateLead.mutate({ remark: val });
                    }}
                  >
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Select preset..." />
                    </SelectTrigger>
                    <SelectContent>
                      {['Bada dost i5', 'Bada dost i5+', 'Bada dost i5XL', 'Bada dost i2', 'Dost+ XL', 'Dost XL', 'saathi', 'Partner', 'Bada dost i6'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-8 text-xs whitespace-nowrap" onClick={() => {
                    const remark = prompt("Add/Edit custom remark:", lead.remark || "");
                    if (remark !== null) updateLead.mutate({ remark });
                  }}>
                    Custom
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
