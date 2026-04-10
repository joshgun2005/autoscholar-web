// ─── Live Paper Room — Realistic Mock Data & Simulation ──────
// This file provides a self-running simulation that can be swapped
// for a real SSE/polling data source later.

import type {
  LivePaperState,
  PaperSection,
  PaperFigure,
  PaperReference,
  LiveAgent,
  LiveEvent,
  PaperStatus,
  EventSeverity,
} from "./types";

// ─── Initial sections ────────────────────────────────────────

const INITIAL_SECTIONS: PaperSection[] = [
  {
    id: "abstract",
    title: "Abstract",
    status: "completed",
    content: "This paper investigates the cross-sectional predictability of cryptocurrency returns using on-chain network metrics and decentralized exchange (DEX) liquidity flows. We construct a novel dataset merging Ethereum token-level network activity\u2014including active addresses, transaction velocity, and gas-weighted transfer volume\u2014with DEX pool depth and routing efficiency from Uniswap v3 and Curve Finance. Using a panel of 120 ERC-20 tokens over the period January 2021 to December 2025, we estimate Fama\u2013MacBeth cross-sectional regressions augmented with machine-learning-based interaction terms. Our results reveal that the ratio of DEX liquidity depth to on-chain transfer volume\u2014a measure we term the \"Liquidity Absorption Ratio\"\u2014exhibits significant and robust predictive power for one-week-ahead excess returns, even after controlling for market beta, size, momentum, and volatility.",
    wordCount: 142,
    updatedAt: Date.now() - 180_000,
    recentChanges: [],
  },
  {
    id: "introduction",
    title: "Introduction",
    status: "completed",
    content: "The rapid maturation of decentralized finance has created a unique laboratory for empirical asset pricing. Unlike traditional equity markets, where order flow and liquidity provision are mediated by centralized intermediaries, cryptocurrency markets increasingly operate through automated market makers and permissionless liquidity pools. This structural difference raises a fundamental question: do the informational signals embedded in on-chain network activity and decentralized liquidity provision predict future asset returns?\n\nWe contribute to the nascent literature at the intersection of crypto-asset pricing and decentralized market microstructure by constructing and testing a novel cross-sectional predictor. Specifically, we introduce the Liquidity Absorption Ratio (LAR), defined as the ratio of aggregate DEX pool depth for a given token to its on-chain transfer volume over a trailing seven-day window. The economic intuition is straightforward: tokens whose available liquidity exceeds the pace of on-chain transfers may be undervalued by flow-driven pricing, while tokens where transfer velocity outstrips available depth face absorption pressure.",
    wordCount: 168,
    updatedAt: Date.now() - 150_000,
    recentChanges: [],
  },
  {
    id: "literature",
    title: "Literature Review",
    status: "completed",
    content: "Our work sits at the confluence of three active research streams. First, we build on the growing empirical literature on cryptocurrency return predictability. Liu, Tsyvinski, and Wu (2022) demonstrate that network factors\u2014particularly proxies for user adoption and transaction activity\u2014carry significant risk premia in the cross-section of cryptocurrency returns. Cong, He, and Li (2021) develop a tokenomics framework showing that platform-token pricing depends critically on user-base growth and transactional demand. Our contribution extends these findings by incorporating liquidity-side information from decentralized exchanges, which was largely unavailable when these foundational studies were conducted.\n\nSecond, we draw on the microstructure literature for automated market makers. Lehar and Parlour (2023) model impermanent loss and liquidity provision in constant-function market makers, establishing theoretical links between pool depth, trading volume, and price informativeness.",
    wordCount: 155,
    updatedAt: Date.now() - 120_000,
    recentChanges: ["2 new citations integrated"],
  },
  {
    id: "data",
    title: "Data & Sample Construction",
    status: "completed",
    content: "Our empirical analysis draws on three complementary data sources. First, we collect on-chain network metrics for ERC-20 tokens from the Ethereum blockchain via the Dune Analytics API. For each token in our sample, we extract daily active addresses, transaction count, gas-weighted transfer volume, and unique sender/receiver counts over the period January 2021\u2014December 2025. Second, we obtain decentralized exchange data from Uniswap v3 and Curve Finance subgraphs, including pool-level total value locked (TVL), daily swap volume, fee tier composition, and concentrated liquidity range distributions. Third, we merge these on-chain datasets with standard market data\u2014daily prices, returns, and market capitalizations\u2014from CoinGecko's institutional API.\n\nOur final sample comprises 120 ERC-20 tokens with continuous trading history and sufficient DEX liquidity over the five-year window.",
    wordCount: 152,
    updatedAt: Date.now() - 90_000,
    recentChanges: [],
  },
  {
    id: "methodology",
    title: "Methodology",
    status: "writing",
    content: "We employ a Fama\u2013MacBeth (1973) two-pass procedure adapted for the cross-section of cryptocurrency returns. In the first pass, for each week t in our sample, we estimate cross-sectional regressions of one-week-ahead excess returns on the Liquidity Absorption Ratio and a battery of controls. In the second pass, we compute time-series averages of the slope coefficients and test their significance using Newey\u2013West (1987) standard errors with four lags to account for serial correlation in the estimated risk premia.\n\nFormally, our baseline specification is:\n\nr_{i,t+1} = \\alpha_t + \\beta_t \\cdot LAR_{i,t} + \\gamma_t' X_{i,t} + \\varepsilon_{i,t+1}\n\nwhere r_{i,t+1} denotes the excess return of token i over week t+1, LAR_{i,t} is the Liquidity Absorption Ratio measured at the end of week t, and X_{i,t} is a vector of controls including market beta, log market capitalization, past one-week and four-week returns, and realized volatility.",
    wordCount: 178,
    updatedAt: Date.now() - 15_000,
    recentChanges: ["Fama\u2013MacBeth specification finalized", "Control variables defined"],
  },
  {
    id: "results",
    title: "Results",
    status: "pending",
    content: "",
    wordCount: 0,
    updatedAt: 0,
    recentChanges: [],
  },
  {
    id: "robustness",
    title: "Robustness Checks",
    status: "pending",
    content: "",
    wordCount: 0,
    updatedAt: 0,
    recentChanges: [],
  },
  {
    id: "conclusion",
    title: "Conclusion",
    status: "pending",
    content: "",
    wordCount: 0,
    updatedAt: 0,
    recentChanges: [],
  },
  {
    id: "references",
    title: "References",
    status: "writing",
    content: "",
    wordCount: 0,
    updatedAt: Date.now() - 30_000,
    recentChanges: ["24 references compiled"],
  },
];

