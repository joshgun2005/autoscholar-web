import { z } from "zod";

export const chatBodySchema = z.object({
  query: z.string().min(1, "Query is required").max(1000000),
  history: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional().default([]),
  sessionId: z.string().optional(),
  imageData: z.string().optional(),
  imageMimeType: z.string().optional(),
  authorProfile: z.object({
    name: z.string(),
    university: z.string(),
    department: z.string(),
    email: z.string(),
  }).optional(),
  uploadedFiles: z.array(z.object({
    originalName: z.string(),
    storedName: z.string(),
    filepath: z.string(),
    size: z.number(),
    ext: z.string(),
  })).optional(),
  restoreFromSessionId: z.string().optional(), // Checkpoint resume: restore figures from this prior session
});

export const shareBodySchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  toolResults: z.unknown().optional(),
  sources: z.unknown().optional(),
  customPythonFigures: z.unknown().optional(),
});

export const heartbeatBodySchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  status: z.string().optional(),
  currentQuery: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
});
