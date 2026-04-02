import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { CheckCircle, Play, Plug, Target, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link as RouterLink } from "react-router-dom";
import { useEffect } from "react";

const HowItWorks = () => {
  useEffect(() => {
    document.title = "How It Works | Scalezix - Meta Lead Flow Automation";
  }, []);
  const steps = [
    {
      number: "Step 01",
      title: "Connect Your Meta App",
      description: "Enter your Facebook App ID and App Secret within our secure Integrations panel. This authorizes Scalezix to receive your lead data directly from Meta's API. No coding required.",
      icon: <Plug className="h-10 w-10 text-blue-500" />,
      detail: "Scalezix uses official Meta Webhooks to bridge your lead forms to your CRM workspace instantly."
    },
    {
      number: "Step 02",
      title: "Automated Lead Sync",
      description: "Any time a prospect fills out a Lead Ad form on Facebook or Instagram, Meta sends that data to Scalezix. Our system processes it, maps the custom fields, and adds them to your 'New' pipeline stage.",
      icon: <Target className="h-10 w-10 text-purple-500" />,
      detail: "Leads appear in your dashboard in under 2 seconds. No manual CSV uploads or refresh needed."
    },
    {
      number: "Step 03",
      title: "Assign & Engage",
      description: "Auto-assign leads to your specialized closers or manually distribute them based on expertise. Use our 'Quick Dial' buttons to call or WhatsApp the prospect the moment they arrive.",
      icon: <CheckCircle className="h-10 w-10 text-green-500" />,
      detail: "Speed to lead is the #1 factor in conversion. Scalezix is built to help you win that race."
    },
    {
      number: "Step 04",
      title: "Track Conversion ROI",
      description: "As leads move through your pipeline, Scalezix tracks which campaigns, creative, and agents are producing the most 'Won' deals. Scale your winners and cut your losers.",
      icon: <TrendingUp className="h-10 w-10 text-blue-600" />,
      detail: "Turn gut feelings into data-driven decisions. Watch your ROI grow month over month."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      <main className="pt-24 pb-20">
        {/* Hero Header */}
        <section className="bg-gray-900 py-24 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-6">The Journey of a <br /><span className="text-blue-400">Scalezix Lead</span></h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-12">
              From the moment they click your ad to the moment you close the deal. Here's how we automate your success.
            </p>
            <div className="flex justify-center">
                <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 font-bold shadow-xl shadow-blue-500/20">
                  Watch 2-Min Demo <Play className="ml-3 h-5 w-5 fill-white" />
                </Button>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="space-y-32">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row items-start gap-12 md:gap-20">
                        <div className="flex-1 space-y-6">
                            <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{step.number}</span>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{step.title}</h2>
                            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                                {step.description}
                            </p>
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 italic text-blue-800 text-sm font-medium">
                                "{step.detail}"
                            </div>
                        </div>
                        <div className="flex-1 w-full pt-12 md:pt-0">
                            <div className="aspect-[4/3] rounded-[40px] bg-gray-50 border-8 border-white shadow-2xl flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:opacity-0 transition-opacity"></div>
                                <div className="h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    {step.icon}
                                </div>
                                <div className="absolute bottom-6 right-6 text-9xl font-black text-gray-900/5 pointer-events-none select-none">
                                    {idx + 1}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="py-24 border-b border-gray-100">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Enterprise-Grade Security</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Scalezix treats your lead data with the highest sensitivity. We utilize AES-256 encryption at rest and TLS 1.3 in transit. Our infrastructure is built on world-class servers with 99.9% uptime guarantees.
                        </p>
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                <span className="font-bold text-gray-800">GDPR & CCPA Compliant</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                <span className="font-bold text-gray-800">Direct Meta API Authorization</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                <span className="font-bold text-gray-800">Automated Data Backups</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 relative">
                        <div className="absolute top-0 right-0 p-8">
                            <TrendingUp className="h-12 w-12 text-blue-100" />
                        </div>
                        <h4 className="text-xl font-bold mb-4">Meta Verified Partner API</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            We use the standard OAuth 2.0 protocol for all Facebook integrations. Scalezix never stores your Facebook password; we only receive an encrypted access token with specific permissions you approve.
                        </p>
                        <div className="mt-8 flex gap-2">
                            <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                            <div className="h-1 w-4 bg-blue-200 rounded-full"></div>
                            <div className="h-1 w-4 bg-blue-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Integration Callout */}
        <section className="py-24 bg-blue-50">
            <div className="container mx-auto px-4 text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    <h2 className="text-3xl font-black text-gray-900">Zero Technical Debt. 100% Meta Native.</h2>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Scalezix is built directly on Meta's official Lead Flow API. This means we don't rely on fragile scrapers or slow intermediate servers. Your sync is as robust as Facebook's own platform.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">SSL Encrypted</div>
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">Meta Authorized</div>
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">API Speed Sync</div>
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-800">Secure Storage</div>
                    </div>
                    <RouterLink to="/login">
                        <Button className="h-14 px-10 text-lg font-bold">
                            Experience Seamless Meta Flow <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                    </RouterLink>
                </div>
            </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
