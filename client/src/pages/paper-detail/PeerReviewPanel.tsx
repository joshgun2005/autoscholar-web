import {
  ClipboardCheck, Star, AlertTriangle, CheckCircle2, Loader2, RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UseMutationResult } from "@tanstack/react-query";
import type { PublishedPaper, PeerReviewData, DetailedScores, SectionReviewItem } from "./types";
import { getScoreColor, getScoreBg, getRecommendationInfo } from "./helpers";

interface PeerReviewPanelProps {
  paper: PublishedPaper;
  peerReview: PeerReviewData | undefined;
  showReview: boolean;
  setShowReview: (show: boolean) => void;
  reviewMutation: UseMutationResult<unknown, Error, void, unknown>;
  onNavigate: (path: string) => void;
}

export default function PeerReviewPanel({
  paper,
  peerReview,
  showReview,
  setShowReview,
  reviewMutation,
  onNavigate,
}: PeerReviewPanelProps) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/60">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck className="w-5 h-5 text-primary" />
          </div>
          AI Peer Review
        </h2>
        {!peerReview && (
          <Button
            onClick={() => reviewMutation.mutate()}
            disabled={reviewMutation.isPending}
            className="rounded-xl gap-2"
            size="sm"
          >
            {reviewMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-4 h-4" />
                Generate Peer Review
              </>
            )}
          </Button>
        )}
        {peerReview && !showReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReview(true)}
            className="rounded-xl gap-2"
          >
            <Star className="w-4 h-4" />
            Show Review ({peerReview.overallScore}/100)
          </Button>
        )}
        {peerReview && showReview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReview(false)}
            className="rounded-xl"
          >
            Hide
          </Button>
        )}
      </div>

      {reviewMutation.isError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 mb-4">
          {reviewMutation.error?.message || 'Failed to generate peer review'}
        </div>
      )}

      {reviewMutation.isPending && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Conducting peer review with Claude Opus...</p>
          <p className="text-xs text-muted-foreground/50 mt-1">This may take 30-60 seconds</p>
        </div>
      )}

      {peerReview && showReview && (() => {
        let detailedScores: DetailedScores = { originality: 0, methodology: 0, results: 0, writing: 0, references: 0, reproducibility: 0 };
        let sectionReviews: SectionReviewItem[] = [];
        let strengths: string[] = [];
        let weaknesses: string[] = [];
        try { detailedScores = JSON.parse(peerReview.detailedScores); } catch {}
        try { sectionReviews = JSON.parse(peerReview.sectionReviews); } catch {}
        try { strengths = JSON.parse(peerReview.strengths); } catch {}
        try { weaknesses = JSON.parse(peerReview.weaknesses); } catch {}
        const rec = getRecommendationInfo(peerReview.recommendation);

        return (
          <div className="space-y-6">
            {/* Score + Recommendation */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className={`flex-1 p-5 rounded-xl border ${getScoreBg(peerReview.overallScore)} text-center`}>
                <div className={`text-4xl font-bold ${getScoreColor(peerReview.overallScore)}`}>
                  {peerReview.overallScore}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Overall Score / 100</div>
              </div>
              <div className={`flex-1 p-5 rounded-xl border ${rec.color} text-center flex flex-col items-center justify-center`}>
                <div className="text-lg font-bold">{rec.label}</div>
                <div className="text-xs opacity-70 mt-1">Recommendation</div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Executive Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{peerReview.summary}</p>
            </div>

            {/* Detailed Scores */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Detailed Scores</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(detailedScores).map(([key, score]) => (
                  <div key={key} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground capitalize">{key}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-green-500' : score >= 65 ? 'bg-blue-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h3>
                <ul className="space-y-1.5">
                  {strengths.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Weaknesses
                </h3>
                <ul className="space-y-1.5">
                  {weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">-</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Section Reviews */}
            {sectionReviews.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Section-by-Section Review</h3>
                <div className="space-y-3">
                  {sectionReviews.map((sr, i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{sr.section}</span>
                        <span className={`text-sm font-bold ${getScoreColor(sr.score)}`}>{sr.score}/100</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{sr.comments}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Report (collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-primary hover:text-primary/80 transition-colors list-none flex items-center gap-2">
                <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                Full Peer Review Report
              </summary>
              <div className="mt-4 p-5 rounded-xl bg-muted/20 border border-border/40 prose prose-sm max-w-none text-muted-foreground">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{peerReview.fullReport}</div>
              </div>
            </details>

            {/* Revise Paper Button */}
            {paper.sessionId && (
              <div className="flex justify-center pt-4 border-t border-border/30 mt-4">
                <Button
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={() => {
                    const revisionPrompt = [
                      `Based on the peer review of the paper "${paper.title}", please revise and regenerate the paper addressing the following reviewer feedback:\n`,
                      `**Overall Score: ${peerReview.overallScore}/100 — Recommendation: ${getRecommendationInfo(peerReview.recommendation).label}**\n`,
                      `**Weaknesses to address:**`,
                      ...weaknesses.map((w, i) => `${i + 1}. ${w}`),
                      `\n**Section-specific feedback:**`,
                      ...sectionReviews.map(sr => `- **${sr.section}** (${sr.score}/100): ${sr.comments}`),
                      `\nPlease regenerate the full paper with all sections, incorporating these revisions. Maintain the same research topic and data but improve the methodology, results presentation, and writing quality as suggested.`,
                    ].join('\n');

                    try {
                      sessionStorage.setItem('autoscholar-revision-session', paper.sessionId!);
                      sessionStorage.setItem('autoscholar-pending-prompt', revisionPrompt);
                    } catch { /* noop */ }
                    onNavigate('/');
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Revise Paper Based on Review
                </Button>
              </div>
            )}
            {!paper.sessionId && (
              <div className="flex justify-center pt-4 border-t border-border/30 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => {
                    const revisionPrompt = [
                      `Based on the peer review of the paper "${paper.title}", please revise and regenerate the paper addressing the following reviewer feedback:\n`,
                      `**Overall Score: ${peerReview.overallScore}/100 — Recommendation: ${getRecommendationInfo(peerReview.recommendation).label}**\n`,
                      `**Weaknesses to address:**`,
                      ...weaknesses.map((w, i) => `${i + 1}. ${w}`),
                      `\n**Section-specific feedback:**`,
                      ...sectionReviews.map(sr => `- **${sr.section}** (${sr.score}/100): ${sr.comments}`),
                      `\nPlease regenerate the full paper with all sections, incorporating these revisions.`,
                    ].join('\n');

                    try {
                      sessionStorage.setItem(
                        'autoscholar_continue_from_share',
                        JSON.stringify({
                          question: `Generate a research paper: ${paper.title}`,
                          answer: paper.abstract || paper.title,
                        })
                      );
                      sessionStorage.setItem('autoscholar-pending-prompt', revisionPrompt);
                    } catch { /* noop */ }
                    onNavigate('/');
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Revise Paper (new conversation)
                </Button>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground/30 text-center pt-2">
              Reviewed on {new Date(peerReview.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} by Claude Opus — AI Peer Review
            </div>
          </div>
        );
      })()}

      {!peerReview && !reviewMutation.isPending && !reviewMutation.isError && (
        <p className="text-sm text-muted-foreground/50 text-center py-4">
          No peer review yet. Click "Generate Peer Review" to have Claude evaluate this paper.
        </p>
      )}
    </div>
  );
}
