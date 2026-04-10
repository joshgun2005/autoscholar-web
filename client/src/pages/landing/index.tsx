import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { JournalNav } from "@/components/journal/JournalNav";
import { LiveRunTicker } from "@/components/journal/LiveRunTicker";
import { CryptoDonationBanner } from "@/components/crypto-donation-banner";
import type { JournalStats, PublishedPaper, CostStats } from "./constants";
import { HeroSection } from "./HeroSection";
import { StatsSection } from "./StatsSection";
import { PipelineSection } from "./PipelineSection";
import { ComparisonSection } from "./ComparisonSection";
import { GuaranteesSection } from "./GuaranteesSection";
import { LatestPapersSection } from "./LatestPapersSection";
import { OpenScienceSection } from "./OpenScienceSection";
import { CostTransparencySection } from "./CostTransparencySection";
import { CTASection } from "./CTASection";
import { FooterSection } from "./FooterSection";

export default function Landing() {
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<JournalStats>({
    queryKey: ["/api/platform/journal-stats"],
    queryFn: async () => { const r = await fetch("/api/platform/journal-stats"); return r.json(); },
    refetchInterval: 30000,
  });

  const { data: papers = [] } = useQuery<PublishedPaper[]>({
    queryKey: ["/api/journal/papers"],
    queryFn: async () => { const r = await fetch("/api/journal/papers"); return r.json(); },
    refetchInterval: 30000,
  });

  const { data: costStats } = useQuery<CostStats>({
    queryKey: ["/api/platform/cost-stats"],
    queryFn: async () => { const r = await fetch("/api/platform/cost-stats"); return r.json(); },
    refetchInterval: 30000,
  });

  const latestPapers = papers.slice(0, 4);
  const totalWords = papers.reduce((sum, p) => sum + (p.wordCount || 0), 0);
  const totalFigures = papers.reduce((sum, p) => sum + (p.figureCount || 0), 0);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background relative">
      <CryptoDonationBanner />
      <JournalNav />
      <LiveRunTicker />

      <HeroSection onNavigate={setLocation} />
      <StatsSection stats={stats} totalWords={totalWords} totalFigures={totalFigures} />
      <PipelineSection onNavigate={setLocation} />
      <ComparisonSection />
      <GuaranteesSection />
      <LatestPapersSection papers={latestPapers} onNavigate={setLocation} />
      <OpenScienceSection onNavigate={setLocation} />
      <CostTransparencySection costStats={costStats} onNavigate={setLocation} />
      <CTASection onNavigate={setLocation} />
      <FooterSection onNavigate={setLocation} />
    </div>
  );
}
