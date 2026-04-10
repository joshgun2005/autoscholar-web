import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { getCryptoDonations, WALLETS } from "../services/cryptoDonationService";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.isAdmin === true) {
    return next();
  }
  res.status(403).json({ error: "Admin access required" });
}

export function registerAdminRoutes(app: Express) {

  // ─── Admin Login (password only) ─────────────────────
  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { password } = req.body;
    if (password === (process.env.ADMIN_PASSWORD || "admin123")) {
      (req.session as any).userId = "admin";
      (req.session as any).isAdmin = true;
      return req.session.save(() => {
        res.json({ success: true });
      });
    }
    res.status(401).json({ error: "Invalid password" });
  });

  // ─── Legacy Database / Users / Sessions / Reports ────

  app.get("/api/admin/database", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const sessions = await storage.getAllConversationSessions();
      const sharedReports = await storage.getAllSharedReports();

      const totalInputTokens = sessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0);
      const totalOutputTokens = sessions.reduce((sum, s) => sum + (s.outputTokens || 0), 0);
      const totalCost = sessions.reduce((sum, s) => sum + (s.totalCost || 0), 0);

      const userMetrics = users.map(u => {
        const userSessions = sessions.filter(s => s.userId === u.id);
        const inputTokens = userSessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0);
        const outputTokens = userSessions.reduce((sum, s) => sum + (s.outputTokens || 0), 0);
        const cost = userSessions.reduce((sum, s) => sum + (s.totalCost || 0), 0);
        return { userId: u.id, displayName: u.displayName, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, cost, sessionCount: userSessions.length };
      });

      res.json({
        users: users.map(u => ({ id: u.id, displayName: u.displayName, createdAt: u.createdAt })),
        sessions: sessions.map(s => ({ id: s.id, sessionId: s.sessionId, userId: s.userId, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt, inputTokens: s.inputTokens || 0, outputTokens: s.outputTokens || 0, totalCost: s.totalCost || 0 })),
        sharedReports: sharedReports.map(r => ({ id: r.id, shareId: r.shareId, question: r.question.substring(0, 100), createdAt: r.createdAt })),
        metrics: { totalInputTokens, totalOutputTokens, totalTokens: totalInputTokens + totalOutputTokens, totalCost, totalSessions: sessions.length, averageCostPerSession: sessions.length > 0 ? totalCost / sessions.length : 0, userMetrics },
      });
    } catch (error) {
      logger.error("Get database error:", error);
      res.status(500).json({ error: "Failed to get database data" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try { await storage.deleteUser(req.params.id); res.json({ success: true }); }
    catch (error) { logger.error("Delete user error:", error); res.status(500).json({ error: "Failed to delete user" }); }
  });

  app.delete("/api/admin/sessions/:id", requireAdmin, async (req: Request, res: Response) => {
    try { await storage.deleteConversationSessionById(req.params.id); res.json({ success: true }); }
    catch (error) { logger.error("Delete session error:", error); res.status(500).json({ error: "Failed to delete session" }); }
  });

  app.delete("/api/admin/reports/:id", requireAdmin, async (req: Request, res: Response) => {
    try { await storage.deleteSharedReport(req.params.id); res.json({ success: true }); }
    catch (error) { logger.error("Delete report error:", error); res.status(500).json({ error: "Failed to delete report" }); }
  });

  // ─── Journal Paper Management ─────────────────────────

  app.get("/api/admin/papers", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getAllPublishedPapers();
      const reviews = await Promise.all(papers.map(p => storage.getPeerReviewByPaperId(p.id).catch(() => undefined)));
      const lightweight = papers.map(({ latexContent, bibtexEntries, ...rest }, i) => ({
        ...rest,
        reviewScore: reviews[i]?.overallScore ?? null,
        recommendation: reviews[i]?.recommendation ?? null,
      }));
      res.json(lightweight);
    } catch (error) {
      logger.error("Get admin papers error:", error);
      res.status(500).json({ error: "Failed to get papers" });
    }
  });

  app.patch("/api/admin/papers/:id/visibility", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { showInJournal } = req.body;
      if (typeof showInJournal !== "boolean" && typeof showInJournal !== "number") {
        return res.status(400).json({ error: "showInJournal must be a boolean" });
      }
      await storage.updatePaperVisibility(req.params.id, showInJournal ? 1 : 0);
      res.json({ success: true });
    } catch (error) {
      logger.error("Update paper visibility error:", error);
      res.status(500).json({ error: "Failed to update paper visibility" });
    }
  });

  app.delete("/api/admin/papers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePublishedPaper(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Paper not found" });
      res.json({ success: true });
    } catch (error) {
      logger.error("Delete paper error:", error);
      res.status(500).json({ error: "Failed to delete paper" });
    }
  });

  // ─── Pipeline Runs ────────────────────────────────────

  app.get("/api/admin/runs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const runs = await storage.getAllPaperRuns(limit);
      res.json(runs);
    } catch (error) {
      logger.error("Get runs error:", error);
      res.status(500).json({ error: "Failed to get runs" });
    }
  });

  // ─── Run Detail (run + session tool results + peer review + governor decisions) ──
  app.get("/api/admin/runs/:id/detail", requireAdmin, async (req: Request, res: Response) => {
    try {
      const run = await storage.getPaperRunById(req.params.id);
      if (!run) return res.status(404).json({ error: "Run not found" });

      // ── Aggregate session data across original + resume sessions ──
      let sessionData: any = null;
      if (run.sessionId) {
        // Collect all sessions: original + any resume sessions
        const sessionsToMerge: any[] = [];
        const originalSession = await storage.getConversationSession(run.sessionId);
        if (originalSession) sessionsToMerge.push(originalSession);

        // Find resume sessions (sessionId-resume-*)
        try {
          const allSessions = await storage.getAllConversationSessions();
          const resumeSessions = allSessions
            .filter(s => s.sessionId.startsWith(run.sessionId + '-resume-'))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          sessionsToMerge.push(...resumeSessions);
        } catch { /* best effort */ }

        // Merge all messages from all sessions, taking the LAST (most complete) message from each
        const allToolResults: any[] = [];
        const allSources: any[] = [];
        const allSearchQueries: any[] = [];
        const allCustomPythonFigures: any[] = [];
        const allPythonCodeEntries: any[] = [];
        let longestAnswer = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCost = 0;
        let latestPythonCode: string | null = null;

        for (const session of sessionsToMerge) {
          totalInputTokens += session.inputTokens || 0;
          totalOutputTokens += session.outputTokens || 0;
          totalCost += session.totalCost || 0;

          if (!session.messages) continue;
          try {
            const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
            if (!Array.isArray(msgs) || msgs.length === 0) continue;

            // Use the LAST message (most complete) — intermediate saves create partial msgs[0]
            const msg = msgs[msgs.length - 1];
            if (!msg) continue;

            if (msg.toolResults?.length) allToolResults.push(...msg.toolResults);
            if (msg.sources?.length) allSources.push(...msg.sources);
            if (msg.searchQueries?.length) allSearchQueries.push(...msg.searchQueries);
            if (msg.customPythonFigures?.length) allCustomPythonFigures.push(...msg.customPythonFigures);
            if (msg.pythonCodeEntries?.length) allPythonCodeEntries.push(...msg.pythonCodeEntries);
            if (msg.answer?.length > longestAnswer) longestAnswer = msg.answer.length;
            if (msg.pythonCode) latestPythonCode = msg.pythonCode;
          } catch { /* malformed JSON */ }
        }

        if (sessionsToMerge.length > 0) {
          sessionData = {
            toolResults: allToolResults,
            sources: allSources,
            searchQueries: allSearchQueries,
            pythonCode: latestPythonCode,
            customPythonFigures: allCustomPythonFigures,
            pythonCodeEntries: allPythonCodeEntries,
            answerLength: longestAnswer,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalCost,
          };
        }
      }

      // ── Fetch peer review if paperId exists ──
      let peerReview: any = null;
      if (run.paperId) {
        try {
          const review = await storage.getPeerReviewByPaperId(run.paperId);
          if (review) {
            peerReview = {
              overallScore: review.overallScore,
              summary: review.summary,
              strengths: typeof review.strengths === 'string' ? JSON.parse(review.strengths) : review.strengths,
              weaknesses: typeof review.weaknesses === 'string' ? JSON.parse(review.weaknesses) : review.weaknesses,
              detailedScores: typeof review.detailedScores === 'string' ? JSON.parse(review.detailedScores) : review.detailedScores,
              sectionReviews: typeof review.sectionReviews === 'string' ? JSON.parse(review.sectionReviews) : review.sectionReviews,
              recommendation: review.recommendation,
              fullReport: review.fullReport,
              createdAt: review.createdAt,
            };
          }
        } catch { /* no review */ }
      }

      // ── Fetch paper title + abstract if paperId exists ──
      let paperTitle: string | null = null;
      let paperAbstract: string | null = null;
      if (run.paperId) {
        try {
          const paper = await storage.getPublishedPaperById(run.paperId);
          if (paper) {
            paperTitle = paper.title;
            paperAbstract = paper.abstract || null;
          }
        } catch { /* noop */ }
      }

      res.json({ run, sessionData, peerReview, paperTitle, paperAbstract });
    } catch (error) {
      logger.error("Get run detail error:", error);
      res.status(500).json({ error: "Failed to get run detail" });
    }
  });

  app.delete("/api/admin/runs/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deletePaperRun(req.params.id);
      res.json({ success: true });
    } catch (error) {
      logger.error("Delete run error:", error);
      res.status(500).json({ error: "Failed to delete run" });
    }
  });

  app.get("/api/admin/runs/stats", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getPaperRunStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get run stats" });
    }
  });

  app.post("/api/admin/runs/trigger", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { triggerManualRun, getSchedulerConfig } = await import('../services/autoPaperScheduler');
      const config = getSchedulerConfig();
      if (config.isGenerating) {
        return res.json({ triggered: false, reason: "A run is already in progress" });
      }
      triggerManualRun();
      res.json({ triggered: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger run" });
    }
  });

  // ─── Custom Prompt Paper Generation ─────────────────────
  app.post("/api/admin/runs/trigger-custom", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { prompt, domain, method, researchType } = req.body;
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 50) {
        return res.status(400).json({ error: "Prompt must be at least 50 characters long" });
      }
      if (prompt.trim().length > 10000) {
        return res.status(400).json({ error: "Prompt must be at most 10,000 characters" });
      }
      if (researchType && !['A', 'B', 'C', 'D', 'E', 'F'].includes(researchType)) {
        return res.status(400).json({ error: "Invalid research type. Must be A, B, C, D, E, or F." });
      }
      const { triggerCustomPromptRun } = await import('../services/autoPaperScheduler');
      const result = await triggerCustomPromptRun({
        prompt: prompt.trim(),
        domain: domain?.trim() || undefined,
        method: method?.trim() || undefined,
        researchType: researchType || undefined,
      });
      res.json({ triggered: true, runId: result.runId, sessionId: result.sessionId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to trigger custom run";
      res.status(500).json({ error: message });
    }
  });

  // ─── Scheduler Config ─────────────────────────────────

  app.get("/api/admin/scheduler/config", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { getSchedulerConfig } = await import('../services/autoPaperScheduler');
      res.json(getSchedulerConfig());
    } catch (error) {
      res.status(500).json({ error: "Scheduler not available" });
    }
  });

  app.patch("/api/admin/scheduler/config", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { updateSchedulerConfig, getSchedulerConfig } = await import('../services/autoPaperScheduler');
      updateSchedulerConfig(req.body);
      res.json(getSchedulerConfig());
    } catch (error) {
      res.status(500).json({ error: "Failed to update scheduler config" });
    }
  });

  app.post("/api/admin/scheduler/cleanup", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { forceCleanupStaleRuns } = await import('../services/autoPaperScheduler');
      const cleaned = await forceCleanupStaleRuns();
      res.json({ cleaned, message: `Marked ${cleaned} stale run(s) as failed` });
    } catch (error) {
      res.status(500).json({ error: "Cleanup failed" });
    }
  });

  // Stop/abort an in-flight run
  app.post("/api/admin/runs/:runId/stop", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { abortRun } = await import('../services/autoPaperScheduler');
      const aborted = abortRun(req.params.runId);
      if (aborted) {
        await storage.updatePaperRunStatus(req.params.runId, 'failed', {
          errorMessage: 'Aborted by admin',
          completedAt: new Date(),
        });
        res.json({ success: true, message: 'Run aborted' });
      } else {
        // Run not in abort registry — might already be done or not started
        const run = await storage.getPaperRunById(req.params.runId);
        if (run && ['queued', 'researching', 'analyzing', 'drafting', 'validating'].includes(run.status)) {
          await storage.updatePaperRunStatus(req.params.runId, 'failed', {
            errorMessage: 'Force-stopped by admin',
            completedAt: new Date(),
          });
          res.json({ success: true, message: 'Run marked as failed (pipeline may have already ended)' });
        } else {
          res.status(404).json({ error: 'No active run found with this ID' });
        }
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to stop run" });
    }
  });

  // Resume a failed/timed-out run from its last checkpoint
  app.post("/api/admin/runs/:runId/resume", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { resumePaperRun } = await import('../services/autoPaperScheduler');
      const result = await resumePaperRun(req.params.runId);
      if (result.resumed) {
        res.json({ success: true, message: result.reason || 'Run resumed from checkpoint' });
      } else {
        res.status(400).json({ success: false, error: result.reason });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to resume run" });
    }
  });

  // Get checkpoint state for a specific run
  app.get("/api/admin/runs/:runId/checkpoint", requireAdmin, async (req: Request, res: Response) => {
    try {
      const run = await storage.getPaperRunById(req.params.runId);
      if (!run) return res.status(404).json({ error: "Run not found" });
      let checkpoint = null;
      if (run.governorState) {
        try { checkpoint = JSON.parse(run.governorState); } catch { /* invalid */ }
      }
      res.json({
        runId: run.id,
        status: run.status,
        checkpoint,
        sessionId: run.sessionId,
        hasCheckpoint: !!checkpoint && checkpoint.lastCompletedStage !== 'none',
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get checkpoint" });
    }
  });

  app.get("/api/admin/scheduler/prompts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { PROMPT_BANK } = await import('../services/promptBank');
      const { getSchedulerConfig } = await import('../services/autoPaperScheduler');
      const cursor = getSchedulerConfig().promptCursor;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const slice = PROMPT_BANK.slice(offset, offset + limit);
      res.json({ total: PROMPT_BANK.length, cursor, offset, limit, prompts: slice });
    } catch (error) {
      res.status(500).json({ error: "Prompt bank not available" });
    }
  });

  // ─── Prompts (system templates) ───────────────────────

  app.get("/api/admin/prompts", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const all = await storage.getAllSavedPrompts();
      const templates = all.filter(p => p.userId === '__system__');
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to get prompts" });
    }
  });

  app.post("/api/admin/prompts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) return res.status(400).json({ error: "title and content required" });
      const prompt = await storage.createSavedPrompt({ userId: '__system__', authorName: 'System', title, content });
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });

  // ─── Popper Validator Config ──────────────────────────

  app.get("/api/admin/validators/popper", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { getSchedulerConfig } = await import('../services/autoPaperScheduler');
      const config = getSchedulerConfig();
      res.json({
        threshold: config.popperThreshold,
        popperEnabled: config.popperEnabled,
        model: 'claude-opus-4-6',
        dimensions: ['originality', 'methodology', 'results', 'writing', 'references', 'reproducibility'],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get validator config" });
    }
  });

  app.patch("/api/admin/validators/popper", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { updateSchedulerConfig, getSchedulerConfig } = await import('../services/autoPaperScheduler');
      if (req.body.threshold !== undefined) {
        updateSchedulerConfig({ popperThreshold: req.body.threshold });
      }
      if (req.body.popperEnabled !== undefined) {
        updateSchedulerConfig({ popperEnabled: !!req.body.popperEnabled });
      }
      const config = getSchedulerConfig();
      res.json({ threshold: config.popperThreshold, popperEnabled: config.popperEnabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to update validator config" });
    }
  });

  // ─── Admin: Total Cost Config ──────────────────────────

  app.get("/api/admin/cost-config", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const totalCost = await storage.getSiteConfig("total_paper_cost");
      res.json({ totalCost: totalCost ? parseFloat(totalCost) : 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to load cost config" });
    }
  });

  app.post("/api/admin/cost-config", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { totalCost } = req.body;
      if (typeof totalCost !== 'number' || totalCost < 0) {
        return res.status(400).json({ error: "totalCost must be a non-negative number" });
      }
      await storage.setSiteConfig("total_paper_cost", String(totalCost));
      res.json({ success: true, totalCost });
    } catch (error) {
      res.status(500).json({ error: "Failed to update cost config" });
    }
  });

  // ─── Admin: Donations ─────────────────────────────────

  app.get("/api/admin/donations", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allDonations = await storage.getAllDonations();
      res.json(allDonations);
    } catch (error) {
      res.status(500).json({ error: "Failed to load donations" });
    }
  });

  app.patch("/api/admin/donations/:id/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!['pending', 'contacted', 'completed'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await storage.updateDonationStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update donation status" });
    }
  });

  // ─── Public Platform Endpoints (no auth) ──────────────

  // Public: crypto donation pledge submission (no auth required)
  app.post("/api/platform/donations", async (req: Request, res: Response) => {
    try {
      const { name, amount, currency, message, txHash, showOnWall } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: "Name is required (min 2 characters)" });
      }
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }
      if (!['BTC', 'ETH', 'USDC', 'USD'].includes(currency)) {
        return res.status(400).json({ error: "Currency must be BTC, ETH, USDC, or USD" });
      }
      const donation = await storage.createDonation({
        name: name.trim(),
        email: null,
        amount,
        currency,
        message: message?.trim() || null,
        txHash: txHash?.trim() || null,
        status: 'pending',
        showOnWall: showOnWall !== false ? 1 : 0,
      });
      res.json({ success: true, id: donation.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit donation" });
    }
  });

  // Public: donor wall — returns confirmed donations that opted-in to the wall
  app.get("/api/platform/donor-wall", async (_req: Request, res: Response) => {
    try {
      const allDonations = await storage.getAllDonations();
      const wallDonors = allDonations
        .filter((d: any) => d.showOnWall === 1 || d.showOnWall === true)
        .map((d: any) => ({
          id: d.id,
          name: d.name,
          amount: d.amount,
          currency: d.currency || 'BTC',
          message: d.message,
          createdAt: d.createdAt,
        }));
      res.json(wallDonors);
    } catch (error) {
      res.json([]);
    }
  });

  // Public: cost stats for landing/donation page — auto-calculated from session tokens
  app.get("/api/platform/cost-stats", async (_req: Request, res: Response) => {
    try {
      const costs = await storage.getJournalPaperCosts();
      const papers = await storage.getJournalPapers();
      const totalCost = costs.reduce((sum, c) => sum + c.totalCost, 0);
      const totalInput = costs.reduce((sum, c) => sum + c.inputTokens, 0);
      const totalOutput = costs.reduce((sum, c) => sum + c.outputTokens, 0);
      const count = papers.length;
      res.json({
        totalCost: Math.round(totalCost * 100) / 100,
        publishedPapers: count,
        costPerPaper: count > 0 ? Math.round((totalCost / count) * 100) / 100 : 0,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
      });
    } catch (error) {
      res.json({ totalCost: 0, publishedPapers: 0, costPerPaper: 0, totalInputTokens: 0, totalOutputTokens: 0 });
    }
  });

  // Public: crypto donation wallet balances (monitored on-chain) + fiat donations from DB
  app.get("/api/platform/crypto-donations", async (_req: Request, res: Response) => {
    try {
      const balances = await getCryptoDonations();
      // Sum fiat (USD) donations from DB
      const allDonations = await storage.getAllDonations();
      const fiatTotal = allDonations
        .filter((d: any) => (d.currency === 'USD' || !d.currency))
        .reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
      res.json({
        ...balances,
        fiatUsd: Math.round(fiatTotal * 100) / 100,
        totalUsd: Math.round((balances.totalUsd + fiatTotal) * 100) / 100,
        wallets: WALLETS,
      });
    } catch (error) {
      res.json({ btc: 0, eth: 0, usdc: 0, btcUsd: 0, ethUsd: 0, usdcUsd: 0, fiatUsd: 0, totalUsd: 0, wallets: WALLETS, lastUpdated: null });
    }
  });

  app.get("/api/platform/active-run", async (_req: Request, res: Response) => {
    try {
      const run = await storage.getActivePaperRun();
      if (!run) return res.json(null);
      res.json({
        id: run.id,
        status: run.status,
        domain: run.domain,
        method: run.method,
        startedAt: run.startedAt,
        createdAt: run.createdAt,
      });
    } catch (error) {
      res.json(null);
    }
  });

  app.get("/api/platform/journal-stats", async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getJournalPapers();
      const runStats = await storage.getPaperRunStats();
      const reviews = await storage.getAllPeerReviews();
      const avgScore = reviews.length > 0
        ? Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length)
        : 0;
      res.json({
        totalPapers: papers.length,
        totalRuns: runStats.total,
        publishedRuns: runStats.published,
        rejectedRuns: runStats.rejected,
        avgPeerReviewScore: avgScore,
        uniqueDomains: new Set(papers.map(p => p.domain).filter(Boolean)).size,
        acceptanceRate: runStats.total > 0 ? Math.round((runStats.published / runStats.total) * 100) : 0,
      });
    } catch (error) {
      res.json({ totalPapers: 0, totalRuns: 0, publishedRuns: 0, rejectedRuns: 0, avgPeerReviewScore: 0, uniqueDomains: 0, acceptanceRate: 0 });
    }
  });

  // Legacy compat
  app.get("/api/admin/auto-paper/status", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { getSchedulerConfig } = await import('../services/autoPaperScheduler');
      res.json(getSchedulerConfig());
    } catch (error) {
      res.status(500).json({ error: "Scheduler not available" });
    }
  });

  app.post("/api/admin/auto-paper/trigger", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const { triggerManualRun, getSchedulerConfig } = await import('../services/autoPaperScheduler');
      const config = getSchedulerConfig();
      if (config.isGenerating) {
        return res.json({ triggered: false, reason: "Generation already in progress" });
      }
      triggerManualRun();
      res.json({ triggered: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger" });
    }
  });
}
