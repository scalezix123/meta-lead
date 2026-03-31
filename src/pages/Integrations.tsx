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
  meta_app_id?: string;
  meta_app_secret?: string;
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
  const [appSecret, setAppSecret] = useState("");
  const [dbData, setDbData] = useState<Workspace | null>(null);
  const [foundPages, setFoundPages] = useState<FacebookPage[]>([]);
  const [linkedPages, setLinkedPages] = useState<Record<string, FacebookPage>>({});
  const [syncingPageId, setSyncingPageId] = useState<string | null>(null);

  // Fetch workspace and linked pages
  useEffect(() => {
    if (!profile?.workspace_id) {
      setFetchLoading(false);
      return;
    }

    async function loadData() {
      setFetchLoading(true);
      try {
        // Fetch Workspace
        const { data: workspace, error: wError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', profile.workspace_id)
          .single();

        if (wError) throw wError;

        if (workspace) {
          setDbData(workspace as Workspace);
          setAppId(workspace.meta_app_id || "");
          setAppSecret(workspace.meta_app_secret || "");
          
          if (workspace.meta_access_token) {
            fetchPagesFromMeta(workspace.meta_access_token);
          }
        }

        // 2. Fetch Linked Pages
        const { data: pages, error: pError } = await supabase
          .from('facebook_pages')
          .select('*')
          .eq('workspace_id', profile.workspace_id);

        if (pError) throw pError;

        if (pages) {
          const mapped = pages.reduce((acc: Record<string, FacebookPage>, p) => ({ 
            ...acc, 
            [p.page_id]: { 
              id: p.page_id,
              name: p.page_name,
              access_token: p.access_token,
              is_active: p.is_active,
              field_mapping: p.field_mapping,
              total_leads: p.total_leads || 0
            } 
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

  const handleManualSync = async (page: FacebookPage) => {
    if (!profile?.workspace_id) return;
    setSyncingPageId(page.id);
    
    try {
      let totalImported = 0;
      let formsUrl = `https://graph.facebook.com/v19.0/${page.id}/leadgen_forms?access_token=${page.access_token}`;
      let hasNextForms = true;
      let isFirstPage = true;

      while (hasNextForms) {
        const formsRes = await fetch(formsUrl);
        const formsData = await formsRes.json();
        
        if (!formsData.data || formsData.data.length === 0) {
          if (isFirstPage) toast.info(`No lead forms found for ${page.name}`);
          break;
        }
        isFirstPage = false;

        for (const form of formsData.data) {
          let url = `https://graph.facebook.com/v19.0/${form.id}/leads?fields=id,created_time,field_data,campaign_name,form_id,is_organic&access_token=${page.access_token}&limit=100`;
          let hasNextPage = true;

          while (hasNextPage) {
            const leadsRes = await fetch(url);
            const leadsData = await leadsRes.json();

            if (leadsData.data && leadsData.data.length > 0) {
              const mapping = (linkedPages[page.id]?.field_mapping as Record<string, string>) || { 
                full_name: 'full_name', 
                email: 'email', 
                phone: 'phone' 
              };

              const leadsToUpsert = leadsData.data.map((lead: any) => {
                const getFieldValue = (name: string, fallbacks: string[] = []) => {
                    let val = lead.field_data.find((f: any) => f.name === name || f.name.toLowerCase() === name.toLowerCase())?.values?.[0];
                    if (val) return val;
                    for (const fb of fallbacks) {
                        val = lead.field_data.find((f: any) => f.name === fb || f.name.toLowerCase() === fb.toLowerCase())?.values?.[0];
                        if (val) return val;
                    }
                    return "";
                };
                
                return {
                  workspace_id: profile.workspace_id,
                  full_name: getFieldValue(mapping.full_name, ['full_name', 'name', 'first_name', 'fullname', 'full_name']) || 'Prospect',
                  email: getFieldValue(mapping.email, ['email', 'email_address', 'email']),
                  phone: getFieldValue(mapping.phone, ['phone', 'phone_number', 'work_phone_number', 'phonenumber', 'phone']),
                  status: 'new',
                  source: 'meta',
                  facebook_lead_id: lead.id,
                  meta_data: {
                    ...lead,
                    page_name: page.name,
                    campaign_name: lead.campaign_name || 'Direct / Organic'
                  },
                  created_at: lead.created_time
                };
              });

              const { error: upsertError } = await supabase
                .from('leads')
                .upsert(leadsToUpsert, { onConflict: 'facebook_lead_id' });

              if (!upsertError) totalImported += leadsToUpsert.length;
            }

            if (leadsData.paging && leadsData.paging.next) {
              url = leadsData.paging.next;
            } else {
              hasNextPage = false;
            }
          }
        }
        
        if (formsData.paging && formsData.paging.next) {
          formsUrl = formsData.paging.next;
        } else {
          hasNextForms = false;
        }
      }

      toast.success(`Synced ${totalImported} leads from ${page.name}!`);
    } catch (err) {
      console.error("Manual Sync Error:", err);
      toast.error("Failed to sync leads.");
    } finally {
      setSyncingPageId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!profile?.workspace_id) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('workspaces')
      .update({ 
        meta_app_id: appId,
        meta_app_secret: appSecret 
      })
      .eq('id', profile.workspace_id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Settings saved successfully");
      setDbData(prev => prev ? { ...prev, meta_app_id: appId, meta_app_secret: appSecret } : null);
    }
    setSavingSettings(false);
  };

  const handleConnectFacebook = async () => {
    const finalAppId = dbData?.meta_app_id || appId;
    const finalSecret = dbData?.meta_app_secret || appSecret;

    if (!finalAppId || !finalSecret || !profile?.workspace_id) {
      toast.error("Please ensure App ID and App Secret are saved.");
      return;
    }

    setLoading(true);
    const redirectUri = window.location.origin + "/integrations";
    const scope = "ads_management,pages_show_list,leads_retrieval,pages_read_engagement,pages_manage_ads,pages_manage_metadata";
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${finalAppId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;
    window.location.href = authUrl;
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`;

  const handleTestWebhook = async () => {
    if (Object.keys(linkedPages).length === 0) {
      toast.error("Please connect at least one Page in Section 3 before testing!");
      return;
    }

    toast.promise(
      async () => {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entry: [{
              id: "test_entry",
              time: Math.floor(Date.now() / 1000),
              changes: [{
                field: "leadgen",
                value: {
                  leadgen_id: "test_lead_" + Date.now(),
                  page_id: Object.keys(linkedPages)[0],
                  form_id: "test_form",
                  created_time: Math.floor(Date.now() / 1000)
                }
              }]
            }]
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        return res.json();
      },
      {
        loading: 'Sending test lead to your webhook...',
        success: 'Test payload received! New lead should appear in your Leads table.',
        error: (err: any) => `Webhook Error: ${err.message}`
      }
    );
  };

  const togglePageSync = async (page: FacebookPage) => {
    if (!profile?.workspace_id) return;
    
    const isCurrentlyLinked = !!linkedPages[page.id];

    if (isCurrentlyLinked) {
      try {
        await fetch(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps?access_token=${page.access_token}`, { method: 'DELETE' });
      } catch (err) {
        console.error("Failed to unsubscribe app from page:", err);
      }

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
      setLoading(true);
      try {
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${dbData?.meta_access_token}`);
        const pagesData = await pagesRes.json();
        const pageInfo = pagesData.data?.find((p: any) => p.id === page.id);
        
        const permanentToken = pageInfo?.access_token || page.access_token;

        const subRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}/subscribed_apps?subscribed_fields=leadgen&access_token=${permanentToken}`, { 
          method: 'POST' 
        });
        const subData = await subRes.json();
        
        if (!subData.success) {
          console.error("Facebook Subscription Failed:", subData);
          toast.warning("Facebook subscription failed. Leads may not sync automatically.");
        }

        const { error } = await supabase
          .from('facebook_pages')
          .upsert({
            workspace_id: profile.workspace_id,
            page_id: page.id,
            page_name: page.name,
            access_token: permanentToken,
            is_active: true
          }, { onConflict: 'workspace_id,page_id' });
        
        if (!error) {
          setLinkedPages({ ...linkedPages, [page.id]: { ...page, access_token: permanentToken } });
          toast.success(`Connected ${page.name}! Real-time sync enabled.`);
        } else {
          toast.error("Failed to link page: " + error.message);
        }
      } catch (err) {
        console.error("Failed to connect page:", err);
        toast.error("An error occurred while connecting the page.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle OAuth Callback
  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash || window.location.search;
      if (hash && hash.includes("access_token=") && profile?.workspace_id) {
        const cleanHash = hash.startsWith('#') || hash.startsWith('?') ? hash.substring(1) : hash;
        const finalHash = cleanHash.startsWith('#') ? cleanHash.substring(1) : cleanHash;
        
        const params = new URLSearchParams(finalHash);
        const shortLivedToken = params.get("access_token");
        
        if (shortLivedToken) {
          setLoading(true);
          try {
            // Call the secure Edge Function for token exchange
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-token-exchange`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              },
              body: JSON.stringify({ 
                shortLivedToken, 
                workspaceId: profile.workspace_id 
              })
            });

            const result = await response.json();

            if (result.success) {
              toast.success("Account connected with 60-day stable token!");
              setDbData(prev => prev ? { ...prev, meta_access_token: result.access_token } : null);
              fetchPagesFromMeta(result.access_token);
            } else {
              throw new Error(result.error || "Token exchange failed");
            }
          } catch (err: any) {
            console.error("Meta OAuth Error:", err);
            toast.error("Connection Failed: " + err.message);
          } finally {
            setLoading(false);
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      }
    };

    handleCallback();
  }, [profile?.workspace_id]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Meta App ID</label>
                <input 
                  type="text" 
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="Enter your Facebook App ID"
                  className="w-full p-2 rounded-md bg-background border text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Meta App Secret</label>
                <input 
                  type="password" 
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full p-2 rounded-md bg-background border text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Found in your Meta Developer Console settings. These are required for 60-day token stability.
            </p>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div className="flex flex-col">
                          <span className="text-sm text-card-foreground font-medium">Account Linked</span>
                          <span className="text-[10px] text-green-600 font-bold uppercase tracking-tight">60-Day Stable Session</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm text-muted-foreground">Not connected</span>
                      </>
                    )}
                  </div>
                  {isConnected && (
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-primary" onClick={handleTestWebhook}>
                      Test Webhook
                    </Button>
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

        {/* 3. Page Management */}
        {isConnected && (
          <div className="bg-card rounded-lg border p-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-card-foreground">3. Page Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Select which Facebook Pages should sync leads.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => fetchPagesFromMeta(dbData?.meta_access_token!)}>
                Refresh Pages
              </Button>
            </div>

            <div className="space-y-3">
              {foundPages.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">No pages found. Grant permissions in Meta Popup.</p>
                </div>
              ) : (
                foundPages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-4 rounded-xl border bg-background hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      {page.picture ? (
                        <img src={page.picture} alt={page.name} className="h-10 w-10 border rounded-full" />
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-muted-foreground font-mono uppercase">ID: {page.id}</p>
                          {linkedPages[page.id] && (
                            <span className="text-[9px] font-bold text-primary bg-primary/5 px-1 rounded border border-primary/10">PERMANENT SYNC</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {linkedPages[page.id] && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] px-2 font-bold uppercase"
                          onClick={() => {
                            const currentMapping = (linkedPages[page.id].field_mapping as Record<string, string>) || { full_name: 'full_name', email: 'email', phone: 'phone' };
                            const newName = prompt("Map 'Full Name' to:", currentMapping.full_name);
                            const newEmail = prompt("Map 'Email' to:", currentMapping.email);
                            const newPhone = prompt("Map 'Phone' to:", currentMapping.phone);
                            
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
                      
                      {linkedPages[page.id] && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] px-2 font-bold uppercase"
                          onClick={() => handleManualSync(page)}
                          disabled={syncingPageId === page.id}
                        >
                          {syncingPageId === page.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Sync
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
              Add this URL and Verify Token to Meta Console.
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Callback URL</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-[11px] break-all border">{webhookUrl}</code>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Verify Token</label>
                <code className="block p-2 bg-muted rounded text-[11px] border">my_lead_flow_token</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
