import axios from 'axios';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-opus-4-6';

// Two-part detection: query must contain a "verb" AND a "noun" for paper generation
const PAPER_VERBS = /(gen[eè]re|generate|write|r[eé]dige|[eé]cris|produi[st]|create|compose|draft|fais|make)/i;
const PAPER_NOUNS = /(paper|article|papier|recherche|research|[eé]tude|study|working.?paper|rapport)/i;
const SURPRISE_RE = /(surprise|random|al[eé]atoire|au hasard|choisis?|pick|any topic|n.importe)/i;

// Methodology detection patterns
const STATS_RE = /(statistic|hypothesis.?test|t[\s-]?test|anova|chi[\s-]?square|normality|distribution.?test|bayesian|effect.?size|confidence.?interval|mann[\s-]?whitney|kruskal|wilcoxon|compare.?groups?|two.?sample|paired|non[\s-]?parametric)/i;
const ML_RE = /(machine.?learn|random.?forest|gradient.?boost|xgboost|lightgbm|predict|forecast|classification|regression.?tree|feature.?importance|cross[\s-]?validat|train[\s/]test|supervised|unsupervised|clustering|k[\s-]?means|svm|support.?vector|elastic[\s-]?net|lasso|ridge)/i;
const AI_RE = /(neural.?net|deep.?learn|artificial.?intelligence|nn|lstm|rnn|cnn|transformer|attention|autoencoder|gan|generative|representation.?learn|embedding|perceptron|backpropagat|pytorch|torch|tensorflow|keras)/i;

/**
 * Detect the research methodology from a user query.
 * Returns: 'econometrics' | 'statistics' | 'machine_learning' | 'ai'
 */
export function detectResearchMethodology(query: string): 'econometrics' | 'statistics' | 'machine_learning' | 'ai' {
  if (AI_RE.test(query)) return 'ai';
  if (ML_RE.test(query)) return 'machine_learning';
  if (STATS_RE.test(query)) return 'statistics';
  return 'econometrics';
}

/**
 * Detect whether a user query is asking to generate a research paper.
 */
export function isResearchPaperRequest(query: string): boolean {
  // Must have both a generation verb AND a paper noun, OR "surprise" + paper noun
  const hasVerb = PAPER_VERBS.test(query);
  const hasNoun = PAPER_NOUNS.test(query);
  const hasSurprise = SURPRISE_RE.test(query);
  return (hasVerb && hasNoun) || (hasSurprise && hasNoun) || (hasSurprise && hasVerb);
}

/**
 * Call Opus (non-streaming) to upgrade a vague research prompt into a
 * detailed, specific research specification that will produce a better paper.
 *
 * @param originalQuery - The user's raw prompt
 * @param userApiKey - Optional user-provided API key
 * @returns The upgraded prompt, or the original if upgrade fails
 */
