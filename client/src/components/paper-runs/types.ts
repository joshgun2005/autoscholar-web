export type PhaseState = "queued" | "active" | "complete" | "failed";

export interface RunPhase {
  key: string;
  label: string;
  agent: string;
  state: PhaseState;
  sectionsWritten?: string[];
}

export interface RunEvent {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "artifact" | "phase";
  title: string;
  description?: string;
  agent?: string;
}

export interface RunArtifactCounts {
  papersReviewed: number;
  datasetsRetained: number;
  modelsRun: number;
  tablesGenerated: number;
  figuresGenerated: number;
  referencesCompiled: number;
  sectionsWritten: number;
  compilationDone: boolean;
}

export interface RunNarrative {
  justFinished?: string;
  happeningNow?: string;
  comingNext?: string;
}

export interface PaperRunSummary {
  id: string;
  status: string;
  domain: string | null;
  method: string | null;
  prompt: string | null;
  sessionId: string | null;
  paperId: string | null;
  popperScore: number | null;
  popperRecommendation: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface PaperRunDetail {
  run: PaperRunSummary;
  phases: RunPhase[];
  events: RunEvent[];
  narrative: RunNarrative;
  artifactCounts: RunArtifactCounts;
  sessionData: { inputTokens: number; outputTokens: number; totalCost: number } | null;
  paperTitle: string | null;
  paperAbstract: string | null;
  paperAsid: string | null;
  peerReview: { overallScore: number; summary: string; recommendation: string } | null;
  elapsed: number;
}
