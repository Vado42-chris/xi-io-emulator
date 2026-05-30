# Pass B Final Evidence Report (Phase 9)

Date: **2026-05-30** (WIP refresh — user sign-off pending)  
Milestone: **XARCADE-CONTROLLER-LAUNCH-PROOF-001**  
Branch: `wip/pass-b-lifecycle-display-shell` @ **`7924d57`** (xi-io.net @ `b3a9b96`)  
Prior baseline: `main` @ `b34a60d`  
Tags: `#xar:controller-launch-proof/pass-b` `#xar:controller-launch-proof/current`

---

## 2026-05-30 executive summary (WIP branch)

Pass B remains **partial / blocked**. Pass C is **not safe**. Bulk hydration remains **blocked**.

Since the 2026-05-29 report (`b34a60d`), the WIP branch adds material launch/session/security work. **Agent and doc gates improved; user hardware sign-off is still required** to close PRH-04.

| Area | WIP status (agent-verified) | User HW sign-off |
|------|----------------------------|------------------|
| Session supervisor / FCEUX cleanup | **Done** @ `45d55ee` | Retest launch/exit |
| Gamepad GUID + controller mapping seed | **Done** | Retest in-game |
| Shell restore (hide/show, eager wake) | **Done** | Retest return speed |
| PRH-02 `shell_focus_restore_failed` | **Done** @ `897a97d` | Check Logs for restore events |
| Path privacy (public repo) | **Done** @ `afa9349` | Configure `.env.local` locally |
| Security framework + xi-io.net mirror | **Done** @ `f2c9230` | N/A |
| NES launch + return | **Partial** (user improved 2026-05-30) | **Sign below** |
| SNES xi-io GUI launch | **Not evidenced** | **Sign below** |
| Controller A/B in-game | **Open** | **Sign below** |
| Mark In-Game Verified | **Open** | **Sign below** |

**Final classification (unchanged until user sign-off):** Pass B **partial/blocked**. Pass C **not safe**.

---

## User hardware sign-off (required — PRH-04)

Complete on real hardware from **Pass B Launch Proof** shelf only. Copy results into this table or reply to agent with the same fields.

| Test | Pass / Fail | Date | Notes (no full ROM paths — use game ID) |
|------|-------------|------|----------------------------------------|
| NES launch from proof shelf | | | game_passb_nes |
| NES exit via controller chord (Select+Start or Guide) | | | |
| NES return to xi-io shell (< 3s acceptable) | | | |
| Ledger: `shell_focus_restored` OR `shell_focus_restore_failed` with reasonCode | | | Admin → Logs |
| SNES launch from proof shelf | | | game_passb_snes |
| SNES exit via controller chord | | | |
| SNES return to xi-io shell | | | |
| Controller D-pad / Start / Select in-game (NES) | | | |
| Controller A / B in-game (NES minimum bar) | | | |
| Sound audible in NES session | | | |
| Mark In-Game Verified clicked (only if A/B pass) | | | |

**Signed:** ___________________ **Date:** ___________

Until the sign-off row is completed, PRH-04 and Pass B remain **open**.

---

## WIP code improvements since b34a60d

| Commit | Change | Verify command |
|--------|--------|----------------|
| `45d55ee` | Session supervisor, stale FCEUX cleanup, gamepad GUID, faster shell restore | `npm run verify:session-idle`, `verify:shell-restore` |
| `897a97d` | PRH-02 restore failure events + reason codes | `npm run verify:shell-restore` |
| `afa9349` | Showcase roots → `.env.local`; public path redaction | path grep clean in `src/` |
| `ab4365c` / `f2c9230` | Security framework + hub mirror | sync status doc |

**Pre-test setup (operator):**

```bash
git checkout wip/pass-b-lifecycle-display-shell && git pull
cp .env.local.example .env.local   # set your showcase/proof roots locally — never commit
export CARGO_TARGET_DIR=".tmp/cargo-target" TMPDIR=".tmp"
npm run tauri:dev
```

---

