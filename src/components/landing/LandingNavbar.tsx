import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import { Link } from "react-router-dom";

export const LandingNavbar = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Target className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Scalezix</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
          <Link to="/how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</Link>
          <Link to="/roi-calculator" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">ROI Calculator</Link>
          <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-sm font-medium">Log In</Button>
          </Link>
          <Link to="/login">
            <Button className="text-sm font-medium">Start Free Trial</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
