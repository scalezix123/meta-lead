import { useState, useEffect } from "react";
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

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  picture?: string;
  total_leads?: number;
  is_active?: boolean;
  field_mapping?: any;
}

export default function Integrations() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [appId, setAppId] = useState("");
  const [dbData, setDbData] = useState<Workspace | null>(null);
  const [foundPages, setFoundPages] = useState<FacebookPage[]>([]);
  const [linkedPages, setLinkedPages] = useState<Record<string, FacebookPage>>({});

  // Fetch workspace and linked pages
  useEffect(() => {
    async function loadData() {
      if (!profile?.workspace_id) return;
      
      setFetchLoading(true);
      try {
        // 1. Fetch Workspace
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', profile.workspace_id)
          .single();

        if (workspace) {
          setDbData(workspace as Workspace);
          setAppId(workspace.meta_app_id || "");
          
          if (workspace.meta_access_token) {
            fetchPagesFromMeta(workspace.meta_access_token);
          }
        }

        // 2. Fetch Linked Pages
        const { data: pages } = await supabase
          .from('facebook_pages')
          .select('*, leads:leads(count)')
          .eq('workspace_id', profile.workspace_id);

        if (pages) {
          const mapped = pages.reduce((acc: Record<string, FacebookPage>, p) => ({ 
            ...acc, 
            [p.page_id]: { ...(p as unknown as FacebookPage), total_leads: (p as any).leads?.[0]?.count || 0 } 
          }), {});
          setLinkedPages(mapped);
        }
      } catch (err) {
        console.error("Error loading integration data:", err);
      } finally {
        setFetchLoading(false);
      }
    }

    loadData();
  }, [profile?.workspace_id]);

  const fetchPagesFromMeta = (token: string) => {
    setLoading(true);
    // Fetch accounts and their pictures in one go
    fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token,picture.type(small)&access_token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          const pagesWithPics: FacebookPage[] = data.data.map((p: any) => ({
            ...p,
            picture: p.picture?.data?.url
          }));
          setFoundPages(pagesWithPics);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const isConnected = !!dbData?.meta_access_token;

  const handleSaveSettings = async () => {
    if (!profile?.workspace_id) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ meta_app_id: appId })
      .eq('id', profile.workspace_id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Settings saved successfully");
      setDbData(prev => prev ? { ...prev, meta_app_id: appId } : null);
    }
    setSavingSettings(false);
  };

  const handleConnectFacebook = async () => {
    const finalAppId = dbData?.meta_app_id || appId;
    if (!finalAppId || !profile?.workspace_id) {
      toast.error("Please ensure App ID is saved and you are logged in.");
      return;
    }

    setLoading(true);
    const redirectUri = window.location.origin + "/integrations";
    const scope = "ads_management,pages_show_list,leads_retrieval,pages_read_engagement,pages_manage_ads";
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${finalAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;
    window.location.href = authUrl;
  };

  const togglePageSync = async (page: FacebookPage) => {
    if (!profile?.workspace_id) return;
    
    const isCurrentlyLinked = !!linkedPages[page.id];

    if (isCurrentlyLinked) {
      // Unlink
      const { error } = await supabase
        .from('facebook_pages')
        .delete()
        .eq('workspace_id', profile.workspace_id)
        .eq('page_id', page.id);
      
      if (!error) {
        const newLinked = { ...linkedPages };
        delete newLinked[page.id];
        setLinkedPages(newLinked);
        toast.info(`Unlinked ${page.name}`);
      }
    } else {
      // Link
      const { error } = await supabase
        .from('facebook_pages')
        .upsert({
          workspace_id: profile.workspace_id,
          page_id: page.id,
          page_name: page.name,
          access_token: page.access_token,
          is_active: true
        }, { onConflict: 'workspace_id,page_id' });
      
      if (!error) {
        setLinkedPages({ ...linkedPages, [page.id]: page });
        toast.success(`Connected ${page.name}! Ready to sync leads.`);
      } else {
        toast.error("Failed to link page: " + error.message);
      }
    }
  };

  // Handle OAuth Callback
  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash || window.location.search;
      if (hash && hash.includes("access_token=") && profile?.workspace_id) {
        console.log("Meta OAuth: Received token in URL", { hasHash: !!window.location.hash, hasSearch: !!window.location.search });
        
        // Clean the hash/search string
        const cleanHash = hash.startsWith('#') || hash.startsWith('?') ? hash.substring(1) : hash;
        const finalHash = cleanHash.startsWith('#') ? cleanHash.substring(1) : cleanHash;
        
        const params = new URLSearchParams(finalHash);
        const accessToken = params.get("access_token");
        
        if (accessToken) {
          console.log("Meta OAuth: Extracted token, syncing to workspace:", profile.workspace_id);
          setLoading(true);
          const { error } = await supabase
            .from('workspaces')
            .update({ meta_access_token: accessToken })
            .eq('id', profile.workspace_id);

          if (error) {
            console.error("Meta OAuth: Supabase Update Failed", error);
            toast.error("Failed to link account: " + error.message);
            setLoading(false);
          } else {
            console.log("Meta OAuth: Successfully saved token to database!");
            toast.success("Meta account linked successfully!");
            setDbData(prev => prev ? { ...prev, meta_access_token: accessToken } : null);
            window.history.replaceState(null, "", window.location.pathname);
            fetchPagesFromMeta(accessToken);
          }
        }
      }
    };

    handleCallback();
  }, [profile?.workspace_id]);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`;

  if (fetchLoading) {
    return (
      <AppLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground animate-pulse">Syncing workspace settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

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
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Facebook className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-card-foreground">2. Meta Connection</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Authorise Scalezix to access your Facebook account and pages.
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
                variant={isConnected ? "outline" : "default"}
                size="sm" 
                onClick={handleConnectFacebook}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Facebook className="h-4 w-4 mr-2" />}
                {isConnected ? 'Reconnect Account' : 'Connect Meta Account'}
              </Button>
            </div>
          </div>
        </div>

        {/* 3. Page Management (Pro Level) */}
        {isConnected && (
          <div className="bg-card rounded-lg border p-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-card-foreground">3. Page Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Select which Facebook Pages should sync leads to this workspace.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchPagesFromMeta(dbData?.meta_access_token!)}>
                Refresh Pages
              </Button>
            </div>

            <div className="space-y-3">
              {foundPages.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">No pages found. Make sure you've granted page permissions.</p>
                </div>
              ) : (
                foundPages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-4 rounded-xl border bg-background hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      {page.picture ? (
                        <img src={page.picture} alt={page.name} className="h-10 w-10 rounded-full border shadow-sm" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm">
                          {page.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{page.name}</p>
                          {linkedPages[page.id] && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                              {linkedPages[page.id].total_leads || 0} Leads
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase">ID: {page.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {linkedPages[page.id] && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] px-2 uppercase font-bold tracking-wider"
                          onClick={() => {
                            const currentMapping = (linkedPages[page.id].field_mapping as Record<string, string>) || { full_name: 'full_name', email: 'email', phone: 'phone' };
                            const newName = prompt("Map 'Full Name' to Meta field name:", currentMapping.full_name);
                            const newEmail = prompt("Map 'Email' to Meta field name:", currentMapping.email);
                            const newPhone = prompt("Map 'Phone' to Meta field name:", currentMapping.phone);
                            
                            if (newName && newEmail && newPhone) {
                              const newMapping = { full_name: newName, email: newEmail, phone: newPhone };
                              supabase
                                .from('facebook_pages')
                                .update({ field_mapping: newMapping })
                                .eq('page_id', page.id)
                                .eq('workspace_id', profile?.workspace_id || "")
                                .then(({ error }) => {
                                  if (!error) {
                                    setLinkedPages({
                                      ...linkedPages,
                                      [page.id]: { ...linkedPages[page.id], field_mapping: newMapping }
                                    });
                                    toast.success("Mapping updated!");
                                  }
                                });
                            }
                          }}
                        >
                          Map Fields
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant={linkedPages[page.id] ? "destructive" : "default"}
                        className="h-8 px-4 text-xs"
                        onClick={() => togglePageSync(page)}
                      >
                        {linkedPages[page.id] ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. Webhook Settings */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-base font-semibold text-card-foreground mb-4">4. Webhook Configuration</h2>
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