## Updated Pass B checklist (2026-05-30)

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Preflight (typecheck, verify scripts) | **Pass** | WIP @ `e7530b8` |
| 2 | Tauri shell running | **Pass** | `npm run tauri:dev` |
| 3 | Proof ROM config (local overlay) | **Pass** | `.env.local` + Admin → Engines |
| 4 | NES xi-io → FCEUX launch | **Partial** | User 2026-05-30; re-sign above |
| 5 | SNES xi-io → RetroArch launch | **Pending** | Not in ledger — user sign-off |
| 6 | Exit/return + shell restore | **Partial** | PRH-02 events; user re-sign |
| 7 | Controller D-pad/Start/Select | **Partial** | User prior; re-sign |
| 8 | Controller A/B in-game | **Pending** | Mapping slice ongoing |
| 9 | Mark In-Game Verified | **Pending** | After A/B |
| 10 | Path privacy (public repo) | **Pass** | P0 + manifest @ `afa9349` |
| 11 | PRH-02 failure visibility | **Pass** | `897a97d`, XIO-LCH-008 implemented |

---

## Historical report (2026-05-29 @ b34a60d)

The sections below remain valid supporting evidence. Where they conflict with WIP behavior, **WIP branch wins** until Pass B is formally closed.

---

ChatGPT peer review **confirmed** the prior assessment: **Pass B is partial / blocked. Pass C is not safe.** Approved scope: **resume Pass B only** — no hydration, bulk scan, platform engine registry, or Pass C.

This report completes Phase 7a (functional smoke matrix), Phase 7b (standard-user UX critique), and Phase 9 (final evidence) per the approved Pass B plan. Live GUI proof for exit re-test, SNES launch, and full controller verification **requires user-assisted steps** below; agent automation was blocked by overlay/GUI state during this session.

**Final classification:** **Pass B remains partial/blocked. Pass C is not safe.**

---

## Peer review confirmation (ChatGPT, 2026-05-29)

| Decision | Verdict |
|----------|---------|
| Milestone call | **Confirm** partial / blocked |
| Pass C | **Not safe** |
| Keep b34a60d exit fix (narrow scope) | **Yes**, pending re-test |
| Full async launch refactor | **No** unless re-test fails |
| A/B in-game before Pass C | **Required minimum** |
| Turbo / advanced remapping UI | **Defer** to XARCADE-CONTROLLER-002 |
| Hydration / bulk ingress / platform engine | **Not approved** |

---

## Pass B evidence checklist (final)

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Phase 0 preflight | **Pass** | webkit2gtk, libsoup, typecheck/lint/build, cargo check |
| 2 | Tauri shell running | **Pass** | `npm run tauri:dev`; Vite :5173; window `xi-io Emulator` |
| 3 | Engine + proof ROM config | **Pass** | localStorage: engines tested, proof paths, demo off |
| 4 | NES xi-io → FCEUX launch | **Partial** | Prior session: ledger `launch_requested` / `launch_started`; user played game |
| 5 | SNES xi-io → RetroArch launch | **Fail / blocked** | Not in ledger; user hit stale demo path — see below |
| 6 | Exit/return (b34a60d fix) | **Pending re-test** | User pre-fix: stuck overlay + `code null`; fix merged, not user-verified |
| 7 | Controller D-pad/Start/Select | **Partial** | User: works in FCEUX |
| 8 | Controller A/B primary actions | **Fail** | User: not mapped; no engine remap at launch |
| 9 | Mark In-Game Verified | **Fail** | Not completed after full in-game proof |
| 10 | Phase 7a smoke matrix | **Pass (evidence)** | See below |
| 11 | Phase 7b UX critique | **Pass (evidence)** | See below |

---

## Phase 7a — Functional smoke matrix

Evidence from Tauri shell + code review + prior user sessions. **Not** exhaustive automated QA.

| Surface | Works | Partial / stub | Blocker / honest gap |
|---------|-------|----------------|----------------------|
| **Arcade Home** | Shelves, search (Y), keyboard nav, launch overlay, demo banner | Batch/demo SNES library from mock ingress | Engine-not-configured banner if settings cleared; launch blocked without paths |
| **Engines** | Path fields, Save & Test, proof ROM registration, checklist UI | Browse = preset dropdowns only (no native picker) | SNES core label says Snes9x but proof uses bsnes (temporary) |
| **Controllers** | Detection poll, Refresh, Input Test, Mark In-Game Verified | Gamepad API in WebView ≠ in-game engine mapping | No visual SNES map; `controller_profile` not applied at launch |
| **Settings** | Demo mode toggle visible; disables real spawn when on | — | Demo off required for proof |
| **Library** | Grid, filters, detail panel, CSV export | Single/batch ingress uses **mock file lists**, not filesystem scan | Text paths only |
| **Storage** | Root list UI, scan history display | Batch scan is mock | No real folder picker |
| **Game Detail** | Artwork display when mapped | Controller tab copy promises future profiles | NES: no artwork (`getArtworkMappingForTitle` SNES-only) |
| **Logs** | Ledger events visible | — | — |
| **Launch lifecycle** | spawn → wait → ledger | Overlay blocked pre-fix on null exit | b34a60d: clean exit + auto-dismiss **needs user re-test** |

