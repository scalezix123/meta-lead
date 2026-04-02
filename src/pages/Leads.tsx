import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LeadStatusBadge, stageLabels } from "@/components/LeadStatusBadge";
import { Badge } from "@/components/ui/badge";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Loader2, Download, MessageCircle, RefreshCcw, LayoutGrid, ShieldAlert, Clock } from "lucide-react";
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
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
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
                                        let val = lead.field_data.find((f: any) => f.name === name || f.name.toLowerCase() === name.toLowerCase())?.values?.[0];
                                        if (val) return val;
                                        for (const fb of fallbacks) {
                                            val = lead.field_data.find((f: any) => f.name === fb || f.name.toLowerCase() === fb.toLowerCase())?.values?.[0];
                                            if (val) return val;
                                        }
                                        return "";
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
      const { error } = await supabase.from('leads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead updated");
    }
  });

  const handleAddRemark = (e: React.MouseEvent, lead: any) => {
    e.stopPropagation();
    const remark = prompt("Add/Edit remark:", lead.remark || "");
    if (remark !== null) {
      updateLead.mutate({ id: lead.id, updates: { remark } });
    }
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
    return matchesSearch && matchesStatus && matchesAssignee;
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
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Source / Page</TableHead>
                  <TableHead className="hidden md:table-cell">Score</TableHead>
                  <TableHead className="hidden lg:table-cell">Speed</TableHead>
                  <TableHead>TL</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground italic">
                      No leads found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(lead => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50 group"
                    >
                      <TableCell onClick={() => navigate(`/leads/${lead.id}`)}>
                        <div>
                          <p className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{lead.full_name || 'No Name'}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{lead.email || 'No email'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground" onClick={() => navigate(`/leads/${lead.id}`)}>
                        {lead.phone || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell" onClick={() => navigate(`/leads/${lead.id}`)}>
                        {lead.lead_score !== undefined && lead.lead_score !== null ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getScoreColor(lead.lead_score)}`}>
                            {lead.lead_score}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" onClick={() => navigate(`/leads/${lead.id}`)}>
                        {(() => {
                          const speed = getSpeedLabel(lead.created_at, lead.status);
                          if (!speed) return <span className="text-muted-foreground text-xs">—</span>;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              speed.hot ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                              speed.warn ? 'bg-red-500/10 text-red-700 border-red-500/20' :
                              'bg-muted text-muted-foreground border-muted-foreground/20'
                            }`}>
                              <Clock className="h-2.5 w-2.5" />{speed.label}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs" onClick={() => navigate(`/leads/${lead.id}`)}>  
                        <div className="flex flex-col">
                          <span className="uppercase font-bold text-[9px] text-primary" title={lead.meta_data?.campaign_name || 'Generic Campaign'}>
                            {lead.meta_data?.campaign_name || lead.source}
                          </span>
                          <span className="text-muted-foreground truncate max-w-[120px] text-[10px]" title={lead.meta_data?.page_name || 'Generic Page'}>
                            {lead.meta_data?.page_name || 'Generic Page'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigate(`/leads/${lead.id}`)}>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(lead.tags || []).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20 capitalize whitespace-nowrap">
                              {tag}
                            </Badge>
                          ))}
                          {(!lead.tags || lead.tags.length === 0) && <span className="text-[10px] text-muted-foreground italic">No tags</span>}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select 
                          value={lead.assigned_to || "unassigned"} 
                          onValueChange={(val) => updateLead.mutate({ id: lead.id, updates: { assigned_to: val === "unassigned" ? null : val } })}
                        >
                          <SelectTrigger className="h-8 border-none p-0 bg-transparent text-xs w-[120px] focus:ring-0">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {members.map(member => (
                              <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={lead.remark}>
                            {lead.remark || "No remark"}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10 shrink-0" onClick={(e) => handleAddRemark(e, lead)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigate(`/leads/${lead.id}`)}>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm" onClick={() => navigate(`/leads/${lead.id}`)}>
                        {new Date(lead.created_at).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (lead.phone) openWhatsApp(lead.phone);
                          }}
                          className="text-green-600 hover:bg-green-500/10"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
