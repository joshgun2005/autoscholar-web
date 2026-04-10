import { Target } from "lucide-react";
import type { QuestionCategory } from "./types";

export const THEORETICAL_GAME_THEORY: QuestionCategory = {
  category: "Theoretical Game Theory in Finance",
  icon: Target,
  questions: [
    "Theoretical paper on strategic trading with private information: Kyle's model extensions with multiple insiders and dynamic learning",
    "Formal model of predatory trading: how large traders exploit the predictable liquidation of distressed positions",
    "Theoretical framework for auction design in Treasury markets: uniform price vs discriminatory auctions and bidder strategies",
    "Paper developing a game-theoretic model of credit rating agencies: strategic inflation, reputation, and issuer-pays conflicts",
    "Theoretical analysis of herding in financial markets: information cascades, Bayesian learning, and rational imitation",
    "Formal model of strategic default in mortgage markets: borrower options, lender beliefs, and equilibrium foreclosure rates",
    "Theoretical paper on market-making as a Bertrand competition: price competition, adverse selection, and the zero-profit condition",
    "Model of central bank signaling games: cheap talk, costly signaling, and the credibility of forward guidance",
    "Theoretical framework for cooperative and non-cooperative bargaining in debt restructuring negotiations",
    "Paper on the design of financial benchmarks: manipulation incentives, detection mechanisms, and optimal reporting rules",
  ]
};
