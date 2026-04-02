import { useState, useEffect } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, TrendingUp, DollarSign, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link as RouterLink } from "react-router-dom";

export const ROICalculator = () => {
  useEffect(() => {
    document.title = "ROI Analytics & Profit Calculators | Scalezix";
  }, []);
  // Calculator 1: Recovery Calc
  const [spend_1, setSpend_1] = useState(50000);
  const [leads_1, setLeads_1] = useState(200);
  const [lossRate_1, setLossRate_1] = useState(15);
  const starterCost = 599;

  // Calculator 2: Ad-to-Profit Calc
  const [spend_2, setSpend_2] = useState(100000);
  const [cpl_2, setCpl_2] = useState(250);
  const [closeRate_2, setCloseRate_2] = useState(5);
  const [dealValue_2, setDealValue_2] = useState(50000);

  // Calculator 3: Speed Impact Calc
  const [leads_3, setLeads_3] = useState(100);
  const [responseTime, setResponseTime] = useState(240); // in minutes

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      <main className="pt-24 pb-20">
        <section className="bg-gray-50 py-20 border-b border-gray-100 mb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 font-primary">
              The <span className="text-blue-600">ROI Analytics</span> Suite
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Scalezix isn't just a cost — it's an investment. Use our calculators to see exactly how much revenue your current systems are leaving on the table.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-6xl">
          <Tabs defaultValue="recovery" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-16 p-1 bg-gray-100 rounded-2xl mb-12">
              <TabsTrigger value="recovery" className="rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <ShieldCheck className="h-4 w-4 mr-2" /> Lead Recovery
              </TabsTrigger>
              <TabsTrigger value="profit" className="rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <TrendingUp className="h-4 w-4 mr-2" /> Ad-to-Profit
              </TabsTrigger>
              <TabsTrigger value="speed" className="rounded-xl text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-lg">
                <Clock className="h-4 w-4 mr-2" /> Speed Impact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recovery" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                            Monthly Ad Spend (₹) <span>₹{spend_1.toLocaleString()}</span>
                            </label>
                            <Slider value={[spend_1]} onValueChange={(val) => setSpend_1(val[0])} min={5000} max={500000} step={5000} />
                        </div>
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                            Monthly Leads <span>{leads_1} leads</span>
                            </label>
                            <Slider value={[leads_1]} onValueChange={(val) => setLeads_1(val[0])} min={10} max={2000} step={10} />
                        </div>
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                            Est. Loss Rate بدون CRM (%) <span>{lossRate_1}%</span>
                            </label>
                            <Slider value={[lossRate_1]} onValueChange={(val) => setLossRate_1(val[0])} min={5} max={50} step={1} />
                        </div>
                    </div>
                    
                    <Card className="bg-gray-900 text-white border-none shadow-2xl p-4">
                        <CardHeader className="text-center pt-8">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">Recovery Potential</p>
                            <CardTitle className="text-6xl font-black text-white leading-none">
                                ₹{Math.round(((spend_1 / (leads_1 || 1)) * (leads_1 * lossRate_1 / 100)) - starterCost).toLocaleString()}
                            </CardTitle>
                            <p className="text-gray-400 mt-4 text-sm font-medium italic">Net gain per month after Scalezix Starter cost</p>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-10">
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-gray-400 font-medium">Cost of Lost Leads</span>
                                <span className="text-red-400 font-black">₹{Math.round((spend_1 / (leads_1 || 1)) * (leads_1 * lossRate_1 / 100)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-gray-400 font-medium">Monthly Leads Recovered</span>
                                <span className="text-green-400 font-black">{Math.round(leads_1 * lossRate_1 / 100)} leads</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="profit" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                            Monthly Spend (₹) <span>₹{spend_2.toLocaleString()}</span>
                            </label>
                            <Slider value={[spend_2]} onValueChange={(val) => setSpend_2(val[0])} min={10000} max={1000000} step={10000} />
                        </div>
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                            Close Rate (%) <span>{closeRate_2}%</span>
                            </label>
                            <Slider value={[closeRate_2]} onValueChange={(val) => setCloseRate_2(val[0])} min={1} max={50} step={1} />
                        </div>
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                            Avg. Deal Value (₹) <span>₹{dealValue_2.toLocaleString()}</span>
                            </label>
                            <Slider value={[dealValue_2]} onValueChange={(val) => setDealValue_2(val[0])} min={1000} max={500000} step={5000} />
                        </div>
                    </div>
                    
                    <Card className="bg-blue-600 text-white border-none shadow-2xl p-4">
                        <CardHeader className="text-center pt-8">
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.3em] mb-3">Estimated Gross Profit</p>
                            <CardTitle className="text-5xl font-black text-white leading-none">
                                ₹{Math.round(((spend_2 / cpl_2) * (closeRate_2 / 100) * dealValue_2) - spend_2).toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-10">
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-blue-100">Projected Total Revenue</span>
                                <span className="font-black text-white">₹{Math.round((spend_2 / cpl_2) * (closeRate_2 / 100) * dealValue_2).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                <span className="text-blue-100">Closed Sales Monthly</span>
                                <span className="font-black text-white">{Math.round((spend_2 / cpl_2) * (closeRate_2 / 100))} deals</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-blue-100">Projected ROI</span>
                                <span className="font-black text-white text-xl">{( (((spend_2 / cpl_2) * (closeRate_2 / 100) * dealValue_2) - spend_2) / spend_2 * 100).toFixed(0)}%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="speed" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-8">
                    <div className="space-y-10">
                        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex gap-4">
                            <AlertCircle className="h-6 w-6 text-yellow-600 shrink-0" />
                            <p className="text-sm text-yellow-800 font-medium leading-relaxed">
                                Lead quality drops by **10x** after the first 5 minutes. Scalezix ensures your webhook alerts your team the second a lead lands.
                            </p>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="space-y-6">
                                <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                                Monthly Leads <span>{leads_3}</span>
                                </label>
                                <Slider value={[leads_3]} onValueChange={(val) => setLeads_3(val[0])} min={10} max={1000} step={10} />
                            </div>
                            <div className="space-y-6">
                                <label className="text-sm font-bold text-gray-900 uppercase tracking-widest flex justify-between">
                                Avg. Response Time <span>{responseTime >= 60 ? `${(responseTime/60).toFixed(1)} hrs` : `${responseTime} mins`}</span>
                                </label>
                                <Slider value={[responseTime]} onValueChange={(val) => setResponseTime(val[0])} min={1} max={1440} step={1} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-2 border-gray-100 shadow-xl p-6">
                            <CardTitle className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-500" /> Lead Probability Drop
                            </CardTitle>
                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-700 uppercase">Current Performance</span>
                                        <span className="text-red-500 font-black">-{ (100 - (100 / (1 + (responseTime / 10)))).toFixed(0)}%</span>
                                    </div>
                                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-700" 
                                            style={{ width: `${100 / (1 + (responseTime / 10))}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-blue-600 uppercase">With Scalezix ( &lt; 2 min )</span>
                                        <span className="text-blue-600 font-black">100%</span>
                                    </div>
                                    <div className="h-4 w-full bg-blue-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-600 text-center">
                                    Conclusion: At **{responseTime >= 60 ? `${(responseTime/60).toFixed(1)} hours` : `${responseTime} mins`}**, your team is losing up to **{Math.round(leads_3 * (1 - (1 / (1 + (responseTime / 10)))))}** reachable leads every month.
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </TabsContent>
          </Tabs>

          <div className="mt-32 text-center bg-gray-50 p-12 rounded-[40px] border border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 mb-6">Stop Calculating, Start Winning.</h2>
            <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Scalezix takes less than 2 minutes to set up and starts recovering lead costs from day one.
            </p>
            <RouterLink to="/login">
              <Button size="lg" className="h-16 px-12 text-xl font-black shadow-xl shadow-blue-500/20">
                Claim Your 7-Day Free Trial
              </Button>
            </RouterLink>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ROICalculator;
