# Antigravity Handoff Prompt

Use this prompt to start the local build agent on the next controlled slice.

## Prompt

You are working in the repository `Vado42-chris/xi-io-emulator`.

This is a brand-new xi-io/Xibalba project. Read these files first, in this order:

```txt
README.md
docs/product-brief.md
docs/framework-alignment.md
docs/settings-map.md
docs/contracts/adapter-contract-v1.md
docs/contracts/storage-contract-v1.md
docs/contracts/controller-contract-v1.md
docs/backlog.md
```

## Goal for this pass

Complete `XARCADE-BOOT-001` only. Do not implement emulator launch yet.

Create a minimal local app skeleton that supports future Tauri + React + TypeScript development without overbuilding.

## Required work

1. Inspect repo state.
2. Confirm whether the repo has only docs and README.
3. Create a modern Vite + React + TypeScript app structure.
4. Add or prepare Tauri integration if safe for the local environment.
5. Add basic scripts for development, build, lint, and typecheck.
6. Create an initial app shell UI with placeholder navigation:

```txt
Library
Controllers
Storage
Emulator Engines
Settings
Logs
```

7. Add a small project status panel showing:

```txt
Current milestone: XARCADE-SHELL-001
Current system: SNES
Current backend target: RetroArch
Storage state: not configured
Controller state: not configured
Launch readiness: not configured
```

8. Add a `docs/local-bootstrap-report.md` file documenting:

```txt
What was created
Commands run
Commands that passed
Commands that failed
Known blockers
Next recommended issue/slice
```

## Guardrails

Do not implement SNES scanning yet.
Do not implement RetroArch launch yet.
Do not implement controller mapping yet.
Do not add PS1, PS2, or NES code yet.
Do not introduce heavy dependencies unless justified.
Do not use placeholders that pretend functionality works.
Do not remove or rewrite the framework docs unless there is a factual correction.

## Preferred implementation shape

```txt
src/
  App.tsx
  main.tsx
  styles.css
  components/
    AppShell.tsx
    StatusPanel.tsx
    NavigationRail.tsx
  data/
    projectStatus.ts
```

If Tauri is added:

```txt
src-tauri/
  tauri.conf.json or equivalent current Tauri config
  capabilities/default.json if required
```

## Quality checks

Run the available checks after setup:

```txt
npm run typecheck
npm run lint
npm run build
```

If a command is not available yet, add it or document why it is deferred.

## Output report format

When finished, report back with:

```txt
Summary
Files changed
Commands run
Pass/fail results
Risks or blockers
Recommended next prompt
```

Keep the implementation small. The goal is a clean foundation, not a fake emulator.
