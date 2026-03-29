export const stageLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  lost: "Lost",
  won: "Won",
};

export const stageColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  qualified: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  won: "bg-green-500/10 text-green-500 border-green-500/20",
  lost: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${stageColors[status] || 'bg-muted text-muted-foreground'}`}>
      {stageLabels[status] || status}
    </span>
  );
}
