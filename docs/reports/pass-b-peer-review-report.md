# Pass B Peer Review Report

Date: 2026-05-29  
Milestone: **XARCADE-CONTROLLER-LAUNCH-PROOF-001**  
Operating model: **agent-led, user-assisted** (`docs/decisions/agent-led-pass-b-hardware-proof.md`)  
Tags: `#xar:controller-launch-proof/current` `#xar:controller-launch-proof/pass-b` `#adapter:fceux/nes` `#adapter:retroarch/snes`

## Summary

Pass B hardware/GUI proof was executed agent-led with user assistance. Phase 0 preflight gates passed. Tauri desktop shell runs against Vite on `http://localhost:5173`. NES launch through xi-io → FCEUX was evidenced once via ledger events and process spawn. SNES launch through xi-io was **not** closed with credible evidence. In-game controller proof is **partial**: D-pad, Start, and Select worked in FCEUX; A, B, and turbo did not (no in-game mapping applied at launch). Exit/return was brittle: FCEUX quit left xi-io on a launch overlay with `Process exited with code null` — a fix was implemented locally but requires Tauri rebuild to verify.

**Interpretation: partial pass / blocked.** Pass C is **not safe** until SNES launch proof, controller face-button proof, and exit/return re-test complete.

Peer-reviewed product direction (platform-scoped engines, metadata facets, chunked ingress) was captured as future backlog only — not implemented during Pass B.

---

## Pass B evidence checklist

| Item | Status | Evidence |
|------|--------|----------|
| Phase 0: pkg-config, npm gates, cargo check | **Pass** | webkit2gtk 2.50.4, libsoup 3.0.7; typecheck/lint/build pass; cargo check pass with `CARGO_TARGET_DIR` on Storage drive |
| Tauri window visible (`npm run tauri:dev`) | **Pass** | Window title `xi-io Emulator`; Vite HTTP 200 on :5173 |
| Engine paths configured (FCEUX, RetroArch, core) | **Pass** | WebKit localStorage bootstrap + user paths; `testStatus: success` in `xibalba_engine_settings` |
| Proof ROMs registered (NES + SNES, no bulk scan) | **Pass** | `xibalba_proof_games` with canonical proof paths only |
| Demo mode disabled for real launch | **Pass** | `xibalba_demo_mode: false` |
| Engine diagnostic via GUI automation | **Partial** | xdotool coordinate automation unreliable after window resize; localStorage bootstrap used as agent fallback |
| NES launch via xi-io | **Partial** | Ledger: `launch_requested`, `launch_started` for Legend of Zelda proof ROM; FCEUX process spawned with correct command |
| SNES launch via xi-io | **Fail / not evidenced** | RetroArch CLI works standalone; xi-io GUI launch not confirmed in ledger |
| Controller in-game (Zikway USB) | **Partial** | User: D-pad/Start/Select work; A/B/turbo do not; no engine remap applied at launch |
| Mark In-Game Verified (manual) | **Unknown / likely not** | Requires explicit user click after face buttons work |
| Exit returns to Arcade Home cleanly | **Fail (pre-fix)** | User screenshot: overlay stuck with `Process exited with code null` after FCEUX closed |
| Exit/return fix deployed | **Pending re-test** | Code committed: null exit treated as clean quit; auto-dismiss overlay; focus retry |
| Phase 7a functional smoke matrix | **Not completed** | — |
| Phase 7b UX critique merged | **Not completed** | Prior page reviews exist; live Pass B matrix not run |
| Pass B agent report (this document) | **Pass** | — |

---

## Controller proof result

- **Detection:** Zikway HID gamepad detected via Linux `/proc/bus/input/devices` and browser Gamepad API in Tauri shell.
- **Shell input test:** Gamepad API input test may pass; does not prove in-game mapping.
- **In-game (user report):** Partial — menu navigation buttons work; action buttons (A/B/turbo) do not.
- **Root cause (code):** `controller_profile` in adapter manifests is metadata only; `launchGame` does not generate or apply FCEUX/RetroArch remap configs (`#todo:controller/profile-mapping`).
- **Policy:** Generic USB wired controller acceptable per `docs/decisions/generic-usb-controller-proof-policy.md`; in-game control is the product proof bar.

---

## NES / FCEUX proof result

- **Adapter:** `fceux.nes` — launch template `{engine_path} {content_path}`
- **Proof ROM:** `/media/chrishallberg/Storage 22/Games/emulators/Legend of Zelda, The (USA) (Rev 1).nes`
- **Engine:** `/usr/games/fceux`
- **Launch evidence:** Ledger events + FCEUX process with proof ROM path
- **Presentation gap:** NES records have no cover art — `getArtworkMappingForTitle` returns `{}` for `systemId !== 'snes'` (SNES-only demo hydration)

---

## SNES / RetroArch proof result

- **Adapter:** `retroarch.snes.snes9x` — launch template RetroArch `-f -L {core_path} {content_path}`
- **Proof ROM:** Super Mario World (E) (V1.1) `[!].smc` under proof folder (not bulk 11k library)
- **Engine:** Flatpak RetroArch + bsnes core (temporary smoke; Snes9x is candidate production default)
- **Standalone CLI:** RetroArch + bsnes launches proof ROM (timeout test)
- **xi-io GUI launch:** Not evidenced in ledger during Pass B run

---

## Tauri status

- **Commands:** `path_exists`, `launch_emulator`, `list_input_devices`
- **Compile:** Pass with system deps installed; use `CARGO_TARGET_DIR` and `TMPDIR` on Storage drive when `/tmp` is full
- **Launch model:** Synchronous spawn + wait until emulator exits; focus restore after exit
- **Exit fix (2026-05-29):** `wait()` instead of `wait_with_output()`; null/0/130/143 treated as clean exit in TS; Arcade overlay auto-dismiss on `returnedCleanly`

