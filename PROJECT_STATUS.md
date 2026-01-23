# Project Status & Architecture Log

**Last Updated:** 2026-01-24
**Project:** WoW Stat Solver
**Current Version:** v1.3.0

## 1. Directory Structure
The project follows a "Monorepo-like" structure to support both offline and online usage.

```text
Root/
├── index.html          # Portal page
├── README.md           # Project documentation
├── PROJECT_STATUS.md   # Current file
├── .gitignore          # Git exclusion rules
│
├── LocalVersion/       # [Offline] Fully localized, zero dependencies
│   ├── index.html
│   ├── changelog.md    # Version history
│   ├── jsconfig.json   # VSCode Type Checking Config (Strict)
│   ├── css/vendor/     # Localized fonts & styles
│   └── js/vendor/      # Localized libs (Tailwind, Chart.js, KaTeX)
│
└── OnlineVersion/      # [Online] CDN-based, lightweight
    ├── index.html
    ├── changelog.md
    ├── jsconfig.json   # VSCode Type Checking Config (Strict)
    └── js/             # Synced logic with LocalVersion
```

## 2. Recent Work (Completed)
*   **Stat Priority Engine & Analysis**:
    *   Implemented high-resolution (Step: 500) Growth Trajectory simulation.
    *   Developed a **Strategy Phase Analyzer** to identify "Single-stat" vs "Hybrid" allocation phases.
    *   Added visual "Strategy Phase Bar" and "Phase Details List" with tooltips for precise budget planning.
*   **SimC Import Optimization**:
    *   Added **Fit Strategy Selector**: "Smart (Auto)" (Linear if $R^2 \ge 0.99$, else Quadratic) and "Force Linear".
    *   Implemented **Real-time Re-fitting**: Charts and models update instantly upon changing Base Ratings or Fit Strategy.
    *   Cached raw SimC data for seamless on-the-fly analysis.
*   **Algorithm & Precision**:
    *   Improved Greedy Algorithm precision by adding a $1$ unit step size (`[100, 25, 5, 1]`).
    *   Relaxed linear fit threshold to $0.99$ for better stability.
*   **Documentation**:
    *   Completed LaTeX documentation parts 1-3 covering definitions, core logic, UI features, and advanced analysis tools.
    *   Standardized all LaTeX equations in `原理2.tex` to be flush-left using `flalign*`.

## 3. Pending Tasks
*   **UI/UX Polish**: Refine transition animations for the dashboard (if needed) and ensure cross-browser compatibility for the new phase bar.
*   **Logic Modularization**: Consider transition to ES Modules (ESM) if the environment allows, to remove global variable dependencies.

## 4. How to Resume
1.  **Read this file**: `read_file PROJECT_STATUS.md`
2.  **Verify Parity**: Ensure any new logic is applied to both versions.
3.  **Future Feature**: Start implementing specialized "Trinket/Proc" simulation support if requested.