**Mock behavior disclosure (required):** Library/Storage batch ingress in `AppShell.tsx` uses hardcoded `mockFiles` arrays — not a real directory scan. Must not be presented as production hydration.

---

## Phase 7b — Standard-user UX critique

### Persona A — age 12–15, console gamer

| Finding | Severity |
|---------|----------|
| Arcade shelves look like a real game launcher when SNES art loads | Positive |
| “Engine not configured” / launch overlay errors feel like the app is broken | High |
| Stuck “Launching…” screen after quitting a game is confusing and scary | High (pre-fix; re-test b34a60d) |
| No cover art on NES games feels unfinished vs SNES tiles | Medium |
| Controller works in menu but not A/B in game — feels like false advertising | High |
| Typing ROM paths instead of browsing folders is not how teens expect PC apps to work | Medium (post-Pass B) |

### Persona B — age 40+, casual user

| Finding | Severity |
|---------|----------|
| Admin vs Arcade (Escape) is easy to get lost in | Medium |
| Emulator Engines page is necessary but intimidating | Medium |
| “Mark In-Game Verified” is unclear without plain-language steps | Medium |
| Demo mode banner helps trust when visible | Positive |
| Logs page supports “what went wrong” for patient users | Positive |
| Would not understand `code null` or adapter jargon on overlay | High (pre-fix copy) |

**UX follow-ups (post-Pass B, not blockers for this report):** native path browse, NES artwork parity, clearer controller mapping status, Arcade Home onboarding when engines unconfigured.

---

## Controller proof result

```txt
Detection:     pass (Zikway via Linux input + Gamepad API)
In-game menu:  partial (D-pad, Start, Select — user confirmed)
In-game play:  fail minimum bar (A/B not working — user confirmed)
Turbo:         fail (defer to CONTROLLER-002)
Mark Verified: not clicked / not valid until A/B pass
```

**Root cause:** `buildLaunchPlan` / `launchGame` do not apply `controller_profile` or FCEUX `--inputcfg` / RetroArch remap configs. Controllers page tests browser API only.

**Minimum before Pass C (peer review):** fix or verify A/B in FCEUX (and SNES when launched). Turbo deferred.

---

## NES / FCEUX proof result

- Proof ROM registered and paths valid.
- User launched and played via xi-io (prior session).
- Exit UX failed pre-fix; b34a60d addresses null exit classification + auto-dismiss overlay.
- **Agent re-test this session:** blocked by GUI overlay / automation; **user must re-test** (steps below).

---

## SNES / RetroArch proof result

- **bsnes core:** temporary smoke only; document Snes9x as production candidate.
- **Standalone CLI:** launches proof ROM.
- **xi-io GUI:** not evidenced in ledger — **still required**.

### SNES launch blocker correction (2026-05-29)

User screenshot showed:

```txt
Launch Blocked: Missing Game File
/media/arcade-usb/snes-roms/Donkey Kong Country (USA).sfc
```

**Classification:** This is **not** a missing user-owned ROM. It is a **stale demo/mock batch ingress record** from hardcoded `mockFiles` in `AppShell.tsx` (`/media/arcade-usb/snes-roms`). The user’s real SNES library and proof ROM live under:

```txt
Library root (reference only — configure in local overlay; do not bulk scan):
/path/to/your/snes/roms

SNES proof ROM (single file only):
/path/to/your/snes/roms/Super Mario World (E) (V1.1) [!].smc
```

**Pass B SNES proof must use the proof ROM path above**, registered via Admin → Engines → Register SNES Proof, then launched from the **Pass B Launch Proof** shelf (added in code fix).

