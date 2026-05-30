# Storage Contract v1

The storage contract ensures ROM libraries on secondary drives behave predictably on Linux.

## Purpose

A missing mounted drive must not look like an empty library.

The app must track library roots, mounted state, last seen paths, scan results, and recovery actions.

## Library root model

```ts
type LibraryRoot = {
  id: string;
  label: string;
  path: string;
  expectedDevice?: string;
  systems: string[];
  mounted: boolean;
  lastSeenAt?: string;
  lastScanAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Mounted volume model

```ts
type MountedVolume = {
  id: string;
  label?: string;
  mountPath: string;
  devicePath?: string;
  filesystem?: string;
  available: boolean;
  detectedAt: string;
};
```

## Game record model

```ts
type GameRecord = {
  id: string;
  systemId: string;
  title: string;
  contentPath: string;
  libraryRootId: string;
  fileExtension: string;
  fileSizeBytes?: number;
  checksum?: string;
  favorite: boolean;
  hidden: boolean;
  lastPlayedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

## Storage states

```txt
mounted
missing
permission_denied
path_changed
empty
scan_pending
scan_in_progress
scan_failed
```

## Required flows

### Add library root

```txt
1. User chooses a folder.
2. App stores the path and label.
3. App infers system candidates from files.
4. App records mounted state.
5. App starts or offers a scan.
```

### Missing drive

```txt
1. App starts.
2. Library root path does not exist.
3. App marks root as missing.
4. App shows missing-drive UI.
5. App does not delete game records.
6. App offers reconnect / choose new path / forget root.
```

### Rescan

```txt
1. User chooses rescan.
2. App scans files under root.
3. App updates changed records.
4. App marks absent files as unavailable, not deleted by default.
5. App emits scan summary.
```

## Scan result model

```ts
type LibraryScanResult = {
  scanId: string;
  libraryRootId: string;
  startedAt: string;
  completedAt?: string;
  status: "completed" | "failed" | "cancelled";
  filesSeen: number;
  gamesAdded: number;
  gamesUpdated: number;
  gamesMissing: number;
  duplicatesFound: number;
  errors: StorageDiagnostic[];
};
```

## Diagnostic model

```ts
type StorageDiagnostic = {
  severity: "info" | "warning" | "error";
  code:
    | "root_missing"
    | "permission_denied"
    | "unsupported_extension"
    | "duplicate_file"
    | "scan_failed";
  message: string;
  path?: string;
};
```

## MVP supported extensions

```txt
SNES:
  .sfc
  .smc

Later:
  .zip
  .7z
  .nes
  .cue
  .bin
  .chd
  .iso
```

## Ledger events

```txt
library_root_added
library_root_missing
library_root_reconnected
library_scan_started
library_scan_completed
library_scan_failed
rom_detected
duplicate_rom_detected
```

## UX rules

1. Never delete user library records because a drive is temporarily missing.
2. Never show an empty state if the root is missing.
3. Always show the last known path.
4. Always give the user a recovery path.
5. Never copy ROMs by default.
6. Never upload ROM names or paths by default.

---

## Future addendum — portable USB and relative paths (v1.1 target)

Status: **Planned — not implemented.** See [portable-usb-and-kiosk-product-model.md](../future/portable-usb-and-kiosk-product-model.md).

Before bulk hydration (XARCADE-STORAGE-001), catalog records should evolve beyond absolute `contentPath` only:

### Library root identity

```ts
type LibraryRoot = {
  // ... existing fields ...
  volumeFingerprint?: string;   // stable id for removable volume when detectable
  relativePathSupported: boolean;
  readOnlySource: boolean;      // default true for ROM roots
};
```

### Game path resolution (target shape)

```ts
type GamePathRef = {
  libraryRootId: string;
  relativePath: string;              // path within root, portable across mounts
  volumeHint?: string;               // e.g. USB label, last seen mount base
  lastResolvedAbsolutePath?: string; // cache; not authoritative
  pathStatus: 'mounted' | 'missing' | 'permission_denied' | 'path_changed';
};
```

### Portable catalog mode

```txt
App data (SQLite, settings, cache) may live:
  - beside portable install on USB (xi-io/app-data/)
  - or on internal disk when app is installed

Library data (ROM files) always external to app binary folder.
Catalog travels with app data; ROMs never copied into app install by default.
```

### Mount unavailable state

```txt
When libraryRoot.mounted === false:
  - preserve all GameRecords for that root
  - set pathStatus = missing on affected games
  - UI shows recovery banner, not empty library
  - no silent deletion or re-scan that drops records
```

### Read-only source root

```txt
ROM library roots are read-only by reference (decision locked).
Ingress and hydration must not write sidecars next to user ROMs without explicit opt-in.
```

Milestone: **XARCADE-PORTABLE-USB-001**, **XARCADE-RUNTIME-CONFIG-001**.
