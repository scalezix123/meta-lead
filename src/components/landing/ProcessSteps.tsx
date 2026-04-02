import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const ProcessSteps = () => {
  const steps = [
    {
      number: "01",
      title: "Connect Your Facebook Pages",
      description: "Enter your Meta App ID and App Secret inside Scalezix Integrations. Takes under 2 minutes. Multiple pages supported simultaneously.",
      image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=60"
    },
    {
      number: "02",
      title: "Leads Sync Automatically",
      description: "Every new lead from your Facebook lead forms lands in Scalezix instantly via webhook. No manual CSV uploads or copy-pasting.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60"
    },
    {
      number: "03",
      title: "Assign & Work the Pipeline",
      description: "Assign leads to team members, drag them through pipeline stages (New → Contacted → Qualified → Won), and log interactions.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60"
    },
    {
      number: "04",
      title: "Track, Win & Grow",
      description: "Monitor your conversion funnel, see which campaigns produce most won deals, and watch team's closing performance.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60"
    }
  ];

  return (
    <section id="process" className="py-24 bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works — 4 Simple Steps
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From setup to scale in under 5 minutes.
          </p>
        </div>

        <div className="space-y-24">
          {steps.map((step, idx) => (
            <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24`}>
              <div className="flex-1 space-y-6">
                <span className="text-5xl font-black text-primary/10 leading-none">{step.number}</span>
                <h3 className="text-3xl font-bold text-gray-900 leading-tight">{step.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                  {step.description}
                </p>
              </div>
              <div className="flex-1 w-full relative">
                <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
                  <img src={step.image} alt={step.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="absolute -z-1 -inset-4 bg-primary/5 rounded-3xl blur-2xl"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <Link to="/login">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold">
              Ready to Start? Try for Free Today
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
