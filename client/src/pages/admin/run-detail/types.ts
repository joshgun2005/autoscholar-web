// ── Types for AdminRunDetail ────────────────────────────────

export interface PipelineCheckpoint {
  version: number;
  lastCompletedStage: 'none' | 'researching' | 'analyzing' | 'drafting';
  completedTools: Array<{ tool: string; toolId: string; completedAt: number }>;
  sectionsWritten: string[];
  compilationSeen: boolean;
  resumeCount: number;
  lastResumeAt: number | null;
}

export interface CheckpointResponse {
  runId: string;
  status: string;
  checkpoint: PipelineCheckpoint | null;
  sessionId: string | null;
  hasCheckpoint: boolean;
}

export interface PaperRun {
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

export interface ToolResult {
  tool: string;
  result: any;
}

export interface PythonCodeEntry {
  id: string;
  code: string;
  description: string;
  agent?: string;
  timestamp: number;
  status: string;
  error?: string;
  duration?: number;
}

export interface CustomPythonFigure {
  id: string;
  scriptId?: string;
  figures: string[];
  figureUrls?: string[];
  output?: string;
  description?: string;
}

export interface SessionData {
  toolResults: ToolResult[];
  sources: Array<{ url: string; title?: string }>;
  searchQueries: Array<{ query: string; results?: any[] }>;
  pythonCode: string | null;
  customPythonFigures: CustomPythonFigure[];
  pythonCodeEntries: PythonCodeEntry[];
  answerLength: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export interface PeerReview {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  detailedScores: Record<string, number>;
  sectionReviews: Array<{ section: string; score: number; comments: string }>;
  recommendation: string;
  fullReport: string;
  createdAt: string;
}

export interface RunDetail {
  run: PaperRun;
  sessionData: SessionData | null;
  peerReview: PeerReview | null;
  paperTitle: string | null;
  paperAbstract: string | null;
}

export interface AdminRunDetailProps {
  runId: string;
  onBack: () => void;
}
