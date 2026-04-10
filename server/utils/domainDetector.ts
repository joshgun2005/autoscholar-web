/**
 * Weighted keyword scoring for research paper domain classification.
 * Each domain has keywords with weights (1-3). The domain with the
 * highest total score wins, with a minimum threshold of 2 points.
 */

const domainRules: { domain: string; keywords: [string, number][] }[] = [
  { domain: 'Volatility Modeling', keywords: [['garch', 3], ['volatility surface', 3], ['implied volatil', 3], ['stochastic volatil', 3], ['volatility smile', 2], ['heston', 3], ['sabr', 3], ['volatil', 1], ['vol clustering', 2], ['vix', 2]] },
  { domain: 'Portfolio Optimization', keywords: [['portfolio optimiz', 3], ['mean-variance', 3], ['markowitz', 3], ['efficient frontier', 3], ['asset allocation', 2], ['portfolio construct', 2], ['portfolio', 1], ['sharpe ratio', 2], ['black-litterman', 3]] },
  { domain: 'Derivatives Pricing', keywords: [['option pricing', 3], ['black-scholes', 3], ['greeks', 2], ['binomial', 2], ['derivatives', 2], ['call option', 2], ['put option', 2], ['option', 1], ['hedging strateg', 2], ['payoff', 1]] },
  { domain: 'Monte Carlo Methods', keywords: [['monte carlo', 3], ['simulation', 1], ['random walk', 2], ['brownian motion', 2], ['path simulation', 3], ['variance reduction', 3]] },
  { domain: 'Machine Learning in Finance', keywords: [['machine learning', 3], ['deep learning', 3], ['neural network', 3], ['lstm', 3], ['random forest', 2], ['xgboost', 2], ['transformer', 2], ['nlp', 2], ['predict', 1], ['classification', 1]] },
  { domain: 'Behavioral Finance', keywords: [['sentiment analysis', 3], ['behavioral financ', 3], ['market sentiment', 3], ['investor behavior', 3], ['overreaction', 2], ['herding', 2], ['prospect theory', 3], ['cognitive bias', 2]] },
  { domain: 'Macroeconomics & Monetary Policy', keywords: [['monetary policy', 3], ['central bank', 3], ['inflation', 2], ['interest rate', 2], ['gdp', 2], ['fiscal policy', 3], ['macroeconom', 2], ['yield curve', 2], ['quantitative easing', 3]] },
  { domain: 'Crypto & Digital Assets', keywords: [['cryptocurrency', 3], ['bitcoin', 3], ['ethereum', 3], ['blockchain', 3], ['defi', 3], ['decentraliz', 2], ['crypto', 2], ['token', 1], ['nft', 2], ['stablecoin', 3]] },
  { domain: 'ESG & Sustainable Finance', keywords: [['esg', 3], ['climate risk', 3], ['green bond', 3], ['carbon', 2], ['sustainab', 2], ['social responsibility', 2], ['environmental', 1], ['governance', 1]] },
  { domain: 'Risk Management', keywords: [['value at risk', 3], ['value-at-risk', 3], ['expected shortfall', 3], ['risk management', 3], ['tail risk', 3], ['credit risk', 3], ['stress test', 3], ['risk measure', 2], ['copula', 2], ['drawdown', 2]] },
  { domain: 'Factor Investing', keywords: [['factor model', 3], ['fama-french', 3], ['momentum', 2], ['factor investing', 3], ['anomal', 2], ['smart beta', 3], ['alpha', 1], ['cross-section', 2], ['size effect', 2]] },
  { domain: 'Econometrics', keywords: [['econometric', 3], ['cointegration', 3], ['granger causal', 3], ['regression', 1], ['time series', 2], ['panel data', 3], ['var model', 2], ['arima', 2], ['heteroskedast', 2], ['stationarity', 2]] },
  { domain: 'Market Microstructure', keywords: [['market microstructure', 3], ['bid-ask spread', 3], ['order book', 3], ['high-frequency', 3], ['liquidity', 2], ['price discovery', 3], ['market making', 3], ['tick data', 2]] },
  { domain: 'Fixed Income', keywords: [['bond', 2], ['fixed income', 3], ['yield curve', 3], ['duration', 1], ['credit spread', 3], ['interest rate model', 3], ['term structure', 3], ['coupon', 2]] },
  { domain: 'Algorithmic Trading', keywords: [['algorithmic trading', 3], ['trading strateg', 2], ['backtest', 3], ['execution', 1], ['pairs trading', 3], ['mean reversion', 2], ['signal', 1], ['technical analysis', 2], ['moving average', 2]] },
];

export function detectDomain(title: string, abstract: string, keywords: string[] = []): string {
  const fullText = (title + ' ' + abstract + ' ' + keywords.join(' ')).toLowerCase();

  let bestDomain = 'Quantitative Finance';
  let bestScore = 0;

  for (const rule of domainRules) {
    let score = 0;
    for (const [kw, weight] of rule.keywords) {
      if (fullText.includes(kw)) score += weight;
    }
    if (score > bestScore) {
      bestScore = score;
      bestDomain = rule.domain;
    }
  }

  // Only assign if score is meaningful (at least 2 points)
  return bestScore >= 2 ? bestDomain : 'Quantitative Finance';
}
