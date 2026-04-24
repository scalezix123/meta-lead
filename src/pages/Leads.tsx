import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LeadStatusBadge, stageLabels } from "@/components/LeadStatusBadge";
import { Badge } from "@/components/ui/badge";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, Download, MessageCircle, RefreshCcw, LayoutGrid, ShieldAlert, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const getSpeedLabel = (createdAt: string, status: string) => {
  if (status !== 'new') return null;
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60));
  if (mins < 60) return { label: `${mins}m`, hot: mins < 30 };
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return { label: `${hrs}h`, hot: false, warn: hrs >= 4 };
  return { label: `${Math.floor(hrs / 24)}d`, hot: false, warn: true };
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500/10 text-green-700 border-green-500/20';
  if (score >= 60) return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
  if (score >= 40) return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
  return 'bg-red-500/10 text-red-700 border-red-500/20';
};

export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState<string>("");
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [customRemarkText, setCustomRemarkText] = useState("");
  const [customRemarkLead, setCustomRemarkLead] = useState<any>(null);
  const [customTLLead, setCustomTLLead] = useState<any>(null);
  const [customTLText, setCustomTLText] = useState("");
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Supabase Realtime: instant lead refresh
  useEffect(() => {
    if (!profile?.workspace_id) return;
    const channel = supabase
      .channel(`realtime-leads-table-${profile.workspace_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `workspace_id=eq.${profile.workspace_id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.success('🎯 New lead just arrived!', { duration: 4000 });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.workspace_id, queryClient]);

  const handleSyncAllMetaLeads = async () => {
    if (!profile?.workspace_id) return;
    setIsSyncingMeta(true);
    let overallAdded = 0;
    
    try {
        const { data: pages } = await supabase.from('facebook_pages').select('*').eq('workspace_id', profile.workspace_id);
        if (!pages || pages.length === 0) {
            toast.info("No Facebook pages connected. Go to Integrations to connect.");
            setIsSyncingMeta(false);
            return;
        }

        for (const page of pages) {
            let formsUrl = `https://graph.facebook.com/v19.0/${page.page_id}/leadgen_forms?access_token=${page.access_token}`;
            let hasNextForms = true;
            
            while (hasNextForms) {
                const formsRes = await fetch(formsUrl);
                const formsData = await formsRes.json();
                
                if (formsData.data) {
                    for (const form of formsData.data) {
                        let url = `https://graph.facebook.com/v19.0/${form.id}/leads?fields=id,created_time,field_data,campaign_name,form_id,is_organic&access_token=${page.access_token}&limit=100`;
                        let hasNextPage = true;

                        while (hasNextPage) {
                            const leadsRes = await fetch(url);
                            const leadsData = await leadsRes.json();

                            if (leadsData.data && leadsData.data.length > 0) {
                                const mapping = page.field_mapping || { full_name: 'full_name', email: 'email', phone: 'phone' };
                                const leadsToUpsert = leadsData.data.map((lead: any) => {
                                    const getFieldValue = (name: string, fallbacks: string[] = []) => {
                                        let val = lead.field_data?.find((f: any) => f.name === name || f.name.toLowerCase() === name.toLowerCase())?.values?.[0];
                                        if (val) return val;
                                        for (const fb of fallbacks) {
                                            val = lead.field_data?.find((f: any) => f.name === fb || f.name.toLowerCase() === fb.toLowerCase())?.values?.[0];
                                            if (val) return val;
                                        }
                                        return null;
                                    };
                                    return {
                                        workspace_id: profile.workspace_id,
                                        full_name: getFieldValue(mapping.full_name, ['full_name', 'name', 'first_name', 'fullname', 'full_name']) || 'Prospect',
                                        email: getFieldValue(mapping.email, ['email', 'email_address', 'email']),
                                        phone: getFieldValue(mapping.phone, ['phone', 'phone_number', 'work_phone_number', 'phonenumber', 'phone']),
                                        status: 'new',
                                        source: 'meta',
                                        facebook_lead_id: lead.id,
                                        meta_data: {
                                            ...lead,
                                            page_name: page.page_name || page.name,
                                            campaign_name: lead.campaign_name || 'Direct / Organic'
                                        },
                                        created_at: lead.created_time
                                    };
                                });
                                const { error } = await supabase.from('leads').upsert(leadsToUpsert, { onConflict: 'facebook_lead_id' });
                                if (!error) overallAdded += leadsToUpsert.length;
                            }
                            if (leadsData.paging && leadsData.paging.next) url = leadsData.paging.next;
                            else hasNextPage = false;
                        }
                    }
                }
                
                if (formsData.paging && formsData.paging.next) {
                    formsUrl = formsData.paging.next;
                } else {
                    hasNextForms = false;
                }
            }
        }
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        if (overallAdded > 0) {
            toast.success(`Successfully synced ${overallAdded} new leads from Meta`);
        } else {
            toast.info("No new leads found to sync.");
        }
    } catch (err) {
        toast.error("Error syncing leads");
    } finally {
        setIsSyncingMeta(false);
    }
  };

  const updateLead = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead updated");
    },
    onError: (error: any) => {
      console.error("Update failed:", error);
      toast.error(`Failed to update: ${error.message || "Unknown error"}`);
    }
  });

  const handleAddRemark = (e: React.MouseEvent | null, lead: any) => {
    if (e) e.stopPropagation();
    setCustomRemarkText(lead.remark || "");
    setCustomRemarkLead(lead);
  };

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
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

  const filtered = leads.filter(lead => {
    const matchesSearch = 
      (lead.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (lead.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (lead.phone || "").includes(search) ||
      (lead.tags || []).some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesAssignee = assigneeFilter === "all" || lead.assigned_to === assigneeFilter;
    const matchesFollowUp = !followUpFilter || (lead.follow_up_date && lead.follow_up_date.startsWith(followUpFilter));
    return matchesSearch && matchesStatus && matchesAssignee && matchesFollowUp;
  });

  const isRotten = (createdAt: string, status: string) => {
    if (status !== 'new') return false;
    const hours = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return hours > 4;
  };

  const exportLeads = () => {
    if (filtered.length === 0) return;
    const headers = ["Name", "Email", "Phone", "Status", "Source", "Date"];
    const rows = filtered.map(l => [
      l.full_name,
      l.email,
      l.phone,
      l.status,
      l.source,
      new Date(l.created_at).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("CSV Export started");
  };

  const handleRottenReassign = async () => {
    const rottenLeads = filtered.filter(l => isRotten(l.created_at, l.status));
    if (rottenLeads.length === 0) {
        toast.info("No rotten leads to process!");
        return;
    }
    const eligibleMembers = members.filter(m => m.id !== profile?.id);
    if (eligibleMembers.length === 0) {
        toast.error("No other team members available to reassign to!");
        return;
    }
    
    toast.loading(`Processing ${rottenLeads.length} neglected leads...`);
    for (const lead of rottenLeads) {
        const randomMember = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
        await supabase.from('leads').update({ assigned_to: randomMember.id }).eq('id', lead.id);
    }
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    toast.dismiss();
    toast.success(`Successfully reassigned ${rottenLeads.length} rotten leads away from neglectful owners!`);
  };

  const openWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/[^\d]/g, '');
    // If it's a 10-digit number, prepend India country code (91) as a baseline
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <AppLayout>
      <div className="animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground mt-1">{leads.length} total leads found</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/pipeline')}>
              <LayoutGrid className="h-4 w-4 mr-2" /> Board View
            </Button>
            {profile?.role === 'admin' && (
              <Button variant="destructive" size="sm" onClick={handleRottenReassign}>
                <ShieldAlert className="h-4 w-4 mr-2" /> Reassign Rotten
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSyncAllMetaLeads} disabled={isSyncingMeta}>
              {isSyncingMeta ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
              {isSyncingMeta ? 'Syncing...' : 'Sync Meta Leads'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportLeads} disabled={filtered.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <CreateLeadDialog />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(stageLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {members.map(member => (
                  <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={followUpFilter}
              onChange={e => setFollowUpFilter(e.target.value)}
              className="w-[160px] h-10"
              placeholder="Follow-up Date"
            />
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {leadsLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[140px]">Name</TableHead>
                  <TableHead className="hidden md:table-cell">TL</TableHead>
                  <TableHead className="hidden md:table-cell">Custom Info</TableHead>
                  <TableHead className="hidden lg:table-cell">Calling Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Calling Remark</TableHead>
                  <TableHead>Next Follow-up</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Last Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-muted-foreground italic">
                      No leads found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(lead => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50 group"
                    >
                      <TableCell className="max-w-[140px]" onClick={() => navigate(`/leads/${lead.id}`)}>
                        <div className="flex flex-col">
                          <p className="font-semibold text-card-foreground group-hover:text-primary transition-colors truncate">{lead.full_name || 'No Name'}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-[10px] text-muted-foreground truncate">{lead.phone || 'No phone'}</p>
                            {lead.phone && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.phone); }}
                                    className="text-green-600 hover:text-green-500"
                                >
                                    <MessageCircle className="h-3 w-3" />
                                </button>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                            <Select 
                                value={lead.assigned_to || (lead.custom_tl ? "custom" : "unassigned")} 
                                onValueChange={(val) => {
                                    if (val === "custom") {
                                        setCustomTLText(lead.custom_tl || "");
                                        setCustomTLLead(lead);
                                    } else {
                                        updateLead.mutate({ id: lead.id, updates: { assigned_to: val === "unassigned" ? null : val, custom_tl: null } });
                                    }
                                }}
                            >
                            <SelectTrigger className="h-8 border-none p-0 bg-transparent text-xs w-[100px] focus:ring-0">
                                <SelectValue placeholder="Unassigned">
                                    {lead.assigned_to ? members.find(m => m.id === lead.assigned_to)?.full_name : (lead.custom_tl || "Unassigned")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {members.map(member => (
                                <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                                ))}
                                <SelectItem value="custom" className="font-bold text-primary">+ Custom TL</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Input 
                          value={lead.custom_text_field || ""} 
                          onChange={(e) => updateLead.mutate({ id: lead.id, updates: { custom_text_field: e.target.value } })}
                          className="h-7 text-[10px] w-24 bg-transparent border-muted/20"
                          placeholder="Note..."
                        />
                      </TableCell>

                      <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Input 
                          type="date"
                          value={lead.calling_date || ""} 
                          onChange={(e) => updateLead.mutate({ id: lead.id, updates: { calling_date: e.target.value } })}
                          className="h-7 text-[10px] w-28 bg-transparent border-muted/20"
                        />
                      </TableCell>

                      <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        <Input 
                          value={lead.calling_remark || ""} 
                          onChange={(e) => updateLead.mutate({ id: lead.id, updates: { calling_remark: e.target.value } })}
                          className="h-7 text-[10px] w-32 bg-transparent border-muted/20"
                          placeholder="Call notes..."
                        />
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[130px] h-8 justify-start text-left font-normal text-[10px] px-2 border-muted/20 bg-transparent",
                                !lead.follow_up_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-1 h-3 w-3" />
                              {lead.follow_up_date ? format(new Date(lead.follow_up_date), "PPP") : <span>Set Date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={lead.follow_up_date ? new Date(lead.follow_up_date) : undefined}
                              onSelect={(date) => updateLead.mutate({ id: lead.id, updates: { follow_up_date: date?.toISOString() } })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                            value={lead.inquiry_outcome || "none"}
                            onValueChange={(val) => updateLead.mutate({ id: lead.id, updates: { inquiry_outcome: val === "none" ? null : val } })}
                        >
                            <SelectTrigger className="h-8 border-none p-0 bg-transparent text-[10px] w-[100px] focus:ring-0">
                                <SelectValue placeholder="No Outcome" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" className="text-muted-foreground italic">No Outcome</SelectItem>
                                {['FAKE INQUIRY', 'INTRESTED', 'NOT INTERSTED', 'PENDING', 'WRONG NUMBER', 'OUT OF TARITORY', 'DUPLICATE INQUIRY'].map(o => (
                                    <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Select
                            value={['Bada dost i5', 'Bada dost i5+', 'Bada dost i5XL', 'Bada dost i2', 'Dost+ XL', 'Dost XL', 'saathi', 'Partner', 'Bada dost i6', 'Dost Twin fule'].includes(lead.remark) ? lead.remark : (lead.remark ? "custom" : "none")}
                            onValueChange={(val) => {
                              if (val === "custom") {
                                handleAddRemark(null, lead);
                              } else if (val !== "none") {
                                updateLead.mutate({ id: lead.id, updates: { remark: val } });
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 border-none p-0 bg-transparent text-[10px] w-[110px] focus:ring-0">
                              <div className="truncate max-w-[100px] text-left" title={lead.remark}>
                                {lead.remark || "No vehicle"}
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-muted-foreground italic">No vehicle</SelectItem>
                              {['Bada dost i5', 'Bada dost i5+', 'Bada dost i5XL', 'Bada dost i2', 'Dost+ XL', 'Dost XL', 'saathi', 'Partner', 'Bada dost i6', 'Dost Twin fule'].map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                              <SelectItem value="custom" className="font-bold text-primary">+ Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Input 
                          value={lead.last_action || ""} 
                          onChange={(e) => updateLead.mutate({ id: lead.id, updates: { last_action: e.target.value } })}
                          className="h-7 text-[10px] w-32 bg-transparent border-muted/20"
                          placeholder="What's next?..."
                        />
                      </TableCell>

                      <TableCell onClick={() => navigate(`/leads/${lead.id}`)}>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-muted-foreground text-[10px]" onClick={() => navigate(`/leads/${lead.id}`)}>
                        {new Date(lead.created_at).toLocaleDateString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={!!customRemarkLead} onOpenChange={(open) => !open && setCustomRemarkLead(null)}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Add/Edit Custom Vehicle/Remark</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={customRemarkText} 
              onChange={(e) => setCustomRemarkText(e.target.value)} 
              placeholder="Enter custom vehicle or remark..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateLead.mutate({ id: customRemarkLead.id, updates: { remark: customRemarkText } });
                  setCustomRemarkLead(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomRemarkLead(null)}>Cancel</Button>
            <Button onClick={() => {
              if (customRemarkLead) {
                updateLead.mutate({ id: customRemarkLead.id, updates: { remark: customRemarkText } });
                setCustomRemarkLead(null);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!customTLLead} onOpenChange={(open) => !open && setCustomTLLead(null)}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Assign Custom TL</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={customTLText} 
              onChange={(e) => setCustomTLText(e.target.value)} 
              placeholder="Enter custom TL name..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateLead.mutate({ id: customTLLead.id, updates: { assigned_to: null, custom_tl: customTLText } });
                  setCustomTLLead(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomTLLead(null)}>Cancel</Button>
            <Button onClick={() => {
              if (customTLLead) {
                updateLead.mutate({ id: customTLLead.id, updates: { assigned_to: null, custom_tl: customTLText } });
                setCustomTLLead(null);
              }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
