import { Zap, BarChart3, Layout, Users, Calendar, Link, Contact, Trophy, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const FeaturesGrid = () => {
  const features = [
    {
      title: "Google Leads (New)",
      description: "Capture leads directly from Google Search ads and YouTube. Webhook integration ensures leads from Google Ads sync instantly.",
      icon: <Zap className="h-6 w-6 text-red-500" />
    },
    {
      title: "WhatsApp Lead Alerts",
      description: "Get instant WhatsApp notifications the moment a new lead arrives. Real-time follow-up reminders directly to your phone.",
      icon: <MessageSquare className="h-6 w-6 text-emerald-500" />
    },
    {
      title: "Campaign ROI Tracker",
      description: "Track which Meta & Google campaigns are producing the most 'Won' deals. Optimize your ad spend based on real closing data.",
      icon: <BarChart3 className="h-6 w-6 text-blue-500" />
    },
    {
      title: "Manual & Other Sources",
      description: "Log walk-ins, phone inquiries, and referral leads manually. Support for website forms via webhook URLs included.",
      icon: <Contact className="h-6 w-6 text-purple-700" />
    },
    {
      title: "Instant Meta Sync",
      description: "Leads from all your Facebook pages and lead gen forms sync automatically in real time. No CSV uploads, no manual sync required.",
      icon: <Zap className="h-6 w-6 text-yellow-500" />
    },
    {
      title: "Drag & Drop Pipeline",
      description: "Kanban-style board with custom stages. Drag any lead between stages instantly to manage your sales funnel.",
      icon: <Layout className="h-6 w-6 text-purple-500" />
    },
    {
      title: "Team Leaderboard",
      description: "Real-time ranking of your closers by won deals. Create healthy competition and reward your top performers.",
      icon: <Trophy className="h-6 w-6 text-amber-500" />
    }
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Scalezix is built for speed
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Everything you need to capture, assign, and close Meta & Google leads in one workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="border-gray-100 hover:shadow-md transition-shadow group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-bold mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed text-base">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