**Fix applied (pending user verify):**

- `proofGameService.ts` — detects stale `/media/arcade-usb/` paths; clearer blocker copy
- `ArcadeHome.tsx` — **Pass B Launch Proof** shelf pinned first; guidance banner
- `.tmp/passb-bootstrap-localstorage.py` — replaces game records with proof-only rows; removes mock library roots

**Bootstrap executed (agent, this session):** localStorage now contains **exactly 2** game records (NES Zelda + SNES Super Mario World). No `/media/arcade-usb/` paths remain in `xibalba_game_records`. Proof SNES path confirmed on disk:

```txt
/path/to/your/snes/roms/Super Mario World (E) (V1.1) [!].smc
```

**Before SNES launch proof:**

1. Restart Tauri after bootstrap or re-register proof ROMs in Engines.
2. Select **Super Mario World** from **Pass B Launch Proof** shelf (not Donkey Kong / Recently Added demo tiles).
3. Confirm hero path ends with `Super Mario World (E) (V1.1) [!].smc` under Storage drive — **not** `/media/arcade-usb/`.
4. Then press Play / launch.

---

## Exit / return (b34a60d)

**Code changes (merged @ b34a60d):**

- `launchExitService.ts` — null/0/130/143 → clean exit
- `launchService.ts` — `returnedCleanly`, `emulator_exited` ledger on clean quit
- `ArcadeHome.tsx` — auto-dismiss overlay ~600ms after clean exit
- `lib.rs` — `wait()` + 3× focus retry

**User re-test procedure:**

1. Restart `npm run tauri:dev` (ensure b34a60d binary running).
2. Press **Escape** if stuck on old overlay.
3. Launch NES proof from Arcade (search “Legend of Zelda” → Enter).
4. Play briefly; quit FCEUX normally (File → Quit or close window).
5. **Pass criteria:** overlay shows “Returned from…” then auto-closes; **no** red `Process exited with code null`; Arcade Home usable; xi-io regains focus.
6. Repeat for SNES after SNES launch proof succeeds.

---

## Commands run (this Pass B resume session)

```bash
git status  # clean @ b34a60d
npm run typecheck && npm run lint
cargo build --manifest-path src-tauri/Cargo.toml  # with CARGO_TARGET_DIR on Storage
npm run tauri:dev
# WebKit localStorage verification (engine/proof/demo)
# xdotool launch attempts (partial — overlay/GUI sensitivity)
```

---

## Pass / fail gates

| Gate | Result |
|------|--------|
| typecheck | pass |
| lint | pass |
| cargo build (Tauri) | pass |
| Peer review alignment | pass |
| Milestone close | **fail** — checklist incomplete |
| Pass C readiness | **fail** |

---

## Remaining blockers (user-assisted)

1. **Clear stale demo library state** — run proof bootstrap or use Pass B Launch Proof shelf only (see SNES section).
2. **Exit re-test** after b34a60d (NES, then SNES).
3. **SNES xi-io launch** — Super Mario World proof ROM from Pass B shelf; confirm path before Play.
4. **A/B in-game** — FCEUX input config or minimal launch flag; user confirms in game.
5. **Mark In-Game Verified** — only after #4 (and SNES when in scope).
6. Optional: install **Snes9x** core for production-candidate SNES path (bsnes remains smoke note).

---

## Not approved (unchanged)

```txt
Pass C
Image hydration implementation
Bulk SNES library scan
Platform engine registry implementation
Metadata schema implementation
Ibal / MCP / API keys
Broad UX refactors during Pass B
Full async launch refactor (unless exit re-test fails)
```

---

## Next recommended prompt (after user completes steps 1–4)

```txt
Pass B user-assisted proof results:

Exit re-test (NES): [pass/fail — describe overlay + focus]
SNES xi-io launch: [pass/fail — ledger snippet]
A/B in-game: [pass/fail]
Mark In-Game Verified: [yes/no]

If all pass: request Pass B close peer review before Pass C.
If any fail: remain partial/blocked with exact blocker.
```

---

## Closing statement

```txt
Pass B remains partial/blocked. Pass C is not safe.
```

Prior report `docs/reports/pass-b-peer-review-report.md` remains valid supporting evidence. ChatGPT peer review **confirmed** that verdict on 2026-05-29.

