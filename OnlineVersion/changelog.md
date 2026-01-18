# Changelog - OnlineVersion (Online Edition)

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