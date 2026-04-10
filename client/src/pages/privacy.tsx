import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Shield, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Privacy() {
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
            <Shield className="w-3.5 h-3.5" />
            Legal
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: March 13, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-base prose-h3:mt-6 prose-p:text-[15px] prose-p:leading-relaxed prose-li:text-[15px]">

          <h2>1. Introduction</h2>
          <p>
            Welcome to AutoScholar.ai ("we", "our", or "us"). We are committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information
            when you use our AI-powered autonomous research platform at <strong>autoscholar.ai</strong>.
          </p>
          <p>
            By accessing or using the Service, you agree to the collection and use of information in accordance
            with this policy. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
          </p>

          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information</strong>: Display name, hashed password, and recovery token when you create an account.</li>
            <li><strong>Research Queries</strong>: Questions, prompts, and analyses you submit to the platform.</li>
            <li><strong>Conversation History</strong>: Your research sessions, generated papers, and their associated results.</li>
            <li><strong>Shared Content</strong>: Reports and analyses you choose to share publicly via unique links.</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Technical Data</strong>: IP address, browser type and version, operating system, and device information.</li>
            <li><strong>Session Cookies</strong>: Essential cookies to maintain your authenticated session (maximum 30 days).</li>
            <li><strong>Usage Analytics</strong>: API token consumption, response times, tool calls, and Python code execution metrics for platform monitoring.</li>
            <li><strong>Log Data</strong>: Server logs including request timestamps, endpoints accessed, and error information.</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li><strong>Service Delivery</strong>: To provide, operate, and maintain the AutoScholar research platform.</li>
            <li><strong>Personalization</strong>: To save your conversation history and provide continuity across research sessions.</li>
            <li><strong>AI Processing</strong>: To transmit your research queries to Claude AI (Anthropic) for analysis generation.</li>
            <li><strong>Paper Generation</strong>: To compile your research into publication-grade LaTeX PDF papers.</li>
            <li><strong>Platform Improvement</strong>: To analyze usage patterns and improve service quality and performance.</li>
            <li><strong>Security</strong>: To detect, prevent, and address technical issues, abuse, and unauthorized access.</li>
          </ul>

          <h2>4. Data Sharing and Third-Party Services</h2>

          <h3>4.1 AI and Data Providers</h3>
          <p>
            Your research queries and associated data may be transmitted to the following third-party services
            for processing. Each service has its own privacy policy which we encourage you to review:
          </p>
          <ul>
            <li><strong>Anthropic (Claude AI)</strong> — Natural language processing and research analysis generation.</li>
            <li><strong>Financial Modeling Prep</strong> — Real-time and historical financial market data.</li>
            <li><strong>Firecrawl</strong> — Web content extraction and document parsing.</li>
            <li><strong>Tavily</strong> — Intelligent web search and research aggregation.</li>
            <li><strong>Exa</strong> — Semantic search across the web.</li>
            <li><strong>SerpAPI</strong> — Google Search, Google Scholar, and related search services.</li>
            <li><strong>World Bank, IMF, OECD</strong> — Macroeconomic indicator data.</li>
            <li><strong>OpenAlex, arXiv, CrossRef</strong> — Academic literature search and metadata.</li>
          </ul>

          <h3>4.2 Shared Reports and Published Papers</h3>
          <p>
            When you use the "Share" feature, your analysis becomes publicly accessible via a unique URL.
            Papers published to the AutoScholar Journal are publicly listed and downloadable.
            Only share content you are comfortable making public.
          </p>

          <h3>4.3 We Do Not Sell Your Data</h3>
          <p>
            We do not sell, rent, or trade your personal information to third parties for marketing purposes.
            We do not serve advertisements.
          </p>

          <h2>5. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your data:</p>
          <ul>
            <li><strong>Encryption</strong>: Passwords are hashed using bcrypt. All connections use HTTPS/TLS in production.</li>
            <li><strong>Secure Cookies</strong>: Session cookies are httpOnly, secure, and SameSite-protected.</li>
            <li><strong>API Key Protection</strong>: All API keys and secrets are stored as server-side environment variables, never exposed to the client.</li>
            <li><strong>Input Validation</strong>: All user inputs are validated and sanitized to prevent injection attacks.</li>
            <li><strong>Sandboxed Execution</strong>: Custom Python code runs in a time-limited, restricted environment.</li>
          </ul>

          <h2>6. Data Retention</h2>
          <ul>
            <li><strong>Conversation Sessions</strong>: Retained indefinitely until you delete them or your account.</li>
            <li><strong>Published Papers</strong>: Retained indefinitely as part of the public AutoScholar Journal.</li>
            <li><strong>Session Cookies</strong>: Expire after 30 days of inactivity.</li>
            <li><strong>Shared Reports</strong>: Retained indefinitely unless manually removed.</li>
            <li><strong>Server Logs</strong>: Retained for up to 90 days for security and debugging purposes.</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access</strong> — Request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification</strong> — Request correction of inaccurate or incomplete data.</li>
            <li><strong>Erasure</strong> — Request deletion of your account and associated data.</li>
            <li><strong>Export</strong> — Download your conversation history and generated papers.</li>
            <li><strong>Objection</strong> — Object to certain types of data processing.</li>
            <li><strong>Restriction</strong> — Request that we limit the processing of your data.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{" "}
            <a href="mailto:contact@autoscholar.ai" className="text-primary hover:underline font-medium">
              contact@autoscholar.ai
            </a>.
            We will respond within 30 days.
          </p>

          <h2>8. Cookies</h2>
          <p>
            We use only <strong>strictly essential cookies</strong> required for session management and authentication.
            We do not use tracking cookies, advertising cookies, or any third-party analytics cookies.
            No cookie consent banner is required as we only use essential cookies.
          </p>

          <h2>9. Children's Privacy</h2>
          <p>
            The Service is not directed to individuals under the age of 16. We do not knowingly collect personal
            information from children. If we become aware that we have collected data from a child without parental
            consent, we will take steps to delete that information.
          </p>

          <h2>10. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence,
            including the United States, where our third-party service providers operate. We ensure appropriate
            safeguards are in place for such transfers in compliance with applicable data protection laws.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by
            updating the "Last updated" date at the top of this page. Your continued use of the Service after
            any modifications constitutes acceptance of the updated policy.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact us at:
          </p>
          <div className="not-prose flex items-center gap-3 p-4 rounded-xl bg-card border border-border/60 mt-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AutoScholar.ai — Privacy Inquiries</p>
              <a href="mailto:contact@autoscholar.ai" className="text-sm text-primary hover:underline font-medium">
                contact@autoscholar.ai
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border/60 text-center">
          <p className="text-xs text-muted-foreground/50">
            AutoScholar.ai — Autonomous Academic Research Platform
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <button onClick={() => setLocation('/privacy')} className="text-primary font-medium">Privacy Policy</button>
            <span className="text-muted-foreground/30">|</span>
            <button onClick={() => setLocation('/terms')} className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</button>
            <span className="text-muted-foreground/30">|</span>
            <button onClick={() => setLocation('/ai-policy')} className="text-muted-foreground hover:text-foreground transition-colors">AI Content Policy</button>
          </div>
        </div>
      </main>
    </div>
  );
}
