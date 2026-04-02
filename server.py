"""
Material Web Builder local server.

Purpose:
- Serve project files from the repository root.
- Compile static/scss/styles.scss → static/css/styles.css at startup (Dart Sass, if available).
- Compile static/js/*.ts → static/js/dist/*.js at startup (TypeScript, if available).
- Expose theme discovery and theme file endpoints for browser UI:
  - GET  /api/themes            — list color_themes/ files
  - GET  /api/theme/<file>      — return one theme JSON
  - GET  /api/fonts             — list fonts/ files with family metadata
  - GET  /api/icons             — list icons/ files with grouped source summary
  - POST /api/export-package    — build and download themed export zip

Export package structure (POST /api/export-package):
  Expects JSON body:
    theme_file          — material-theme-*.json file name
    selected_font_files — list of font file names from fonts/
    icon_source         — "all", "root", or a subfolder name from icons/
    typography_json     — typography config object from the UI
    plain_font_css      — CSS font-family string for body/label/title roles
    brand_font_css      — CSS font-family string for display/headline roles

  Returns a zip containing:
    css/theme.css        — compiled CSS (Dart Sass, falls back to omitting if unavailable)
    js/behaviors.js      — optional interactive behaviors
    src/scss/            — full SCSS source tree with substituted token/font values
    src/ts/behaviors.ts  — TypeScript source for behaviors.js
    fonts/               — selected font files
    icons/               — selected icon files
    theme.json           — selected color theme JSON
    typography.json      — typography config JSON

Usage examples:
- python server.py
- python server.py --port 9000 --host 0.0.0.0 --verbose

Notes:
- This script uses only the Python standard library.
- Theme files are expected in color_themes/ with pattern material-theme-*.json.
- Dart Sass binaries expected at _imports/dart-sass/src/dart.exe + sass.snapshot.
- TypeScript compiler expected at _imports/typescript/lib/tsc.js.
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import re
import shutil
import subprocess
import tempfile
import zipfile
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


DEFAULT_VERBOSE = 0
DEFAULT_LOG_TO_FILE = 0
DEFAULT_ASSERTIONS_ENABLED = 1
DEFAULT_LOG_DIR_NAME = "_logs"
DEFAULT_LOG_FILE_NAME = "server.log"
THEME_DIR_NAME = "color_themes"
EXPORT_TEMPLATES_DIR_NAME = "_export_templates"
FONT_FILE_EXTENSIONS = (".ttf", ".ttc", ".otf", ".woff", ".woff2")
ICON_FILE_EXTENSIONS = (".svg", ".png", ".ico", ".jpg", ".jpeg", ".webp", ".gif")
FONT_WEIGHT_HINTS = [
    ("thin", 100),
    ("extralight", 200),
    ("ultralight", 200),
    ("light", 300),
    ("regular", 400),
    ("normal", 400),
    ("book", 400),
    ("medium", 500),
    ("semibold", 600),
    ("demibold", 600),
    ("bold", 700),
    ("extrabold", 800),
    ("ultrabold", 800),
    ("black", 900),
    ("heavy", 900),
]
LOGGER = logging.getLogger("material_web_builder")


def assert_when_enabled(condition: bool, message: str) -> None:
    """
    Assert a condition only when assertion toggles are enabled.

    Args:
        condition: Condition to validate.
        message: Assertion failure message.

    Returns:
        None.

    Example:
        assert_when_enabled(args.port > 0, "Port must be positive")
    """
    if DEFAULT_ASSERTIONS_ENABLED:
        assert condition, message


def configure_logging(verbose: bool, write_log_file: bool, project_root: Path) -> None:
    """
    Configure process logging.

    Args:
        verbose: If True, use DEBUG; otherwise INFO.
        write_log_file: If True, also write logs to _logs/server.log.
        project_root: Project root used to place log files.

    Returns:
        None.

    Example:
        configure_logging(verbose=True, write_log_file=True, project_root=Path("."))
    """
    log_level = logging.DEBUG if verbose else logging.INFO
    handlers: list[logging.Handler] = [logging.StreamHandler()]
    log_path: Path | None = None

    if write_log_file:
        log_dir = project_root / DEFAULT_LOG_DIR_NAME
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / DEFAULT_LOG_FILE_NAME
        handlers.append(logging.FileHandler(log_path, encoding="utf-8"))

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        handlers=handlers,
        force=True,
    )

    if write_log_file and log_path is not None:
        LOGGER.info("File logging enabled at %s", log_path)


def list_theme_files(project_root: Path) -> list[str]:
    """
    Return sorted material theme export files from project root.

    Args:
        project_root: Root directory to scan.

    Returns:
        Sorted list of file names matching material-theme-*.json in color_themes/.
        Uses natural version ordering (base file first, then -vN ascending).

    Example:
        list_theme_files(Path("."))
    """
    theme_dir = (project_root / THEME_DIR_NAME).resolve()
    if theme_dir.parent != project_root or not theme_dir.exists():
        return []

    theme_files = [
        file_path.name
        for file_path in theme_dir.glob("material-theme-*.json")
        if file_path.is_file()
    ]
    return sorted(theme_files, key=theme_file_sort_key)


def theme_file_sort_key(file_name: str) -> tuple[str, int, str]:
    """
    Return sorting key for material-theme filenames.

    Sort behavior:
    - Base file first: material-theme-Name.json
    - Versioned files next in numeric order: material-theme-Name-v2.json
    - Fallback to lexical ordering for non-matching names.

    Args:
        file_name: Theme file name.

    Returns:
        Tuple used as a deterministic sort key.

    Example:
        theme_file_sort_key("material-theme-OnSiteXI-v3.json")
    """
    stem = Path(file_name).stem
    match = re.match(r"^(?P<base>.+?)(?:-v(?P<version>\d+))?$", stem)
    if not match:
        return (stem.lower(), 10**9, file_name.lower())

    base_name = match.group("base").lower()
    version_text = match.group("version")
    version_value = -1 if version_text is None else int(version_text)
    return (base_name, version_value, file_name.lower())


def list_asset_files(
    project_root: Path,
    folder_name: str,
    extensions: tuple[str, ...],
    recursive: bool = True,
) -> list[str]:
    """
    Return sorted relative asset file paths from a project subfolder.

    Args:
        project_root: Root directory that contains asset folders.
        folder_name: Subfolder name under project root (for example "fonts").
        extensions: Allowed lowercase file suffixes.
        recursive: If True, recurse through nested folders.

    Returns:
        Sorted list of POSIX-style relative paths from folder_name.

    Example:
        list_asset_files(Path("."), "icons", ICON_FILE_EXTENSIONS)
    """
    folder_path = (project_root / folder_name).resolve()
    if folder_path.parent != project_root or not folder_path.exists():
        return []

    glob_pattern = "**/*" if recursive else "*"
    assets = []
    for file_path in folder_path.glob(glob_pattern):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() not in extensions:
            continue
        assets.append(file_path.relative_to(folder_path).as_posix())

    return sorted(assets)


def summarize_icon_sources(icon_files: list[str]) -> list[dict[str, int | str]]:
    """
    Group icon files by top-level source folder.

    Args:
        icon_files: Relative icon paths under icons/.

    Returns:
        Sorted list of source summary objects with counts.

    Example:
        summarize_icon_sources(["add.svg", "ionicons/add.svg"])
    """
    source_counts: dict[str, int] = {}
    for icon_path in icon_files:
        first_segment = icon_path.split("/", 1)[0]
        source_name = first_segment if "/" in icon_path else "root"
        source_counts[source_name] = source_counts.get(source_name, 0) + 1

    return [
        {"source": source_name, "count": source_counts[source_name]}
        for source_name in sorted(source_counts.keys())
    ]


def infer_weight_from_font_name(file_name: str) -> int:
    """
    Infer CSS font-weight token from file name hints.

    Args:
        file_name: Font file name.

    Returns:
        Inferred weight in range 100..900 (fallback 400).

    Example:
        infer_weight_from_font_name("ACaslonPro-BoldItalic.otf")
    """
    lowered = file_name.lower()
    for hint, weight in FONT_WEIGHT_HINTS:
        if hint in lowered:
            return weight
    return 400


def normalize_font_family_key(file_name: str) -> str:
    """
    Build normalized font family key from a file name.

    Args:
        file_name: Font file name.

    Returns:
        Normalized family key string.

    Example:
        normalize_font_family_key("ACaslonPro-BoldItalic.otf")
    """
    stem = Path(file_name).stem
    lowered = stem.lower()
    for hint, _ in FONT_WEIGHT_HINTS:
        lowered = lowered.replace(hint, "")
    lowered = lowered.replace("italic", "")
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return lowered or stem.lower()


def _run_subprocess(command: list[str], cwd: Path | None = None) -> tuple[int, str]:
    """
    Run subprocess command and return (exit_code, combined_output).

    Args:
        command: Command with argument list.
        cwd: Optional working directory.

    Returns:
        Tuple of process return code and combined stdout/stderr text.

    Example:
        code, output = _run_subprocess(["node", "tool.js"])
    """
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        cwd=str(cwd) if cwd else None,
    )
    output = (result.stdout + result.stderr).strip()
    return result.returncode, output


def _check_and_compile_sass(project_root: Path) -> None:
    """
    Check static SCSS sources and compile to CSS when stale.

    Args:
        project_root: Project root path.

    Returns:
        None.

    Example:
        _check_and_compile_sass(Path("."))
    """
    scss_dir = project_root / "static" / "scss"
    dart_exe = project_root / "_imports" / "dart-sass" / "src" / "dart.exe"
    snapshot = project_root / "_imports" / "dart-sass" / "src" / "sass.snapshot"

    if not dart_exe.exists() or not snapshot.exists() or not scss_dir.exists():
        return

    targets = [
        (scss_dir / "console.scss", project_root / "static" / "css" / "console.css"),
        (scss_dir / "styles.scss", project_root / "static" / "css" / "styles.css"),
    ]
    sources = [source for source, _ in targets if source.exists()]
    if not sources:
        return

    newest_scss = max(file_path.stat().st_mtime for file_path in sources)
    needs_compile = any(
        source.exists() and (not target.exists() or target.stat().st_mtime < newest_scss)
        for source, target in targets
    )
    if not needs_compile:
        return

    for _, target in targets:
        target.parent.mkdir(parents=True, exist_ok=True)

    LOGGER.info("SASS: source changed -- compiling...")
    pairs = [f"{source}:{target}" for source, target in targets if source.exists()]
    code, output = _run_subprocess(
        [
            str(dart_exe),
            str(snapshot),
            "--no-source-map",
            "--style=expanded",
            *pairs,
        ],
        cwd=project_root,
    )
    if code == 0:
        LOGGER.info("SASS: compiled -- CSS updated")
    else:
        LOGGER.warning("SASS: compile errors:\n%s", output or "(no output)")


def _check_and_compile_ts(project_root: Path) -> None:
    """
    Check project TypeScript sources under static/js and compile when stale.

    Args:
        project_root: Project root path.

    Returns:
        None.

    Example:
        _check_and_compile_ts(Path("."))
    """
    ts_dir = project_root / "static" / "js"
    dist_dir = ts_dir / "dist"
    tsc_path = project_root / "_imports" / "typescript" / "lib" / "tsc.js"
    tsconfig = project_root / "tsconfig.json"

    if not ts_dir.exists() or not tsc_path.exists() or not tsconfig.exists():
        return

    ts_files = [file_path for file_path in ts_dir.rglob("*.ts") if "dist" not in file_path.parts]
    if not ts_files:
        return

    newest_ts = max(file_path.stat().st_mtime for file_path in ts_files)
    js_files = list(dist_dir.rglob("*.js")) if dist_dir.exists() else []
    oldest_js = min((file_path.stat().st_mtime for file_path in js_files), default=0.0)

    if newest_ts <= oldest_js:
        return

    LOGGER.info("TypeScript: source changed -- compiling...")
    code, output = _run_subprocess(
        ["node", str(tsc_path), "--project", str(tsconfig)],
        cwd=project_root,
    )
    if code == 0:
        LOGGER.info("TypeScript: compiled -- JS updated")
    else:
        LOGGER.warning("TypeScript: compile errors:\n%s", output or "(no output)")




def _camel_to_kebab(name: str) -> str:
    """
    Convert a camelCase identifier to kebab-case.

    Args:
        name: camelCase string (e.g. "onPrimaryContainer").

    Returns:
        kebab-case string (e.g. "on-primary-container").

    Example:
        _camel_to_kebab("surfaceContainerHighest")  # "surface-container-highest"
    """
    return re.sub(r"([a-z])([A-Z])", r"\1-\2", name).lower()


def _substitute_color_tokens(template_text: str, theme_json: dict) -> str:
    """
    Replace SCSS !default hex values in _tokens.scss with actual theme colors.

    Reads light and dark scheme colors from theme_json.schemes.{light,dark} and
    substitutes them into any line matching the pattern:
      $md-sys-color-<name>: #RRGGBB !default;

    Light tokens map camelCase JSON keys to $md-sys-color-<kebab> variables.
    Dark tokens map the same keys to $md-sys-color-<kebab>-dark variables.
    Lines whose variable name is not in the substitution map are left unchanged.

    Args:
        template_text: Full content of _tokens.scss template.
        theme_json: Parsed material-theme-*.json payload.

    Returns:
        Template text with hex defaults replaced by theme colors.

    Example:
        substituted = _substitute_color_tokens(tokens_text, theme_data)
    """
    schemes = theme_json.get("schemes", {})
    light_scheme = schemes.get("light", {})
    dark_scheme = schemes.get("dark", {})

    substitutions: dict[str, str] = {}
    for camel_key, hex_value in light_scheme.items():
        scss_var = f"$md-sys-color-{_camel_to_kebab(camel_key)}"
        substitutions[scss_var] = str(hex_value).upper()
    for camel_key, hex_value in dark_scheme.items():
        scss_var = f"$md-sys-color-{_camel_to_kebab(camel_key)}-dark"
        substitutions[scss_var] = str(hex_value).upper()

    def _replace_line(match: re.Match) -> str:
        var_name = match.group(1)
        spacing = match.group(2)
        replacement_hex = substitutions.get(var_name)
        if replacement_hex:
            return f"{var_name}:{spacing}{replacement_hex} !default;"
        return match.group(0)

    return re.sub(
        r"(\$md-sys-color-[\w-]+)(:[ \t]+)(#[0-9A-Fa-f]{6}) !default;",
        _replace_line,
        template_text,
    )


def _substitute_font_tokens(template_text: str, plain_font_css: str, brand_font_css: str) -> str:
    """
    Replace SCSS !default font-family values in _typography.scss.

    Substitutes $md-typescale-plain-font and $md-typescale-brand-font defaults
    with the caller-supplied CSS font-family strings.  If either argument is
    empty the corresponding line is left unchanged.

    Args:
        template_text: Full content of _typography.scss template.
        plain_font_css: CSS font-family string for body/label/title roles.
                        Must be a valid CSS value, e.g. '"Roboto", sans-serif'.
        brand_font_css: CSS font-family string for display/headline roles.

    Returns:
        Template text with font-family defaults substituted.

    Example:
        substituted = _substitute_font_tokens(typo_text, '"Inter", sans-serif', '"Playfair Display", serif')
    """
    if plain_font_css:
        template_text = re.sub(
            r"(\$md-typescale-plain-font:[ \t]+)'[^']*'([ \t]+!default;)",
            lambda m: f"{m.group(1)}'{plain_font_css}'{m.group(2)}",
            template_text,
        )
    if brand_font_css:
        template_text = re.sub(
            r"(\$md-typescale-brand-font:[ \t]+)'[^']*'([ \t]+!default;)",
            lambda m: f"{m.group(1)}'{brand_font_css}'{m.group(2)}",
            template_text,
        )
    return template_text


def _compile_export_scss(
    project_root: Path,
    tokens_content: str,
    typography_content: str,
) -> str | None:
    """
    Compile the export SCSS template tree with substituted tokens to CSS.

    Copies _export_templates/scss/ to a temp directory, writes the substituted
    _tokens.scss and _typography.scss, runs Dart Sass on theme.scss, reads the
    output, and cleans up.  Returns None if Dart Sass is unavailable or
    compilation fails.

    Args:
        project_root: Project root path.
        tokens_content: Substituted _tokens.scss text.
        typography_content: Substituted _typography.scss text.

    Returns:
        Compiled CSS string, or None on failure.

    Example:
        css = _compile_export_scss(Path("."), tokens_text, typography_text)
    """
    import shutil
    import tempfile

    dart_exe = project_root / "_imports" / "dart-sass" / "src" / "dart.exe"
    snapshot = project_root / "_imports" / "dart-sass" / "src" / "sass.snapshot"
    if not dart_exe.exists() or not snapshot.exists():
        LOGGER.warning("Export SCSS: Dart Sass not found — skipping css/theme.css compilation")
        return None

    templates_scss = project_root / EXPORT_TEMPLATES_DIR_NAME / "scss"
    if not templates_scss.exists():
        LOGGER.warning("Export SCSS: _export_templates/scss/ not found — skipping compilation")
        return None

    tmp_dir = Path(tempfile.mkdtemp(prefix="mtb_export_"))
    try:
        shutil.copytree(templates_scss, tmp_dir / "scss")
        (tmp_dir / "scss" / "_tokens.scss").write_text(tokens_content, encoding="utf-8")
        (tmp_dir / "scss" / "_typography.scss").write_text(typography_content, encoding="utf-8")

        source = tmp_dir / "scss" / "theme.scss"
        target = tmp_dir / "theme.css"
        code, output = _run_subprocess(
            [
                str(dart_exe),
                str(snapshot),
                "--no-source-map",
                "--style=expanded",
                f"{source}:{target}",
            ],
            cwd=project_root,
        )
        if code != 0:
            LOGGER.warning("Export SCSS: compile errors:\n%s", output or "(no output)")
            return None

        return target.read_text(encoding="utf-8")
    except Exception:
        LOGGER.exception("Export SCSS: unexpected error during compilation")
        return None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def build_font_inventory(font_files: list[str]) -> tuple[list[dict], list[dict]]:
    """
    Build font item inventory and family summaries for UI selection.

    Args:
        font_files: Font file names under fonts/.

    Returns:
        Tuple: (font_items, font_families).

    Example:
        build_font_inventory(["YuGothR.ttc", "YuGothM.ttc"])
    """
    family_map: dict[str, dict] = {}
    font_items: list[dict] = []

    for file_name in sorted(font_files, key=str.lower):
        family_key = normalize_font_family_key(file_name)
        inferred_weight = infer_weight_from_font_name(file_name)

        if family_key not in family_map:
            family_map[family_key] = {
                "family_key": family_key,
                "display_name": family_key,
                "files": [],
                "available_weights": set(),
            }

        family_entry = family_map[family_key]
        family_entry["files"].append(file_name)
        family_entry["available_weights"].add(inferred_weight)

        font_items.append(
            {
                "file_name": file_name,
                "display_name": Path(file_name).stem,
                "family_key": family_key,
                "inferred_weight": inferred_weight,
            }
        )

    font_families = []
    for family_key in sorted(family_map.keys()):
        entry = family_map[family_key]
        font_families.append(
            {
                "family_key": family_key,
                "display_name": family_key,
                "available_weights": sorted(entry["available_weights"]),
                "files": sorted(entry["files"], key=str.lower),
            }
        )

    return font_items, font_families


class ThemeRequestHandler(SimpleHTTPRequestHandler):
    """
    HTTP handler that serves static files plus theme JSON endpoints.

    Endpoints:
    - /api/themes -> list available theme files
    - /api/theme/<file> -> full theme JSON object
    - /api/fonts -> list available local font files
    - /api/icons -> list available icon files and grouped sources
    - /api/export-package -> zip export for generated theme artifacts

    Example:
        GET /api/themes
    """

    def do_GET(self) -> None:  # noqa: N802
        """
        Route API requests first, then fall back to static file handling.

        Returns:
            None.

        Example:
            GET /api/theme/material-theme-OnSiteXI.json
        """
        parsed_url = urlparse(self.path)
        route = parsed_url.path

        if route == "/api/themes":
            self._handle_theme_list()
            return

        if route == "/api/fonts":
            self._handle_font_list()
            return

        if route == "/api/icons":
            self._handle_icon_list()
            return

        if route.startswith("/api/theme/"):
            requested_name = unquote(route.removeprefix("/api/theme/"))
            self._handle_single_theme(requested_name)
            return

        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        """
        Handle API POST routes.

        Returns:
            None.

        Example:
            POST /api/export-package
        """
        parsed_url = urlparse(self.path)
        route = parsed_url.path

        if route == "/api/export-package":
            self._handle_export_package()
            return

        self._send_json(404, {"error": "unknown api route"})

    def _handle_theme_list(self) -> None:
        """
        Return list of available material theme JSON files.

        Returns:
            None.

        Example:
            Response: {"theme_files": ["material-theme-OnSiteXI.json"]}
        """
        project_root = Path(self.directory or ".").resolve()
        files = list_theme_files(project_root)
        self._send_json(200, {"theme_files": files})

    def _handle_font_list(self) -> None:
        """
        Return list of available local font files from fonts/.

        Returns:
            None.

        Example:
            Response: {"font_files": ["YuGothR.ttc"]}
        """
        project_root = Path(self.directory or ".").resolve()
        files = list_asset_files(project_root, "fonts", FONT_FILE_EXTENSIONS, recursive=False)
        font_items, font_families = build_font_inventory(files)
        self._send_json(
            200,
            {
                "font_files": files,
                "font_items": font_items,
                "font_families": font_families,
            },
        )

    def _handle_icon_list(self) -> None:
        """
        Return icon file inventory and grouped source summary from icons/.

        Returns:
            None.

        Example:
            Response: {"icon_files": ["add.svg"], "icon_sources": [{"source": "root", "count": 1}]}
        """
        project_root = Path(self.directory or ".").resolve()
        files = list_asset_files(project_root, "icons", ICON_FILE_EXTENSIONS)
        source_summary = summarize_icon_sources(files)
        self._send_json(
            200,
            {
                "icon_files": files,
                "icon_sources": source_summary,
            },
        )

    def _handle_single_theme(self, theme_file_name: str) -> None:
        """
        Return JSON payload for a requested theme file.

        Args:
            theme_file_name: Requested file name from URL path.

        Returns:
            None.

        Example:
            _handle_single_theme("material-theme-OnSiteXI.json")
        """
        if (
            "/" in theme_file_name
            or "\\" in theme_file_name
            or not theme_file_name.startswith("material-theme-")
            or not theme_file_name.endswith(".json")
        ):
            self._send_json(400, {"error": "invalid theme file name"})
            return

        project_root = Path(self.directory or ".").resolve()
        theme_dir = (project_root / THEME_DIR_NAME).resolve()
        target_file = (theme_dir / theme_file_name).resolve()

        if (
            theme_dir.parent != project_root
            or target_file.parent != theme_dir
            or not target_file.is_file()
        ):
            self._send_json(404, {"error": "theme file not found"})
            return

        try:
            payload = json.loads(target_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            LOGGER.exception("Invalid JSON in theme file: %s", target_file)
            self._send_json(
                500,
                {
                    "error": "theme file is not valid JSON",
                    "details": str(error),
                },
            )
            return

        self._send_json(200, payload)

    def _handle_export_package(self) -> None:
        """
        Build and return a zip export package for current UI selections.

        Expected POST body (JSON):
            theme_file          — material-theme-*.json file name in color_themes/
            selected_font_files — list of font file names from fonts/
            icon_source         — "all", "root", or a subfolder name from icons/
            typography_json     — typography config object from the UI
            plain_font_css      — CSS font-family string for body/label/title roles
            brand_font_css      — CSS font-family string for display/headline roles

        Zip structure produced:
            css/theme.css        — compiled CSS (omitted if Dart Sass unavailable)
            js/behaviors.js      — optional interactive behaviors
            src/scss/            — full SCSS source with substituted token/font values
            src/ts/behaviors.ts  — TypeScript source for behaviors.js
            fonts/               — selected font files
            icons/               — selected icon files
            theme.json           — selected color theme JSON
            typography.json      — typography config JSON

        Returns:
            None.

        Example:
            POST /api/export-package with JSON payload.
        """
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "invalid content length"})
            return

        if content_length <= 0:
            self._send_json(400, {"error": "empty request body"})
            return

        try:
            raw_body = self.rfile.read(content_length)
            payload = json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            self._send_json(400, {"error": "invalid json payload", "details": str(error)})
            return

        if not isinstance(payload, dict):
            self._send_json(400, {"error": "payload must be an object"})
            return

        project_root = Path(self.directory or ".").resolve()

        # ── Validate theme file ────────────────────────────────────────────────
        theme_name = str(payload.get("theme_file", "")).strip()
        if not theme_name.startswith("material-theme-") or not theme_name.endswith(".json"):
            self._send_json(400, {"error": "invalid theme_file"})
            return

        theme_dir = (project_root / THEME_DIR_NAME).resolve()
        theme_path = (theme_dir / theme_name).resolve()
        if (
            theme_dir.parent != project_root
            or theme_path.parent != theme_dir
            or not theme_path.is_file()
        ):
            self._send_json(404, {"error": "theme file not found"})
            return

        try:
            theme_json = json.loads(theme_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            self._send_json(500, {"error": "theme file is not valid JSON", "details": str(error)})
            return

        # ── Collect payload fields ─────────────────────────────────────────────
        selected_fonts = payload.get("selected_font_files", [])
        if not isinstance(selected_fonts, list):
            selected_fonts = []

        selected_icon_source = str(payload.get("icon_source", "all")).strip() or "all"

        typography_json = payload.get("typography_json", {})
        if not isinstance(typography_json, dict):
            typography_json = {}

        plain_font_css = str(payload.get("plain_font_css", "")).strip()
        brand_font_css = str(payload.get("brand_font_css", "")).strip()

        # ── Read and substitute SCSS templates ────────────────────────────────
        templates_scss = project_root / EXPORT_TEMPLATES_DIR_NAME / "scss"

        tokens_path = templates_scss / "_tokens.scss"
        typography_path = templates_scss / "_typography.scss"

        if not tokens_path.is_file() or not typography_path.is_file():
            self._send_json(500, {"error": "_export_templates/scss/ source files missing"})
            return

        tokens_content = _substitute_color_tokens(
            tokens_path.read_text(encoding="utf-8"), theme_json
        )
        typography_content = _substitute_font_tokens(
            typography_path.read_text(encoding="utf-8"), plain_font_css, brand_font_css
        )

        # ── Compile CSS (best-effort) ──────────────────────────────────────────
        compiled_css = _compile_export_scss(project_root, tokens_content, typography_content)

        # ── Filter icon files ──────────────────────────────────────────────────
        all_icon_files = list_asset_files(project_root, "icons", ICON_FILE_EXTENSIONS)
        if selected_icon_source == "all":
            export_icon_files = all_icon_files
        elif selected_icon_source == "root":
            export_icon_files = [p for p in all_icon_files if "/" not in p]
        else:
            export_icon_files = [
                p for p in all_icon_files if p.startswith(f"{selected_icon_source}/")
            ]

        icons_folder = (project_root / "icons").resolve()
        fonts_dir = (project_root / "fonts").resolve()
        templates_dir = project_root / EXPORT_TEMPLATES_DIR_NAME

        # ── Build zip ─────────────────────────────────────────────────────────
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as archive:

            # Compiled CSS
            if compiled_css:
                archive.writestr("css/theme.css", compiled_css)

            # Pre-compiled behaviors JS
            behaviors_js = templates_dir / "js" / "behaviors.js"
            if behaviors_js.is_file():
                archive.write(behaviors_js, arcname="js/behaviors.js")

            # SCSS source tree — substituted _tokens and _typography, rest verbatim
            scss_src_dir = templates_scss
            for scss_file in sorted(scss_src_dir.rglob("*.scss")):
                rel = scss_file.relative_to(scss_src_dir).as_posix()
                if scss_file.name == "_tokens.scss":
                    archive.writestr(f"src/scss/{rel}", tokens_content)
                elif scss_file.name == "_typography.scss":
                    archive.writestr(f"src/scss/{rel}", typography_content)
                else:
                    archive.write(scss_file, arcname=f"src/scss/{rel}")

            # TypeScript source
            behaviors_ts = templates_dir / "ts" / "behaviors.ts"
            if behaviors_ts.is_file():
                archive.write(behaviors_ts, arcname="src/ts/behaviors.ts")

            # Selected fonts
            for font_file in sorted(set(str(item) for item in selected_fonts)):
                font_path = (fonts_dir / font_file).resolve()
                if font_path.parent != fonts_dir or not font_path.is_file():
                    continue
                archive.write(font_path, arcname=f"fonts/{font_file}")

            # Selected icons
            for icon_file in export_icon_files:
                icon_path = (icons_folder / icon_file).resolve()
                if icon_path.is_file() and icons_folder in icon_path.parents:
                    archive.write(icon_path, arcname=f"icons/{icon_file}")

            # Theme and typography JSON
            archive.writestr("theme.json", json.dumps(theme_json, indent=2))
            archive.writestr("typography.json", json.dumps(typography_json, indent=2))

        body = zip_buffer.getvalue()
        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Content-Disposition", 'attachment; filename="material-theme-export.zip"')
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, status_code: int, payload: dict) -> None:
        """
        Send a JSON HTTP response.

        Args:
            status_code: HTTP status code.
            payload: JSON-serializable response object.

        Returns:
            None.

        Example:
            _send_json(200, {"ok": True})
        """
        body = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def parse_args() -> argparse.Namespace:
    """
    Parse CLI flags for server startup.

    Returns:
        Parsed argparse namespace.

    Example:
        args = parse_args()
    """
    parser = argparse.ArgumentParser(description="Serve Material Web Builder locally")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind")
    parser.add_argument("--port", type=int, default=9000, help="TCP port to bind")
    parser.add_argument(
        "--root",
        default=str(Path(__file__).resolve().parent),
        help="Project root to serve",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        default=bool(DEFAULT_VERBOSE),
        help="Enable debug logging",
    )
    parser.add_argument(
        "--log-file",
        action="store_true",
        default=bool(DEFAULT_LOG_TO_FILE),
        help="Also write logs to _logs/server.log",
    )
    return parser.parse_args()


def main() -> int:
    """
    Run the local HTTP server.

    Returns:
        Process exit code (0 for clean shutdown).

    Example:
        raise SystemExit(main())
    """
    args = parse_args()
    assert_when_enabled(isinstance(args.port, int), "Port must be an integer")
    assert_when_enabled(1 <= args.port <= 65535, "Port must be in 1..65535")

    project_root = Path(args.root).resolve()
    configure_logging(args.verbose, args.log_file, project_root)

    if not project_root.exists() or not project_root.is_dir():
        LOGGER.error("Invalid project root: %s", project_root, stacklevel=2)
        return 2

    _check_and_compile_sass(project_root)
    _check_and_compile_ts(project_root)

    handler_class = partial(ThemeRequestHandler, directory=str(project_root))
    server_address = (args.host, args.port)

    with ThreadingHTTPServer(server_address, handler_class) as httpd:
        LOGGER.info("Serving %s on http://%s:%d", project_root, args.host, args.port)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            LOGGER.info("Shutdown requested by user")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
