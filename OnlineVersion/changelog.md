# Changelog - OnlineVersion (Online Edition)

## [v1.3.0] - 2026-01-24
### Added
- **Strategy Phase Analysis**: Integrated strategy phase detection and detailed breakpoint lists into the Trajectory modal.
- **SimC Fit Control**: Added dropdown to choose between Smart and Forced Linear fitting in the SimC import workflow.
- **Interactive UI**: Added tooltips to both the strategy bar and the detailed breakpoint list showing start/end stat distributions.

### Changed
- **Logic Synchronization**: All core solver and chart updates (step size 1, 500-step resolution, live fitting) synced from LocalVersion.
- **Precision Enhancement**: Refined greedy algorithm for single-digit accuracy.
- **Improved Fitting**: Relaxed linear regression threshold to 0.99 for more consistent modeling across different specs.

## [v1.2.1] - 2026-01-19
### Fixed
- **Strict Mode Compliance**: Resolved 100+ VSCode strict mode (`checkJs: true`) errors across all JS files.
- **Type Safety**: Added explicit JSDoc type definitions and casts for DOM elements, global variables, and complex object indexing.
- **Global Conflicts**: Removed redundant `var` declarations in `utils.js` to prevent browser console errors while maintaining editor intellisense.

## [v1.2.0] - 2026-01-19
### Changed
- **Code Quality**: Performed a thorough code cleanup and added comprehensive JSDoc documentation to all core logic files.
- **Logic Sync**: Fully synchronized core logic files (`solver.js`, `charts.js`, `main.js`, `config.js`, `utils.js`) with the Localized version.
- **Refactoring**: Improved internal function consistency and parameter documentation.

## [v1.1.0] - 2026-01-18
### Changed
- **Directory Structure**: Moved to a dedicated `OnlineVersion/` folder for better project organization.
- **Renaming**: Renamed directory from `@OnlineVersion` to `OnlineVersion` for clarity.
- **Entry Point Refactoring**: Synchronized with the latest logic.
  - Deleted the redundant `main.js`.
  - Renamed `main2.js` to `main.js` to standardize the codebase.
- **Dependency Management**: Maintained optimized CDN links (tailwindcss.com, jsdelivr, cdnjs) to keep the package size minimal.

### Fixed
- **Module Coordination**: Updated `index.html` to point to the new `js/main.js` entry point.

---
## [v1.0.0] - Initial State
- Original implementation using CDN resources and multiple script files.
