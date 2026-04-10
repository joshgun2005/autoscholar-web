// ── Domain colors ───────────────────────────────────────────────

export const domainColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  'Volatility Modeling':            { bg: 'bg-red-500/8',    text: 'text-red-600 dark:text-red-400',    border: 'border-red-500/20',    accent: 'from-red-500/20 to-red-500/5' },
  'Portfolio Optimization':         { bg: 'bg-blue-500/8',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-500/20',   accent: 'from-blue-500/20 to-blue-500/5' },
  'Derivatives Pricing':            { bg: 'bg-purple-500/8', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', accent: 'from-purple-500/20 to-purple-500/5' },
  'Monte Carlo Methods':            { bg: 'bg-amber-500/8',  text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-500/20',  accent: 'from-amber-500/20 to-amber-500/5' },
  'Machine Learning in Finance':    { bg: 'bg-emerald-500/8',text: 'text-emerald-600 dark:text-emerald-400',border: 'border-emerald-500/20', accent: 'from-emerald-500/20 to-emerald-500/5' },
  'Behavioral Finance':             { bg: 'bg-pink-500/8',   text: 'text-pink-600 dark:text-pink-400',   border: 'border-pink-500/20',   accent: 'from-pink-500/20 to-pink-500/5' },
  'Macroeconomics & Monetary Policy': { bg: 'bg-indigo-500/8', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', accent: 'from-indigo-500/20 to-indigo-500/5' },
  'Crypto & Digital Assets':        { bg: 'bg-orange-500/8', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', accent: 'from-orange-500/20 to-orange-500/5' },
  'ESG & Sustainable Finance':      { bg: 'bg-green-500/8',  text: 'text-green-600 dark:text-green-400',  border: 'border-green-500/20',  accent: 'from-green-500/20 to-green-500/5' },
  'Risk Management':                { bg: 'bg-rose-500/8',   text: 'text-rose-600 dark:text-rose-400',   border: 'border-rose-500/20',   accent: 'from-rose-500/20 to-rose-500/5' },
  'Factor Investing':               { bg: 'bg-cyan-500/8',   text: 'text-cyan-600 dark:text-cyan-400',   border: 'border-cyan-500/20',   accent: 'from-cyan-500/20 to-cyan-500/5' },
  'Econometrics':                   { bg: 'bg-teal-500/8',   text: 'text-teal-600 dark:text-teal-400',   border: 'border-teal-500/20',   accent: 'from-teal-500/20 to-teal-500/5' },
  'Market Microstructure':          { bg: 'bg-violet-500/8', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20', accent: 'from-violet-500/20 to-violet-500/5' },
  'Fixed Income':                   { bg: 'bg-sky-500/8',    text: 'text-sky-600 dark:text-sky-400',    border: 'border-sky-500/20',    accent: 'from-sky-500/20 to-sky-500/5' },
  'Algorithmic Trading':            { bg: 'bg-lime-500/8',   text: 'text-lime-600 dark:text-lime-400',   border: 'border-lime-500/20',   accent: 'from-lime-500/20 to-lime-500/5' },
  'Quantitative Finance':           { bg: 'bg-primary/8',    text: 'text-primary',                       border: 'border-primary/20',    accent: 'from-primary/20 to-primary/5' },
};

export function getDomainStyle(domain: string | null) {
  return domainColors[domain || ''] || domainColors['Quantitative Finance'];
}
