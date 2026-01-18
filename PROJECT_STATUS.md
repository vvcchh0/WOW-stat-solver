# Project Status & Architecture Log

**Last Updated:** 2026-01-19 (End of Session)
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
*   **Code Documentation**: Added comprehensive JSDoc comments to `config.js`, `utils.js`, `solver.js`, `charts.js`, and `main.js`.
*   **Strict Type Safety**: Enabled `checkJs: true` and `strict: true` in `jsconfig.json`. Resolved 100+ type errors by adding explicit JSDoc casts and handling global variable definitions.
*   **Cross-Version Sync**: All logic files and bug fixes are perfectly synchronized between `LocalVersion` and `OnlineVersion`.
*   **Browser Compatibility**: Ensured no "redeclaration" errors occur in the browser console by cleaning up variable declarations in `utils.js`.

## 3. Pending Tasks (Next Session)
*   **Feature Expansion**: Consider adding "Stat Priority" suggestions based on weight trends.
*   **Unit Tests**: Explore adding a lightweight testing framework (like Jasmine or a custom runner) to verify solver logic automatically.

## 4. How to Resume
1.  **Read this file**: `read_file PROJECT_STATUS.md`
2.  **Next Step**: Start implementing new features or tests.