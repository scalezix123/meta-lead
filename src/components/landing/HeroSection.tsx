import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-gradient-to-b from-white to-gray-50 border-b border-gray-100">
      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Meta & Google Leads CRM Built for Closers
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          Capture every Facebook, Instagram & Google lead into a closed deal — <span className="text-blue-600">automatically.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          SCALEZIX captures every lead the moment they submit your Meta or Google form. Sync, assign, track, and close — all in one workspace built for speed.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link to="/login">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-lg shadow-blue-500/20">
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="text-sm font-medium text-gray-500">
            ✅ 7-day free trial | No credit card needed
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-sm md:text-base font-medium text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" /> 2-minute setup
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" /> Zero leads missed
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" /> Meta & Google synced
          </div>
        </div>
      </div>
    </section>
  );
};
