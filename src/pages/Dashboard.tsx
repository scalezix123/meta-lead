import { Target, TrendingUp, Loader2, BarChart3, Trophy, PieChart, Zap, Calendar as CalendarIcon, Bell } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { AppLayout } from "@/components/AppLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

const SOURCE_COLORS: Record<string, string> = {
  meta: '#3b82f6',
  google: '#ef4444',
  manual: '#8b5cf6',
  other: '#64748b',
};

export default function Dashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const userName = profile?.full_name || profile?.id?.substring(0, 8) || "User";

  // ---- Supabase Realtime: auto-refresh when new lead arrives ----
  useEffect(() => {
    if (!profile?.workspace_id) return;
    const channel = supabase
      .channel(`realtime-leads-${profile.workspace_id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads', filter: `workspace_id=eq.${profile.workspace_id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-leads'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.workspace_id, queryClient]);

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['dashboard-leads', profile?.workspace_id],
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

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['dashboard-campaigns', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', profile.workspace_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['dashboard-tasks', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', profile.workspace_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['dashboard-team', profile?.workspace_id],
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

  const today = new Date().toISOString().split('T')[0];
  const todayLeads = leads.filter(l => l.created_at.startsWith(today));
  const todayFollowUps = leads.filter(l => l.follow_up_date && l.follow_up_date.startsWith(today));
  const recentLeads = leads.slice(0, 5);

  useEffect(() => {
    if (todayFollowUps.length > 0) {
      toast.info(`You have ${todayFollowUps.length} follow-ups scheduled for today!`, {
        icon: <Bell className="h-4 w-4" />,
        duration: 5000,
      });
    }
  }, [todayFollowUps.length]);

  // Financial Calculations
  const totalPipelineValue = leads.reduce((acc, lead) => acc + (Number(lead.lead_value) || 0), 0);
  const wonRevenue = leads.filter(l => l.status === 'won').reduce((acc, lead) => acc + (Number(lead.lead_value) || 0), 0);
  const totalAdSpend = campaigns.reduce((acc, camp) => acc + (Number(camp.ad_spend) || 0), 0);
  const roas = totalAdSpend > 0 ? (wonRevenue / totalAdSpend).toFixed(2) : "0.00";

  // Conversion Funnel
  const funnelStages = ['new', 'contacted', 'qualified', 'won', 'lost'];
  const funnelData = funnelStages.map(stage => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    Count: leads.filter(l => l.status === stage).length
  }));

  // Lead Source Analytics (Pie)
  const sourceMap: Record<string, number> = {};
  leads.forEach(l => {
    const src = l.source || 'other';
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SOURCE_COLORS[name] || '#64748b'
  }));

  // Campaign ROI & Top Closers
  const campaignMap: Record<string, number> = {};
  const closerMap: Record<string, number> = {};
  leads.forEach(l => {
    if (l.status === 'won') {
      const camp = l.meta_data?.campaign_name || 'Generic / Standard';
      campaignMap[camp] = (campaignMap[camp] || 0) + 1;
      if (l.assigned_to) {
        closerMap[l.assigned_to] = (closerMap[l.assigned_to] || 0) + 1;
      }
    }
  });

  const topCampaigns = Object.entries(campaignMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topClosers = Object.entries(closerMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, wonCount]) => {
    const member = members.find(m => m.id === id);
    return { name: member?.full_name || 'Unknown TL', won: wonCount };
  });

  // Speed-to-Lead: HOW MANY leads are still 'new' > 4 hrs old
  const slowLeads = leads.filter(l => {
    if (l.status !== 'new') return false;
    const hrs = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60);
    return hrs > 4;
  });

  if (leadsLoading || tasksLoading || membersLoading || campaignsLoading) {
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
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground capitalize">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back, {userName}. Here's your revenue and workflow overview.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-500/10 text-green-700 border border-green-500/20 px-3 py-1.5 rounded-full font-semibold">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse inline-block" />
            Live
          </div>
        </div>

        {/* Speed-to-Lead Warning Banner */}
        {slowLeads.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Zap className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700">⚠️ {slowLeads.length} leads are waiting over 4 hours without contact!</p>
              <p className="text-xs text-red-500 mt-0.5">Leads contacted within 5 mins are 9x more likely to convert. Assign them now!</p>
            </div>
          </div>
        )}

        {/* Today's Follow-ups Banner */}
        {todayFollowUps.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CalendarIcon className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-700">📅 {todayFollowUps.length} follow-ups scheduled for today!</p>
              <p className="text-xs text-blue-500 mt-0.5">Don't forget to call your scheduled leads to keep the pipeline moving.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Leads"
            value={leads.length}
            icon={Target}
            trend={todayLeads.length > 0 ? `+${todayLeads.length} today` : undefined}
          />
          <StatCard
            title="Pipeline Value"
            value={`₹${totalPipelineValue.toLocaleString('en-IN')}`}
            icon={TrendingUp}
          />
          <StatCard
            title="Won Revenue"
            value={`₹${wonRevenue.toLocaleString('en-IN')}`}
            icon={Trophy}
            trend={totalAdSpend > 0 ? `Spend: ₹${totalAdSpend.toLocaleString('en-IN')}` : undefined}
          />
          <StatCard
            title="ROAS"
            value={`${roas}x`}
            icon={BarChart3}
            trend="Return on Ad Spend"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Conversion Funnel */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-card-foreground">Conversion Funnel</h2>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="Count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lead Source Analytics Pie */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-card-foreground">Lead Source Breakdown</h2>
            </div>
            {sourceData.length === 0 ? (
              <p className="text-muted-foreground italic text-sm pt-8">No source data yet.</p>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} leads`, 'Count']} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Today's Follow-ups</h2>
            <div className="space-y-3">
              {todayFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4">No follow-ups for today.</p>
              ) : todayFollowUps.map(lead => (
                <div key={lead.id} className="flex justify-between items-center bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{lead.full_name || 'No Name'}</p>
                    <p className="text-[10px] text-muted-foreground">{lead.phone}</p>
                  </div>
                  <LeadStatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Campaign ROI</h2>
            <div className="space-y-3">
              {topCampaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4">No won deals attributed to campaigns yet.</p>
              ) : topCampaigns.map(([campaign, wonDeals]) => (
                <div key={campaign} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                  <span className="text-xs font-semibold uppercase truncate max-w-[130px]" title={campaign}>{campaign}</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold shrink-0">{wonDeals} won</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Top Closers 🏆</h2>
            <div className="space-y-3">
              {topClosers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No deals closed yet.</p>
              ) : (
                topClosers.map((closer, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-xs">#{i + 1}</div>
                      <p className="text-sm font-semibold text-card-foreground">{closer.name}</p>
                    </div>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-xs">{closer.won} Won</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Recent Leads</h2>
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No recent leads found.</p>
              ) : (
                recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/10 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{lead.full_name || 'No Name'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{lead.source}</p>
                    </div>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