export async function upgradeResearchPrompt(
  originalQuery: string,
  userApiKey?: string,
): Promise<{ upgraded: string; wasUpgraded: boolean }> {
  const isSurprise = SURPRISE_RE.test(originalQuery);

  // Detect methodology from query
  const isStats = STATS_RE.test(originalQuery);
  const isML = ML_RE.test(originalQuery);
  const isAI = AI_RE.test(originalQuery);
  const detectedMethod = isAI ? 'ai' : isML ? 'machine_learning' : isStats ? 'statistics' : 'econometrics';

  const now = new Date();
  const isoDate = now.toISOString().split('T')[0];

  // Method-specific prompt sections
  const methodologyGuidance: Record<string, string> = {
    econometrics: `- The suggested methodology must be an econometric model (panel regression, IV/2SLS/GMM, DiD, event study, GARCH, VAR, etc.)
- Include an identification strategy (IV, DiD, event study, natural experiment) or explicit statement that the analysis is correlational
- ALWAYS specify LARGE, DATA-RICH empirical designs:
  * Panel data with 30-80+ assets/countries/firms over 20-30+ years
  * Multiple data sources: combine market prices (EODHD), macro indicators (FRED, IMF, World Bank, OECD), and firm fundamentals (FMP)
  * 15-25+ variables including controls, interaction terms, squared terms, lagged variables
  * At least 6-10 econometric specifications: baseline, with controls, with fixed effects, random effects, IV/GMM, robustness checks
  * Specify diagnostic tests: VIF, heteroskedasticity, serial correlation, Hausman test
  * Request bootstrap confidence intervals and HAC/clustered standard errors
  * Specify mechanism/channel analysis to investigate HOW the effect operates
  * Request sub-sample heterogeneity analysis across at least 4 dimensions`,
    statistics: `- The suggested methodology must center on formal hypothesis testing and statistical inference
- Define null (H₀) and alternative (H₁) hypotheses explicitly
- Specify the statistical tests to use: parametric (t-test, ANOVA, F-test) and non-parametric alternatives (Mann-Whitney, Kruskal-Wallis)
- ALWAYS require:
  * Effect sizes (Cohen's d, η², Cramér's V) alongside p-values
  * 95% confidence intervals for all key estimates
  * Assumption checking: normality (Shapiro-Wilk), homogeneity (Levene's), independence
  * Multiple comparison corrections if testing 3+ hypotheses (Bonferroni, Holm, Tukey HSD)
  * Power analysis or sample size justification
  * Non-parametric robustness for every parametric test
  * Bootstrap confidence intervals (1000+ replications)
  * Sub-group analyses across at least 2 dimensions
- Specify the data sources and expected sample sizes per group
- Request distribution visualization: Q-Q plots, box plots, violin plots, histograms`,
    machine_learning: `- The suggested methodology must center on predictive modeling and model comparison
- Define the prediction task: regression (continuous target) or classification (discrete target)
- Specify the target variable and success metrics:
  * Regression: R², RMSE, MAE, MAPE
  * Classification: accuracy, precision, recall, F1, AUC-ROC
- ALWAYS require:
  * A baseline model (linear/logistic regression or naive predictor)
  * At least 4 models compared: baseline + RandomForest + GradientBoosting/XGBoost + one more (SVM, ElasticNet, LightGBM)
  * k-fold cross-validation (k≥5) or TimeSeriesSplit for temporal data
  * Hyperparameter tuning via GridSearchCV or RandomizedSearchCV
  * Feature importance analysis (built-in + permutation) with economic interpretation
  * Partial dependence plots for top 3-5 features
  * Learning curves showing train vs validation performance
  * Prediction vs actual scatter (regression) or confusion matrix + ROC (classification)
  * Performance stability across 5+ random seeds
  * Feature engineering: 15-25+ features including raw + derived (rolling stats, lags, interactions)
- Specify data sources, time period, and train/test split strategy`,
    ai: `- The suggested methodology must center on neural network architecture design and training
- Define the AI task: classification, regression, representation learning, or generation
- Specify the architecture family: MLP (tabular), CNN (spatial), RNN/LSTM (sequential), or Transformer (attention)
- ALWAYS require:
  * A clear baseline comparison with simpler models (logistic/linear regression + random forest + gradient boosting)
  * Architecture specification: input dim, hidden layers, activations, output dim, total parameters
  * Training protocol: optimizer (Adam), learning rate, batch size, epochs, early stopping
  * Regularization: dropout, weight decay, batch normalization
  * Train/validation/test split (60/20/20 or 70/15/15)
  * Learning curves: training AND validation loss over epochs
  * Ablation study: vary depth (2/4/6 layers), width (32/128/512), regularization
  * Test set evaluation with comprehensive metrics
  * Representation analysis: t-SNE or UMAP of penultimate layer
  * Computational cost reporting: training time, parameter count
  * Feature engineering: 15-25+ input features with normalization
- Specify data sources and expected sample size (neural nets need large datasets)
- PREFER sklearn MLPClassifier/MLPRegressor for tabular data; PyTorch only for custom architectures`
  };

  const systemPrompt = `You are a research prompt architect. Your job is to transform vague or brief research paper requests into detailed, specific research specifications that will guide an autonomous research agent to produce a high-quality academic paper.

Current date: ${isoDate}
Detected methodology: ${detectedMethod}

RULES:
- Output ONLY the upgraded prompt text — no preamble, no explanation, no markdown formatting
- Keep the user's language (if French → respond in French, if English → English)
- The upgraded prompt must specify:
  1. A precise, novel research question (not a survey/review)
  2. The specific domain and sub-field
  3. The dependent and independent variables or theoretical constructs
  4. The suggested methodology — detected as "${detectedMethod}" based on the user's query
  5. The data sources and time period to use
  6. The expected contribution to the literature
  7. 2-3 specific hypotheses or objectives to test
  8. ${detectedMethod === 'econometrics' ? 'An identification strategy (IV, DiD, event study) or explicit correlational statement' : detectedMethod === 'statistics' ? 'Formal null and alternative hypotheses with test selection' : detectedMethod === 'machine_learning' ? 'A prediction target, success metric, and baseline to beat' : 'A modeling objective, architecture choice, and evaluation protocol'}
  9. A clear novel contribution (new measure, new dataset, new mechanism, or new empirical fact — NOT just "apply method X to market Y")

METHODOLOGY-SPECIFIC REQUIREMENTS:
${methodologyGuidance[detectedMethod]}

GENERAL REQUIREMENTS:
- Make the topic timely and publishable in top-tier journals — favor recent phenomena, policy changes, or methodological innovations
- If the user says "surprise" or is vague, pick an original topic appropriate for the ${detectedMethod} methodology
- The upgraded prompt should be 400-700 words — detailed enough to guide the full pipeline
- Request 12-18 publication-quality figures and 8-12 results tables
- Specify that the paper should target 60-90 pages with comprehensive appendices
- Include 4-6 testable hypotheses/objectives organized into primary and secondary groups
- Specify the appendix structure: additional tables, full robustness results, variable construction details
- Do NOT mention that you are upgrading a prompt — write as if the user themselves wrote this detailed request`;

  try {
    const apiKey = userApiKey || ANTHROPIC_API_KEY;
    if (!apiKey) return { upgraded: originalQuery, wasUpgraded: false };

    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: MODEL,
        max_tokens: 2048,
        temperature: 1,
        messages: [
          {
            role: 'user',
            content: isSurprise
              ? `The user wants a surprise research paper. Pick an original, timely, and interesting topic. The detected methodology is "${detectedMethod}" — ${detectedMethod === 'statistics' ? 'focus on hypothesis testing and statistical inference' : detectedMethod === 'machine_learning' ? 'focus on predictive modeling and model comparison' : detectedMethod === 'ai' ? 'focus on neural network design and deep learning' : 'focus on econometric analysis and causal inference'}. Generate a detailed research specification. Original request: "${originalQuery}"`
              : `Upgrade this research paper request into a detailed research specification using the "${detectedMethod}" methodology. Keep the user's intent but make it much more specific and actionable. Original request: "${originalQuery}"`,
          },
        ],
        system: systemPrompt,
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          'content-type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const upgraded = response.data?.content?.[0]?.text?.trim();
    if (upgraded && upgraded.length > 50) {
      console.log(`🔬 [PromptUpgrader] Original (${originalQuery.length} chars) → Upgraded (${upgraded.length} chars)`);
      return { upgraded, wasUpgraded: true };
    }

    return { upgraded: originalQuery, wasUpgraded: false };
  } catch (error: any) {
    console.warn(`⚠️ [PromptUpgrader] Failed to upgrade prompt: ${error?.message || 'unknown error'}`);
    return { upgraded: originalQuery, wasUpgraded: false };
  }
}
