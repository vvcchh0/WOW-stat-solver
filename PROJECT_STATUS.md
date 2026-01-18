# Project Status & Architecture Log

**Last Updated:** 2026-01-18 (End of Session)
**Project:** WoW Stat Solver

## 1. Directory Structure
The project follows a "Monorepo-like" structure to support both offline and online usage.

```text
Root/
├── index.html          # [NEW] Portal page to select between Online/Local versions
├── README.md           # [NEW] Project documentation
├── PROJECT_STATUS.md   # This file
│
├── LocalVersion/       # [Offline] Fully localized, zero dependencies
│   ├── index.html
│   ├── changelog.md    # Version history for Local build
│   ├── css/vendor/     # Localized fonts & styles
│   └── js/vendor/      # Localized libs (Tailwind, Chart.js, KaTeX)
│
└── OnlineVersion/      # [Online] CDN-based, lightweight
    ├── index.html
    ├── changelog.md    # Version history for Online build
    └── js/             # Synced logic with LocalVersion
```

## 2. Recent Work (Completed)
*   **Restructuring**: Renamed folders to `LocalVersion` / `OnlineVersion`. Created root portal and documentation.
*   **Dependency Management**: Fully downloaded all assets for `LocalVersion` (including complex Google Fonts slicing and KaTeX fonts).
*   **Code Cleanup**: Standardized to single entry point (`main.js`) and removed obsolete files.
*   **Documentation & Sync**:
    *   **Core Files**: Added comprehensive JSDoc comments to `config.js`, `utils.js`, `solver.js`, `charts.js`, and `main.js`.
    *   **Cross-Version Sync**: All logic files are now synchronized between `LocalVersion` and `OnlineVersion`.

## 3. Pending Tasks (Next Session)
*   **Final Review**: Verify `OnlineVersion` functionality in browser.
*   **Feature Expansion**: Consider adding "Stat Priority" suggestions based on weight trends.

## 4. How to Resume
1.  **Read this file**: `read_file PROJECT_STATUS.md`
2.  **Continue Annotation**: Start with `LocalVersion/js/solver.js`.
