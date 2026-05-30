# Pass B Troubleshooting Runbook

Date: 2026-05-29

## Purpose

Operator and user runbook for **XARCADE-CONTROLLER-LAUNCH-PROOF-001** hardware proof on Pop!_OS / Linux.

**Failure codes:** see [launch-failure-codes.md](./launch-failure-codes.md)

**Milestone:** Pass B partial/blocked. Pass C not safe. This runbook does not close the milestone.

---

## System freeze after closing a game (full desktop lockup)

**Symptoms:** Emulator closes, then the entire Linux session freezes (mouse/keyboard dead); hard reset required.

**Likely cause (fixed in current builds):** duplicate shell-restore storms — Rust and the UI both called window focus restore, spawning many concurrent `xdotool windowactivate --sync` calls that can block the compositor indefinitely under load.

**Guardrails now in place:**

- Single restore owner in Rust; UI only resets state on `emulator-session-finished`
- 2.5s debounce + mutex on shell restore
- No `xdotool --sync`; all WM tools wrapped in `timeout 2`
- Focus retries capped at 2 (250ms, 1s) instead of 7
- Removed global `pkill -KILL -x fceux` — only session PIDs are killed
- Terminate path deduped to prevent concurrent kill + restore

**If it happens again:**

```bash
# From another TTY (Ctrl+Alt+F3) or SSH — never rely on the frozen desktop
pkill -f 'fceux.*your-rom-name' || true
pkill -f xi-io-emulator || true
```

Report `[xi-io]` lines from `~/.local/share/xi-io-emulator/` logs or journal if available.

---

## Before any test

```bash
# Clean slate (manual — not app pkill)
pkill -f fceux || true
pkill -f xi-io-emulator || true
pgrep -af 'fceux|xi-io-emulator|RetroArch|org.libretro' || echo "clean"

# Start app
export CARGO_TARGET_DIR=".tmp/cargo-target" TMPDIR=".tmp"
npm run tauri:dev
```

Launch only from **Pass B Launch Proof** shelf unless explicitly testing blockers.

### Controller-only exit (hard rule)

Pass B proof assumes a **Zikway / arcade controller**, not keyboard+mouse at the emulator window.

**The only acceptable user exit paths during proof:**

```txt
Hold Select + Start (~1 second)   → return to xi-io and kill emulator session
Press Guide / Home                → instant return to xi-io
Optional saved single-button map  → return to xi-io (if configured in setup)
Esc                               → keyboard-only emergency; not proof path
```

**Not acceptable for Pass B proof or agent retest instructions:**

```txt
FCEUX File → Close Game
FCEUX File → Exit
Any emulator menu navigation
Alt-Tab as the primary return path
```

If return chords fail, the bug is **lifecycle / termination / focus restore** — not “use the emulator menu.” Agents must never tell controller users to open FCEUX menus.

Emergency cleanup only (operator terminal): `pkill -f fceux`

---

## Game says Missing Engine

| | |
|---|---|
| **Code** | XIO-LCH-001 |
| **Symptom** | Yellow blocker on game card; "Missing Engine" |
| **Likely cause** | FCEUX (NES) or RetroArch (SNES) binary path not configured or file missing |
| **In-app check** | Admin → Emulator Engines → set FCEUX / RetroArch paths → **Test Engine Paths** |
| **Terminal check** | `test -f /usr/games/fceux`; `test -f /usr/bin/retroarch` |
| **Safe fix** | Set correct binary paths; save; re-test engine |
| **Verified when** | Hero blocker clears; `engine_detected` in Admin → Logs |

---

## Game says Missing Game File

| | |
|---|---|
| **Code** | XIO-LCH-003 |
| **Symptom** | "Missing Game File" blocker |
| **Likely cause** | Proof ROM path wrong, drive unmounted, or typo in Admin → Engines proof paths |
| **In-app check** | Admin → Engines → NES/SNES proof ROM path fields |
| **Terminal check** | `test -f "<your .nes or .smc path>"` |
| **Safe fix** | Register proof game with real path on Storage drive |
| **Verified when** | Readiness shows ready; launch proceeds |

---

## Stale /media/arcade-usb demo record

| | |
|---|---|
| **Code** | XIO-LCH-010 |
| **Symptom** | Blocker mentions mock batch path `/media/arcade-usb/` |
| **Likely cause** | Demo/batch ingress tile — not user's real library |
| **In-app check** | Use **Pass B Launch Proof** shelf only; read green banner |
| **Terminal check** | `test -d /media/arcade-usb` (may not exist — expected) |
| **Safe fix** | Ignore demo tiles; configure proof ROMs under Admin → Engines |
| **Verified when** | Launch from proof shelf with local overlay paths configured |

---

## FCEUX black screen after return chord (XIO-LCH-011)

