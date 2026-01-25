# Project Status & Architecture Log

**Last Updated:** 2026-01-25
**Project:** WoW Stat Solver
**Current Version:** v1.4.0

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
*   **Core Math & DR Logic**:
    *   **New DR Curve**: Implemented a comprehensive custom DR curve (30-40% @ 0.9 ... 80-200% @ 0.5).
    *   **Mastery Scaling**: Added dynamic scaling for Mastery thresholds based on conversion ratios.
    *   **Reverse Calculation**: Added `percentToRating` and `getPanelRating` to support reverse-deriving Rating from Panel Percent.
*   **UI/UX Improvements**:
    *   **TOTAL Mode Overhaul**: "Custom Build" inputs in TOTAL mode now accept Panel Percent and auto-calculate/display the corresponding "Base + Allocated" Rating.
    *   **Visual Enhancements**: Added bold/white styling to active mode buttons, centralized numeric inputs, and optimized input prefixes for better alignment.
    *   **Localization**: Full localization for Chart titles, Strategy Phases, and Tooltips.
    *   **Clean Up**: Hidden numeric input spinners and suppressed Tailwind CDN warnings.
*   **Code Quality**:
    *   **Strict Type Checking**: Fixed all JSDoc type errors in `utils.js`, `solver.js`, `charts.js`, and `main.js` to satisfy strict compiler checks.
    *   **Documentation**: Updated `structure.md` with new utility functions.

## 3. Pending Tasks
*   **Future Feature**: Specialized "Trinket/Proc" simulation support.
*   **Refactoring**: Potential ESM migration (low priority).

## 4. How to Resume
1.  **Read this file**: `read_file PROJECT_STATUS.md`
2.  **Verify Parity**: Ensure any new logic is applied to both versions.
3.  **Check Changelog**: Refer to `LocalVersion/changelog.md` for detailed version history.