// ─── Initial figures ─────────────────────────────────────────

const INITIAL_FIGURES: PaperFigure[] = [
  {
    id: "fig1",
    title: "Figure 1",
    caption: "Time-series evolution of aggregate DEX liquidity depth and on-chain transfer volume",
    status: "completed",
    previewUrl: null,
    sectionId: "data",
  },
  {
    id: "fig2",
    title: "Figure 2",
    caption: "Cross-sectional distribution of the Liquidity Absorption Ratio by token size quintile",
    status: "completed",
    previewUrl: null,
    sectionId: "data",
  },
  {
    id: "fig3",
    title: "Figure 3",
    caption: "Fama\u2013MacBeth coefficient estimates with 95% confidence bands",
    status: "generating",
    previewUrl: null,
    sectionId: "methodology",
  },
];

// ─── Initial references ──────────────────────────────────────

const INITIAL_REFERENCES: PaperReference[] = [
  { id: "ref1", authors: "Liu, Y., Tsyvinski, A., & Wu, X.", title: "Common risk factors in cryptocurrency", year: 2022, journal: "Journal of Finance", addedAt: Date.now() - 300_000 },
  { id: "ref2", authors: "Cong, L.W., He, Z., & Li, J.", title: "Decentralized mining in centralized pools", year: 2021, journal: "Review of Financial Studies", addedAt: Date.now() - 295_000 },
  { id: "ref3", authors: "Lehar, A. & Parlour, C.A.", title: "Decentralized exchanges", year: 2023, journal: "Journal of Financial Economics", addedAt: Date.now() - 280_000 },
  { id: "ref4", authors: "Fama, E.F. & MacBeth, J.D.", title: "Risk, return, and equilibrium: empirical tests", year: 1973, journal: "Journal of Political Economy", addedAt: Date.now() - 270_000 },
  { id: "ref5", authors: "Newey, W.K. & West, K.D.", title: "A simple, positive semi-definite, heteroskedasticity and autocorrelation consistent covariance matrix", year: 1987, journal: "Econometrica", addedAt: Date.now() - 268_000 },
  { id: "ref6", authors: "Makarov, I. & Schoar, A.", title: "Trading and arbitrage in cryptocurrency markets", year: 2020, journal: "Journal of Financial Economics", addedAt: Date.now() - 260_000 },
  { id: "ref7", authors: "Harvey, C.R., Liu, Y., & Zhu, H.", title: "... and the cross-section of expected returns", year: 2016, journal: "Review of Financial Studies", addedAt: Date.now() - 255_000 },
  { id: "ref8", authors: "Capponi, A. & Jia, R.", title: "The adoption of blockchain-based decentralized exchanges", year: 2024, journal: "Management Science", addedAt: Date.now() - 240_000 },
  { id: "ref9", authors: "Hasbrouck, J.", title: "Measuring the information content of stock trades", year: 1991, journal: "Journal of Finance", addedAt: Date.now() - 235_000 },
  { id: "ref10", authors: "Amihud, Y.", title: "Illiquidity and stock returns: cross-section and time-series effects", year: 2002, journal: "Journal of Financial Markets", addedAt: Date.now() - 230_000 },
  { id: "ref11", authors: "Park, A.", title: "The conceptual flaws of AMM fee mechanisms", year: 2023, journal: "Working Paper", addedAt: Date.now() - 220_000 },
  { id: "ref12", authors: "Barbon, A. & Ranaldo, A.", title: "On the quality of cryptocurrency markets", year: 2022, journal: "Working Paper", addedAt: Date.now() - 215_000 },
  { id: "ref13", authors: "Biais, B., Bisière, C., Bouvard, M., & Casamatta, C.", title: "The blockchain folk theorem", year: 2019, journal: "Review of Financial Studies", addedAt: Date.now() - 210_000 },
  { id: "ref14", authors: "Easley, D., O'Hara, M., & Basu, S.", title: "From mining to markets", year: 2019, journal: "Journal of Financial Economics", addedAt: Date.now() - 205_000 },
  { id: "ref15", authors: "Griffin, J.M. & Shams, A.", title: "Is Bitcoin really untethered?", year: 2020, journal: "Journal of Finance", addedAt: Date.now() - 200_000 },
  { id: "ref16", authors: "Gu, S., Kelly, B., & Xiu, D.", title: "Empirical asset pricing via machine learning", year: 2020, journal: "Review of Financial Studies", addedAt: Date.now() - 190_000 },
  { id: "ref17", authors: "Kozhan, R. & Viswanath-Natraj, G.", title: "Decentralized stablecoins and collateral risk", year: 2024, journal: "Review of Finance", addedAt: Date.now() - 185_000 },
  { id: "ref18", authors: "Yermack, D.", title: "Is Bitcoin a real currency?", year: 2015, journal: "Handbook of Digital Currency", addedAt: Date.now() - 175_000 },
  { id: "ref19", authors: "Ante, L.", title: "Non-fungible token (NFT) markets on the Ethereum blockchain", year: 2022, journal: "Finance Research Letters", addedAt: Date.now() - 165_000 },
  { id: "ref20", authors: "Augustin, P., Rubtsov, A., & Shin, D.", title: "The impact of derivatives on spot markets", year: 2023, journal: "Review of Financial Studies", addedAt: Date.now() - 155_000 },
  { id: "ref21", authors: "Borri, N.", title: "Conditional tail-risk in cryptocurrency markets", year: 2019, journal: "Journal of Empirical Finance", addedAt: Date.now() - 145_000 },
  { id: "ref22", authors: "Hautsch, N., Scheuch, C., & Voigt, S.", title: "Building trust takes time: limits to arbitrage in blockchain-based markets", year: 2024, journal: "Journal of Financial Economics", addedAt: Date.now() - 135_000 },
  { id: "ref23", authors: "Dyhrberg, A.H.", title: "Bitcoin, gold and the dollar \u2013 a GARCH volatility analysis", year: 2016, journal: "Finance Research Letters", addedAt: Date.now() - 120_000 },
  { id: "ref24", authors: "Adams, H., Zinsmeister, N., & Robinson, D.", title: "Uniswap v3 Core", year: 2021, journal: "Whitepaper", addedAt: Date.now() - 100_000 },
];