| | |
|---|---|
| **Code** | XIO-LCH-011 |
| **Symptom** | User pressed **Select+Start** or **Guide/Home**; FCEUX stays fullscreen black; xi-io does not return |
| **Likely cause** | Return chord fired but FCEUX was not SIGKILL'd; or focus restored behind a live FCEUX window |
| **In-app check** | Launch overlay hint should show Select+Start / Guide — no menu instructions |
| **Terminal check** | `pgrep -af fceux`; `xdotool search --name FCEUX getwindowname %@` |
| **Safe fix** | Operator: `pkill -f fceux`; re-test with latest lifecycle build |
| **Verified when** | After **controller return chord only**: `pgrep -af fceux` empty; xi-io focused on game card |

---

## xi-io does not return after emulator exit

| | |
|---|---|
| **Code** | XIO-LCH-008, XIO-LCH-011 |
| **Symptom** | Game ended but Arcade Home not visible; overlay stuck or desktop showing |
| **Likely cause** | Focus restore failed; FCEUX still alive; or launch overlay waiting on invoke |
| **In-app check** | Admin → Logs: `emulator_exited`, `shell_focus_restored`, or `shell_focus_restore_failed` (PRH-02) |
| **Terminal check** | `pgrep -af 'fceux|xi-io-emulator'`; session JSON if present |
| **Safe fix** | Alt+Tab or click xi-io window; check log reasonCode; retry launch |
| **Verified when** | Clean return to game card; overlay clears; ledger shows restore success OR explicit failure with reasonCode |

### PRH-02 restore failure (XIO-LCH-008)

If restore fails, Admin → Logs should show **`shell_focus_restore_failed`** with fields:

```txt
reasonCode: tauri_window_missing | show_failed | set_focus_failed | xid_missing | ...
stage: tauri_show | tauri_focus | wm_discover | ...
gameId, sessionId — no full ROM paths
```

Launch overlay shows plain-language recovery copy. This is **expected telemetry** — not a silent failure.

**Verified when:** Success path logs `shell_focus_restored`; failure path logs `shell_focus_restore_failed` with reasonCode (user can still Alt+Tab to recover).

---

## Duplicate xi-io dock icons

| | |
|---|---|
| **Code** | XIO-LCH-012 |
| **Symptom** | Two xi-io entries in dock/taskbar |
| **Likely cause** | Second `tauri:dev` started before single-instance lock; or stale process |
| **In-app check** | Launch again — should focus existing window |
| **Terminal check** | `pgrep -af xi-io-emulator` (expect one debug binary + npm parent) |
| **Safe fix** | `pkill -f xi-io-emulator`; single `npm run tauri:dev` |
| **Verified when** | One dock icon; second launch focuses existing window |

---

## Wrong display / display picker identify issue

| | |
|---|---|
| **Code** | XIO-LCH-009 |
| **Symptom** | Game opens on wrong monitor; or Identify shows nothing |
| **Likely cause** | xrandr index mismatch; multi-monitor picker not confirmed; identify overlay failed silently |
| **In-app check** | **Select + A** on game → Launch Display picker → **Identify screens** → note numbers on physical monitors → pick matching **Screen** row → **A** to launch |
| **Terminal check** | `xrandr --query`; compare index order to picker "Display N" |
| **Safe fix** | Re-run Identify; set correct screen; enable **Remember for all games** if desired |
| **Verified when** | Game fullscreen on intended monitor |

**Single monitor:** picker skipped automatically — game uses primary display.

---

## Launch overlay stuck then error (~12 seconds) — loading then nothing

| | |
|---|---|
| **Code** | XIO-LCH-014 |
| **Symptom** | Overlay shows **Launching…** for up to ~12s; then error; no game window |
| **Likely cause** | Supervisor started but emulator PID never appeared (wrong binary, core path, or ROM); supervisor exited early |
| **In-app check** | Admin → Engines → **Test Engine Paths**; confirm proof ROM exists |
| **Terminal check** | During launch: `pgrep -af 'fceux|retroarch|org.libretro'`; watch stderr for `[xi-io]` supervisor lines |
| **Safe fix** | Fix engine/core/ROM paths; re-test from Pass B Launch Proof shelf |
| **Verified when** | Emulator window visible within ~12s; overlay clears to in-game or success state |

---

## SNES Flatpak / RetroArch command parse failure

| | |
|---|---|
| **Code** | XIO-LCH-015 |
| **Symptom** | Immediate launch failure; message mentions supervisor code 2, parse error, or "flatpak" |
| **Likely cause** | RetroArch configured as internal Flatpak path without `flatpak run`; `flatpak` missing from PATH; malformed launch args |
| **In-app check** | Admin → Engines → RetroArch path; launch preview should normalize to `flatpak run org.libretro.RetroArch …` |
| **Terminal check** | `which flatpak`; `flatpak run org.libretro.RetroArch --version` |
| **Safe fix** | Install Flatpak RetroArch or set system `retroarch` binary; run `npm run verify:engine-launch` |
| **Verified when** | SNES proof ROM launches from xi-io GUI without parse error |

---

## Preflight validation failed (before launch invoke)

