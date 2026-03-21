import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text">Terms of Service</h1>
              <p className="text-foreground/60 text-sm mt-1">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card className="glass-dark shadow-2xl">
          <CardContent className="p-6 md:p-8 space-y-6 text-foreground/80 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the UK Sabor platform ("Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Description of Service</h2>
              <p className="mb-3">
                UK Sabor is a platform that connects dance instructors, promoters, and students within the Latin dance community across the United Kingdom. Our Service includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Online course hosting and distribution</li>
                <li>Event and class ticketing services</li>
                <li>Payment processing for instructors and promoters</li>
                <li>Community features and profiles</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. User Accounts</h2>
              <h3 className="text-lg font-semibold text-foreground mb-2">3.1 Registration</h3>
              <p className="mb-3">
                You must create an account to access certain features. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2">3.2 Account Security</h3>
              <p className="mb-3">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2">3.3 User Types</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Students:</strong> Can browse, purchase, and access courses, classes, and events</li>
                <li><strong>Instructors:</strong> Can create and sell courses, classes, and workshops (subject to approval)</li>
                <li><strong>Promoters:</strong> Can organize and sell tickets to events (subject to approval)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Instructor and Promoter Terms</h2>
              <h3 className="text-lg font-semibold text-foreground mb-2">4.1 Application Process</h3>
              <p className="mb-3">
                To become an instructor or promoter, you must submit an application which will be reviewed by our team. We reserve the right to approve or reject applications at our sole discretion.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2">4.2 Content Ownership</h3>
              <p className="mb-3">
                Instructors retain ownership of their course content. By uploading content, you grant UK Sabor a non-exclusive, worldwide license to host, distribute, and promote your content on the platform.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2">4.3 Revenue Share</h3>
              <p className="mb-3">
                Revenue from course sales and event tickets will be split according to your subscription plan. Platform fees and payment processing fees apply. Detailed fee structures are available in your instructor/promoter dashboard.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2">4.4 Payout Schedule</h3>
              <p>
                Instructors and promoters can request withdrawals through Stripe Connect. Payments are typically processed within 7-14 business days, subject to Stripe's terms and fraud prevention measures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Payments and Refunds</h2>
              <h3 className="text-lg font-semibold text-foreground mb-2">5.1 Payment Processing</h3>
              <p className="mb-3">
                All payments are processed securely through Stripe. By making a purchase, you agree to Stripe's terms of service.
              </p>

              <h3 className="text-lg font-semibold text-foreground mb-2">5.2 Refund Policy</h3>
              <p className="mb-3">
                Refunds for courses, classes, and events are subject to the individual instructor/promoter's refund policy. Generally:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Online courses: 14-day money-back guarantee if less than 25% of content has been accessed</li>
                <li>Live classes: Refunds available up to 24 hours before the class start time</li>
                <li>Events: Refunds subject to the promoter's policy (typically 7 days before the event)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Prohibited Conduct</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Upload content that infringes on intellectual property rights</li>
                <li>Engage in fraudulent activities or payment disputes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Share login credentials or purchased content with unauthorized users</li>
                <li>Attempt to circumvent payment systems or security measures</li>
                <li>Use the platform for any illegal purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">7. Content Policy</h2>
              <p className="mb-3">
                All content (courses, event descriptions, profiles) must:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be accurate and not misleading</li>
                <li>Respect intellectual property rights</li>
                <li>Comply with UK laws and regulations</li>
                <li>Be appropriate for all audiences (no explicit content)</li>
              </ul>
              <p className="mt-3">
                UK Sabor reserves the right to remove content that violates these policies without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">8. Limitation of Liability</h2>
              <p>
                UK Sabor acts as a platform connecting instructors/promoters with students. We are not responsible for the quality of instruction, event organization, or any injuries or damages that may occur during classes or events. Instructors and promoters are responsible for their own insurance and liability coverage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">9. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these Terms of Service, fraudulent activity, or at our sole discretion. You may also close your account at any time through your profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">10. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify users of significant changes via email or platform notification. Continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-3">11. Governing Law</h2>
              <p>
                These Terms of Service are governed by the laws of England and Wales. Any disputes arising from these terms will be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <section className="border-t border-border/30 pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">Contact Us</h2>
              <p className="mb-2">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <p className="text-accent font-medium">
                Email: support@uksabor.com
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
