/**
 * GME Backfill Script — Imports existing papers + peer reviews into memory tables.
 *
 * Usage: npx tsx --env-file=.env server/services/memory/backfill.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import { generateEmbedding, generateEmbeddings } from './embeddingService';

const DB_PATH = path.join(process.cwd(), 'local.db');

interface PaperRow {
  id: string;
  asid: string | null;
  title: string;
  abstract: string | null;
  domain: string | null;
  run_id: string | null;
}

interface RunRow {
  paper_id: string;
  method: string | null;
  domain: string | null;
  popper_score: number | null;
}

interface ReviewRow {
  paper_id: string;
  overall_score: number;
  strengths: string;
  weaknesses: string;
  section_reviews: string;
}

async function backfill() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  console.log('═══ GME BACKFILL ═══');

  // ── 1. Load all existing data ──
  const papers = db.prepare(`
    SELECT p.id, p.asid, p.title, p.abstract, p.domain, p.run_id
    FROM published_papers p
    ORDER BY p.published_at ASC
  `).all() as PaperRow[];

  const runs = db.prepare(`
    SELECT paper_id, method, domain, popper_score FROM paper_runs WHERE paper_id IS NOT NULL
  `).all() as RunRow[];

  const reviews = db.prepare(`
    SELECT paper_id, overall_score, strengths, weaknesses, section_reviews FROM peer_reviews
  `).all() as ReviewRow[];

  const runMap = new Map(runs.map(r => [r.paper_id, r]));
  const reviewMap = new Map(reviews.map(r => [r.paper_id, r]));

  console.log(`Found ${papers.length} papers, ${runs.length} runs, ${reviews.length} reviews`);

  // Check existing papers_memory count
  const existingCount = (db.prepare('SELECT COUNT(*) as c FROM papers_memory').get() as any).c;
  if (existingCount > 0) {
    console.log(`papers_memory already has ${existingCount} entries. Skipping duplicates.`);
  }
  const existingAsids = new Set(
    (db.prepare('SELECT asid FROM papers_memory WHERE asid IS NOT NULL').all() as any[]).map(r => r.asid)
  );

  // ── 2. Backfill papers_memory with embeddings ──
  console.log('\n── Backfilling papers_memory ──');

  const insertPaper = db.prepare(`
    INSERT INTO papers_memory (id, asid, title, abstract, domain, methods_used, datasets_used,
      contributions, limitations, popper_score, abstract_embedding, contribution_embedding,
      methodology_embedding, run_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let paperCount = 0;
  for (const paper of papers) {
    if (paper.asid && existingAsids.has(paper.asid)) {
      console.log(`  skip ${paper.asid} (already exists)`);
      continue;
    }

    const run = runMap.get(paper.id);
    const review = reviewMap.get(paper.id);
    const method = run?.method || 'Unknown';
    const domain = paper.domain || run?.domain || 'Unknown';
    const score = run?.popper_score ?? review?.overall_score ?? null;

    // Generate embeddings (batch of 3)
    const abstractText = paper.abstract || paper.title;
    let abstractEmb: number[] | null = null;
    let contribEmb: number[] | null = null;
    let methodEmb: number[] | null = null;

    try {
      const results = await generateEmbeddings([
        abstractText,
        `contributions of ${paper.title}`,
        `${method} ${domain} methodology`,
      ]);
      abstractEmb = results[0];
      contribEmb = results[1];
      methodEmb = results[2];
    } catch (err) {
      console.warn(`  ⚠ Embedding failed for ${paper.asid}: ${(err as Error).message}`);
    }

    insertPaper.run(
      crypto.randomUUID(),
      paper.asid,
      paper.title,
      paper.abstract,
      domain,
      JSON.stringify([method]),
      JSON.stringify([]),
      null,
      null,
      score,
      abstractEmb ? JSON.stringify(abstractEmb) : null,
      contribEmb ? JSON.stringify(contribEmb) : null,
      methodEmb ? JSON.stringify(methodEmb) : null,
      paper.run_id,
      Math.floor(Date.now() / 1000),
    );

    paperCount++;
    console.log(`  ✓ ${paper.asid || paper.id.slice(0, 8)} — "${paper.title.slice(0, 50)}..." (${domain} / ${method}, score: ${score ?? 'N/A'})`);

    // Rate limit for embedding API
    if (paperCount % 5 === 0) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  console.log(`  → ${paperCount} papers inserted`);

  // ── 3. Backfill methods_memory ──
  console.log('\n── Backfilling methods_memory ──');

  const methodStats = new Map<string, { domain: string; method: string; count: number; scores: number[]; failures: number }>();

  for (const paper of papers) {
    const run = runMap.get(paper.id);
    const review = reviewMap.get(paper.id);
    const method = run?.method || 'Unknown';
    const domain = paper.domain || run?.domain || 'Unknown';
    const score = run?.popper_score ?? review?.overall_score ?? 0;
    const key = `${domain}|${method}`;

    if (!methodStats.has(key)) {
      methodStats.set(key, { domain, method, count: 0, scores: [], failures: 0 });
    }
    const stat = methodStats.get(key)!;
    stat.count++;
    if (score > 0) stat.scores.push(score);
    if (score < 45) stat.failures++;
  }

  const existingMethods = (db.prepare('SELECT COUNT(*) as c FROM methods_memory').get() as any).c;
  if (existingMethods === 0) {
    const insertMethod = db.prepare(`
      INSERT INTO methods_memory (id, domain, method, usage_count, avg_popper_score, failure_count, success_rate, notes, last_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [, stat] of methodStats) {
      const avgScore = stat.scores.length > 0 ? stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length : null;
      const successRate = 1 - (stat.failures / stat.count);

      insertMethod.run(
        crypto.randomUUID(),
        stat.domain,
        stat.method,
        stat.count,
        avgScore,
        stat.failures,
        successRate,
        null,
        Math.floor(Date.now() / 1000),
      );
      console.log(`  ✓ ${stat.domain} / ${stat.method}: ${stat.count}x, avg ${avgScore?.toFixed(0) ?? 'N/A'}, fail ${stat.failures}`);
    }
    console.log(`  → ${methodStats.size} method entries inserted`);
  } else {
    console.log(`  skip (${existingMethods} entries already exist)`);
  }

  // ── 4. Backfill quality_memory from peer reviews ──
  console.log('\n── Backfilling quality_memory ──');

  const qualityStats = new Map<string, {
    domain: string; method: string; scores: number[];
    weaknesses: string[]; strengths: string[];
    sectionReviews: Array<{ section: string; score: number; comments: string }>;
  }>();

  for (const paper of papers) {
    const run = runMap.get(paper.id);
    const review = reviewMap.get(paper.id);
    if (!review) continue;

    const method = run?.method || 'Unknown';
    const domain = paper.domain || run?.domain || 'Unknown';
    const key = `${domain}|${method}`;

    if (!qualityStats.has(key)) {
      qualityStats.set(key, { domain, method, scores: [], weaknesses: [], strengths: [], sectionReviews: [] });
    }
    const stat = qualityStats.get(key)!;
    stat.scores.push(review.overall_score);

    try {
      const w = JSON.parse(review.weaknesses);
      if (Array.isArray(w)) stat.weaknesses.push(...w);
    } catch {}
    try {
      const s = JSON.parse(review.strengths);
      if (Array.isArray(s)) stat.strengths.push(...s);
    } catch {}
    try {
      const sr = JSON.parse(review.section_reviews);
      if (Array.isArray(sr)) stat.sectionReviews.push(...sr);
    } catch {}
  }

  const existingQuality = (db.prepare('SELECT COUNT(*) as c FROM quality_memory').get() as any).c;
  if (existingQuality === 0) {
    const insertQuality = db.prepare(`
      INSERT INTO quality_memory (id, domain, method, avg_score, common_weaknesses, common_strengths, writing_issues, review_patterns, sample_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [, stat] of qualityStats) {
      const avgScore = stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length;
      // Deduplicate weaknesses/strengths
      const uniqueWeaknesses = [...new Set(stat.weaknesses)].slice(0, 20);
      const uniqueStrengths = [...new Set(stat.strengths)].slice(0, 20);
      // Extract writing issues from low-scoring sections
      const writingIssues = stat.sectionReviews
        .filter(sr => sr.score < 60)
        .map(sr => `${sr.section}: ${(sr.comments || '').slice(0, 150)}`)
        .slice(0, 15);

      insertQuality.run(
        crypto.randomUUID(),
        stat.domain,
        stat.method,
        avgScore,
        JSON.stringify(uniqueWeaknesses),
        JSON.stringify(uniqueStrengths),
        JSON.stringify(writingIssues),
        JSON.stringify([]),
        stat.scores.length,
        Math.floor(Date.now() / 1000),
      );
      console.log(`  ✓ ${stat.domain} / ${stat.method}: avg ${avgScore.toFixed(0)}, ${stat.scores.length} reviews, ${uniqueWeaknesses.length} weaknesses`);
    }
    console.log(`  → ${qualityStats.size} quality entries inserted`);
  } else {
    console.log(`  skip (${existingQuality} entries already exist)`);
  }

  // ── Summary ──
  const finalCounts = {
    papers: (db.prepare('SELECT COUNT(*) as c FROM papers_memory').get() as any).c,
    methods: (db.prepare('SELECT COUNT(*) as c FROM methods_memory').get() as any).c,
    datasets: (db.prepare('SELECT COUNT(*) as c FROM datasets_memory').get() as any).c,
    errors: (db.prepare('SELECT COUNT(*) as c FROM errors_memory').get() as any).c,
    quality: (db.prepare('SELECT COUNT(*) as c FROM quality_memory').get() as any).c,
  };

  console.log('\n═══ BACKFILL COMPLETE ═══');
  console.log(`  papers_memory:   ${finalCounts.papers}`);
  console.log(`  methods_memory:  ${finalCounts.methods}`);
  console.log(`  datasets_memory: ${finalCounts.datasets}`);
  console.log(`  errors_memory:   ${finalCounts.errors}`);
  console.log(`  quality_memory:  ${finalCounts.quality}`);

  db.close();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
