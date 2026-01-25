# Changelog - LocalVersion (Localized Edition)

## [v1.4.0] - 2026-01-25
### Added
- **Custom DR Logic**: Implemented a new, non-linear Diminishing Returns (DR) curve logic with custom efficiency tiers (30-40% @ 0.9, ... 80-200% @ 0.5).
- **Mastery Scaling**: Added logic to dynamically scale Mastery DR thresholds based on its conversion ratio relative to Crit.
- **Reverse Math Utils**: Added `getPanelRating` and `percentToRating` to reverse-calculate Rating from Panel %.
- **UI Localization**: Added full localization support for Chart titles ("Growth Trajectory", etc.) and Strategy Phase labels ("Single", "Mixed", "Crit + Haste").
- **TOTAL Mode Interactions**: Completely reworked "Custom Build" inputs in TOTAL mode to accept Panel Percent values, automatically calculating and displaying the breakdown of "Base + Allocated" rating.

### Changed
- **UI Styling**: 
  - Centralized text alignment for Budget and Stat Base inputs.
  - Enhanced contrast (Bold/White) for active Mode toggle buttons.
  - Optimized layout for input prefixes to ensure single-line display.
  - Hidden numeric input spinners for a cleaner look.
- **Chart Precision**: Marginal Delta chart tooltips now display 4 decimal places for precision.
- **Project Structure**: Updated `structure.md` to reflect new utility functions.

### Fixed
- **Compiler Errors**: Resolved all JSDoc/TypeScript strict mode errors in `utils.js`, `solver.js`, `charts.js`, and `main.js`.
- **Tailwind Warning**: Suppressed the console warning regarding Tailwind CDN usage in production.

## [v1.3.0] - 2026-01-24
### Added
- **Strategy Phase Analysis**: New feature in Growth Trajectory to automatically identify and list allocation strategies (Single/Hybrid) across different budget ranges.
- **Strategy Phase Bar**: A color-coded bar below the trajectory chart for visual strategy overview.
- **Phase Details List**: A detailed breakdown of strategy breakpoints with start/end stat tooltips.
- **SimC Fit Strategy Selector**: Added "Smart (Auto)" and "Force Linear" modes to the SimC import modal for more stable allocation results.
- **X-Axis for Strategy Bar**: Added budget markers (5k - 60k) for better orientation.

### Changed
- **Algorithm Precision**: Updated greedy search steps to `[100, 25, 5, 1]` to ensure single-unit precision in final results.
- **Trajectory Resolution**: Increased data points in Growth Trajectory by reducing step size from 2000 to 500.
- **Live Fitting**: The SimC import preview now updates in real-time when modifying Base Ratings or Fit Strategy.
- **UI Tweaks**: Budget slider step changed to 1 for precise pool management.

### Fixed
- **Strategy Merging**: Fixed fragmented strategy intervals by sorting stat names in hybrid labels (e.g., merging "A+B" and "B+A").
- **Fitting Threshold**: Relaxed linear fitting threshold to 0.99 for improved model robustness.

## [v1.2.1] - 2026-01-19
### Fixed
- **Strict Mode Compliance**: Resolved 100+ VSCode strict mode (`checkJs: true`) errors across all JS files.
- **Type Safety**: Added explicit JSDoc type definitions and casts for DOM elements, global variables, and complex object indexing.
- **Global Conflicts**: Removed redundant `var` declarations in `utils.js` to prevent browser console errors while maintaining editor intellisense.

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