import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-6">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-accent/20 border border-accent/30">
              <ShieldCheck className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Privacy Policy</h1>
              <p className="text-foreground/60 text-sm mt-1">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="glass-dark shadow-2xl">
          <CardContent className="p-6 md:p-8 space-y-6 text-foreground/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Introduction</h2>
              <p>
                UK Sabor ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-foreground mb-2">2.1 Personal Information</h3>
              <p className="mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name and email address (required for account creation)</li>
                <li>Profile photo and bio (optional)</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Phone number (optional, for instructors/promoters)</li>
                <li>Social media handles (optional, for public profiles)</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">2.2 Usage Data</h3>
              <p className="mb-3">We automatically collect certain information when you use our platform:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data (country/city level only)</li>
                <li>Course viewing history and progress</li>
                <li>Search queries and browsing behavior</li>
                <li>Event attendance records (QR code scans)</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">2.3 Cookies and Tracking</h3>
              <p>
                We use cookies and similar tracking technologies to enhance user experience, analyze platform usage, and deliver personalized content. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
              <p className="mb-3">We use the collected information for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Management:</strong> Creating and maintaining your user account</li>
                <li><strong>Service Delivery:</strong> Processing purchases, enrollments, and ticket sales</li>
                <li><strong>Communication:</strong> Sending transactional emails (receipts, confirmations) and optional marketing updates</li>
                <li><strong>Platform Improvement:</strong> Analyzing usage patterns to enhance features and user experience</li>
                <li><strong>Security:</strong> Detecting and preventing fraud, abuse, and security incidents</li>
                <li><strong>Compliance:</strong> Meeting legal obligations and enforcing our Terms of Service</li>
                <li><strong>Payments:</strong> Processing instructor/promoter payouts and student refunds</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Legal Basis for Processing (GDPR)</h2>
              <p className="mb-3">Under UK GDPR, we process your personal data based on:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Contract Performance:</strong> Processing necessary to fulfill our service agreement with you</li>
                <li><strong>Consent:</strong> For marketing communications and optional features (you can withdraw consent anytime)</li>
                <li><strong>Legitimate Interests:</strong> For platform security, fraud prevention, and service improvement</li>
                <li><strong>Legal Obligations:</strong> Compliance with UK tax, financial reporting, and consumer protection laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Information Sharing and Disclosure</h2>

              <h3 className="text-lg font-semibold text-foreground mb-2">5.1 Public Information</h3>
              <p className="mb-3">
                Instructor and promoter profiles (including name, photo, bio, and specialties) are publicly visible. Student profiles are private by default.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2">5.2 Service Providers</h3>
              <p className="mb-3">We share data with trusted third-party service providers:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> Payment processing and instructor payouts</li>
                <li><strong>Bunny.net:</strong> Video hosting and content delivery</li>
                <li><strong>Sentry:</strong> Error monitoring and performance analytics</li>
                <li><strong>Email Service Provider:</strong> Transactional and marketing emails</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">5.3 Legal Requirements</h3>
              <p>
                We may disclose your information if required by law, court order, or government request, or to protect the rights, property, or safety of UK Sabor, our users, or the public.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">5.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide services. If you close your account, we will delete or anonymize your data within 90 days, except where we must retain it for legal or accounting purposes (typically 6-7 years for financial records).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">7. Your Rights (UK GDPR)</h2>
              <p className="mb-3">You have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data ("right to be forgotten")</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Restriction:</strong> Request temporary restriction of processing</li>
                <li><strong>Withdraw Consent:</strong> Opt out of marketing emails anytime</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at <span className="text-accent font-medium">privacy@uksabor.com</span>. We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">8. Email Marketing Preferences</h2>
              <p>
                When you sign up as an instructor or promoter, you can choose to receive:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 my-3">
                <li><strong>Platform Updates:</strong> New features and product announcements</li>
                <li><strong>Growth Tips:</strong> Marketing advice and promotional opportunities</li>
                <li><strong>Community Stories:</strong> Inspiring stories and event highlights</li>
              </ul>
              <p>
                You can update your email preferences anytime in your account settings or click "unsubscribe" in any marketing email. Transactional emails (receipts, confirmations) cannot be opted out.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">9. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 my-3">
                <li>HTTPS encryption for all data transmission</li>
                <li>Secure password hashing using bcrypt</li>
                <li>Regular security audits and vulnerability scanning</li>
                <li>Restricted access to personal data (need-to-know basis)</li>
                <li>PCI-DSS compliant payment processing via Stripe</li>
              </ul>
              <p>
                However, no system is 100% secure. If you discover a security vulnerability, please report it to <span className="text-accent font-medium">security@uksabor.com</span>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">10. Children's Privacy</h2>
              <p>
                Our platform is not intended for children under 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal data, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">11. International Data Transfers</h2>
              <p>
                Your information may be stored and processed in the UK, EU, or other countries where our service providers operate. We ensure appropriate safeguards are in place for international transfers, including Standard Contractual Clauses where required.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or prominent notice on the platform. The "Last Updated" date at the top reflects the most recent revision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">13. Third-Party Links</h2>
              <p>
                Our platform may contain links to external websites (e.g., instructor websites, social media). We are not responsible for the privacy practices of these third-party sites. Please review their privacy policies separately.
              </p>
            </section>

            <section className="border-t border-border/30 pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">Contact Us</h2>
              <p className="mb-3">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="space-y-2">
                <p><strong>Data Protection Officer:</strong></p>
                <p className="text-accent font-medium">Email: privacy@uksabor.com</p>
                <p className="text-accent font-medium">Email: support@uksabor.com</p>
              </div>
              <p className="mt-4 text-sm text-foreground/60">
                You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) if you believe your data protection rights have been violated.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
