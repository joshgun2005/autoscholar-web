import { BarChart3 } from "lucide-react";
import type { QuestionCategory } from "./types";

export const ETF_INDEX_OPTIONS: QuestionCategory = {
  category: "Options on ETFs & Indices",
  icon: BarChart3,
  questions: [
    "Research paper on SPY vs SPX options: pricing differences, tax efficiency, and liquidity comparison",
    "Academic study on implied correlation extraction from index and single-stock options: the correlation risk premium",
    "Paper on sector ETF options (XLF, XLK, XLE): cross-sector volatility smile comparison and sector rotation signals",
    "Empirical analysis of QQQ options implied volatility dynamics and their relationship to NASDAQ concentration risk",
    "Research on leveraged ETF options (TQQQ, SOXL): volatility scaling, smile distortion, and pricing challenges",
    "Paper on the VIX ETP options ecosystem (UVXY, SVXY): term structure exposure and systematic selling strategies",
    "Study on commodity ETF options (GLD, USO, SLV): comparing implied volatility to underlying commodity options",
    "Academic paper on the index implied correlation smile and its relationship to dispersion trading profitability",
    "Research on Treasury ETF options (TLT, IEF): interest rate volatility surface and Fed policy sensitivity",
    "Paper on emerging market ETF options (EEM, FXI): political risk pricing and IV surface characteristics",
    "Empirical study on options liquidity and spread dynamics across the top 100 most actively traded ETF options",
    "Research on the dividend risk premium in index options: ex-dividend effects on the SPX options surface",
  ]
};
