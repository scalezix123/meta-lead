import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthContext";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { ProcessSteps } from "@/components/landing/ProcessSteps";
import { ROICalculator } from "@/components/landing/ROICalculator";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Scalezix | The Meta Leads CRM Built for Closers";
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        
        <div className="relative">
          <FeaturesGrid />
          <div className="container mx-auto px-4 pb-20 text-center -mt-12">
            <Link to="/features">
              <Button variant="outline" className="group border-blue-200 hover:border-blue-500 transition-all font-bold">
                View All Advanced Features <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 border-y border-gray-100">
          <ProcessSteps />
          <div className="container mx-auto px-4 pb-20 text-center -mt-12">
            <Link to="/how-it-works">
              <Button variant="outline" className="group border-blue-200 hover:border-blue-500 transition-all font-bold">
                Detailed Setup Guide <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <ROICalculator />
        
        <div className="relative pb-24">
          <PricingSection />
          <div className="container mx-auto px-4 text-center -mt-12">
            <Link to="/pricing">
              <Button variant="outline" className="group border-blue-200 hover:border-blue-500 transition-all font-bold">
                Compare Plan Details <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
