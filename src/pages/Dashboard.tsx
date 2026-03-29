import { Target, Users, TrendingUp, CalendarCheck, Loader2, BarChart3 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { LeadStatusBadge } from "@/components/LeadStatusBadge";
import { AppLayout } from "@/components/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        .select('id')
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

  // Chart Data Preparation (last 7 days)
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

  if (leadsLoading || tasksLoading || membersLoading) {
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
          <h1 className="text-2xl font-bold text-foreground capitalize">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {userName}. Here's your lead overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Leads" 
            value={leads.length} 
            icon={Target} 
            trend={todayLeads.length > 0 ? `+${todayLeads.length} today` : undefined} 
          />
          <StatCard title="Leads Today" value={todayLeads.length} icon={TrendingUp} />
          <StatCard title="Team Members" value={members.length} icon={Users} />
          <StatCard title="Pending Tasks" value={pendingTasks.length} icon={CalendarCheck} />
        </div>

        {/* Analytics Section */}
        <div className="bg-card rounded-2xl border p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-card-foreground">Lead Volume</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Recent Leads</h2>
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No recent leads found.</p>
              ) : (
                recentLeads.map(lead => (
                  <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
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

          <div className="bg-card rounded-2xl border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-card-foreground mb-4">Upcoming Tasks</h2>
            <div className="space-y-3">
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No pending tasks.</p>
              ) : (
                pendingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground uppercase">{task.status}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </span>
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
