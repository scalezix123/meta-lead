import { AppLayout } from "@/components/AppLayout";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-20">
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2 border-b pb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Last Updated: March 31, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">1. Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            Scalezix ("we", "our", or "us") is committed to protecting the privacy and security of your data. This Privacy Policy describes how we collect, use, and protect information in connection with our lead management and CRM platform located at crm.scalezix.com.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">2. Meta Platform Data</h2>
          <p className="text-muted-foreground leading-relaxed">
            When you integrate your Meta (Facebook) account with Scalezix, we collect lead information (such as name, email, and phone number) generated from your Meta Lead Ads. 
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2">
            <li>We only access data you specifically authorize through the Meta OAuth flow.</li>
            <li>We do not share your lead data with any third parties or use it for our own marketing.</li>
            <li>Lead data is used solely to provide CRM services to you and your authorized team members.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">3. Data Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We implement industry-standard security measures, including encryption and secure Supabase database storage, to maintain the safety of your information. All Meta access tokens are stored in a secure, server-side environment.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">4. Data Retention and Deletion</h2>
          <p className="text-muted-foreground leading-relaxed">
            You maintain full control over your data. You may delete individual leads or disconnect your Meta account at any time through the Integrations dashboard. Upon account disconnection, we immediately revoke and discard all associated Meta access tokens.
          </p>
        </section>

        <section className="space-y-4 border-t pt-8">
          <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
          <p className="text-sm text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at <span className="font-medium text-foreground">shahrukh@movish.co.in</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
