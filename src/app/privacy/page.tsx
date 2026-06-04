import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Privacy Policy',
  description: 'PixCraftX privacy policy.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="lead mb-6">
              Last updated: May 31, 2026
            </p>

            <p className="leading-relaxed mb-6">
              PixCraftX (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website
              pixcraftx.com and the PixCraftX AI coloring page generator service. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              service. Please read this policy carefully. By using PixCraftX, you consent to the data
              practices described herein.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              1. Information We Collect
            </h2>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              1.1 Information You Provide Directly
            </h3>
            <p className="leading-relaxed mb-6">
              We collect information that you voluntarily provide when using our service, including:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Account registration details (name, email address, password)</li>
              <li>Text prompts you submit to generate coloring pages</li>
              <li>Payment and billing information processed through our payment provider</li>
              <li>Feedback, support requests, and communications you send to us</li>
            </ul>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              1.2 Information Collected Automatically
            </h3>
            <p className="leading-relaxed mb-6">
              When you access or use our service, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Log data (IP address, access times, pages viewed, referring URLs)</li>
              <li>Cookies and similar tracking technologies (see Section 8)</li>
              <li>Usage patterns and interaction data within the service</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              2. How We Use Information
            </h2>
            <p className="leading-relaxed mb-6">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>To provide, maintain, and improve our AI coloring page generation service</li>
              <li>To process your prompts and deliver generated coloring page images</li>
              <li>To create and manage your account and subscription</li>
              <li>To process payments and send billing-related communications</li>
              <li>To communicate with you about product updates, features, and support</li>
              <li>To monitor and analyze usage patterns to improve user experience</li>
              <li>To detect, prevent, and address fraud, abuse, and security issues</li>
              <li>To comply with legal obligations and enforce our terms of service</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              3. AI-Generated Content
            </h2>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              3.1 How AI Generation Works
            </h3>
            <p className="leading-relaxed mb-6">
              PixCraftX uses artificial intelligence models powered by Fal.ai and AILabTools to generate coloring page
              images based on text prompts you provide. Your prompts are sent to our AI processing partner
              (Fal.ai and AILabTools) for image generation. The AI models produce original images and are not designed to
              reproduce copyrighted material.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              3.2 Content Moderation
            </h3>
            <p className="leading-relaxed mb-6">
              We employ automated content moderation systems to filter prompts and generated images that
              violate our content policies. This includes blocking content that is illegal, harmful to
              minors, or otherwise prohibited under our Terms of Service. However, automated moderation
              is not perfect, and we cannot guarantee that all policy-violating content will be caught.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              3.3 Your Content Rights
            </h3>
            <p className="leading-relaxed mb-6">
              You retain ownership of the text prompts you submit. The rights to generated coloring page
              images depend on your subscription tier, as detailed in our Terms of Service. You are
              responsible for ensuring that your use of generated content complies with applicable laws
              and does not infringe on the rights of third parties.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              3.4 Data Retention for AI Content
            </h3>
            <p className="leading-relaxed mb-6">
              Generated images are stored on our servers until you choose to delete them or your account
              is terminated. Text prompts are retained for 90 days for quality improvement and abuse
              prevention, after which they are permanently deleted. We do not use your prompts to train
              AI models.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              4. Information Sharing
            </h2>
            <p className="leading-relaxed mb-6">
              We do not sell, trade, or rent your personal information to third parties. We may share
              your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>Service Providers:</strong> We share data with trusted third-party service providers who assist us in operating our platform:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Clerk</strong> — Authentication and user identity management</li>
                  <li><strong>Creem</strong> — Payment processing and subscription billing</li>
                  <li><strong>Fal.ai</strong> — AI image generation processing</li>
                  <li><strong>AILabTools</strong> — Photo to coloring page conversion</li>
                  <li><strong>Supabase</strong> — Database storage and application infrastructure</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law, subpoena, or other legal process, or when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              5. Data Security
            </h2>
            <p className="leading-relaxed mb-6">
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. These
              measures include encryption in transit (TLS/SSL), encrypted data storage, regular security
              assessments, and access controls. However, no method of transmission over the Internet or
              electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              6. Your Rights
            </h2>
            <p className="leading-relaxed mb-6">
              Depending on your jurisdiction, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> You have the right to request access to the personal data we hold about you.</li>
              <li><strong>Correction:</strong> You have the right to request correction of inaccurate or incomplete personal data.</li>
              <li><strong>Deletion:</strong> You have the right to request deletion of your personal data, subject to certain legal exceptions.</li>
              <li><strong>Data Portability:</strong> You have the right to receive your personal data in a structured, commonly used, machine-readable format.</li>
              <li><strong>Opt-Out:</strong> You may opt out of promotional communications at any time by following the unsubscribe link or contacting us.</li>
            </ul>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              6.1 GDPR Rights (EU/EEA Users)
            </h3>
            <p className="leading-relaxed mb-6">
              If you are a resident of the European Economic Area (EEA), you have additional rights under
              the General Data Protection Regulation (GDPR), including the right to object to processing,
              the right to restrict processing, and the right to lodge a complaint with a supervisory
              authority. The legal basis for processing your data includes your consent, the necessity
              of processing for the performance of our contract with you, and our legitimate interests.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              6.2 CCPA Rights (California Users)
            </h3>
            <p className="leading-relaxed mb-6">
              If you are a California resident, you have rights under the California Consumer Privacy Act
              (CCPA), including the right to know what personal information we collect, the right to
              request deletion of your personal information, the right to opt out of the sale of your
              personal information (we do not sell personal information), and the right to
              non-discrimination for exercising your rights.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              7. Children&apos;s Privacy
            </h2>
            <p className="leading-relaxed mb-6">
              PixCraftX is not directed at children under the age of 13. We do not knowingly collect
              personal information from children under 13. If you are a parent or guardian and become
              aware that your child has provided us with personal information, please contact us at{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>{' '}
              and we will take steps to delete such information. Parents and guardians should supervise
              their children&apos;s use of our service to ensure appropriate use of AI-generated content.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              8. Cookies and Tracking
            </h2>
            <p className="leading-relaxed mb-6">
              We use cookies and similar tracking technologies to enhance your experience on PixCraftX.
              These include essential cookies required for authentication and security, analytics cookies
              that help us understand how our service is used, and functional cookies that remember your
              preferences. You can manage your cookie preferences through your browser settings. Please
              note that disabling certain cookies may affect the functionality of our service.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              9. International Data Transfers
            </h2>
            <p className="leading-relaxed mb-6">
              PixCraftX operates globally, and your information may be transferred to and processed in
              countries other than your country of residence. These countries may have different data
              protection laws. When we transfer your data internationally, we ensure appropriate
              safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the
              European Commission, and compliance with applicable data protection regulations.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              10. Changes to This Privacy Policy
            </h2>
            <p className="leading-relaxed mb-6">
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technologies, legal requirements, or other factors. We will notify you of material changes
              by posting the updated policy on our website and updating the &quot;Last updated&quot; date.
              Your continued use of PixCraftX after any changes constitutes your acceptance of the
              updated Privacy Policy.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              11. Data Retention
            </h2>
            <p className="leading-relaxed mb-6">
              We retain your personal data only for as long as necessary to fulfill the purposes
              described in this Privacy Policy. Specific retention periods are as follows:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>Account Data:</strong> Retained for 30 days after account deletion to allow for recovery, then permanently deleted.</li>
              <li><strong>Generated Images:</strong> Stored until you delete them or your account is terminated, after which they are deleted within 30 days.</li>
              <li><strong>Payment Records:</strong> Retained as required by applicable financial and tax laws (typically 5–7 years).</li>
              <li><strong>Server Logs:</strong> Retained for up to 12 months for security and debugging purposes.</li>
              <li><strong>Text Prompts:</strong> Retained for 90 days for quality improvement and abuse prevention, then permanently deleted.</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              12. Contact Us
            </h2>
            <p className="leading-relaxed mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please contact us at:{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              13. Regulatory Compliance
            </h2>
            <p className="leading-relaxed mb-6">
              PixCraftX is committed to complying with applicable data protection regulations, including:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>General Data Protection Regulation (GDPR):</strong> For users in the European Economic Area, we process personal data in accordance with GDPR requirements, including lawful basis for processing, data subject rights, and cross-border transfer safeguards.</li>
              <li><strong>California Consumer Privacy Act (CCPA):</strong> For California residents, we comply with CCPA requirements, including the right to know, right to delete, right to opt out, and right to non-discrimination.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              If you believe that your data protection rights have been violated, you have the right to
              lodge a complaint with your local supervisory authority.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
