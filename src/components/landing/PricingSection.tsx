import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "₹599",
      description: "For solo operators and small businesses just getting started.",
      features: [
        "1 Facebook Page",
        "Up to 500 leads/month",
        "2 Team Member seats",
        "Pipeline Board (Default)",
        "Lead Detail & Notes",
        "Tasks & Follow-ups",
        "WhatsApp Lead Alerts",
        "Email Support"
      ],
      bestFor: "Solo agents, individual coaches, local clinics.",
      buttonText: "Start Free Trial",
      popular: false
    },
    {
      name: "Professional",
      price: "₹1,199",
      description: "The complete package for a serious growing business.",
      features: [
        "3 Meta Pages + Google Ads",
        "Up to 2,000 leads/month",
        "5 Team Member seats",
        "Custom Pipeline Stages",
        "Call Log Tracker",
        "Campaign ROI Tracking",
        "Closer Leaderboard",
        "Priority Email Support"
      ],
      bestFor: "Real estate teams, EdTech, clinics, car dealerships.",
      buttonText: "Start Free Trial",
      popular: true
    },
    {
      name: "Growth",
      price: "₹2,499",
      description: "For agencies and high-volume businesses.",
      features: [
        "10 Meta Pages + Google Ads",
        "Unlimited Monthly Leads",
        "15 Team Member seats",
        "Advanced Analytics",
        "Ad Set & Keyword Tracking",
        "Manager Roles",
        "Onboarding Call",
        "Dedicated WhatsApp Support"
      ],
      bestFor: "Agencies, large developers, enterprise teams.",
      buttonText: "Start Free Trial",
      popular: false
    },
    {
      name: "Custom",
      price: "Custom",
      description: "For large teams and enterprises with specific needs.",
      features: [
        "Unlimited Pages & Ads",
        "Unlimited Team Members",
        "White Label Option",
        "API & Custom Integrations",
        "Data Residency Control",
        "AI Lead Scoring",
        "Priority Hotline Support",
        "GST Invoice available"
      ],
      bestFor: "Large agencies, national EdTech, franchise chains.",
      buttonText: "Contact Us",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl underline decoration-primary/10">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Pay only for what you need. Scale your business without limits.
          </p>
          <div className="inline-flex mt-8 p-1 bg-white rounded-lg border border-gray-100 shadow-sm">
            <button className="px-4 py-2 text-sm font-semibold text-primary bg-primary/5 rounded-md">Monthly</button>
            <button className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">Annual (2 Months Free)</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {plans.map((plan, idx) => (
            <Card key={idx} className={`relative flex flex-col ${plan.popular ? 'border-primary ring-2 ring-primary/20 shadow-xl scale-105 z-10' : 'border-gray-100 shadow-sm translate-y-2'} transition-all duration-300`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold mb-1">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm font-medium">/month</span>
                </div>
                <p className="text-sm text-gray-500 mt-4 leading-relaxed">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="h-px bg-gray-100 mb-6"></div>
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-gray-600">{feature}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="pt-8">
                <div className="w-full space-y-4">
                  <Button className={`w-full h-12 text-base font-bold ${plan.popular ? '' : 'variant-outline'}`} variant={plan.popular ? 'default' : 'outline'}>
                    {plan.buttonText}
                  </Button>
                  <p className="text-[10px] text-center text-gray-400 font-medium uppercase tracking-widest italic">{plan.bestFor}</p>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900">Compare Plans & Features</h3>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="w-[300px] py-6 pl-8 font-bold text-gray-900">Feature</TableHead>
                  <TableHead className="text-center font-bold text-gray-900">Starter</TableHead>
                  <TableHead className="text-center font-bold text-gray-900">Professional</TableHead>
                  <TableHead className="text-center font-bold text-gray-900">Growth</TableHead>
                  <TableHead className="text-center font-bold text-gray-900">Custom</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Meta Pages", values: ["1", "3", "10", "Unlimited"] },
                  { name: "Google Ads", values: [false, true, true, true] },
                  { name: "Monthly Leads", values: ["500", "2,000", "Unlimited", "Unlimited"] },
                  { name: "Team Members", values: ["2", "5", "15", "Unlimited"] },
                  { name: "Custom Pipeline Stages", values: [false, true, true, true] },
                  { name: "Call Log Tracker", values: [false, true, true, true] },
                  { name: "Campaign ROI Tracking", values: [false, true, true, true] },
                  { name: "Closer Leaderboard", values: [false, true, true, true] },
                  { name: "Manager Roles", values: [false, true, true, true] },
                  { name: "Onboarding Call", values: [false, false, true, true] },
                  { name: "API & White Label", values: [false, false, false, true] },
                  { name: "Support", values: ["Email", "Priority", "WhatsApp", "Hotline"] }
                ].map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50/30">
                    <TableCell className="py-4 pl-8 font-semibold text-gray-700">{row.name}</TableCell>
                    {row.values.map((val, vIdx) => (
                      <TableCell key={vIdx} className="text-center py-4 text-sm">
                        {typeof val === 'boolean' ? (
                          val ? <Check className="h-5 w-5 text-primary mx-auto" /> : <div className="h-0.5 w-4 bg-gray-200 mx-auto rounded-full"></div>
                        ) : (
                          <span className="font-medium text-gray-600">{val}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
};
