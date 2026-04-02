import { supabase } from "@/lib/supabase";

export const addActivity = async (lead_id: string, workspace_id: string, profile_id: string, type: string, content: string) =>
  supabase.from("lead_activities").insert({ lead_id, workspace_id, user_id: profile_id, type, content });
