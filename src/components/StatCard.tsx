import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden bg-card rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all group ${className || ''}`}>
      <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
            {trend}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-3xl font-bold text-card-foreground tracking-tight">{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">{title}</p>
      </div>
    </div>
  );
}
