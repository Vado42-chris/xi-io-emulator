# Content and User Library Boundary

Date: 2026-05-30  
Status: **Active — public product policy**  
Tags: `#xio:emulator/legal/boundary` `#xio:emulator/content/policy`

---

## Plain-language policy

xi-io Emulator is **software for organizing and launching games the user already owns locally**. It is not a game store, ROM provider, or content distributor.

---

## What xi-io does

```txt
Index user-selected local files by reference (read-only)
Store catalog metadata, artwork mappings, and settings in app-owned data
Launch configured emulator engines against user-provided paths
Provide a controller-first arcade shell UI
```

---

## What xi-io does not do

```txt
Provide ROMs or game files
Download copyrighted commercial games
Bundle copyrighted game content in the product or repository
Upload user ROM paths or filenames to cloud by default
Mutate, rename, move, or delete user ROM files during import
Market itself as a substitute for purchasing games
```

---

## User responsibility

Users are responsible for:

```txt
Legal right to use the files they point the app at
Compliance with copyright and platform terms in their jurisdiction
Keeping backups of their own media
Choosing library locations (USB, NAS, local disk)
```

---

## Monetization boundary

The product may monetize **software, features, themes, and support** — not game content.

```txt
Allowed: donation, supporter tier, optional cloud backup of settings/catalog (opt-in)
Deferred: advertising (cabinet UX and legal review required)
Never: selling ROMs, ROM packs, or access to copyrighted game libraries
```

See [portable-usb-and-kiosk-product-model.md](../future/portable-usb-and-kiosk-product-model.md) § Monetization guardrails.

---

## Developer / agent rules

```txt
Never commit user ROM binaries to the public app repo
Never commit user machine paths to public manifests or docs
Never link private personal archive repos in public documentation
Never implement bulk download of commercial game libraries
Use proof_game_id and path_status in public artifacts — not full ROM paths
```

Related: [.memory/security.md](../../.memory/security.md), [supply-chain-security-baseline.md](../security/supply-chain-security-baseline.md).

---

## Emulation and cheats

Reference metadata for cheats, hacks, or homebrew may exist in **user-owned** or **private research** contexts. The public product does not ship cheat databases tied to commercial ROM distribution.

---

## Tags

```txt
#xio:emulator/legal/boundary
#xio:emulator/content/no-distribution
```
