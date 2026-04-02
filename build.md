Example build script for a Python web project that compiles Sass and TypeScript sources before starting the server. The script checks the modification times of source files against their compiled outputs and runs the appropriate compiler if any sources are newer. Compilation errors are logged as warnings, allowing the server to start even if there are issues with the source files.

```py
def _check_and_compile_sass() -> None:
"""Check SCSS sources against compiled CSS output; run Dart Sass if any .scss is newer.

    Compares the mtime of every .scss file under static/scss/ against each target
    .css output file. If any source is newer (or a target does not exist), invokes
    the vendored Dart Sass and logs the result. Runs synchronously before the server
    starts so the first request always gets up-to-date CSS. Compile errors are
    logged as warnings and do not prevent the server from starting.

    Compilation targets (source → output):
        static/scss/console.scss → static/css/console.css
        static/scss/styles.scss  → static/css/styles.css

    Sass binary: _imports/dart-sass/src/dart.exe _imports/dart-sass/src/sass.snapshot
    Invocation:  dart.exe sass.snapshot [flags] src:dst [src:dst ...]
    Flags:       --no-source-map --style=expanded
    """
    scss_dir  = BASE_DIR / "static" / "scss"
    dart_exe  = BASE_DIR / "_imports" / "dart-sass" / "src" / "dart.exe"
    snapshot  = BASE_DIR / "_imports" / "dart-sass" / "src" / "sass.snapshot"

    if not dart_exe.exists() or not snapshot.exists() or not scss_dir.exists():
        return

    targets = [
        (scss_dir / "console.scss", BASE_DIR / "static" / "css" / "console.css"),
        (scss_dir / "styles.scss",  BASE_DIR / "static" / "css" / "styles.css"),
    ]

    scss_files = list(scss_dir.rglob("*.scss"))
    if not scss_files:
        return

    newest_scss = max(f.stat().st_mtime for f in scss_files)
    needs_compile = any(
        not dst.exists() or dst.stat().st_mtime < newest_scss
        for _, dst in targets
    )
    if not needs_compile:
        return

    LOGGER.info("SASS: source changed -- compiling...")
    pairs = [f"{src}:{dst}" for src, dst in targets]
    result = subprocess.run(
        [str(dart_exe), str(snapshot), "--no-source-map", "--style=expanded"] + pairs,
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        LOGGER.info("SASS: compiled -- CSS updated")
    else:
        output = (result.stdout + result.stderr).strip()
        LOGGER.warning("SASS: compile errors:\n%s", output)

def _check_and_compile_ts() -> None:
    """Check TypeScript sources against compiled output; run tsc if any .ts is newer.

    Compares the mtime of every .ts file under static/js/ against the oldest .js
    file in static/js/dist/. If any source is newer (or dist/ is empty), invokes
    the vendored tsc and logs the result. Runs synchronously before the server
    starts so the first request always gets up-to-date JS. Compile errors are
    logged as warnings and do not prevent the server from starting.
    """
    ts_dir   = BASE_DIR / "static" / "js"
    dist_dir = BASE_DIR / "static" / "js" / "dist"
    tsc_path = BASE_DIR / "_imports" / "typescript" / "lib" / "tsc.js"
    tsconfig = BASE_DIR / "tsconfig.json"

    ts_files = [f for f in ts_dir.rglob("*.ts") if "dist" not in f.parts]
    if not ts_files or not tsc_path.exists():
        return

    newest_ts = max(f.stat().st_mtime for f in ts_files)
    js_files  = list(dist_dir.rglob("*.js")) if dist_dir.exists() else []
    oldest_js = min((f.stat().st_mtime for f in js_files), default=0.0)

    if newest_ts <= oldest_js:
        return  # all JS is up to date

    LOGGER.info("TypeScript: source changed -- compiling...")
    result = subprocess.run(
        ["node", str(tsc_path), "--project", str(tsconfig)],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        LOGGER.info("TypeScript: compiled -- JS updated")
    else:
        output = (result.stdout + result.stderr).strip()
        LOGGER.warning("TypeScript: compile errors:\n%s", output)

```

