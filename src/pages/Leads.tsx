import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { LeadStatusBadge, stageLabels } from "@/components/LeadStatusBadge";
import { CreateLeadDialog } from "@/components/CreateLeadDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Download, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Leads() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const navigate = useNavigate();
  const { profile } = useAuth();

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
      (lead.phone || "").includes(search);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesAssignee = assigneeFilter === "all" || lead.assigned_to === assigneeFilter;
    return matchesSearch && matchesStatus && matchesAssignee;
  });

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
                  <TableHead className="hidden lg:table-cell">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
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
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-xs uppercase" onClick={() => navigate(`/leads/${lead.id}`)}>
                        {lead.source}
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
