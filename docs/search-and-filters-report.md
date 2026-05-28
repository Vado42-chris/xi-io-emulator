# Search & Filters Implementation Report: Submerged Indexing, Multi-criteria Discovery & Duplicate Advisory (XARCADE-SEARCH-001)

This report documents the design, architecture, and verification of the local search, filtering, sorting, and duplicate-candidate advisory system for the **xi-io Arcade Shell**.

---

## 1. Milestone Overview

The goal of **XARCADE-SEARCH-001** was to implement a performant, local search index and robust discovery suite to manage ingressed game records. We implemented:
- **Submerged Search Indexing Layer (`searchService.ts`)**: Built a typed search document (`GameSearchDocument`) representation that pre-compiles and indexes textual attributes for fast, token-based multi-word search matching.
- **Multi-criteria Filtering & Dropdowns (`AppShell.tsx` & `LibraryGrid.tsx`)**: Created new interactive UI controls, category tabs, and dropdown selectors for filtering by System ID, Launch Status, and Metadata Identity Status.
- **Custom Sort Engine**: Integrated support for sorting games alphabetically by title, by addition/play dates, play count, and launch status priorities.
- **Duplicate Candidate Advisory Banner**: Designed a non-destructive warning banner pointing out title groups sharing the same normalized title and target console platform, allowing users to toggle and isolate candidates for review.

---

## 2. Architecture & Service Layer

We adopted a decoupled, "Iceberg" design where thin UI views consume calculated search indexes from a stateless service layer.

### A. Typed Search Indexing (`src/services/searchService.ts`)
- **`GameSearchDocument`**: Flattens relevant `GameRecord` attributes including tags, ingress modes, launch statuses, and play states.
- **Text Compilation**: Combines title, sort title, original file name, system ID, ingress mode, launch status, and identity status into a single space-separated, lowercase `searchText` field.
- **Multi-word Matching**: Splitting search queries into whitespace-delimited tokens, requiring all terms to match substrings in the compiled `searchText` string.

### B. Filtering & Sorting Algorithms
- **Category Tabs**: Filters cataloged games into tabs (All Cataloged, Single Games, Batch Library, Favorites, Needing Config, Hidden).
- **System Dropdown**: Dynamically reads unique `systemId` values present in the database to populate the dropdown.
- **Launch & Identity Statuses**: Filters by readiness (`ready`, `blocked`, `not_configured`) and mapping authenticity (`normalized`, `raw`).
- **Sorting Logic**:
  - `title`: Alphabetical string comparison.
  - `recently_added`: Descending date comparison using record creation timestamps.
  - `recently_played`: Descending date comparison using last played timestamps.
  - `play_count`: Descending integer comparison.
  - `launch_status`: Status priorities (1: Ready, 2: Not Configured, 3: Blocked, 4: Other).

---

## 3. Duplicate Detection & Advisory Design

To support large, batch-imported libraries, we introduced an advisory duplicate group detector that groups games by:
$$\text{normalizedTitle} + \text{systemId}$$

- **Non-Destructive Rules**: The application is an advisory system. It reports duplicate groups, recommends actions, and allows isolating duplicate candidates in the grid, but never mutates the underlying library ledger database automatically.
- **Advisory Banner**: Displays a premium warning banner detailing the total duplicate records and the count of unique title groups. Users can toggle this mode to view only potential cleanup candidates.

---

## 4. UI Control Suite & Styling (`src/styles.css`)

We added dedicated, responsive CSS styles to fit the layout:
1. **`library-filters-container`**: A dual-row grid. The first row contains the wide search input, sort selection, clear button, and result counts. The second row contains the horizontal categories tabs and dropdown selectors.
2. **`duplicate-warning-banner`**: A premium warning container highlighted in warning amber colors, complete with call-to-action buttons for isolating duplicates.
3. **`btn-clear-filters`**: A responsive utility button appearing only when active filter criteria are modified, allowing users to instantly reset state variables back to default configurations.

---

## 5. Quality Verification & Build Output

All automated validation gates pass cleanly:
- **Typecheck (`npm run typecheck`)**: Successful execution with zero TypeScript compile errors.
- **Lint (`npm run lint`)**: Clean validation with zero unused imports or warnings.
- **Build (`npm run build`)**: Vite production build succeeded:
  - `dist/assets/index-B5wYzy1a.css` (18.22 kB)
  - `dist/assets/index-BbON_ulh.js` (253.51 kB)

---

## 6. Future Enhancements

1. **Physical Input Mapping (XARCADE-INPUT-001)**:
   - Make the filter bar fully navigable via gamepad/physical controller directional pads.
2. **Batch Metadata Resolution**:
   - Integrate with metadata provider scrapers to automatically resolve raw file names into normalized titles.
