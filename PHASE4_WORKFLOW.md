# NEXUS Phase 4 preparation

## Path configuration

Replace only the three values in [`phase4-project-paths.config.json`](./phase4-project-paths.config.json) with exact local directory paths:

- `VELORA_PATH`
- `AETHER_PATH`
- `ORVE_PATH`

No project path is inferred from the desktop, prior projects, or other folders. Until those values are replaced, do not inspect, enumerate, or open any project source directory. This is a documented workflow, not an automated scanner.

## Read-only inspection workflow

Once the paths are supplied, inspect each configured directory strictly as a source of information:

1. Confirm that each exact configured directory exists and identify its project entry points and package manifest.
2. Review source files and any existing screenshots/assets inside that project directory to verify its visible features, visual identity, and actual technologies.
3. Exclude dependency, version-control, build-output, and cache folders from review (`node_modules`, `.git`, `dist`, `build`, `.next`, and caches).
4. Do not run install, format, build, or code-generation commands in those projects. Do not write, rename, or delete anything there.
5. Record only details supported by source or actual project imagery. If an existing screenshot is available, copy the chosen image into NEXUS; if not, use a browser capture workflow only after confirming the configured app can run without modifying its source project.

## NEXUS integration workflow

Keep copied artwork inside `public/projects/` with per-project folders and descriptive filenames. Preserve source aspect ratios, use `object-fit: contain` or a documented art-directed crop, and lazy-load below-the-fold imagery. The image alternatives must describe the actual captured interface. Do not use the current CSS mockups as final authentic artwork.

The current representative project artwork to replace is rendered in `src/App.tsx` within `.project-visual`:

- VELORA: `.velora-ui` and its dashboard CSS illustration.
- AETHER: `.aether-art` and its ring/wordmark CSS illustration.
- ORVÉ: `.orve-art` and its product CSS illustration.
- The shared `REPRESENTATIVE INTERFACE STUDY` label must become an accurate image caption or be removed.

Their visual rules live in `src/styles.css` under the project visual, `.velora-*`, `.aether-*`, and `.orve-*` selectors. Project overview data currently lives in `src/content.ts`. After inspection, replace unsupported descriptions/technology labels there and add local asset references. Build dedicated project-detail presentations from that verified content, with configurable destinations kept in `src/content.ts`; test direct entry and refresh for any detail URL.

## Current state

This preparation does not import the config into the app, change project copy, add placeholder images, or access the configured paths. NEXUS keeps rendering its existing representative artwork until source paths are supplied and inspected.
