// Python Executor - Modular version
// Original file split into 4 modules for better maintainability
// See server/services/python/ for implementation details

// Export refactored modules
export * from './python/index';

// Export legacy functions not yet refactored
export {
  executePortfolioOptimization,
  executeRiskMetricsAnalysis,
  executePlot,
  executeVolatilitySurface,
  executeDataDownload,
  executeCustomPython
} from './pythonExecutor.legacy';

// Export types from legacy
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
  CustomPythonExecutionResult
} from './pythonExecutor.legacy';
