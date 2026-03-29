import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Facebook, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  meta_access_token?: string;
  page_id?: string;
  meta_app_id?: string;
  created_at: string;
}

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
}

export default function Integrations() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [appId, setAppId] = useState("");
  const [dbData, setDbData] = useState<Workspace | null>(null);

  // Fetch workspace data on load
  useState(() => {
    if (profile?.workspace_id) {
      supabase
        .from('workspaces')
        .select('*')
        .eq('id', profile.workspace_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDbData(data as Workspace);
            setAppId(data.meta_app_id || "");
          }
        });
    }
  });

  const isConnected = !!dbData?.meta_access_token;

  const handleSaveSettings = async () => {
    if (!profile?.workspace_id) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ meta_app_id: appId })
      .eq('id', profile.workspace_id);
    
    if (error) toast.error("Failed to save settings: " + error.message);
    else {
      toast.success("Settings saved successfully!");
      setDbData({ ...dbData, meta_app_id: appId });
    }
    setSavingSettings(false);
  };

  const handleConnectFacebook = async () => {
    const finalAppId = dbData?.meta_app_id || appId;

    if (!finalAppId) {
      toast.error("Please enter and save your Meta App ID first!");
      return;
    }

    if (!profile?.workspace_id) {
      toast.error("Please log in to your account first");
      return;
    }

    setLoading(true);
    const redirectUri = window.location.origin + "/integrations";
    const scope = "ads_management,pages_show_list,leads_retrieval,pages_read_engagement,pages_manage_ads";
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${finalAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;
    
    window.location.href = authUrl;
  };

  // Handle OAuth Callback
  useState(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=") && profile?.workspace_id) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      
      if (accessToken) {
        setLoading(true);
        
        // 1. Fetch Page ID from Meta Graph API using the new token
        fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`)
          .then(res => res.json())
          .then(async (data) => {
            const firstPage = data.data?.[0]; // Get the first page found
            
            if (!firstPage) {
              toast.error("No Facebook Pages found for this account.");
              setLoading(false);
              return;
            }

            // 2. Save both Access Token and Page ID to Supabase
            const { error } = await supabase
              .from('workspaces')
              .update({ 
                meta_access_token: accessToken,
                page_id: firstPage.id 
              })
              .eq('id', profile.workspace_id);

            if (error) toast.error("Error saving Meta data: " + error.message);
            else {
              toast.success(`Connected to Page: ${firstPage.name}!`);
              window.history.replaceState(null, "", "/integrations");
              window.location.reload();
            }
          })
          .catch(err => {
            toast.error("Failed to fetch Meta pages: " + err.message);
            setLoading(false);
          });
      }
    }
  });

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`;

  return (
    <AppLayout>
      <div className="animate-slide-in max-w-2xl space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your own Meta advertisement tools</p>
        </div>

        {/* 1. App Configuration */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-base font-semibold text-card-foreground mb-4">1. Meta App Configuration</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">Meta App ID</label>
              <input 
                type="text" 
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Enter your Facebook App ID"
                className="w-full p-2 rounded-md bg-background border text-sm"
              />
              <p className="text-xs text-muted-foreground">Found in your Meta Developer Console settings.</p>
            </div>
            <Button size="sm" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save App Settings"}
            </Button>
          </div>
        </div>

        {/* 2. Connection */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Facebook className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-card-foreground">2. Meta Connection</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Authorise Scalezix to access your lead forms.
              </p>

              <div className="mt-4 p-3 rounded-md bg-muted/50 border">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-card-foreground font-medium">Account Linked</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Not connected</span>
                    </>
                  )}
                </div>
              </div>

              <Button 
                className="mt-4" 
                size="sm" 
                onClick={handleConnectFacebook}
                disabled={loading || isConnected}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Facebook className="h-4 w-4 mr-2" />}
                {isConnected ? 'Account Connected' : 'Connect Meta Account'}
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Webhook Settings */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-base font-semibold text-card-foreground mb-4">3. Webhook Configuration</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add this URL and Verify Token to your Meta App's Webhooks section to receive leads in real-time.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Callback URL</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-[11px] break-all border">{webhookUrl}</code>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Verify Token</label>
                <div className="flex gap-2">
                  <code className="w-full p-2 bg-muted rounded text-[11px] border">my_lead_flow_token</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