// ─── Initial agents ──────────────────────────────────────────

const INITIAL_AGENTS: LiveAgent[] = [
  {
    id: "gauss",
    name: "Gauss",
    role: "Literature discovery & gap analysis",
    status: "completed",
    currentTask: null,
    lastAction: "Identified 24 core references across 3 research streams",
    lastActionAt: Date.now() - 240_000,
    color: "indigo",
    icon: "Search",
    toolCalls: 18,
  },
  {
    id: "turing",
    name: "Turing",
    role: "Data collection & econometric analysis",
    status: "completed",
    currentTask: null,
    lastAction: "Panel dataset merged from Dune, Uniswap, and CoinGecko APIs",
    lastActionAt: Date.now() - 120_000,
    color: "amber",
    icon: "Database",
    toolCalls: 31,
  },
  {
    id: "newton",
    name: "Newton",
    role: "Dataset preparation & feature engineering",
    status: "completed",
    currentTask: null,
    lastAction: "Constructed LAR variable and winsorized control variables at 1%/99%",
    lastActionAt: Date.now() - 90_000,
    color: "cyan",
    icon: "BarChart3",
  toolCalls: 8,
  },
  {
    id: "fisher",
    name: "Fisher",
    role: "Empirical analysis & robustness testing",
    status: "active",
    currentTask: "Estimating Fama\u2013MacBeth regressions with Newey\u2013West corrections",
    lastAction: "Baseline OLS specification completed with 120-token panel",
    lastActionAt: Date.now() - 25_000,
    color: "rose",
    icon: "Microscope",
    toolCalls: 12,
  },
  {
    id: "euler",
    name: "Euler",
    role: "Paper synthesis & LaTeX compilation",
    status: "active",
    currentTask: "Writing Methodology section \u2014 regression specification",
    lastAction: "Introduction section finalized and passed internal review",
    lastActionAt: Date.now() - 45_000,
    color: "teal",
    icon: "Brain",
    toolCalls: 22,
  },
  {
    id: "popper",
    name: "Popper",
    role: "Peer review validation",
    status: "queued",
    currentTask: null,
    lastAction: null,
    lastActionAt: null,
    color: "amber",
    icon: "Shield",
    toolCalls: 0,
  },
];

