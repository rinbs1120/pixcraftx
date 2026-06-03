import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Terms of Service',
  description: 'ColorForge terms of service.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="lead mb-6">
              Last updated: May 31, 2026
            </p>

            <p className="leading-relaxed mb-6">
              Welcome to ColorForge. These Terms of Service (&quot;Terms&quot;) govern your access to and use
              of the ColorForge AI coloring page generator service, available at pixcraftx.com
              (&quot;Service&quot;). By accessing or using our Service, you agree to be bound by these
              Terms. If you do not agree to these Terms, please do not use the Service.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed mb-6">
              By creating an account, accessing, or using ColorForge, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you
              are using the Service on behalf of an organization, you represent and warrant that you have
              the authority to bind that organization to these Terms. You must be at least 13 years of age
              to use this Service.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              2. Description of Service
            </h2>
            <p className="leading-relaxed mb-6">
              ColorForge is an AI-powered coloring page generator that allows users to create custom
              coloring pages from text descriptions. The Service uses AI models powered by Fal.ai (including the Flux model family) and AILabTools to
              transform your text prompts into printable coloring page images. The Service is provided
              through our website at pixcraftx.com and may include features such as image generation,
              image storage, and image downloading in various formats.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              3. User Accounts
            </h2>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              3.1 Registration
            </h3>
            <p className="leading-relaxed mb-6">
              To use certain features of the Service, you must create an account. You agree to provide
              accurate, current, and complete information during registration and to update such information
              to keep it accurate, current, and complete. You are responsible for safeguarding your account
              password and for all activities that occur under your account. You must notify us immediately
              of any unauthorized use of your account.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              3.2 Account Types
            </h3>
            <p className="leading-relaxed mb-6">
              ColorForge offers the following account tiers:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>Free:</strong> Limited number of image generations per month for personal, non-commercial use.</li>
              <li><strong>Pro:</strong> Increased generation limits with commercial use rights for generated content.</li>
              <li><strong>Business:</strong> Highest generation limits with extended commercial rights and priority processing.</li>
            </ul>
            <p className="leading-relaxed mb-6">
              The specific features, limits, and pricing for each tier are described on our website and
              may be updated from time to time.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              4. AI-Generated Content
            </h2>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              4.1 Content Ownership
            </h3>
            <p className="leading-relaxed mb-6">
              You retain ownership of the text prompts you submit to the Service. Ownership and usage
              rights for generated coloring page images depend on your subscription tier:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li><strong>Free Tier:</strong> Generated images are licensed for personal, non-commercial use only.</li>
              <li><strong>Pro and Business Tiers:</strong> You are granted a license to use generated images for both personal and commercial purposes, subject to these Terms.</li>
            </ul>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              4.2 Content Policy and Prohibited Content
            </h3>
            <p className="leading-relaxed mb-6">
              You may not use the Service to generate content that:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Is illegal, harmful, threatening, abusive, or defamatory</li>
              <li>Involves or depicts minors in inappropriate or illegal contexts</li>
              <li>Infringes on the intellectual property rights, privacy, or publicity rights of others</li>
              <li>Promotes violence, hate speech, discrimination, or harassment</li>
              <li>Contains sexually explicit or pornographic material</li>
              <li>Attempts to circumvent or interfere with the security or integrity of the Service</li>
              <li>Misrepresents the source or origin of the generated content</li>
            </ul>
            <p className="leading-relaxed mb-6">
              We reserve the right to refuse to generate any content and to remove content that violates
              this policy without notice.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              4.3 AI Limitations
            </h3>
            <p className="leading-relaxed mb-6">
              AI-generated content is produced by machine learning models and may contain errors,
              artifacts, or unexpected results. We do not guarantee the quality, accuracy, or suitability
              of any generated image for any particular purpose. You are solely responsible for reviewing
              and evaluating the suitability of generated content for your intended use.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              5. Payment Terms
            </h2>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              5.1 Subscription Billing
            </h3>
            <p className="leading-relaxed mb-6">
              Paid subscriptions are billed in advance on a monthly or annual basis, depending on the plan
              you select. By subscribing, you authorize us to charge the applicable fees to your payment
              method through our payment processor, Creem. Prices are subject to change with prior notice.
              Price changes will take effect at the start of your next billing cycle.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              5.2 Cancellation
            </h3>
            <p className="leading-relaxed mb-6">
              You may cancel your subscription at any time through your account settings or by contacting
              us. Upon cancellation, your subscription will remain active until the end of the current
              billing period. No partial refunds are provided for unused portions of a billing period.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              5.3 Refund Policy
            </h3>
            <p className="leading-relaxed mb-6">
              If you are unsatisfied with the Service, you may request a refund within 7 days of your
              purchase by contacting us at{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>. Refund requests made after 7 days will be considered on a case-by-case basis.
              All payments are processed by Creem, and refunds will be issued through the same payment
              method used for the original purchase.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              6. Prohibited Uses
            </h2>
            <p className="leading-relaxed mb-6">
              In addition to the content restrictions in Section 4.2, you may not:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its related systems</li>
              <li>Use the Service to compete directly with ColorForge or to build a similar product or service</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated tools or bots to access the Service in a manner that exceeds normal usage</li>
              <li>Share your account credentials with others or allow others to use your account</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              7. Intellectual Property
            </h2>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              7.1 Your Content
            </h3>
            <p className="leading-relaxed mb-6">
              You retain all rights to the text prompts you submit to the Service. By submitting prompts,
              you grant us a limited, non-exclusive license to process your prompts through our AI models
              for the purpose of generating images for you.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              7.2 Generated Content
            </h3>
            <p className="leading-relaxed mb-6">
              As described in Section 4.1, your rights to generated content depend on your subscription
              tier. ColorForge retains no ownership rights in the generated images you create. However,
              you acknowledge that AI-generated content may not be eligible for copyright protection in
              certain jurisdictions, and you should consult legal counsel regarding the copyright status
              of AI-generated works in your jurisdiction.
            </p>

            <h3 className="font-display text-xl mt-6 mb-3 text-foreground">
              7.3 DMCA Copyright Complaints
            </h3>
            <p className="leading-relaxed mb-6">
              We respect intellectual property rights. If you believe that any content on our Service
              infringes your copyright, you may submit a notification under the Digital Millennium
              Copyright Act (DMCA) by providing the following information to{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
              <li>A description of the copyrighted work that you claim has been infringed</li>
              <li>A description of the allegedly infringing material and its location on our Service</li>
              <li>Your address, phone number, and email address</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner</li>
              <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf</li>
              <li>Your physical or electronic signature</li>
            </ul>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              8. Disclaimer of Warranties
            </h2>
            <p className="leading-relaxed mb-6">
              THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT
              WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE
              DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE. WE
              DO NOT GUARANTEE THE QUALITY, ACCURACY, RELIABILITY, OR SUITABILITY OF ANY AI-GENERATED
              CONTENT. YOU USE THE SERVICE AND RELY ON GENERATED CONTENT AT YOUR SOLE RISK.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              9. Limitation of Liability
            </h2>
            <p className="leading-relaxed mb-6">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, COLORFORGE AND ITS OFFICERS, DIRECTORS, EMPLOYEES,
              AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL,
              ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. IN NO EVENT SHALL OUR TOTAL
              LIABILITY EXCEED THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              10. Termination
            </h2>
            <p className="leading-relaxed mb-6">
              We may suspend or terminate your access to the Service at any time, with or without cause,
              and with or without notice. Upon termination, your right to use the Service will immediately
              cease. You may terminate your account at any time by contacting us or through your account
              settings. Provisions of these Terms that by their nature should survive termination shall
              survive, including but not limited to Sections 4, 7, 8, 9, and 10.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              11. Changes to Terms
            </h2>
            <p className="leading-relaxed mb-6">
              We reserve the right to modify these Terms at any time. We will notify you of material
              changes by posting the updated Terms on our website and updating the &quot;Last updated&quot;
              date. Your continued use of the Service after any changes constitutes your acceptance of the
              revised Terms. If you do not agree to the modified Terms, you must stop using the Service.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              12. Governing Law
            </h2>
            <p className="leading-relaxed mb-6">
              These Terms shall be governed by and construed in accordance with applicable laws, without
              regard to conflict of law principles. Any disputes arising under or in connection with these
              Terms shall be resolved through good faith negotiation, and if unresolved, through binding
              arbitration or in the courts of the applicable jurisdiction.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4 text-foreground">
              13. Contact
            </h2>
            <p className="leading-relaxed mb-6">
              If you have any questions or concerns about these Terms of Service, please contact us at:{' '}
              <a href="mailto:support@pixcraftx.com" className="text-primary hover:underline">
                support@pixcraftx.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
