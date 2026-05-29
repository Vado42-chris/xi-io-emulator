# Pass B Troubleshooting Runbook

Date: 2026-05-29

## Purpose

Operator and user runbook for **XARCADE-CONTROLLER-LAUNCH-PROOF-001** hardware proof on Pop!_OS / Linux.

**Failure codes:** see [launch-failure-codes.md](./launch-failure-codes.md)

**Milestone:** Pass B partial/blocked. Pass C not safe. This runbook does not close the milestone.

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
| **Verified when** | Launch from proof shelf with Storage 22 paths |

---

## FCEUX black screen after File → Close Game

| | |
|---|---|
| **Code** | XIO-LCH-011 |
| **Symptom** | FCEUX stays fullscreen black; xi-io does not return |
| **Likely cause** | FCEUX keeps process alive after ROM unload; lifecycle monitor must detect idle and kill session |
| **In-app check** | Prefer **controller return**: hold **Select + Start** 1s or press **Guide/Home** (not FCEUX menus) |
| **Terminal check** | `pgrep -af fceux`; `xdotool search --name FCEUX getwindowname %@` |
| **Safe fix** | Re-test with latest lifecycle build; if stuck: `pkill -f fceux` then return to xi-io |
| **Verified when** | After return chord: `pgrep -af fceux` empty; xi-io focused on game card |

**Note:** File → Close Game is a keyboard/menu path. Controller-only users should use **Select+Start / Guide**, not FCEUX menus.

---

## xi-io does not return after emulator exit

| | |
|---|---|
| **Code** | XIO-LCH-008, XIO-LCH-011 |
| **Symptom** | Game ended but Arcade Home not visible; overlay stuck or desktop showing |
| **Likely cause** | Focus restore failed; FCEUX still alive; or launch overlay waiting on invoke |
| **In-app check** | Admin → Logs: `launch_failed`, `emulator_exited`, `shell_focus_restored` |
| **Terminal check** | `pgrep -af 'fceux|xi-io-emulator'`; `cat ~/.local/share/com.xi-io.emulator/emulator_last_session.json` |
| **Safe fix** | Kill orphan FCEUX; Alt-Tab to xi-io; File → Exit if needed |
| **Verified when** | Clean return to Zelda card; overlay clears; ledger `emulator_exited` |

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
```

Do not close Pass B until NES lifecycle, SNES launch, and A/B mapping are verified on user hardware.
