import { AppLayout } from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2, Trash2, Calendar as CalendarIcon, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function Tasks() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', profile?.workspace_id],
    queryFn: async () => {
      if (!profile?.workspace_id) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          leads (full_name)
        `)
        .eq('workspace_id', profile.workspace_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.workspace_id,
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Task updated");
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success("Task deleted");
    }
  });

  const filtered = tasks.filter(t => {
    if (filter === "all") return true;
    if (filter === "pending") return t.status !== 'completed';
    if (filter === "completed") return t.status === 'completed';
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    return new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime();
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

  return (
    <AppLayout>
      <div className="animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.filter(t => t.status !== 'completed').length} pending tasks
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All Tasks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <CreateTaskDialog />
          </div>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <button 
                        onClick={() => toggleTaskStatus.mutate({ 
                          id: task.id, 
                          status: task.status === 'completed' ? 'todo' : 'completed' 
                        })}
                      >
                        {task.status === 'completed'
                          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                          : <Circle className="h-5 w-5 text-muted-foreground" />}
                      </button>
                    </TableCell>
                    <TableCell className={task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-card-foreground font-medium'}>
                      {task.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm uppercase">
                      {task.leads?.full_name || 'General'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask.mutate(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
