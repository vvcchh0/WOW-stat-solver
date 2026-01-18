# Changelog - LocalVersion (Localized Edition)

## [v1.2.0] - 2026-01-19
### Added
- **Code Documentation**: Added comprehensive JSDoc annotations to all core logic files (`solver.js`, `charts.js`, `main.js`, `config.js`, `utils.js`).
  - Detailed descriptions for the Greedy Algorithm and Multi-stat Fitting logic.
  - Parameter and return type definitions for better IDE support.

### Changed
- **Code Quality**: Performed a thorough code cleanup, removing redundant comments and standardizing code formatting.
- **Logic Sync**: Fully synchronized core logic files with the Online version.

## [v1.1.0] - 2026-01-18
### Added
- **Full Localization**: Downloaded and internalized all external dependencies.
  - JS: Tailwind CSS, Chart.js, KaTeX.
  - CSS: KaTeX styles.
  - Fonts: Google Fonts (Inter, JetBrains Mono) - 46 slices, Font Awesome 6.4.0 (Solid, Regular, Brands).
- **Directory Structure**: Created `js/vendor/` and `css/vendor/` to organize localized assets.

### Changed
- **Renaming**: Renamed directory from `@LocalVersion` to `LocalVersion` for clarity.
- **Entry Point Refactoring**: Deleted obsolete `main.js` and renamed `main2.js` to `main.js` for a cleaner architecture.
- **Resource Path Fixes**: Corrected relative paths in `google-fonts.css` and linked them to `css/vendor/fonts/`.
- **Offline Support**: Updated `index.html` to reference all assets locally.

### Fixed
- **Font Rendering**: Resolved `ERR_FILE_NOT_FOUND` by downloading missing KaTeX font files (.woff2, .woff, .ttf) and correcting CSS relative paths.
- **Console Errors**: Fixed all missing resource errors in the developer console.

---
## [v1.0.0] - Initial State
- Original implementation with mixed JS files and CDN dependencies.