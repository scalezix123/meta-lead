import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQSection = () => {
  const faqs = [
    {
      question: "How does Scalezix get my Meta leads?",
      answer: "You connect your Facebook page using your Meta App ID and App Secret inside the Integrations section. Scalezix then syncs all leads from your lead gen forms automatically via Meta's webhook. You can also trigger a manual sync anytime."
    },
    {
      question: "Do I need technical skills to set it up?",
      answer: "No. If you've run a Facebook lead ad before, you can set up Scalezix. Most users are live within 15 minutes."
    },
    {
      question: "Can multiple team members use the same account?",
      answer: "Yes. Each plan comes with team seats. You can invite members by email, assign leads to them, and track their performance on the closer leaderboard."
    },
    {
      question: "What happens if I exceed my lead limit on Starter?",
      answer: "We notify you at 80% capacity. You can upgrade to Growth (unlimited leads) or purchase the Extra Pages or Extra Members add-on. We never drop or hide your leads."
    },
    {
      question: "Can I connect multiple Facebook pages?",
      answer: "Starter supports 1, Growth supports 5, Agency supports unlimited. You can also add more pages with the Extra Pages Pack add-on."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes — 7 days on every plan. No credit card required."
    },
    {
      question: "Can I resell Scalezix to my clients?",
      answer: "Yes. The White Label add-on lets you rebrand it completely with your own logo, domain, and colors. Sell it as your own product and keep 100% of the margin."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Scalezix.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-gray-100 rounded-xl bg-gray-50/50 px-6 data-[state=open]:bg-white data-[state=open]:shadow-sm transition-all">
                <AccordionTrigger className="text-left font-bold text-gray-900 hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base leading-relaxed pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
