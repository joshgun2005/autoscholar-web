// ─── Live Paper Room — Data Model ────────────────────────────
// Designed to be easily replaced by a real SSE/WebSocket stream later.
// For now, the simulation hook in useLivePaperSimulation.ts produces this data.

export type PaperStatus =
  | "researching"
  | "writing"
  | "validating"
  | "compiling"
  | "recovery"
  | "completed";

export type SectionStatus =
  | "pending"
  | "writing"
  | "completed"
  | "revising";

export type AgentStatus =
  | "active"
  | "idle"
  | "completed"
  | "queued"
  | "warning";

export type EventSeverity =
  | "info"
  | "success"
  | "warning"
  | "recovered";

// ─── Core types ──────────────────────────────────────────────

export interface PaperSection {
  id: string;
  title: string;
  status: SectionStatus;
  content: string;
  wordCount: number;
  updatedAt: number;         // epoch ms
  recentChanges: string[];   // e.g. "3 new references inserted"
}

export interface PaperFigure {
  id: string;
  title: string;
  caption: string;
  status: "generating" | "completed";
  previewUrl: string | null;  // base64 placeholder or real URL
  sectionId: string;          // which section it belongs to
}

export interface PaperReference {
  id: string;
  authors: string;
  title: string;
  year: number;
  journal: string;
  addedAt: number;
}

export interface LiveAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  currentTask: string | null;
  lastAction: string | null;
  lastActionAt: number | null;
  color: string;             // tailwind color token e.g. "indigo"
  icon: string;              // lucide icon name
  toolCalls: number;
}

export interface LiveEvent {
  id: string;
  timestamp: number;
  type: "research" | "data" | "analysis" | "writing" | "validation" | "compilation" | "system";
  title: string;
  message: string;
  agentId: string | null;
  severity: EventSeverity;
}

export interface LivePaperState {
  id: string;
  title: string;
  subtitle: string;
  status: PaperStatus;
  progress: number;           // 0-100
  startedAt: number;
  elapsedSeconds: number;
  activeAgentId: string | null;
  sections: PaperSection[];
  figures: PaperFigure[];
  references: PaperReference[];
  agents: LiveAgent[];
  events: LiveEvent[];
  totalToolCalls: number;
  totalTokens: number;
}
