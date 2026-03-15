# Changelog - OnlineVersion (CDN Edition)

## [v1.7.0] - 2026-03-15
> **Note**: v1.6.0 changes are merged into this release and were not published separately.

### 🎉 New Features
- **Growth Trajectory Report Export**: Export simulation results as a standalone HTML report.
  - Includes configuration notes with Markdown rendering (powered by marked.js)
  - Detailed stat configuration (Base %, Conversion Ratio, DR Intervals table)
  - Strategy phase analysis with collapsible cards
  - Four interactive charts:
    - Stat Growth Trajectory (%)
    - Rating Allocation Trajectory
    - Total Yield Growth Curve
    - Marginal Gain Delta (with smoothScores correction)
  - Filename format: `WoW_Stat_Trajectory_Report_{zh|en}_{YY-MM-DD-HH-MM-SS}.html`
  - Full bilingual support (Chinese/English)

- **Markdown Rendering Enhancement**: Integrated marked.js library.
  - Replaced handwritten Markdown parser (~60 lines of code)
  - Full GFM (GitHub Flavored Markdown) support
  - Better handling of edge cases (nested lists, complex code blocks)
  - Support for tables, task lists, footnotes, and more
  - OnlineVersion: loads from CDN `https://cdn.jsdelivr.net/npm/marked/marked.min.js`

### 📊 Stat Updates
- **Updated Base Conversion Ratios** (matching new game values):
  - Critical Strike: 45.99 → **46**
  - Haste: 44.01 → **44**
  - Mastery: 45.99 → **46**
  - Versatility: 53.97 → **54**

- **Updated DR Thresholds**:
  - Critical Strike: base_limit=1380, step_limit=460
  - Haste: base_limit=1320, step_limit=440
  - Mastery: base_limit=1380, step_limit=460
  - Versatility: base_limit=1620, step_limit=540

- **Interval Addition**: Now uses stat-specific `step_limit` instead of fixed 7000

### 🎨 UI/UX Improvements
- **Strategy Phase Collapsible Cards**: 
  - Default collapsed state to save space
  - Click to expand and view detailed stat allocation ranges
  - Rotating chevron icon indicates expand/collapse state
  - Localized stat names (爆击/急速/精通/全能 or Crit/Haste/Mastery/Vers)

- **Formula Display Enhancement**:
  - Total Damage Formula: `D = D₀ × ∏ᵢ StatGainᵢ` (white bold 1.5rem)
  - Stat Gain Formula: `StatGainᵢ ≈ a₂xᵢ² + a₁xᵢ + a₀` (white bold 1.5rem)
  - Uses `≈` symbol for mathematical accuracy (fitting approximation)

- **Full i18n Support**:
  - Export Report button text (导出报告 / Export Report)
  - Config note label and placeholder
  - Add interval button (添加区间 / ADD TIER)
  - All export report sections

### 🐛 Bug Fixes
- **Report Timestamp Timezone**: Fixed inconsistency between Config export (local time) and Report export (UTC).
  - Now both use local time with format `YY-MM-DD-HH-MM-SS`

- **Delta Chart Missing Smooth Correction**: Fixed report's marginal gain chart using raw `scores` instead of smoothed `smoothScores`.
  - Now correctly applies breakpoint smoothing for continuous curves

- **Import Config Notes Not Showing**: Fixed `initStats` always clearing notes, which overrode imported comments.
  - Now checks localStorage and preserves imported notes

### 📁 Files Changed
- `index.html`: Added marked.js CDN reference, Export Report button, data-i18n attributes
- `js/config.js`: I18N dictionary expansion, state initial values update, STAT_CONFIG stat updates
- `js/main.js`: New `exportTrajectoryReport()` and `generateReportHTML()` functions, Markdown rendering, timestamp fixes

---

## [v1.6.0] - 2026-03-14 (Merged into v1.7.0)
### Added
- **Config Import Note with Markdown Support**: New feature for adding and managing configuration notes.
  - Full-width note area below stat cards with left-aligned bold label "注释："
  - Edit/Preview toggle button (eye/pen icons)
  - Markdown rendering support: headers, bold, italic, code, links, lists, blockquotes
  - Auto-resize textarea (max 5 lines, then scroll)
  - Real-time localStorage saving during editing