---

## Launch / focus / exit behavior (honest)

| Behavior | Observed |
|----------|----------|
| Game opens in separate window | Yes (expected) |
| xi-io blocks until emulator exits | Yes (invoke waits on process) |
| Null exit code treated as failure (before fix) | Yes — caused stuck overlay + error copy |
| User must press Escape to dismiss overlay (before fix) | Yes |
| Auto-return to Arcade Home (after fix) | **Pending user re-test** |
| Focus restore to xi-io window | Best-effort 3× retry in Rust; not verified on user multi-monitor setup |

---

## Milestone state

```txt
XARCADE-CONTROLLER-LAUNCH-PROOF-001: PARTIAL — do not close
Pass C: BLOCKED
XARCADE-IMAGE-HYDRATION-001: planned (after Pass C)
XARCADE-STORAGE-001 bulk scan: BLOCKED (requires hydration + chunked validation)
```

---

## Files changed during Pass B execution (this sync)

```txt
docs/decisions/platform-engine-registry-and-library-facets.md   # post-Pass-B product direction (peer-reviewed)
docs/reports/pass-b-peer-review-report.md                       # this report
docs/INDEX.md
src/services/launchExitService.ts                             # exit code classification
src/services/launchService.ts                                 # clean exit + returnedCleanly
src/components/ArcadeHome.tsx                                 # auto-dismiss overlay on clean exit
src-tauri/src/lib.rs                                          # wait() + focus retry
```

Not committed: `.tmp/` agent automation scripts, localStorage bootstrap helpers, `src-tauri/gen/` build artifacts.

---

## Commands run (representative)

```bash
npm run typecheck && npm run lint && npm run build
CARGO_TARGET_DIR=.tmp/cargo-target TMPDIR=.tmp cargo check --manifest-path src-tauri/Cargo.toml
npm run tauri:dev
pgrep -af 'fceux|RetroArch|xi-io-emulator'
# WebKit localStorage read via Python for engine/proof verification
# xdotool window automation (partial; window geometry sensitivity)
```

---

## Pass / fail gates

| Gate | Result | Date |
|------|--------|------|
| typecheck | pass | 2026-05-29 |
| lint | pass | 2026-05-29 |
| build | pass (prior Pass B session) | 2026-05-28 |
| cargo check | pass (with Storage `CARGO_TARGET_DIR`) | 2026-05-29 |
| End-to-end NES launch | partial | user + ledger |
| End-to-end SNES launch | fail / not evidenced | — |
| In-game controller full mapping | fail / partial | user report |
| Exit/return UX | fail pre-fix; fix pending re-test | user screenshot |

---

## Product direction captured (not implemented)

Peer-reviewed as post–Pass B backlog:

```txt
docs/decisions/platform-engine-registry-and-library-facets.md
  - Platform-scoped engines (default → alternatives → per-game override)
  - RetroArch-first + standalone exceptions
  - Metadata facets vs tags before bulk import
  - Data sovereignty for remote metadata/artwork
  - Native path browse (post-Pass B UX)
```

Hydration / ingress gap (user observation, aligned with code):

```txt
SNES: demo libretro-thumbnail URLs at ingress (SNES-only)
NES: no artwork mapping — returns {}
Full hydration (local scan, Rosetta, fallback, chunked validation UI): planned XARCADE-IMAGE-HYDRATION-001
Do not bulk-scan 11k SNES library until hydration + chunked ingress exist
```

---

## Hydration / manifest changes

- No changes to `projects/hydration/xi_io_emulator.hydration-state.yaml` in this sync (still gates bulk hydration on Pass B/C + IMAGE-HYDRATION-001).
- No bulk library ingress performed (Pass B guardrail upheld).

---

## Framework sync changes

- INDEX updated with platform-engine decision doc.
- Pass B peer review report added for ChatGPT/agent peer review handoff.

---

## Remaining blockers

1. **Re-test exit/return fix** after Tauri rebuild — quit FCEUX normally; expect auto-return to Arcade Home without `code null` error.
2. **SNES xi-io launch proof** — register proof ROM if needed; launch from Arcade; capture ledger + RetroArch process.
3. **In-game controller A/B/turbo** — requires engine remap at launch or documented FCEUX manual map + Mark In-Game Verified.
4. **Install/use Snes9x core** for production-candidate SNES path (bsnes remains smoke-only).
5. **Phase 7a–9** — functional smoke matrix, UX critique, final Pass B close report if evidence completes.

---

## Next recommended prompt (for ChatGPT peer review)

```txt
Peer review Pass B status for xi-io-emulator (repo: Vado42-chris/xi-io-emulator).

Read:
  docs/reports/pass-b-peer-review-report.md
  docs/decisions/agent-led-pass-b-hardware-proof.md
  docs/decisions/platform-engine-registry-and-library-facets.md

Questions:
  1. Is "partial pass / blocked" the correct milestone interpretation?
  2. Is it safe to merge the exit/return fix without broader launch refactor?
  3. What is the minimum controller mapping scope before Pass C (vs deferring to XARCADE-CONTROLLER-002)?
  4. Approve resuming Pass B proof only (SNES launch + exit re-test + in-game buttons) before any hydration or bulk ingress work.

Do not approve Pass C, bulk SNES scan, image hydration implementation, or platform engine registry implementation yet.
```

---

## Closing statement

```txt
Pass B remains partial/blocked. Pass C is not safe.
Awaiting peer review of this report before Pass C or hydration workstreams.
```
