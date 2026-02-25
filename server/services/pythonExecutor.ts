// Python Executor - Modular re-exports
// Implementations are in server/services/python/

export * from './python/index';

export {
  executePortfolioOptimization,
  executeRiskMetricsAnalysis,
  executePlot,
  executeVolatilitySurface,
  executeDataDownload,
  executeCustomPython,
} from './python/var';

export type {
  PortfolioOptimizerInput,
  PortfolioOptimizerResult,
  PortfolioOptimizerExecutionResult,
  RiskMetricsInput,
  RiskMetricsResult,
  RiskMetricsExecutionResult,
  PlotInput,
  PlotResult,
  PlotExecutionResult,
  VolatilitySurfaceInput,
  VolatilitySurfaceResult,
  VolatilitySurfaceExecutionResult,
  DataDownloadInput,
  DataDownloadResult,
  DataDownloadExecutionResult,
  CustomPythonInput,
  CustomPythonResult,
} from './python/var';