| | |
|---|---|
| **Code** | XIO-LCH-016 (may overlap XIO-LCH-001–005) |
| **Symptom** | Blocker on game card or readiness panel; launch never reaches overlay **Launching…** |
| **Likely cause** | `validate_launch_plan` / `prepare_launch` rejected command (missing binary, Flatpak unavailable, invalid args) |
| **In-app check** | Hero blockers; GameDetail readiness strip |
| **Terminal check** | `npm run verify:engine-launch`; `test -f` on engine binary and proof ROM |
| **Safe fix** | Resolve blocker shown (engine, core, content, permission); save Admin → Engines |
| **Verified when** | Readiness shows ready; launch proceeds to overlay |

---

## Controller D-pad works but A/B do not

| | |
|---|---|
| **Code** | (Pass B blocker — no XIO code yet) |
| **Symptom** | Navigation works in xi-io and partial FCEUX input; A/B dead in-game |
| **Likely cause** | `controller_profile` metadata not applied at launch; FCEUX input config not generated |
| **In-app check** | Controllers page; **Mark In-Game Verified** only after real in-game A/B test |
| **Terminal check** | N/A for mapping — engine-side |
| **Safe fix** | **Known Pass B blocker** — awaits A/B mapping at launch; do not mark verified |
| **Verified when** | A/B work in FCEUX/RetroArch without manual remapping each session |

---

## Browser Gamepad API red but emulator input works

| | |
|---|---|
| **Code** | — (acceptable with note per policy) |
| **Symptom** | Controllers page shows no detection; pad works in FCEUX |
| **Likely cause** | WebView Gamepad API ≠ evdev; browser detection is not product proof |
| **In-app check** | `docs/decisions/generic-usb-controller-proof-policy.md` |
| **Terminal check** | `cat /proc/bus/input/devices \| grep -i gamepad` |
| **Safe fix** | Use **Mark In-Game Verified** after in-game test; native evdev bridge handles shell navigation |
| **Verified when** | In-game proof recorded; Return-to-Arcade chord works |

---

## Demo mode accidentally enabled

| | |
|---|---|
| **Code** | XIO-LCH-013 |
| **Symptom** | Instant "launch success" without FCEUX window |
| **Likely cause** | `xibalba_demo_mode` in localStorage |
| **In-app check** | Demo banner on Arcade Home; Admin → Settings |
| **Terminal check** | Browser devtools → Application → localStorage → `xibalba_demo_mode` |
| **Safe fix** | Disable demo mode in Settings |
| **Verified when** | Real Tauri launch spawns FCEUX process |

---

## SNES core uses bsnes temporary smoke instead of Snes9x

| | |
|---|---|
| **Code** | XIO-LCH-002 (if core path wrong) |
| **Symptom** | SNES launch fails or wrong core loaded |
| **Likely cause** | Pass B requires **Snes9x** core path; bsnes smoke tests are not Pass B closure |
| **In-app check** | Admin → Engines → SNES core path = `snes9x_libretro.so` |
| **Terminal check** | `find /usr -name 'snes9x_libretro.so' 2>/dev/null` |
| **Safe fix** | Install/locate Snes9x core; update path; use real `.smc` on Storage drive |
| **Verified when** | SNES proof game launches via xi-io; ledger `launch_started` with correct command |

---

## Return-to-Arcade (controller-only exit)

Primary exit path — **does not use FCEUX menus**:

| Input | Action |
|-------|--------|
| Hold **Select + Start** 1 second | Terminate emulator session, restore xi-io |
| Press **Guide / Home** | Same (after 3s arm delay from launch) |
| Custom mapped button | Same (Controllers setup) |
| **Esc** | Keyboard fallback |

---

## Where to look in-app

| Surface | What it shows |
|---------|----------------|
| Arcade Home hero | Pre-launch blockers |
| Launch Display overlay | Monitor/mode before launch (multi-monitor) |
| Launch overlay | In-flight / error / return state |
| Admin → Logs | Ledger events (message only; details JSON not expanded yet) |
| Admin → Engines | Paths, proof ROMs, engine test |

---

## Escalation checklist for agents

After user reports failure, capture:

```txt
1. XIO-LCH code (from launch-failure-codes.md)
2. Admin → Logs last 10 events
3. pgrep -af 'fceux|xi-io-emulator|RetroArch'
4. emulator_last_session.json if present
5. Single vs multi monitor
6. Demo mode on/off
7. Pass B shelf vs demo tile
8. shell_focus_restored vs shell_focus_restore_failed in Logs (PRH-02)

---

## PRH-04 user hardware retest checklist

WIP branch: `wip/pass-b-lifecycle-display-shell` @ `5705344`

Full sign-off table: [pass-b-final-evidence-report.md](../reports/pass-b-final-evidence-report.md) § User hardware sign-off.

Minimum retest order:

```txt
1. Configure .env.local + Admin → Engines proof paths (local only — never commit)
2. Launch NES from Pass B Launch Proof shelf
3. Play briefly; exit via Select+Start or Guide (not FCEUX menu)
4. Confirm return to shell + Logs (shell_focus_restored or shell_focus_restore_failed)
5. Repeat SNES proof game
6. Confirm A/B in-game on NES (minimum bar before Mark Verified)
7. Fill sign-off table in evidence report
```

**Do not mark Pass B complete until sign-off table is filled.**

---
```

Do not close Pass B until NES lifecycle, SNES launch, and A/B mapping are verified on user hardware.
