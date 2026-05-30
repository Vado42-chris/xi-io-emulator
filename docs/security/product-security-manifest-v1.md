# Product Security Manifest v1

Date: 2026-05-30  
Applies to: Every xi-io product repo (`projects/manifests/<product>.project-manifest.yaml`)

---

## Purpose

The product manifest tells humans and AI **what security baseline this repo claims to follow** and where audit artifacts live. It must be **public-safe** — no user home paths or full ROM paths.

---

## Required manifest fields (public-safe)

```yaml
security:
  framework_baseline_commit: "<git sha on xi-io.net security/baseline.yaml>"
  product_baseline_doc: docs/security/supply-chain-security-baseline.md
  agent_rules: .memory/security.md
  verify_commands:
    deps: npm run verify:deps
  audit_status:
    npm_audit: unknown          # updated by CI or release notes
    cargo_audit: unknown
    sbom: not_generated
    secret_scan: not_configured
  local_data_stores:
    - name: localStorage
      phase: pass_b
      migrates_to: sqlite       # PRH-01
  network_surfaces:
    - none                      # update if telemetry/API added
  tauri_capabilities: src-tauri/capabilities/
  known_exceptions: []          # IDs from security-exception-register.md
  pre_release_hardening:         # product-specific gates
    tracker: docs/project-tracking/pre-release-hardening-milestones.md
```

---

## Local-only overlay (gitignored)

Machine-specific values belong in:

```txt
projects/local/<product_id>.local.yaml
```

Example: [pass-b-local-paths.example.yaml](../../projects/evidence/xi_io_emulator/pass-b-local-paths.example.yaml)

Never commit:

- `local_path` with real username
- Full proof ROM paths
- Working directories with `/media/...` user storage

---

## Proof ROM references (public manifest)

Use IDs and status — not paths:

```yaml
proof_roms:
  nes:
    proof_game_id: game_passb_nes
    path_status: configured_in_local_overlay
    engine: fceux
  snes:
    proof_game_id: game_passb_snes
    path_status: configured_in_local_overlay
    engine: retroarch
```

---

## WIP branch declaration (optional)

For preservation branches not merge-ready:

```yaml
branch_policy:
  active_wip: wip/pass-b-lifecycle-display-shell
  wip_head_sha: "95e2426"
  merge_ready: false
  review_required: slice_before_main
```

---

## Tags

```txt
#xio:framework/security/product-manifest-v1
```
