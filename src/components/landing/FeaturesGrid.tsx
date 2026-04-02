import { Zap, BarChart3, Layout, Users, Calendar, Link, Contact, Trophy, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const FeaturesGrid = () => {
  const features = [
    {
      title: "Instant Meta Sync",
      description: "Leads from all your Facebook pages and lead gen forms sync automatically in real time. No CSV uploads, no manual copy-paste.",
      icon: <Zap className="h-6 w-6 text-yellow-500" />
    },
    {
      title: "Analytics Dashboard",
      description: "Live stats showing Total Leads, Leads Today, Team Members, and Total Won deals. Includes a 7-day lead volume area chart.",
      icon: <BarChart3 className="h-6 w-6 text-blue-500" />
    },
    {
      title: "Drag & Drop Pipeline",
      description: "Kanban-style board with 5 stages: New → Contacted → Qualified → Won → Lost. Drag any lead between stages instantly.",
      icon: <Layout className="h-6 w-6 text-purple-500" />
    },
    {
      title: "Team Management",
      description: "Invite team members by email, assign specific leads to specific closers, set roles, and manage your workspace.",
      icon: <Users className="h-6 w-6 text-green-500" />
    },
    {
      title: "Tasks & Follow-ups",
      description: "Create tasks tied to individual leads with due dates, priority levels, and completion tracking. Never miss a follow-up.",
      icon: <Calendar className="h-6 w-6 text-orange-500" />
    },
    {
      title: "Facebook Integration",
      description: "Connect multiple Facebook pages using your Meta App ID and App Secret. Configure field mapping easily.",
      icon: <Link className="h-6 w-6 text-indigo-500" />
    },
    {
      title: "Lead Activity Log",
      description: "Full lead profile showing source, campaign, form fields, and a complete activity timeline logged chronologically.",
      icon: <Contact className="h-6 w-6 text-cyan-500" />
    },
    {
      title: "Closer Leaderboard",
      description: "Real-time ranking of your team members by won deals. Creates healthy competition and makes top performers visible.",
      icon: <Trophy className="h-6 w-6 text-amber-500" />
    },
    {
      title: "WhatsApp Quick-Dial",
      description: "One-click WhatsApp and call buttons on every lead card. Reach prospects instantly without switching apps.",
      icon: <MessageSquare className="h-6 w-6 text-emerald-500" />
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
            Everything you need to capture, assign, and close Meta leads in one workspace.
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