When NES and SNES both launch through xi-io, exit cleanly after b34a60d re-test, controller D-pad/Start/Select/A/B work in-game, and Mark In-Game Verified is complete, the next agent output should state:

```txt
Pass B appears complete. Awaiting ChatGPT/user peer review before Pass C.
```

Until then, do not close the milestone or start Pass C.

---

## Agent pass log (systematic continuation)

| Pass | Date | Work | Result | Silent-fail check |
|------|------|------|--------|-------------------|
| 1 | 2026-05-29 | typecheck + lint | **pass** (exit 0) | verified stdout empty = success |
| 1 | 2026-05-29 | proof-only localStorage bootstrap | **pass** (2 games, no arcade-usb) | sqlite read confirmed |
| 1 | 2026-05-29 | SNES CLI smoke (RetroArch + bsnes + proof ROM, 8s) | **pass** (exit 124 timeout) | pgrep showed bwrap/retroarch |
| 1 | 2026-05-29 | SNES xi-io GUI launch | **not run** | ledger has no SNES launch_* events |
| 1 | 2026-05-29 | NES xi-io launch (prior session) | **partial** | ledger launch_started + launch_failed exit null |
| 1 | 2026-05-29 | Framework manifest/hydration update | **done** | files written locally |
| 1 | 2026-05-29 | xi-io.net mirror commit | **pass** (`d338880`) | git log verified |
| 3 | 2026-05-29 | GitHub push both repos | **pass** | emulator `f1b257e`, xi-io.net `d338880` |
| 3 | 2026-05-29 | Workbench preview event | **pass** | `evt-xi-io-emulator-pass-b-partial-001` |
| 4 | 2026-05-30 | Session supervisor + shell restore WIP | **pushed** | `45d55ee` |
| 5 | 2026-05-30 | PRH-02 restore failure ledger | **pushed** | `897a97d` |
| 6 | 2026-05-30 | Security + path hygiene + USB product docs | **pushed** | `5705344` |
| 6b | 2026-05-30 | PRH-04 evidence refresh + retest checklist (docs) | **pushed** | `e7530b8`; verify:shell-restore + verify:session-idle exit 0 |
| 7 | 2026-05-30 | PRH-03 hydration SHA + xi-io.net planning mirror | **pushed** | product `a7c7305`; hub `888f4fa`; verify exit 0 |
| 8 | 2026-05-30 | GitHub CI + compliance checklist + PRH-01 plan | **pushed** | `8702185`→`2bab4a6`; hub `fcaddc2`; CI green run `26688165897` |
| 9 | 2026-05-30 | Metadata backup schema v1 + export service + verify | **pushed** | `7924d57`; hub `b3a9b96`; verify exit 0 |
| 10 | 2026-05-30 | Admin Settings metadata export UI + download helper | **pushed** | `68d74ef`; hub `f1cf7c7`; CI `26689488311` success; verify exit 0 |
| 11 | 2026-05-30 | PRH-01 SQLite scaffold + launch/db comments + verify | **pending push** | `754f258`; verify exit 0; cargo check exit 0 |
| 12 | **Pending** | User hardware sign-off (PRH-04) | **blocked** | Requires sign-off table above |
| 13 | **Pending** | Metadata backup 50-title pilot (operator) | **blocked** | Settings → Export pilot (50) + verify JSON |

### Remaining passes estimate (2026-05-30)

| Workstream | Passes est. | Notes |
|------------|-------------|-------|
| Metadata backup schema + pilot export | **Pass 9 schema + Pass 10 Admin UI done**; **1 operator pilot** | Settings → Export pilot (50) |
| User hardware proof + sign-off | **1 user session** | PRH-04 blocker |
| Pass B report close after sign-off | **1 agent pass** | Mark PRH-04 done |
| PRH-01 SQLite implementation | **scaffold done Pass 11**; **1 pass** migration invoke | Parallel to PRH-04 |
| GitHub branch protection verify | **API checked Pass 11** — not enabled; operator action | gh API 404 documented |
| Code comments + runtime path config | **partial Pass 11**; **~1 pass** remaining | launchService + db.ts done |
| WIP review slicing | **2–3 passes** | Before main |
| **Total to Pass B close + compliance baseline** | **~2–5 agent + 1 user + 1 operator pilot** | Pass C + ~2 after B close |
