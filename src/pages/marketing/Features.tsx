import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { Zap, BarChart3, Layout, Users, Calendar, Link, Contact, Trophy, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as RouterLink } from "react-router-dom";
import { useEffect } from "react";

const Features = () => {
  useEffect(() => {
    document.title = "Core Features | Scalezix - Meta Leads CRM for Closers";
  }, []);
  const detailedFeatures = [
    {
      title: "Instant Meta Webhook Sync",
      description: "Stop manual CSV exports. Scalezix uses direct Meta Webhooks to pull lead data the millisecond it's submitted on Facebook or Instagram. Your closers get notified instantly, ensuring the highest possible contact rate.",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      points: ["Real-time data ingestion", "No 3rd party tools like Zapier required", "Works with all Meta Lead Form types"]
    },
    {
      title: "Visual Pipeline Management",
      description: "Move leads through a high-performance Kanban board designed for speed. Track Every lead from 'New' to 'Won' with zero friction. See exactly where your bottlenecks are and which stages need more attention.",
      icon: <Layout className="h-8 w-8 text-purple-500" />,
      points: ["Drag-and-drop mechanics", "Stage-wise lead counting", "Customizable pipeline workflows"]
    },
    {
      title: "Advanced Team Collaboration",
      description: "Scalezix isn't just a lead list; it's a workspace for your entire sales team. Assign leads, set reminders, and monitor performance in real-time. Transparent lead ownership means no more double-calling or missed prospects.",
      icon: <Users className="h-8 w-8 text-green-500" />,
      points: ["Granular role permissions", "One-click lead assignment", "Team activity timeline"]
    },
    {
      title: "Comprehensive Analytics & ROI",
      description: "Built-in intelligence to track your ad spend performance. See which campaigns are producing actual revenue, not just clicks. Monitor your team's closing rates and lead volume trends over the last 7 to 30 days.",
      icon: <BarChart3 className="h-8 w-8 text-blue-500" />,
      points: ["Campaign-level ROI tracking", "Closer leaderboard", "Conversion funnel visualization"]
    },
    {
      title: "Task Management & Follow-ups",
      description: "Create tasks directly tied to leads. Set priority levels, due dates, and reminders. Scalezix ensures that every lead receives the follow-up it deserves, turning cold data into warm relationships.",
      icon: <Calendar className="h-8 w-8 text-orange-500" />,
      points: ["Recurring follow-up alerts", "Task status tracking", "Lead-specific activity logs"]
    },
    {
      title: "One-Click Quick Actions",
      description: "Reach out to leads faster than ever. Every lead card features quick-dial buttons for Phone and WhatsApp. Open a chat or start a call without ever copying a phone number or leaving the CRM.",
      icon: <MessageSquare className="h-8 w-8 text-emerald-500" />,
      points: ["Direct WhatsApp integration", "Native call buttons", "Instant remark logging"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      
      <main className="pt-24 pb-20">
        {/* Header */}
        <section className="bg-gray-50 py-20 border-b border-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
              Features Built for <span className="text-blue-600">Scale</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Scalezix is more than a CRM. It's an automated lead powerhouse designed to bridge the gap between Meta Lead Ads and your bottom line.
            </p>
          </div>
        </section>

        {/* Detailed Grid */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {detailedFeatures.map((f, i) => (
                <Card key={i} className="border-none shadow-none group">
                  <CardHeader className="p-0 mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                      {f.icon}
                    </div>
                    <CardTitle className="text-2xl font-bold mb-4">{f.title}</CardTitle>
                    <CardDescription className="text-lg text-gray-600 leading-relaxed">
                      {f.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="space-y-3">
                      {f.points.map((p, pi) => (
                        <li key={pi} className="flex items-center gap-3 text-gray-700 font-medium">
                          <CheckCircle className="h-5 w-5 text-green-500" /> {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Who is Scalezix For?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Specific solutions for businesses scaling Meta ad spend from 50k to 50L+ per month.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm border-b-4 border-b-blue-600">
                <h4 className="text-xl font-bold mb-4">Real Estate Agencies</h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">Recover every high-intent buyer lead. Ensure fast follow-up call rates and track agent performance from visit to booking.</p>
                <ul className="space-y-2 text-xs font-bold text-blue-600">
                    <li>• Instant CRM Ingestion</li>
                    <li>• Lead Source Tracking</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm border-b-4 border-b-purple-600">
                <h4 className="text-xl font-bold mb-4">Marketing Agencies</h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">Give your clients a visual dashboard they'll love. Prove your lead quality by tracking the entire funnel in one shared workspace.</p>
                <ul className="space-y-2 text-xs font-bold text-purple-600">
                    <li>• Client-Specific Pipelines</li>
                    <li>• ROI Transparency</li>
                </ul>
              </div>
              <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-sm border-b-4 border-b-green-600">
                <h4 className="text-xl font-bold mb-4">Education & EdTech</h4>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">Manage thousands of daily leads without losing data. Assign counselors instantly and monitor conversion rates by coursetype.</p>
                <ul className="space-y-2 text-xs font-bold text-green-600">
                    <li>• High-Volume Lead Sync</li>
                    <li>• Team Capacity Planning</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Experience the Scalezix Difference Today
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <RouterLink to="/login">
                <Button size="lg" className="h-14 px-10 text-lg font-bold bg-white text-blue-600 hover:bg-gray-100">
                  Start Your 7-Day Free Trial
                </Button>
              </RouterLink>
            </div>
            <p className="mt-6 text-blue-100 text-sm font-medium">
              Join 500+ businesses converting Meta leads at 2x their previous rate.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
