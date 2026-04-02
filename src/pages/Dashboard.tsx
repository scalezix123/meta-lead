import { Target, TrendingUp, Loader2, BarChart3, Trophy, PieChart } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { profile } = useAuth();
  const userName = profile?.full_name || profile?.id?.substring(0, 8) || "User";

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
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const recentLeads = leads.slice(0, 5);

  // Financial Calculations
  const totalPipelineValue = leads.reduce((acc, lead) => acc + (lead.lead_value || 0), 0);
  const wonRevenue = leads.filter(l => l.status === 'won').reduce((acc, lead) => acc + (lead.lead_value || 0), 0);
  const totalAdSpend = campaigns.reduce((acc, camp) => acc + (camp.ad_spend || 0), 0);
  const roas = totalAdSpend > 0 ? (wonRevenue / totalAdSpend).toFixed(2) : "0.00";

  // 1. Chart Data Preparation (last 7 days Volume)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = leads.filter(l => l.created_at.startsWith(dateStr)).length;
    return {
      name: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      leads: count
    };
  });

  // 2. Conversion Funnel Setup
  const funnelStages = ['new', 'contacted', 'qualified', 'won', 'lost'];
  const funnelData = funnelStages.map(stage => ({
    name: stage.charAt(0).toUpperCase() + stage.slice(1),
    Count: leads.filter(l => l.status === stage).length
  }));

  // 3. Campaign ROI & Top Closers
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

  const topCampaigns = Object.entries(campaignMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topClosers = Object.entries(closerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, wonCount]) => {
      const member = members.find(m => m.id === id);
      return {
        name: member?.full_name || 'Unknown TL',
        won: wonCount
      };
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground capitalize">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {userName}. Here's your revenue and workflow overview.</p>
        </div>

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

        {/* Top Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-card-foreground">Conversion Funnel</h2>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="Count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
            </div>
            </div>

            <div className="bg-card rounded-2xl border p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                  <PieChart className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-card-foreground">Campaign ROI (Won Deals)</h2>
              </div>
              <div className="flex-1 space-y-4">
                  {topCampaigns.length === 0 ? (
                      <p className="text-muted-foreground italic text-sm">No won deals attributed to campaigns yet.</p>
                  ) : topCampaigns.map(([campaign, wonDeals]) => (
                      <div key={campaign} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
                          <span className="text-sm font-semibold uppercase">{campaign}</span>
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{wonDeals} deals</span>
                      </div>
                  ))}
              </div>
            </div>
        </div>

        {/* Bottom Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Top Closers Leaderboard</h2>
            <div className="space-y-3">
              {topClosers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No deals closed by team leads yet.</p>
              ) : (
                topClosers.map((closer, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-xs">#{i+1}</div>
                      <p className="text-sm font-semibold text-card-foreground">{closer.name}</p>
                    </div>
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-xs">{closer.won} Won</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Recent Leads Drop</h2>
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
