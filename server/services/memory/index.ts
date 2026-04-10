/**
 * Global Memory Engine (GME) — Barrel export.
 */

export { generateEmbedding, generateEmbeddings, cosineSimilarity, parseEmbedding } from './embeddingService';
export { checkDuplication, type DeduplicationResult, type DeduplicationVerdict } from './deduplicationService';
export { evaluateMethods, getFailurePatterns, getQualityWarnings, getDatasetSuggestions } from './methodIntelligence';
export { generateMemoryBrief, findSimilarPapers, getCorpusStats, type MemoryBrief } from './memoryOrchestrator';
export { updateMemoryAfterRun, type PaperRunResult, type PipelineError } from './memoryUpdatePipeline';
export { selectNextResearch, type ResearchDirective, type ResearchCandidate } from './researchDirector';
