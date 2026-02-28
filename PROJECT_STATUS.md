# Project Status & Architecture Log

**Last Updated:** 2026-01-28
**Project:** WoW Stat Solver
**Current Version:** v1.4.1

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
*   **Mathematical Rigor & Documentation**:
    *   **Theoretical Proof**: Established a rigorous mathematical proof for the greedy algorithm's correctness, based on Path Independence and Convexity/Synergy (Negative Hessian Feedback). Documented in `principle.md`.
    *   **Smooth Delta Derivative**: Solved the issue of artificial spikes in marginal gain charts caused by SimC fitting breakpoints. Implemented a parallel "Smooth Score" calculation using ratio alignment to generate a mathematically continuous derivative for visualization, while keeping the main yield chart authentic.
*   **Algorithm Optimization**:
    *   **Convergence Precision**: Simplified the greedy step sequence to `[100, 1]` and introduced a budget reservation logic (`available >= step * 2`) to ensure the final granularity is always handled by the finest step, eliminating overshoot errors.
*   **Core Math & DR Logic** (v1.4.0):
    *   **New DR Curve**: Implemented a comprehensive custom DR curve (30-40% @ 0.9 ... 80-200% @ 0.5).
    *   **Mastery Scaling**: Added dynamic scaling for Mastery thresholds based on conversion ratios.
    *   **Reverse Calculation**: Added `percentToRating` and `getPanelRating` to support reverse-deriving Rating from Panel Percent.

## 3. Pending Tasks
*   **Data Update**: Update SimC data files to reflect the latest game patch/simulation results.
*   **Future Feature**: Specialized "Trinket/Proc" simulation support.
*   **Refactoring**: Potential ESM migration (low priority).

## 4. How to Resume
1.  **Read this file**: `read_file PROJECT_STATUS.md`
2.  **Verify Parity**: Ensure any new logic is applied to both versions.
3.  **Check Changelog**: Refer to `LocalVersion/changelog.md` for detailed version history.
4.  **Next Step**: Prepare and inject new data files (SimC exports) for the next release.