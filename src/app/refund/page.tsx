import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Refund Policy',
  description: 'ColorForge refund policy for subscription services.',
};

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            Refund Policy
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="lead mb-6">
              Last updated: May 31, 2026
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              1. Overview
            </h2>
            <p className="leading-relaxed mb-6">
              ColorForge (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) offers subscription-based AI coloring page
              generation services processed through our payment provider, Creem. This Refund Policy
              outlines the conditions under which you may request a refund for your subscription
              purchase. By making a purchase on ColorForge, you agree to the terms described below.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              2. Refund Eligibility
            </h2>
            <p className="leading-relaxed mb-6">
              You may request a full refund within 7 days of your initial purchase, provided that:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Your request is made within 7 calendar days of the purchase date.</li>
              <li>You have not exceeded 20% of your monthly generation quota (e.g., if your plan
                includes 100 pages per month, you have generated no more than 20 pages).</li>
              <li>Your account is in good standing with no history of policy violations.</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              3. Non-Refundable Cases
            </h2>
            <p className="leading-relaxed mb-6">
              Refunds will not be granted under the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>Expired window:</strong> Requests made more than 7 days after purchase.</li>
              <li><strong>Excessive usage:</strong> You have used more than 20% of your monthly generation quota.</li>
              <li><strong>Abuse:</strong> Accounts flagged for abusive behavior, policy violations, or fraudulent activity are not eligible for refunds.</li>
              <li><strong>Renewals:</strong> Automatic subscription renewals are non-refundable. You can cancel at any time before the renewal date to avoid being charged.</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              4. How to Request a Refund
            </h2>
            <p className="leading-relaxed mb-6">
              To request a refund, please email us at{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>{' '}
              with the following information:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Your ColorForge account email address.</li>
              <li>The order number from your Creem payment confirmation.</li>
              <li>A brief reason for the refund request.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              Once we receive your request, our team will review it and, if approved, process the
              refund through Creem. You will receive a confirmation email once the refund has been
              initiated.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              5. Refund Timeline
            </h2>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>Review period:</strong> 1–3 business days from the date we receive your request.</li>
              <li><strong>Refund processing:</strong> 5–10 business days for the refund to appear on your original payment method, depending on your bank or payment provider.</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              6. Free Plan Users
            </h2>
            <p className="leading-relaxed mb-6">
              The free plan does not involve any payment and therefore does not require a refund.
              If you are on the free plan and decide to upgrade to a paid subscription, the refund
              policy above applies to that paid purchase.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              7. Contact Us
            </h2>
            <p className="leading-relaxed mb-6">
              If you have any questions about this Refund Policy or need assistance with a refund
              request, please contact us at{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
