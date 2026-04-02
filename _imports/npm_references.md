# npm Reference Audit (Vendored TypeScript)

Date: 2026-02-22
Scope: `_imports/typescript/lib/*`
Purpose: locate npm-related references and trace function chains that can execute npm commands.

## Summary

- npm-related tokens are present in vendored TypeScript runtime sources.
- **Direct npm command execution path exists only in typings installer flow** (`_typingsInstaller.js`).
- `tsc` compile path used by this project (`node _imports/typescript/lib/tsc.js --project tsconfig.json`) does **not** include a direct npm invocation path from observed references.
- Most `npm` mentions in `_tsc.js` and `typescript.js` are diagnostic/help strings.

## Match Counts (token scan)

<!-- 
the main thing I am concerned with: if TypeScript is only used for compilation, npm execution paths should not be triggered; if we need to download additional typings, npm execution paths may be triggered, but let's do this now and move everything into `_imports` and map paths appropriately 
-->

- `_imports/typescript/lib/typescript.js`: 16
<!-- typescript.js should already be downloaded and exist entirely in `_imports/typescript/lib/` -->
- `_imports/typescript/lib/_typingsInstaller.js`: 15
<!-- does this need to be run once to get typings? -->
- `_imports/typescript/lib/_tsc.js`: 12
<!-- should be safe from direct npm execution -->
- `_imports/typescript/lib/_tsserver.js`: 10
<!-- should be safe from direct npm execution -->
- `_imports/typescript/lib/typesMap.json`: 1
<!-- does this need to be run once to create a typesMap? -->

## Files and Findings

### 1) `_imports/typescript/lib/_typingsInstaller.js`

High-signal npm execution points:

- `getDefaultNPMLocation(...)` resolves npm executable path or fallback `"npm"`.
- `NodeTypingsInstaller.constructor(...)`:
  - sets `this.npmPath`
  - runs `this.execSyncAndLog(`${this.npmPath} install --ignore-scripts types-registry@...`, { cwd })`
- `NodeTypingsInstaller.installWorker(...)`:
  - calls `typescript_exports.server.typingsInstaller.installNpmPackages(...)`
  - callback executes generated command via `this.execSyncAndLog(command, { cwd })`
- `execSyncAndLog(...)` uses `child_process.execSync(...)` to run command strings.

Also reads args for overriding behavior:

- `--npmLocation`
- `--validateDefaultNpmLocation`

### 2) `_imports/typescript/lib/_tsserver.js`

No direct npm shell call observed in this file, but it launches the installer process that can invoke npm:

- `startNodeSession(...)` defines `NodeTypingsInstallerAdapter`
- `NodeTypingsInstallerAdapter.createInstallerProcess()`:
  - builds arg list including `NpmLocation` / `ValidateDefaultNpmLocation` if present
  - forks `typingsInstaller.js`
- The forked installer process is the executable path that eventually runs npm commands.

### 3) `_imports/typescript/lib/typescript.js`

Contains core helper and adapter definitions used by tsserver/typings installer:

- `installNpmPackages(npmPath, tsVersion, packageNames, install)` builds npm install command slices.
- `getNpmCommandForInstallation(...)` constructs command text.
- `TypingsInstaller.handleRequest(...)` + install flows eventually call `installWorker(...)` in concrete installer implementation.
- `TypingsInstallerAdapter.enqueueInstallTypingsRequest(...)` drives request scheduling into installer process.

Many additional npm mentions are diagnostics / argument constants (not direct execution by themselves).

### 4) `_imports/typescript/lib/_tsc.js`

Observed npm mentions are primarily diagnostic strings (e.g., suggestions like installing `@types/*`).
No clear direct npm process execution path identified from the scanned symbols.

### 5) `_imports/typescript/lib/typesMap.json`

Single npm-related text mention (metadata/mapping context), not an execution path.

## Function Chain(s) that can call npm

### Chain A (Primary runtime npm execution path)

