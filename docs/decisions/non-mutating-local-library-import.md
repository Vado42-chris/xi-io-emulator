# Decision: Non-Mutating Local Library Import

Date: 2026-05-28

## Purpose

The user's local SNES library is an existing external collection and must be treated as user-owned source material.

xi-io Emulator may index the collection, create internal metadata, attach tags, map artwork, build review queues, and generate user-facing display titles.

xi-io Emulator must not move, rename, delete, rewrite, or reorganize the physical ROM files during import or hydration.

## Known local SNES source root

The full local SNES library is located on the user's Aries machine at:

```txt
/media/chrishallberg/Storage 22/Games/emulators/ROMS/Super Nintendo for PC (Every SNES Rom N Emu EVER) (11337 roms)/ROMS
```

Shell prompt context supplied by user:

```txt
chrishallberg@aries:/media/chrishallberg/Storage 22/Games/emulators/ROMS/Super Nintendo for PC (Every SNES Rom N Emu EVER) (11337 roms)/ROMS$
```

This path is allowed in docs as a local ops note. Do not hardcode it into source code.

## Decision

Bulk import must be non-mutating by default.

Allowed:

```txt
read directory entries
record file paths
record file names
record file extensions
record file size
compute checksums if user approves / performance allows
create internal GameRecord entries
create internal display titles
create internal sort titles
create internal canonical identity candidates
create internal Rosetta aliases
create internal tags and metadata
map artwork candidates
create review queues
store user decisions in xi-io metadata
```

Not allowed without explicit separate user approval:

```txt
rename physical ROM files
move ROM files
copy ROM files into a managed library
write sidecar files next to ROMs
delete ROM files
patch ROM files in place
rewrite emulator configs
bulk download artwork into the ROM folder
```

## Metadata tagging model

The system should preserve raw physical file identity while adding xi-io metadata projections.

Distinguish:

```txt
sourcePath: physical path on disk
rawFilename: original filename
rawStem: original filename without extension
displayTitle: cleaned user-facing title
sortTitle: stable title for ordering
canonicalIdentityCandidate: Rosetta-derived identity candidate
systemId: snes
libraryRootId: root record for this source folder
tags: xi-io / Rosetta / user tags
artworkMapping: local/provider/fallback artwork state
reviewStatus: whether the record needs user review
```

## Example internal tags

```txt
system:snes
source:batch_library
source-root:aries-storage-snes
identity:raw
identity:normalized
identity:needs_review
region:usa
region:japan
variant:rev-1
variant:translation
variant:hack
variant:prototype
artwork:matched_exact
artwork:matched_possible
artwork:missing
```

Tags are metadata only. They do not alter files on disk.

## Import behavior

The first real bulk pass should:

```txt
scan the source root read-only
create a LibraryRoot entry
create GameRecord entries with raw path + raw filename preserved
run Rosetta identity normalization
attach system and source tags
attempt local-first artwork mapping
assign generated fallback art if no match
create review queues for ambiguous identity or artwork
show import summary before finalizing if practical
```

## File operation policy

All physical file operations must be separate, explicit, and ledgered.

Required confirmations for any future file rename/move:

```txt
show old path
show proposed new path
show reason
show affected metadata
show rollback warning
require explicit user confirmation
write ledger event
```

Default cleanup is metadata cleanup only:

```txt
clean displayTitle
clean sortTitle
add aliases
add tags
select artwork
```

## Rosetta / framework method

This decision depends on the Rosetta identity layer. The Rosetta layer should map messy ROM names into internal metadata without destroying or mutating the original filenames.

Canonical companion docs:

```txt
docs/decisions/rosetta-stone-artwork-identity-resolution.md
docs/decisions/library-image-hydration-before-bulk-ingress.md
docs/agent-handoff-image-hydration.md
docs/contracts/game-management-contract-v1.md
docs/contracts/storage-contract-v1.md
```

## Bulk hydration gate

Do not scan this full source root until:

```txt
Pass B hardware proof is complete
Pass C launch proof milestone is closed
XARCADE-IMAGE-HYDRATION-001 is implemented enough to avoid text-only records
non-mutating import behavior is confirmed in code
```

## Serialized tags

```txt
#xio:emulator/storage/non-mutating
#xio:emulator/library/source-root
#xio:emulator/metadata/tagging
#xio:emulator/rosetta/tags
#risk:accidental-file-mutation
#risk:private-path-leak
#todo:storage/read-only-source-root
```

## Decision summary

The local SNES library is a read-only source root.

xi-io Emulator will import it by reference, preserve original paths and names, and apply framework/Rosetta metadata internally.

Physical file rename/move/delete is out of scope for default hydration and requires a separate explicit user-approved operation.