// ─── Initial events ──────────────────────────────────────────

const INITIAL_EVENTS: LiveEvent[] = [
  { id: "e1",  timestamp: Date.now() - 360_000, type: "system",      title: "Pipeline initialized",                    message: "Research generation pipeline started for cryptocurrency cross-sectional study", agentId: null, severity: "info" },
  { id: "e2",  timestamp: Date.now() - 340_000, type: "research",    title: "Literature mapping started",              message: "Querying OpenAlex, arXiv, and CrossRef in parallel", agentId: "gauss", severity: "info" },
  { id: "e3",  timestamp: Date.now() - 310_000, type: "research",    title: "87 candidate references screened",       message: "Initial corpus assembled from 3 academic databases", agentId: "gauss", severity: "info" },
  { id: "e4",  timestamp: Date.now() - 280_000, type: "research",    title: "Citation network expanded",              message: "Forward and backward citation analysis added 43 additional papers", agentId: "gauss", severity: "info" },
  { id: "e5",  timestamp: Date.now() - 260_000, type: "research",    title: "24 references retained",                 message: "Literature cluster identified and ranked by relevance score", agentId: "gauss", severity: "success" },
  { id: "e6",  timestamp: Date.now() - 250_000, type: "research",    title: "Research gap identified",                message: "Gap detected: no prior study combines on-chain metrics with DEX liquidity for cross-sectional prediction", agentId: "gauss", severity: "success" },
  { id: "e7",  timestamp: Date.now() - 230_000, type: "data",        title: "Data collection initiated",              message: "Connecting to Dune Analytics, Uniswap v3 subgraph, and CoinGecko API", agentId: "turing", severity: "info" },
  { id: "e8",  timestamp: Date.now() - 200_000, type: "data",        title: "On-chain metrics downloaded",            message: "Daily active addresses, tx count, and gas-weighted volume for 120 ERC-20 tokens (2021\u20132025)", agentId: "turing", severity: "info" },
  { id: "e9",  timestamp: Date.now() - 175_000, type: "data",        title: "DEX liquidity data merged",              message: "Pool-level TVL, swap volume, and fee tiers from Uniswap v3 and Curve Finance", agentId: "turing", severity: "info" },
  { id: "e10", timestamp: Date.now() - 150_000, type: "data",        title: "Market data integrated",                 message: "Daily prices and market capitalizations from CoinGecko institutional API", agentId: "turing", severity: "success" },
  { id: "e11", timestamp: Date.now() - 130_000, type: "analysis",    title: "Feature engineering completed",          message: "Liquidity Absorption Ratio constructed and winsorized at 1%/99% tails", agentId: "newton", severity: "success" },
  { id: "e12", timestamp: Date.now() - 110_000, type: "analysis",    title: "Figure 1 generated",                     message: "Time-series plot of aggregate DEX depth vs. on-chain volume", agentId: "newton", severity: "info" },
  { id: "e13", timestamp: Date.now() - 95_000,  type: "analysis",    title: "Figure 2 generated",                     message: "Cross-sectional LAR distribution by size quintile", agentId: "newton", severity: "info" },
  { id: "e14", timestamp: Date.now() - 80_000,  type: "writing",     title: "Abstract drafted",                       message: "142-word abstract covering methodology, data, and key findings", agentId: "euler", severity: "success" },
  { id: "e15", timestamp: Date.now() - 60_000,  type: "writing",     title: "Introduction section finalized",         message: "Economic motivation and contribution statement completed", agentId: "euler", severity: "success" },
  { id: "e16", timestamp: Date.now() - 45_000,  type: "writing",     title: "Literature review compiled",             message: "Three research streams synthesized with 24 key references", agentId: "euler", severity: "success" },
  { id: "e17", timestamp: Date.now() - 35_000,  type: "writing",     title: "Data section written",                   message: "Sample construction and variable definitions documented", agentId: "euler", severity: "success" },
  { id: "e18", timestamp: Date.now() - 25_000,  type: "analysis",    title: "Baseline regression estimated",          message: "OLS specification with 120-token panel yields t-stat of 3.42 on LAR coefficient", agentId: "fisher", severity: "success" },
  { id: "e19", timestamp: Date.now() - 15_000,  type: "writing",     title: "Methodology section in progress",        message: "Fama\u2013MacBeth specification and control variable documentation", agentId: "euler", severity: "info" },
];

