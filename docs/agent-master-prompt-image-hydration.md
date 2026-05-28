# Master Prompt: Image Hydration Implementation

Date: 2026-05-28

Use this prompt when implementing **XARCADE-IMAGE-HYDRATION-001** after Pass B and Pass C complete.

Do **not** run this slice before:

```txt
Pass B: local hardware proof
Pass C: launch proof milestone documentation close
XARCADE-STANDARDIZATION-AUDIT-001: repo hygiene lock (complete)
```

## Prompt

```txt
You are working in Vado42-chris/xi-io-emulator.

CURRENT TASK:
XARCADE-IMAGE-HYDRATION-001

FIRST READ:
docs/agent-handoff-image-hydration.md
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/architecture/naming-and-pathing-standard.md
docs/architecture/conversation-decision-backlog.md
docs/project-tracking/open-work-ledger.md

GUARDRAILS:
- Do not bulk-scan the local library.
- Do not auto-download provider images.
- Missing artwork must not block launch readiness.
- Do not start XARCADE-STORAGE-001 in the same pass unless explicitly scoped.
- Do not implement Ibal (reserved for XARCADE-IBAL-SLOT-001).

Follow the handoff acceptance criteria and report format in:
docs/agent-handoff-image-hydration.md
```

## Canonical implementation handoff

```txt
docs/agent-handoff-image-hydration.md
```
