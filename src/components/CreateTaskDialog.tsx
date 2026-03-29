import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateTaskDialogProps {
  leadId?: string;
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({ leadId, trigger }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leadId || "unassigned");
  
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch leads for the dropdown if not pre-filled
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-minimal', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name')
        .eq('workspace_id', profile.workspace_id)
        .order('full_name');
      if (error) throw error;
      return data;
    },
    enabled: open && !leadId && !!profile?.workspace_id,
  });

  const createTask = useMutation({
    mutationFn: async (formData: any) => {
      if (!profile?.workspace_id) throw new Error("No workspace selected");
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...formData,
          workspace_id: profile.workspace_id,
          status: 'todo',
          lead_id: formData.lead_id === "unassigned" ? null : formData.lead_id
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      if (leadId) queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      toast.success("Task created successfully");
      setOpen(false);
      // Reset form
      setDate(undefined);
      setSelectedLeadId(leadId || "unassigned");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create task");
    },
    onSettled: () => setIsLoading(false)
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      lead_id: selectedLeadId,
      due_date: date ? date.toISOString() : null,
    };
    createTask.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input id="title" name="title" placeholder="e.g. Call back lead" required />
            </div>
            
            {!leadId && (
              <div className="grid gap-2">
                <Label htmlFor="lead">Related Lead (Optional)</Label>
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">General (No Lead)</SelectItem>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>{lead.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