1. `_tsserver.js`: `startNodeSession(...)`
2. `_tsserver.js`: `new NodeTypingsInstallerAdapter(...)` (unless automatic typing acquisition disabled)
3. `_tsserver.js`: `NodeTypingsInstallerAdapter.createInstallerProcess()`
4. `_tsserver.js`: `fork("typingsInstaller.js", args, ...)`
5. `_typingsInstaller.js`: `new NodeTypingsInstaller(...)`
6. `_typingsInstaller.js`: `NodeTypingsInstaller.constructor(...)`
7. `_typingsInstaller.js`: `execSyncAndLog("<npmPath> install ... types-registry ...")`
8. `_typingsInstaller.js`: later install requests -> `installWorker(...)`
9. `_typingsInstaller.js`: `typescript_exports.server.typingsInstaller.installNpmPackages(...)`
10. `_typingsInstaller.js`: callback -> `execSyncAndLog(command, { cwd })`
11. `_typingsInstaller.js`: `child_process.execSync(...)`

### Chain B (Command composition helper path)

1. `typescript.js`: `TypingsInstaller.handleRequest(...)`
2. `typescript.js`: install flow -> `installWorker(...)` (implemented by concrete installer)
3. `typescript.js`: `installNpmPackages(...)`
4. `typescript.js`: `getNpmCommandForInstallation(...)`
5. concrete runtime (`_typingsInstaller.js`) executes resulting command via `execSyncAndLog(...)`

## Initial Evaluation Guidance

- **If your workflow is only `tsc.js` compile:** likely safe from active npm invocation path.
- **If tsserver typings installer is active:** npm execution path is present in vendored code.
- Candidate mitigations to evaluate next:
  1. force-disable automatic typing acquisition in tsserver startup args/config,
  2. patch `_typingsInstaller.js` to hard-fail on install commands,
  3. reroute `npmPath` to a local no-op shim script and log calls,
  4. deeper hardening in `_tsserver.js` adapter creation path.

## Recommended Next Step

Run a controlled test with tsserver launched for this workspace and capture whether `typingsInstaller.js` is spawned. If yes, decide between disablement vs. explicit no-op reroute strategy.

## Applied Hardening (2026-02-22)

- Workspace settings now disable automatic typing acquisition:
  - `typescript.disableAutomaticTypeAcquisition = true`
- VS Code is pinned to vendored TypeScript SDK:
  - `typescript.tsdk = _imports/typescript/lib`
- Optional npm execution guard is configured:
  - `typescript.npm = _imports/noop_npm.cmd`
  - shim file: `_imports/noop_npm.cmd` (logs invocation and exits non-zero)

These controls are defense-in-depth for editor/runtime behavior; project compilation remains:

- `node _imports/typescript/lib/tsc.js --project tsconfig.json`

## Observed Runtime Behavior (Controlled Probe)

Date: 2026-02-22
Host: Windows, Node.js 24.13.1

Probe method:

- Launch `tsserver.js` in a short-lived process.
- Inspect direct child processes by `ParentProcessId`.
- Compare default launch vs launch with `--disableAutomaticTypingAcquisition`.

### Probe A: Default tsserver launch

Command:

- `node _imports/typescript/lib/tsserver.js --logVerbosity verbose --logFile _imports/tsserver_probe.log`

Observed children:

- `conhost.exe` (console host)
- `node.exe ... _imports/typescript/lib/typingsInstaller.js --globalTypingsCacheLocation ... --typesMapLocation ...`

Result:

- `typingsInstaller.js` **spawned**.

### Probe B: ATA-disabled tsserver launch

Command:

- `node _imports/typescript/lib/tsserver.js --disableAutomaticTypingAcquisition --logVerbosity verbose --logFile _imports/tsserver_probe.log`

Observed children:

- `conhost.exe` only.

Result:

- `typingsInstaller.js` **not spawned**.

### Conclusion from observed behavior

- The npm-capable path is actively reachable in default tsserver mode.
- Adding `--disableAutomaticTypingAcquisition` prevents typings installer process creation in this probe.
- This confirms that ATA disablement is the key control for blocking automatic npm-driven typings flow in editor runtime.