- **Config Export/Import with Comments**: Enhanced configuration file format.
  - Export includes `#comments:` section at the beginning
  - Each comment line prefixed with `#  `
  - Import automatically parses and displays comments
  - Comments reset to empty on page load/refresh

- **Enhanced Gain Formula Display**: Updated formula rendering.
  - New formula: `StatGain = a_2 x^2 + a_1 x + a_0 (x = stat rating)`
  - Variable changed from `X` to lowercase `x`
  - Large white bold styling (1.5rem, font-weight 900)

### Changed
- **Export Filename Format**: Changed from `WoW_Stat_Config_YYYY-MM-DD.txt` to `WoW_Stat_Config_YY-MM-DD-HH-MM-SS.txt`
  - Now includes timestamp down to seconds for unique filenames

### Fixed
- **Double Export Trigger**: Removed duplicate event binding on export button
  - Removed inline `onclick` from HTML, kept only JS event listener
- **Comment Refresh on Import**: Comments now properly reset when importing config without comments
  - Empty comments clear localStorage and UI

## [v1.5.0-MID] - 2026-03-12
### Changed
- **SimC Import Format Validation**: Added detection for Excel-modified CSV files.
  - Detects trailing commas (empty columns) - a hallmark of Excel's CSV export
  - Detects missing spaces after commas - original SimC format uses ", " while Excel uses ","
  - Shows user-friendly alert with suggestions when Excel format is detected
  - Throws error to prevent parsing corrupted data

### Fixed
- **Data Integrity**: Prevents silent failures when users accidentally save SimC CSV files in Excel

## [v1.5.0] - 2026-02-28
### Added
- **Extension Correction (算法层断点修正)**: Implemented a fundamental fix for breakpoint jumps in the greedy algorithm.
  - Added three new utility functions in `utils.js`:
    - `getBreakpoints(statKey)` - Retrieves all breakpoint limits for a stat
    - `checkBreakpointCrossing(statKey, curX, nextX)` - Detects if a step crosses a breakpoint
    - `getGainWithExtension(statKey, curX, nextX)` - Calculates gain with breakpoint extension correction
  - Modified `solveOptimalDistribution` to use extension-corrected gain calculation
  - **Formula**: `gain = (nextM / curM) × (pM1 / pM2)` where pM1/pM2 is the extension factor

### Changed
- **smoothScores Cumulative Correction**: Fixed the smoothing logic in `generateTrajectory`.
  - **Previous (Buggy)**: Applied correction factor only at the crossing step, causing a spike in the next Delta value
  - **New (Correct)**: Cumulatively applies correction factors for ALL already-crossed breakpoints
  - **Mathematical Principle**: Uses the homogeneity property of finite differences: Δ(k·f) = k·Δ(f)
  - **Result**: Delta chart is now mathematically smooth after breakpoint crossings

### Fixed
- **Delta Chart Spike**: Resolved the artificial spike issue in the Marginal Gain (Delta) chart at breakpoint crossings (e.g., the spike at budget ~25500 for the template.txt case)

### Documentation
- **ProjectLogic.txt**: Added comprehensive analysis of the extension correction and smoothScores evolution (Chapter 11 & 11.9)
- **ProjectStatus_byQwen.md**: Created new project status document with mathematical principles and development log

## [v1.4.1] - 2026-01-28
### Improved
- **Algorithm Convergence**: Optimized the greedy algorithm's stepping logic.
  - Simplified step sizes to `[100, 1]` for better efficiency.
  - Implemented a "Budget Reservation" mechanism for non-final steps (requiring `available >= step * 2`), forcing the algorithm to pass sufficient budget to the finest granularity (step=1) to prevent "whole number" overshoot errors.
- **Marginal Gain Chart**: Fixed artificial spikes in the "Delta" chart caused by SimC fitting breakpoints.
  - Implemented a "Parallel Smoothing" technique: While the main Yield Chart retains the authentic (jumping) simulation data, the Delta Chart now uses a mathematically corrected "Smooth Score" curve.
  - This correction uses "Ratio Alignment" at breakpoints to create a continuous derivative, ensuring the marginal gain curve accurately reflects diminishing returns without fitting artifacts.

### Fixed
- **Chart Logic**: Fixed a reference error (`traj is not defined`) in `openTrajectoryModal` when rendering charts.

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