// ─── Upcoming simulation events ──────────────────────────────

interface ScheduledEvent {
  delayMs: number;
  event: Omit<LiveEvent, "id" | "timestamp">;
  mutations?: Partial<{
    status: PaperStatus;
    progress: number;
    sectionUpdates: Array<{ id: string; status: PaperSection["status"]; content?: string; wordCount?: number; recentChanges?: string[] }>;
    agentUpdates: Array<{ id: string; status: LiveAgent["status"]; currentTask?: string | null; lastAction?: string | null; toolCalls?: number }>;
    newFigure?: PaperFigure;
    newReference?: PaperReference;
    figureCompleted?: string;  // figure id
  }>;
}

export const SCHEDULED_EVENTS: ScheduledEvent[] = [
  {
    delayMs: 4_000,
    event: { type: "analysis", title: "Figure 3 generated", message: "Fama\u2013MacBeth coefficient plot with 95% confidence bands across weekly horizons", agentId: "fisher", severity: "success" },
    mutations: {
      progress: 52,
      figureCompleted: "fig3",
      agentUpdates: [{ id: "fisher", status: "active", currentTask: "Running subsample stability tests across bull and bear regimes", toolCalls: 13 }],
    },
  },
  {
    delayMs: 9_000,
    event: { type: "writing", title: "Methodology section completed", message: "Regression framework fully specified with Newey\u2013West standard errors", agentId: "euler", severity: "success" },
    mutations: {
      progress: 56,
      sectionUpdates: [
        { id: "methodology", status: "completed", wordCount: 312, recentChanges: ["Newey\u2013West lag structure justified"] },
        { id: "results", status: "writing", recentChanges: ["Section structure initialized"] },
      ],
      agentUpdates: [{ id: "euler", status: "active", currentTask: "Writing Results section \u2014 baseline findings", lastAction: "Methodology section completed with formal specification" }],
    },
  },
  {
    delayMs: 14_000,
    event: { type: "analysis", title: "Subsample test passed", message: "LAR coefficient remains significant in both pre- and post-FTX-collapse subsamples (t > 2.4)", agentId: "fisher", severity: "success" },
    mutations: {
      progress: 60,
      agentUpdates: [{ id: "fisher", status: "active", currentTask: "Testing alternative LAR construction with 14-day window", lastAction: "Subsample stability confirmed across market regimes", toolCalls: 15 }],
    },
  },
  {
    delayMs: 19_000,
    event: { type: "analysis", title: "Figure 4 generated", message: "Quintile portfolio returns sorted by LAR with monotonic spread", agentId: "fisher", severity: "info" },
    mutations: {
      progress: 63,
      newFigure: { id: "fig4", title: "Figure 4", caption: "Quintile portfolio returns sorted by Liquidity Absorption Ratio", status: "completed", previewUrl: null, sectionId: "results" },
    },
  },
  {
    delayMs: 24_000,
    event: { type: "writing", title: "Baseline results documented", message: "Table 1 and coefficient discussion written for Results section", agentId: "euler", severity: "success" },
    mutations: {
      progress: 67,
      sectionUpdates: [{ id: "results", status: "writing", wordCount: 186, recentChanges: ["Table 1: Fama\u2013MacBeth estimates", "Coefficient interpretation added"] }],
    },
  },
  {
    delayMs: 30_000,
    event: { type: "analysis", title: "Alternative specification rejected", message: "14-day LAR window yields weaker significance (t = 1.87); 7-day specification retained", agentId: "fisher", severity: "warning" },
    mutations: {
      progress: 70,
      agentUpdates: [{ id: "fisher", status: "active", currentTask: "Running Fama\u2013French three-factor augmented specification", lastAction: "14-day alternative rejected \u2014 retained 7-day baseline", toolCalls: 18 }],
    },
  },
  {
    delayMs: 36_000,
    event: { type: "analysis", title: "Factor-augmented test completed", message: "LAR remains significant after controlling for crypto market, size, and momentum factors", agentId: "fisher", severity: "success" },
    mutations: {
      progress: 74,
      newFigure: { id: "fig5", title: "Figure 5", caption: "Factor loadings and residual LAR coefficient across specifications", status: "completed", previewUrl: null, sectionId: "robustness" },
      agentUpdates: [{ id: "fisher", status: "active", currentTask: "Estimating panel VAR for Granger causality analysis", toolCalls: 20 }],
    },
  },
  {
    delayMs: 42_000,
    event: { type: "writing", title: "Results section completed", message: "Main empirical findings documented with 4 tables and 2 figures", agentId: "euler", severity: "success" },
    mutations: {
      progress: 78,
      status: "validating",
      sectionUpdates: [
        { id: "results", status: "completed", wordCount: 420, recentChanges: ["Table 2 added: subsample analysis"] },
        { id: "robustness", status: "writing", recentChanges: ["Robustness framework outlined"] },
      ],
      agentUpdates: [
        { id: "euler", status: "active", currentTask: "Writing Robustness Checks section", lastAction: "Results section finalized with full empirical narrative" },
      ],
    },
  },
  {
    delayMs: 50_000,
    event: { type: "validation", title: "Granger causality established", message: "Panel VAR confirms LAR Granger-causes returns at 1-week horizon (p < 0.01)", agentId: "fisher", severity: "success" },
    mutations: {
      progress: 82,
      agentUpdates: [{ id: "fisher", status: "completed", currentTask: null, lastAction: "All robustness checks passed \u2014 empirical analysis complete", toolCalls: 23 }],
    },
  },
  {
    delayMs: 56_000,
    event: { type: "writing", title: "Robustness section completed", message: "Four robustness checks documented: subsample, alternative window, factor controls, Granger causality", agentId: "euler", severity: "success" },
    mutations: {
      progress: 86,
      sectionUpdates: [
        { id: "robustness", status: "completed", wordCount: 340, recentChanges: ["Table 3: robustness summary"] },
        { id: "conclusion", status: "writing", recentChanges: ["Drafting conclusion"] },
      ],
    },
  },
  {
    delayMs: 62_000,
    event: { type: "writing", title: "Conclusion drafted", message: "Summary of contributions, limitations, and avenues for future research", agentId: "euler", severity: "success" },
    mutations: {
      progress: 90,
      status: "compiling",
      sectionUpdates: [
        { id: "conclusion", status: "completed", wordCount: 210, recentChanges: [] },
        { id: "references", status: "completed", recentChanges: ["Bibliography finalized with 24 entries"] },
      ],
      agentUpdates: [
        { id: "euler", status: "active", currentTask: "Compiling LaTeX manuscript and generating PDF", lastAction: "All manuscript sections completed" },
      ],
    },
  },
  {
    delayMs: 68_000,
    event: { type: "compilation", title: "Bibliography normalized", message: "All 24 BibTeX entries validated and citation keys reconciled", agentId: "euler", severity: "info" },
    mutations: { progress: 93 },
  },
  {
    delayMs: 72_000,
    event: { type: "compilation", title: "LaTeX compilation successful", message: "PDF generated: 28 pages, 5 figures, 3 tables, 24 references", agentId: "euler", severity: "success" },
    mutations: {
      progress: 96,
      agentUpdates: [
        { id: "euler", status: "completed", currentTask: null, lastAction: "PDF compiled successfully \u2014 28 pages" },
        { id: "popper", status: "active", currentTask: "Conducting automated peer review across 6 dimensions", lastAction: null },
      ],
    },
  },
  {
    delayMs: 80_000,
    event: { type: "validation", title: "Peer review completed", message: "Overall score: 72/100 \u2014 Recommendation: Accept with minor revision", agentId: "popper", severity: "success" },
    mutations: {
      progress: 100,
      status: "completed",
      agentUpdates: [
        { id: "popper", status: "completed", currentTask: null, lastAction: "Score 72/100 \u2014 Accept with minor revision" },
      ],
    },
  },
];

// ─── Build initial state ─────────────────────────────────────

export function createInitialState(): LivePaperState {
  return {
    id: "run-demo-2026",
    title: "On-Chain Liquidity Absorption and the Cross-Section of Cryptocurrency Returns",
    subtitle: "Decentralized Exchange Microstructure \u00d7 Empirical Asset Pricing",
    status: "writing",
    progress: 48,
    startedAt: Date.now() - 360_000,
    elapsedSeconds: 360,
    activeAgentId: "euler",
    sections: INITIAL_SECTIONS,
    figures: INITIAL_FIGURES,
    references: INITIAL_REFERENCES,
    agents: INITIAL_AGENTS,
    events: INITIAL_EVENTS,
    totalToolCalls: 91,
    totalTokens: 847_000,
  };
}
