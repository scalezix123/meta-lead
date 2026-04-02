import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const ROICalculator = () => {
  const [spend, setSpend] = useState(50000);
  const [leads, setLeads] = useState(200);
  const [lossRate, setLossRate] = useState(15);

  const [cpl, setCpl] = useState(0);
  const [lostLeads, setLostLeads] = useState(0);
  const [lostValue, setLostValue] = useState(0);
  const [netGain, setNetGain] = useState(0);

  const starterCost = 599;

  useEffect(() => {
    const calculatedCpl = spend / (leads || 1);
    const calculatedLostLeads = Math.round((leads * lossRate) / 100);
    const calculatedLostValue = calculatedLostLeads * calculatedCpl;
    const calculatedNetGain = calculatedLostValue - starterCost;

    setCpl(calculatedCpl);
    setLostLeads(calculatedLostLeads);
    setLostValue(calculatedLostValue);
    setNetGain(calculatedNetGain);
  }, [spend, leads, lossRate]);

  return (
    <section id="roi" className="py-24 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why Scalezix Pays for Itself
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Stop losing leads and start growing your business with our ROI calculator.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Monthly Ad Spend (₹)</label>
                <span className="text-xl font-bold text-primary">₹{spend.toLocaleString()}</span>
              </div>
              <Slider
                value={[spend]}
                onValueChange={(val) => setSpend(val[0])}
                min={5000}
                max={500000}
                step={5000}
                className="py-4"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Monthly Leads Generated</label>
                <span className="text-xl font-bold text-primary">{leads} leads</span>
              </div>
              <Slider
                value={[leads]}
                onValueChange={(val) => setLeads(val[0])}
                min={10}
                max={2000}
                step={10}
                className="py-4"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Est. Leads Lost Without CRM (%)</label>
                <span className="text-xl font-bold text-primary">{lossRate}%</span>
              </div>
              <Slider
                value={[lossRate]}
                onValueChange={(val) => setLossRate(val[0])}
                min={5}
                max={50}
                step={1}
                className="py-4"
              />
              <p className="text-xs text-gray-500 italic">Research shows teams lose 15-30% of leads without a system.</p>
            </div>
          </div>

          <Card className="bg-gray-900 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/20 rounded-full blur-3xl"></div>
            <CardHeader className="text-center">
              <CardTitle className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em] mb-2">Monthly Potential Recovery</CardTitle>
              <div className="text-5xl font-black text-white">₹{netGain.toLocaleString()}</div>
              <p className="text-gray-400 mt-2 text-sm">After Scalezix Starter Cost (₹599)</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-gray-400">Cost Per Lead (CPL)</span>
                <span className="font-bold">₹{Math.round(cpl).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-gray-400">Leads Lost Monthly</span>
                <span className="font-bold text-red-400">{lostLeads} leads</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-gray-400">Value of Lost Leads</span>
                <span className="font-bold text-red-500">₹{Math.round(lostValue).toLocaleString()}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-primary-foreground text-sm font-bold uppercase tracking-widest mb-1">Scalezix Implementation</p>
                <p className="text-gray-300 text-xs">Recovers your lead cost in just <span className="text-white font-bold">{Math.ceil(starterCost / (cpl || 1))} leads</span> per month.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
