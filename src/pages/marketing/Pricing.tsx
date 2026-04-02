import { useState } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { Check, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link as RouterLink } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect } from "react";

const Pricing = () => {
  useEffect(() => {
    document.title = "Pricing Plans | Scalezix - Invest in Your Closing Power";
  }, []);
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 599,
      annualPrice: 499,
      description: "Perfect for solo consultants and small businesses just getting started with Meta lead ads.",
      features: [
        { name: "Facebook Pages", detail: "1 Page" },
        { name: "Monthly Leads", detail: "Up to 500 leads" },
        { name: "Team Members", detail: "2 Seats" },
        { name: "Pipeline Board", detail: "Included" },
        { name: "Lead Detail & Remarks", detail: "Included" },
        { name: "Tasks & Follow-ups", detail: "Included" },
        { name: "Basic Analytics", detail: "Totals + Recent leads" },
        { name: "Support", detail: "Email Support" }
      ],
      bestFor: "Real estate agents, education consultants, local businesses.",
      buttonText: "Start 7-Day Free Trial",
      popular: false
    },
    {
      name: "Growth",
      monthlyPrice: 1499,
      annualPrice: 1249,
      description: "For agencies and growing teams managing multiple pages and higher lead volume.",
      features: [
        { name: "Facebook Pages", detail: "Up to 5 Pages" },
        { name: "Monthly Leads", detail: "Unlimited" },
        { name: "Team Members", detail: "10 Seats" },
        { name: "Pipeline Board", detail: "Included" },
        { name: "Lead Detail & Activity Log", detail: "Included" },
        { name: "Tasks & Follow-ups", detail: "Included" },
        { name: "Full Analytics", detail: "Funnel + Volume Charts" },
        { name: "Campaign ROI Tracking", detail: "Included" },
        { name: "Closer Leaderboard", detail: "Included" },
        { name: "Priority Support", detail: "Priority Email" }
      ],
      bestFor: "Marketing agencies, EdTech companies, real estate developers.",
      buttonText: "Start 7-Day Free Trial",
      popular: true
    },
    {
      name: "Agency",
      monthlyPrice: 3499,
      annualPrice: 2915,
      description: "For established agencies managing multiple client accounts with large teams.",
      features: [
        { name: "Facebook Pages", detail: "Unlimited" },
        { name: "Monthly Leads", detail: "Unlimited" },
        { name: "Team Members", detail: "Unlimited seats" },
        { name: "All Growth Plan features", detail: "Included" },
        { name: "Lead Detail & Remarks", detail: "Included" },
        { name: "Tasks & Follow-ups", detail: "Included" },
        { name: "Full Analytics & Dashboard", detail: "Full Suite" },
        { name: "1-on-1 Onboarding", detail: "Setup Call Included" },
        { name: "WhatsApp Support", detail: "Dedicated Support" }
      ],
      bestFor: "Large agencies, enterprise sales teams, 10+ closers.",
      buttonText: "Contact Sales",
      popular: false
    }
  ];

  const addons = [
    { name: "Extra Pages Pack", price: "₹299/mo", detail: "Add 3 more Facebook pages to any plan." },
    { name: "Extra Team Members", price: "₹399/mo", detail: "Add 5 more team member seats." },
    { name: "Advanced Analytics", price: "₹499/mo", detail: "Hourly lead volume, campaign heatmaps, custom reports." },
    { name: "WhatsApp Broadcast", price: "₹599/mo", detail: "Send bulk WhatsApp messages to leads at specific stages." },
    { name: "AI Lead Scoring", price: "₹799/mo", detail: "Automatically score leads based on engagement and source." },
    { name: "White Label", price: "₹999/mo", detail: "Rebrand Scalezix with your own logo, domain, and colors." }
  ];

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      <main className="pt-24 pb-20">
        {/* Header */}
        <section className="bg-blue-600 py-20 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Invest in Your <span className="text-blue-200">Closing Power</span></h1>
            <p className="text-xl text-blue-50 max-w-2xl mx-auto mb-10 leading-relaxed">
              Scalezix pays for itself by recovering even 3 missed leads. Choose the plan that fits your current volume and scale as you grow.
            </p>
            
            <div className="flex items-center justify-center gap-4 bg-white/10 w-fit mx-auto p-1 rounded-xl backdrop-blur-sm border border-white/20">
              <button 
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${!isAnnual ? 'bg-white text-blue-600 shadow-lg' : 'text-white hover:text-blue-100'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isAnnual ? 'bg-white text-blue-600 shadow-lg' : 'text-white hover:text-blue-100'}`}
              >
                Annual <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-[10px] uppercase font-black">2 Months Free</span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-24 -mt-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {plans.map((plan, idx) => (
                <Card key={idx} className={`flex flex-col relative transition-all duration-300 ${plan.popular ? 'border-blue-500 ring-4 ring-blue-50 shadow-2xl scale-105 z-10 bg-white' : 'border-gray-200 shadow-lg translate-y-4'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="text-center pb-8 pt-10 px-8">
                    <CardTitle className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6 h-12">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black text-gray-900">₹{isAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                      <span className="text-gray-500 font-bold">/mo</span>
                    </div>
                    {isAnnual && (
                      <p className="text-xs text-green-600 font-bold mt-2 uppercase tracking-wider italic animate-pulse">Billed annually (Save ₹{(plan.monthlyPrice - plan.annualPrice) * 12})</p>
                    )}
                  </CardHeader>
                  <CardContent className="px-8 pb-8 flex-1">
                    <div className="h-px bg-gray-100 mb-8"></div>
                    <ul className="space-y-4">
                      {plan.features.map((feature, fidx) => (
                        <li key={fidx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">{feature.name}</span>
                          <span className="text-gray-900 font-bold">{feature.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="px-8 pb-10">
                    <RouterLink to="/login" className="w-full">
                      <Button className={`w-full h-14 text-lg font-bold shadow-lg ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 shadow-blue-500/10'}`} variant={plan.popular ? 'default' : 'outline'}>
                        {plan.buttonText}
                      </Button>
                    </RouterLink>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Add-ons Grid */}
        <section className="py-24 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Power-Up Your Workspace</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Add advanced features to any plan. Pay only for what you need.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {addons.map((addon, aIdx) => (
                <div key={aIdx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-widest">{addon.name}</h4>
                    <span className="text-sm font-black text-blue-600">{addon.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{addon.detail}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-sm font-bold text-gray-400 italic">
                * All prices are excluding GST.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ - Quick Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Pricing FAQ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Can I switch plans anytime?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Yes, you can upgrade or downgrade your plan directly from your settings. Upgrades take effect immediately.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Is there a free trial?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Every plan comes with a 7-day full access free trial. No credit card is required to start.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3">What if I exceed lead limits?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">We notify you at 80% capacity. You can upgrade to Growth for unlimited leads or purchase extra slots.</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3">Do you offer GST invoices?</h4>
                <p className="text-gray-600 text-sm leading-relaxed">Absolutely. All Indian customers receive GST-compliant invoices for their business tax filing.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
