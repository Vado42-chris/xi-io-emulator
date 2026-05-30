# Portable USB and Kiosk Product Model

Date: 2026-05-30  
Status: **Future product doctrine — docs only; not implemented**  
Tags: `#xio:emulator/portable/usb` `#xio:emulator/kiosk/future` `#xio:emulator/product/doctrine`

---

## Purpose

Capture the long-term product model where xi-io Emulator can:

- Run from a USB key
- Be installed from a USB key onto internal storage
- Eventually boot as a lightweight kiosk/cabinet OS shell (far future)

This document is **product strategy only**. It does not authorize Pass C, bulk hydration, storage implementation, or WIP merge to `main`.

**Current gates remain active:** Pass B partial/blocked, PRH-01–04, bulk hydration blocked.

---

## Product doctrine (locked)

```txt
The app and the user's game library may live on the same removable drive,
but the app must treat the ROM library as external, read-only source material.
```

Reinforces existing invariants:

```txt
no ROM mutation
no hardcoded local paths in public repo
catalog by reference
mount status awareness
portable app data separate from ROM folder
missing-library graceful state
```

Related: [non-mutating-local-library-import.md](../decisions/non-mutating-local-library-import.md), [content-and-user-library-boundary.md](../legal/content-and-user-library-boundary.md), [storage-contract-v1.md](../contracts/storage-contract-v1.md).

---

## Default USB layout

```txt
USB volume (or install source)
├── xi-io/                    # app binary / portable install
│   ├── (Tauri shell, engines config as applicable)
│   └── app-data/             # catalog, SQLite, settings, cache, logs (user-owned)
└── library/                  # user ROMs — indexed by reference, never mutated
    ├── nes/
    ├── snes/
    └── ...
```

**Rules:**

- ROM files never live inside the app install folder by default.
- App data may travel with portable installs or live on internal disk when installed.
- Library folder is sibling to app folder, not nested under binaries.

---

## Run modes

### Portable run (from USB)

User launches `xi-io/` from the stick. Library root points at `library/` on the same volume (or a second stick).

```txt
Launch → pick/remember library root → browse → launch → return to shell
```

### Installed app + removable library

App installed to internal storage; library stays on USB/NAS. Catalog remembers roots and mount state.

```txt
Install once → library on external drive → reconnect drive → catalog restores tiles
```

### Missing drive behavior

When a library root is unplugged:

```txt
Do not delete GameRecords
Do not show empty library
Show "library unavailable" / recovery UI
Preserve last known path and mount hint
Offer reconnect / re-pick folder flow
```

Aligns with [storage-contract-v1.md](../contracts/storage-contract-v1.md) § Future addendum.

---

## Path model (future — before bulk hydration)

Absolute paths are brittle on removable media. Future catalog records should prefer:

```txt
libraryRootId
relativePath
volumeHint
lastResolvedAbsolutePath   # cache only, not source of truth
pathStatus                 # mounted | missing | permission_denied | ...
```

Not only:

```txt
contentPath: /absolute/path/to/file.smc
```

Local overlays (`projects/local/*.local.yaml`, runtime config) hold machine-specific roots — never public git. See **XARCADE-RUNTIME-CONFIG-001** (move paths off frontend `VITE_*` before public beta).

---

## Input model (unified — future)

One input layer for all surfaces:

| Input | Use |
|-------|-----|
| Gamepad | Primary arcade/cabinet UX |
| Keyboard | Dev, accessibility, launch overlay |
| Mouse | Desktop browse, admin |
| Touch | Tablets, ChromeOS research, kiosk panels |
| Cabinet controls | Encoders, joysticks, IPAC-class devices |

Feeds existing controller/nav work — not a separate feature branch today.

---

## Platform sequence

| Platform | Phase | Notes |
|----------|-------|-------|
| **Linux** | Now (Pass B) | Primary proof; Tauri + host engines |
| **Windows** | Post–Pass C packaging slice | Portable + installed; engine path differences |
| **macOS** | Later | Sandboxing, notarization, engine launch constraints |
| **ChromeOS** | Research only | See **XARCADE-CHROMEOS-RESEARCH-001** — Crostini, Android, PWA, kiosk modes |

Hard problems per OS: engine launch, filesystem permissions, removable storage, controller APIs, packaging — not React UI.

---

## Monetization guardrails (future)

Market as:

```txt
home arcade shell
library manager
local-first cabinet UI
bring-your-own-games frontend
```

**Not** as ROM pack, downloader, game store, or licensed-content substitute.

| Tier | Direction |
|------|-----------|
| **Supporter / donate first** | Buy Me a Coffee, Stripe one-time, optional license key |
| **Opt-in extras** | Themes, cloud backup of **settings/catalog only** |
| **Deferred** | Ads — UX-sensitive on cabinet; legal review required |
| **Never** | Bundled copyrighted ROMs, ROM store, redistribution |

No Stripe, ads, or supporter features until Pass B/C, PRH gates, and first stable product slice.

---

## Future kiosk distro (north star only)

**Milestone:** XARCADE-KIOSK-DISTRO-001 — far future, after market proof.

```txt
Boot → minimal compositor → xi-io full screen → gamepad-first shell
```

Requires: bundled or tightly coupled engines, read-only library mounts, kiosk session, hardware quirk matrix. Not on active roadmap.

---

## Future milestones (reference)

| ID | Plain name | Blocks Pass B? |
|----|------------|----------------|
| XARCADE-PORTABLE-USB-001 | USB portable run + library sibling layout | No |
| XARCADE-RUNTIME-CONFIG-001 | Runtime path config (not VITE_* in release) | No (blocks public beta) |
| XARCADE-KIOSK-DISTRO-001 | Lightweight Linux boot-to-shell distro | No |
| XARCADE-CHROMEOS-RESEARCH-001 | ChromeOS packaging research | No |

---

## What this doc does not authorize

```txt
Pass C execution
Bulk library hydration
XARCADE-STORAGE-001 implementation
WIP merge to main
Private personal library repo linkage in public docs
ROM distribution or GitHub ROM hosting
```

---

## Tags

```txt
#xio:emulator/portable/usb
#xio:emulator/kiosk/future
#xio:emulator/monetization/guardrails
#todo:portable/usb-layout
#todo:runtime/path-relative-catalog
```
