import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Scale, Mail, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-strong">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Back</span>
            </Button>
            <button onClick={() => setLocation('/')} className="flex items-center gap-2.5">
              <div className="relative">
                <GraduationCap className="w-5 h-5 text-primary" />
                <div className="absolute inset-0 blur-md bg-primary/20" />
              </div>
              <span className="hidden md:inline text-base font-bold text-foreground tracking-tight">
                AutoScholar
              </span>
            </button>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-3xl relative z-10">
        {/* Page Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold tracking-wider uppercase mb-5">
            <Scale className="w-3.5 h-3.5" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: March 13, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-base prose-h3:mt-6 prose-p:text-[15px] prose-p:leading-relaxed prose-li:text-[15px]">

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using AutoScholar.ai ("the Service"), available at <strong>autoscholar.ai</strong>,
            you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
            you must not access or use the Service.
          </p>
          <p>
            We reserve the right to update these Terms at any time. Continued use of the Service after changes
            are posted constitutes your acceptance of the modified Terms.
          </p>

          <h2>2. Description of the Service</h2>
          <p>
            AutoScholar.ai is an autonomous AI-powered academic research platform that provides:
          </p>
          <ul>
            <li>AI-driven research analysis powered by Claude AI (Anthropic).</li>
            <li>Automated generation of publication-grade LaTeX PDF research papers.</li>
            <li>Access to 265+ financial, economic, and market data endpoints.</li>
            <li>Quantitative analysis tools including Monte Carlo simulation, VaR, portfolio optimization, and volatility surface modeling.</li>
            <li>Multi-source academic literature search (OpenAlex, arXiv, CrossRef).</li>
            <li>Macroeconomic data from the World Bank, IMF, and OECD.</li>
            <li>Custom Python code execution for advanced data analysis and visualization.</li>
            <li>Web content extraction and intelligent search capabilities.</li>
            <li>Corporate report and presentation generation.</li>
          </ul>

          <h2>3. Eligibility</h2>
          <p>
            You must be at least 16 years of age to use the Service. By using the Service, you represent
            and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
          </p>

          <h2>4. User Accounts</h2>
          <ul>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            <li>Store your recovery token securely — it is the only way to recover a lost account.</li>
          </ul>

          <h2>5. Acceptable Use</h2>

          <h3>5.1 You Agree NOT To:</h3>
          <ul>
            <li>Use the Service for any unlawful or unauthorized purpose.</li>
            <li>Attempt to gain unauthorized access to any systems, networks, or data.</li>
            <li>Abuse API resources or generate excessive load on the platform.</li>
            <li>Resell, redistribute, or commercially exploit data obtained through the Service without authorization.</li>
            <li>Use the Service to send spam, phishing messages, or harass other users.</li>
            <li>Attempt to circumvent security features, rate limits, or access controls.</li>
            <li>Scrape, crawl, or automatically extract data from the Service.</li>
            <li>Upload or execute malicious code through the Python execution environment.</li>
            <li>Misrepresent AI-generated research as your own original academic work in contexts where AI authorship disclosure is required.</li>
          </ul>

          <h3>5.2 You Agree To:</h3>
          <ul>
            <li>Provide accurate information when creating your account.</li>
            <li>Use analyses and generated content for informational and educational purposes.</li>
            <li>Comply with all applicable laws and regulations in your jurisdiction.</li>
            <li>Respect the terms of service of all third-party APIs accessed through the platform.</li>
            <li>Properly attribute AI-generated content when required by academic or institutional policies.</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <ul>
            <li><strong>Platform</strong>: The Service, its original content, features, and functionality are owned by AutoScholar.ai and are protected by intellectual property laws.</li>
            <li><strong>Your Content</strong>: You retain ownership of the research queries you submit and any original content you create.</li>
            <li><strong>AI-Generated Content</strong>: Research papers and analyses generated by the AI are produced using Claude AI (Anthropic). Usage rights are subject to Anthropic's terms of service.</li>
            <li><strong>Third-Party Data</strong>: Financial data, academic metadata, and other information sourced from third-party providers remain subject to their respective terms and licenses.</li>
            <li><strong>Published Papers</strong>: By publishing a paper to the AutoScholar Journal, you grant us a non-exclusive, worldwide license to host, display, and distribute the paper as part of the Journal.</li>
          </ul>

          <h2>7. Financial Disclaimer</h2>
          <div className="not-prose p-4 rounded-xl bg-amber-500/8 border border-amber-500/20 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">IMPORTANT DISCLAIMER</p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  The Service provides information for <strong>educational and research purposes only</strong>.
                  Nothing on this platform constitutes financial advice, investment recommendations, or a
                  solicitation to buy or sell any financial instruments.
                </p>
              </div>
            </div>
          </div>
          <ul>
            <li><strong>Not Financial Advice</strong>: Analyses, data, and AI-generated content do not constitute investment advice or recommendations.</li>
            <li><strong>No Guarantees</strong>: Financial data, forecasts, and model outputs may be inaccurate, incomplete, or outdated.</li>
            <li><strong>Investment Risk</strong>: All investments carry risk, including potential loss of principal.</li>
            <li><strong>Verification Required</strong>: Always verify information with authoritative sources before making any decisions.</li>
            <li><strong>Professional Advice</strong>: Consult a qualified financial advisor before making any investment decisions.</li>
          </ul>

          <h2>8. AI-Generated Content Disclaimer</h2>
          <p>
            Research papers, analyses, and other content generated by the platform are produced by artificial intelligence.
            While we strive for accuracy:
          </p>
          <ul>
            <li>AI-generated content may contain factual errors, hallucinations, or biases.</li>
            <li>Generated citations and references should be independently verified.</li>
            <li>Statistical analyses and model outputs should be validated before relying on them.</li>
            <li>The platform is a research tool, not a substitute for expert human judgment.</li>
          </ul>

          <h2>9. Custom Python Code Execution</h2>
          <p>
            The platform allows execution of custom Python code for data analysis. By using this feature:
          </p>
          <ul>
            <li>Code executes in a time-limited (90-second timeout), restricted environment.</li>
            <li>System access is restricted for security purposes.</li>
            <li>You are responsible for the code generated and executed in your sessions.</li>
            <li>We are not liable for errors, data loss, or unintended consequences of executed code.</li>
            <li>Attempting to exploit the execution environment is a violation of these Terms.</li>
          </ul>

          <h2>10. Shared Content and Published Papers</h2>
          <p>When you share an analysis or publish a paper:</p>
          <ul>
            <li>It becomes publicly accessible via a unique URL or the AutoScholar Journal.</li>
            <li>You are solely responsible for the content you choose to share.</li>
            <li>We reserve the right to remove content that violates these Terms or applicable law.</li>
            <li>You grant us a license to display and distribute your shared content as part of the Service.</li>
            <li>Other users may view, download, and cite your published papers.</li>
          </ul>

          <h2>11. Limitation of Liability</h2>
          <p>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p>TO THE FULLEST EXTENT PERMITTED BY LAW, AUTOSCHOLAR.AI SHALL NOT BE LIABLE FOR:</p>
          <ul>
            <li>Any financial losses resulting from use of or reliance on the Service.</li>
            <li>Interruptions, downtime, or unavailability of the Service.</li>
            <li>Inaccuracies in data provided by third-party APIs or AI models.</li>
            <li>Errors in AI-generated analyses, papers, or code.</li>
            <li>Loss of data, unauthorized access, or security breaches beyond our reasonable control.</li>
            <li>Any indirect, incidental, special, consequential, or punitive damages.</li>
          </ul>

          <h2>12. Third-Party Services</h2>
          <p>The Service integrates with third-party APIs and services. You acknowledge that:</p>
          <ul>
            <li>These services have their own terms of service and privacy policies.</li>
            <li>We are not responsible for the availability, accuracy, or reliability of third-party services.</li>
            <li>API costs are borne by AutoScholar within reasonable limits; excessive usage may be throttled.</li>
            <li>Third-party service outages may temporarily affect platform functionality.</li>
          </ul>

          <h2>13. Modifications to the Service</h2>
          <p>We reserve the right to:</p>
          <ul>
            <li>Modify, suspend, or discontinue any part of the Service at any time.</li>
            <li>Add, remove, or change features and functionality.</li>
            <li>Impose usage limits or restrictions.</li>
            <li>Update pricing or introduce paid tiers in the future.</li>
          </ul>
          <p>
            We will make reasonable efforts to notify users of material changes, but are not obligated to do so.
          </p>

          <h2>14. Termination</h2>
          <ul>
            <li>You may delete your account at any time through the platform.</li>
            <li>We may suspend or terminate your account for violation of these Terms.</li>
            <li>Upon termination, your right to use the Service ceases immediately.</li>
            <li>Data may be retained for a reasonable period for legal or security reasons.</li>
            <li>Published papers in the Journal may remain accessible after account deletion.</li>
          </ul>

          <h2>15. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless AutoScholar.ai, its operators, and affiliates from any claims,
            damages, losses, or expenses (including legal fees) arising from your use of the Service, your violation
            of these Terms, or your violation of any rights of a third party.
          </p>

          <h2>16. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Province of Quebec, Canada,
            without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject
            to the exclusive jurisdiction of the courts located in Montreal, Quebec, Canada.
          </p>

          <h2>17. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited
            or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>

          <h2>18. Contact Us</h2>
          <p>
            If you have any questions or concerns regarding these Terms of Service, please contact us at:
          </p>
          <div className="not-prose flex items-center gap-3 p-4 rounded-xl bg-card border border-border/60 mt-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AutoScholar.ai — Legal Inquiries</p>
              <a href="mailto:contact@autoscholar.ai" className="text-sm text-primary hover:underline font-medium">
                contact@autoscholar.ai
              </a>
            </div>
          </div>

          <hr className="my-8" />

          <p className="text-center text-sm text-muted-foreground">
            By using AutoScholar.ai, you acknowledge that you have read, understood, and agree to be bound
            by these Terms of Service and our{" "}
            <button onClick={() => setLocation('/privacy')} className="text-primary hover:underline font-medium">
              Privacy Policy
            </button>.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground/50">
            AutoScholar.ai — Autonomous Academic Research Platform
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <button onClick={() => setLocation('/privacy')} className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</button>
            <span className="text-muted-foreground/30">|</span>
            <button onClick={() => setLocation('/terms')} className="text-primary font-medium">Terms of Service</button>
            <span className="text-muted-foreground/30">|</span>
            <button onClick={() => setLocation('/ai-policy')} className="text-muted-foreground hover:text-foreground transition-colors">AI Content Policy</button>
          </div>
        </div>
      </main>
    </div>
  );
}
