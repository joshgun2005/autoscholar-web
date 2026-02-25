import { z } from "zod";

export const chatBodySchema = z.object({
  query: z.string().min(1, "Query is required").max(10000),
  history: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional().default([]),
  sessionId: z.string().optional(),
  imageData: z.string().optional(),
  imageMimeType: z.string().optional(),
});

export const shareBodySchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  toolResults: z.unknown().optional(),
  sources: z.unknown().optional(),
  customPythonFigures: z.unknown().optional(),
});

export const registerBodySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
});

export const loginBodySchema = z.object({
  token: z.string().min(1, "Le token est requis"),
});

export const heartbeatBodySchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  status: z.string().optional(),
  currentQuery: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
});
