/**
 * Packaging — creates ZIP archives of the full research paper project.
 *
 * Exports createProjectZip() which bundles paper.tex, figures, code/,
 * data/ (raw + processed), compiled PDF, run_pipeline.py, requirements.txt,
 * and README.md following the Reproducible Research Engine (RRE) structure.
 */
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Create a ZIP archive of the full research paper project following
 * the Reproducible Research Engine (RRE) directory structure:
 *
 *   - paper.tex, references.bib (LaTeX source)
 *   - outputs/figures/   (all .png from workDir)
 *   - code/              (pipeline-ordered Python scripts: 01_, 02_, 03_)
 *   - data/raw/api/      (API-sourced datasets + metadata)
 *   - data/raw/web/      (web-scraped datasets + metadata)
 *   - data/processed/    (cleaned/merged datasets + metadata)
 *   - outputs/paper.pdf  (compiled PDF)
 *   - run_pipeline.py    (master reproducibility pipeline)
 *   - requirements.txt   (Python dependencies)
 *   - README.md          (build instructions)
 */
export async function createProjectZip(
  workDir: string,
  pdfPath: string,
  pythonScripts: { filename: string; code: string }[],
  projectName: string,
  sessionDataFiles?: { filename: string; filepath: string; data_type?: string }[],
  sessionMetadata?: Array<{ filename: string; metadata: any }>,
): Promise<string> {
  const safeName = projectName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.zip$/i, '');
  const zipPath = path.join(path.resolve('downloads'), `${Date.now()}_${safeName}_project.zip`);
  const rootFolder = `${safeName}-project`;

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 6 } });

    output.on('close', () => resolve(zipPath));
    archive.on('error', (err: Error) => reject(err));
    archive.pipe(output);

    // 1. LaTeX source files
    const texFile = path.join(workDir, 'paper.tex');
    if (fs.existsSync(texFile)) {
      archive.file(texFile, { name: `${rootFolder}/paper.tex` });
    }
    const bibFile = path.join(workDir, 'references.bib');
    if (fs.existsSync(bibFile)) {
      archive.file(bibFile, { name: `${rootFolder}/references.bib` });
    }

    // 2. Figures → outputs/figures/
    const figFiles = fs.readdirSync(workDir).filter(f => f.endsWith('.png'));
    for (const fig of figFiles) {
      archive.file(path.join(workDir, fig), { name: `${rootFolder}/outputs/figures/${fig}` });
    }

    // 3. Python scripts → code/ (pipeline-ordered: 01_data_collection, 02_data_cleaning, 03_analysis)
    const scriptFilenames: string[] = [];
    for (const script of pythonScripts) {
      archive.append(script.code, { name: `${rootFolder}/code/${script.filename}` });
      scriptFilenames.push(script.filename);
    }

    // 4. Compiled PDF → outputs/
    if (fs.existsSync(pdfPath)) {
      archive.file(pdfPath, { name: `${rootFolder}/outputs/paper.pdf` });
    }

    // 5. Data directory — structured for reproducibility
    const dataFileNames = new Set<string>(); // deduplicate by filename

    // 5a. Check workDir for data files (from direct saves — backward compat)
    const workDirDataFiles = fs.readdirSync(workDir).filter(f =>
      f.endsWith('.csv') || f.endsWith('.parquet') || f.endsWith('.feather') || f.endsWith('.pkl') || f.endsWith('.xlsx') || f.endsWith('.tsv') || (f.endsWith('.json') && f !== 'package.json')
    );
    for (const df of workDirDataFiles) {
      archive.file(path.join(workDir, df), { name: `${rootFolder}/data/${df}` });
      dataFileNames.add(df);
    }

    // 5b. Include session-tracked data files with structured subdirectories
    if (sessionDataFiles && sessionDataFiles.length > 0) {
      for (const df of sessionDataFiles) {
        if (!dataFileNames.has(df.filename) && fs.existsSync(df.filepath)) {
          // Route to appropriate subdirectory based on data_type from Python executor
          let subdir = 'data'; // fallback: flat (backward compat)
          if (df.data_type === 'raw/api' || df.data_type === 'raw/web') {
            subdir = `data/${df.data_type}`;
          } else if (df.data_type === 'processed') {
            subdir = 'data/processed';
          } else if (df.data_type === 'metadata') {
            subdir = 'data/metadata';
          }
          archive.file(df.filepath, { name: `${rootFolder}/${subdir}/${df.filename}` });
          dataFileNames.add(df.filename);
        }
      }
    }

    const allDataFiles = Array.from(dataFileNames);

    // Collect metadata source summaries for README
    const metadataSources = sessionMetadata
      ?.filter(m => m.metadata?.source && m.metadata?.source !== 'processed')
      .map(m => `${m.metadata.source} (${m.metadata.method || 'unknown'}, ${m.metadata.rows || '?'} rows)`)
      || [];

    // 6. run_pipeline.py — Reproducible Research Engine master script
    const runPipelinePy = `#!/usr/bin/env python3
"""
run_pipeline.py — AutoScholar Reproducible Research Pipeline

Executes all analysis scripts in pipeline order to regenerate
the complete research output from raw data.

Pipeline stages:
  01_data_collection  — Fetch raw data from APIs and web sources
  02_data_cleaning    — Clean, merge, and construct variables
  03_analysis         — Run econometric models and robustness checks

Usage:
    pip install -r requirements.txt
    python run_pipeline.py
"""
import subprocess
import sys
import os
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
CODE_DIR = os.path.join(ROOT, 'code')
DATA_DIR = os.path.join(ROOT, 'data')
OUTPUT_DIR = os.path.join(ROOT, 'outputs')

# Create reproducibility directory structure
for d in [
    os.path.join(DATA_DIR, 'raw', 'api'),
    os.path.join(DATA_DIR, 'raw', 'web'),
    os.path.join(DATA_DIR, 'processed'),
    os.path.join(OUTPUT_DIR, 'figures'),
    os.path.join(OUTPUT_DIR, 'tables'),
    os.path.join(OUTPUT_DIR, 'logs'),
]:
    os.makedirs(d, exist_ok=True)

# Discover pipeline scripts (sorted alphabetically = pipeline order via 01_, 02_, 03_ prefixes)
scripts = sorted([
    f for f in os.listdir(CODE_DIR)
    if f.endswith('.py')
]) if os.path.isdir(CODE_DIR) else []

print("=" * 60)
print("  AutoScholar — Reproducible Research Pipeline")
print("=" * 60)
print(f"\\nFound {len(scripts)} pipeline stage(s) to execute\\n")

failed = []
timings = []
for i, script in enumerate(scripts, 1):
    script_path = os.path.join(CODE_DIR, script)
    stage = script.split('_')[0] if '_' in script else '??'
    print(f"[{i}/{len(scripts)}] Stage {stage}: {script}")

    start = time.time()
    result = subprocess.run(
        [sys.executable, script_path],
        capture_output=True, text=True, timeout=600,
        env={**os.environ, 'DATA_DIR': DATA_DIR, 'OUTPUT_DIR': OUTPUT_DIR},
    )
    elapsed = time.time() - start
    timings.append((script, elapsed))

    if result.returncode != 0:
        print(f"  ERROR ({elapsed:.1f}s): {result.stderr[:500]}")
        failed.append(script)
        # Log error to outputs/logs/
        log_path = os.path.join(OUTPUT_DIR, 'logs', f'{script}.error.log')
        with open(log_path, 'w') as f:
            f.write(f"STDERR:\\n{result.stderr}\\nSTDOUT:\\n{result.stdout}")
    else:
        print(f"  OK ({elapsed:.1f}s, {len(result.stdout)} chars output)")

# Pipeline summary
print("\\n" + "=" * 60)
print(f"  Pipeline complete: {len(scripts) - len(failed)}/{len(scripts)} stages succeeded")
if timings:
    total = sum(t for _, t in timings)
    print(f"  Total time: {total:.1f}s")
print("=" * 60)

if failed:
    print(f"\\nFailed stages: {', '.join(failed)}")
    print("Check outputs/logs/ for error details.")
    sys.exit(1)

# Verify reproducibility: check key outputs exist
checks = []
processed_dir = os.path.join(DATA_DIR, 'processed')
if os.path.isdir(processed_dir) and os.listdir(processed_dir):
    checks.append("data/processed/ contains files")
else:
    checks.append("WARNING: data/processed/ is empty — Newton stage may not have saved processed data")
fig_dir = os.path.join(OUTPUT_DIR, 'figures')
if os.path.isdir(fig_dir) and os.listdir(fig_dir):
    checks.append(f"outputs/figures/ contains {len(os.listdir(fig_dir))} file(s)")

if checks:
    print("\\nReproducibility checks:")
    for c in checks:
        print(f"  {'✓' if not c.startswith('WARNING') else '!'} {c}")

# Recompile LaTeX if pdflatex is available
import shutil
if shutil.which('pdflatex'):
    print("\\nRecompiling LaTeX...")
    for _ in range(3):
        subprocess.run(['pdflatex', '-interaction=nonstopmode', 'paper.tex'],
                       cwd=ROOT, capture_output=True, timeout=60)
    bib = os.path.join(ROOT, 'references.bib')
    if os.path.exists(bib) and shutil.which('bibtex'):
        subprocess.run(['bibtex', 'paper'], cwd=ROOT, capture_output=True, timeout=30)
        for _ in range(2):
            subprocess.run(['pdflatex', '-interaction=nonstopmode', 'paper.tex'],
                           cwd=ROOT, capture_output=True, timeout=60)
    pdf = os.path.join(ROOT, 'paper.pdf')
    out_pdf = os.path.join(OUTPUT_DIR, 'paper.pdf')
    if os.path.exists(pdf):
        shutil.copy2(pdf, out_pdf)
        print(f"PDF compiled successfully → outputs/paper.pdf")
    else:
        print("WARNING: LaTeX compilation failed. Check paper.log for errors.")
else:
    print("\\npdflatex not found — skipping LaTeX recompilation.")
    print("Install TeX Live or MacTeX to recompile the paper.")
`;
    archive.append(runPipelinePy, { name: `${rootFolder}/run_pipeline.py` });

    // 7. requirements.txt
    const commonPackages = new Set<string>();
    const importRe = /^(?:import|from)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gm;
    const STDLIB = new Set(['os', 'sys', 'json', 'math', 'datetime', 're', 'io', 'base64',
      'collections', 'itertools', 'functools', 'warnings', 'pickle', 'pathlib',
      'subprocess', 'shutil', 'tempfile', 'time', 'copy', 'csv', 'string', 'textwrap']);
    const PKG_MAP: Record<string, string> = {
      'np': 'numpy', 'numpy': 'numpy', 'pd': 'pandas', 'pandas': 'pandas',
      'plt': 'matplotlib', 'matplotlib': 'matplotlib', 'sns': 'seaborn', 'seaborn': 'seaborn',
      'scipy': 'scipy', 'sklearn': 'scikit-learn', 'statsmodels': 'statsmodels',
      'arch': 'arch', 'xgboost': 'xgboost', 'xgb': 'xgboost',
      'lightgbm': 'lightgbm', 'lgb': 'lightgbm',
      'plotly': 'plotly', 'networkx': 'networkx', 'sympy': 'sympy',
      'ta': 'ta', 'yfinance': 'yfinance', 'numba': 'numba',
      'pypfopt': 'pyportfolioopt', 'cvxpy': 'cvxpy', 'riskfolio': 'riskfolio-lib',
    };
    for (const script of pythonScripts) {
      let match;
      while ((match = importRe.exec(script.code)) !== null) {
        const mod = match[1];
        if (!STDLIB.has(mod)) {
          const pkg = PKG_MAP[mod] || mod;
          commonPackages.add(pkg);
        }
      }
    }
    ['numpy', 'pandas', 'matplotlib', 'scipy', 'pyarrow'].forEach(p => commonPackages.add(p));
    const requirements = Array.from(commonPackages).sort().join('\n') + '\n';
    archive.append(requirements, { name: `${rootFolder}/requirements.txt` });

    // 8. README — Reproducible Research Engine documentation
    const readme = `# ${safeName}

Research paper generated by AutoScholar — Reproducible Research Engine.

## Project Structure

\`\`\`
${rootFolder}/
├── paper.tex              # Main LaTeX source
├── references.bib         # BibTeX bibliography
├── data/
│   ├── raw/
│   │   ├── api/           # API-sourced datasets + provenance metadata
│   │   └── web/           # Web-scraped datasets + provenance metadata
│   └── processed/         # Cleaned, merged datasets (CSV + Parquet)
├── code/                  # Reproducible analysis pipeline
${scriptFilenames.map(f => `│   ├── ${f}`).join('\n') || '│   └── (no scripts)'}
├── outputs/
│   ├── figures/           # Publication-quality figures
│   ├── tables/            # Regression tables and statistics
│   ├── logs/              # Pipeline execution logs
│   └── paper.pdf          # Compiled PDF
├── run_pipeline.py        # Master reproducibility script
├── requirements.txt       # Python dependencies
└── README.md              # This file
\`\`\`

## Reproducibility — Full Pipeline

\`\`\`bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the complete reproducibility pipeline
python run_pipeline.py
\`\`\`

The pipeline executes scripts in order:
1. **01_data_collection.py** — Fetches raw data from APIs and web sources
2. **02_data_cleaning.py** — Cleans, merges, and constructs variables
3. **03_analysis.py** — Runs econometric models, generates figures and tables

Each stage saves its outputs to \`data/\` with provenance metadata (JSON sidecars)
documenting the source, timestamp, and transformations applied.

## Manual Steps

### Run individual pipeline stages

\`\`\`bash
${scriptFilenames.map(f => `python code/${f}`).join('\n')}
\`\`\`

### Recompile LaTeX

\`\`\`bash
pdflatex -interaction=nonstopmode paper.tex
${fs.existsSync(path.join(workDir, 'references.bib')) ? 'bibtex paper\npdflatex -interaction=nonstopmode paper.tex' : '# No bibliography — skip bibtex'}
pdflatex -interaction=nonstopmode paper.tex
pdflatex -interaction=nonstopmode paper.tex
\`\`\`

## Data Provenance

${metadataSources.length > 0
      ? `Datasets were collected from the following sources:\n${metadataSources.map(s => `- ${s}`).join('\n')}\n\nEach dataset includes a \`*_metadata.json\` sidecar file with full provenance (source URL, collection timestamp, method, row count).`
      : `Datasets were collected via AutoScholar's API integrations (FMP, EODHD, FRED, World Bank, IMF, OECD).\n${allDataFiles.length > 0 ? 'Pre-collected datasets are included in the \\`data/\\` directory.' : 'Run the pipeline to regenerate datasets from the original API sources.'}`}

## Requirements

- Python 3.10+
- TeX Live 2024+ or MacTeX (for PDF compilation)
- See \`requirements.txt\` for Python packages

---
*Generated by AutoScholar — Reproducible Research Engine*
*https://autoscholar.ai*
`;
    archive.append(readme, { name: `${rootFolder}/README.md` });

    archive.finalize();
  });
}
