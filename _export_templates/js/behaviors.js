/**
 * behaviors.js — Material Design 3 Theme Scaffold
 * ─────────────────────────────────────────────────────────────────────────────
 * Pre-compiled drop-in equivalent of behaviors.ts. No dependencies, no build
 * step required. Include via a <script type="module"> tag or import into your
 * own module entry point.
 *
 * Source: src/ts/behaviors.ts (TypeScript, ES2022 target)
 *
 * Usage — drop-in (no bundler):
 *   <script type="module">
 *     import { initAll } from './js/behaviors.js';
 *     initAll();
 *   </script>
 *
 * Usage — module import:
 *   import { initAll } from './behaviors.js';
 *   initAll();
 *
 * Exports: initAll, initRipple, initDialogs, initFocusRing, openDialog, closeDialog
 *
 * See behaviors.ts for full documentation, configuration options, and CSS
 * pairing instructions.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

const INJECT_RIPPLE_STYLES = true;
const RIPPLE_SELECTORS = 'button, [role="button"], a[href], [data-ripple]';
const NO_RIPPLE_ATTR = 'data-no-ripple';
const DIALOG_OPEN_ATTR = 'data-dialog-open';
const DIALOG_CLOSE_ATTR = 'data-dialog-close';
const KEYBOARD_NAV_ATTR = 'data-keyboard-nav';

// ─── Ripple ───────────────────────────────────────────────────────────────────

function injectRippleStyles() {
  if (!INJECT_RIPPLE_STYLES) return;
  const style = document.createElement('style');
  style.dataset['mdBehaviors'] = 'ripple';
  style.textContent = `
    @keyframes md-ripple-expand {
      to { transform: scale(1); opacity: 0; }
    }
    .md-ripple-host {
      position: relative;
      overflow: hidden;
    }
    .md-ripple-wave {
      position: absolute;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.12;
      transform: scale(0);
      animation: md-ripple-expand 400ms ease-out forwards;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

function handleRipplePointerDown(event) {
  const target = event.currentTarget;
  if (target.hasAttribute(NO_RIPPLE_ATTR)) return;

  target.classList.add('md-ripple-host');

  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const wave = document.createElement('span');
  wave.className = 'md-ripple-wave';
  wave.style.width = `${size}px`;
  wave.style.height = `${size}px`;
  wave.style.left = `${x}px`;
  wave.style.top = `${y}px`;

  target.appendChild(wave);
  wave.addEventListener('animationend', () => wave.remove(), { once: true });
}

export function initRipple() {
  injectRippleStyles();

  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!target) return;

    const rippleTarget = target.closest(RIPPLE_SELECTORS);
    if (!rippleTarget) return;
    if (rippleTarget.hasAttribute(NO_RIPPLE_ATTR)) return;

    const syntheticEvent = Object.create(event, {
      currentTarget: { value: rippleTarget },
    });

    handleRipplePointerDown(syntheticEvent);
  });
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog || dialog.tagName !== 'DIALOG') {
    console.warn(`behaviors.js: no <dialog> found with id "${id}"`);
    return;
  }
  dialog.showModal();
}

export function closeDialog(trigger) {
  const dialog = trigger.closest('dialog');
  if (!dialog) {
    console.warn('behaviors.js: closeDialog could not find an ancestor <dialog>');
    return;
  }
  dialog.close();
}

export function initDialogs() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!target) return;

    const opener = target.closest(`[${DIALOG_OPEN_ATTR}]`);
    if (opener) {
      const dialogId = opener.getAttribute(DIALOG_OPEN_ATTR);
      if (dialogId) openDialog(dialogId);
      return;
    }

    const closer = target.closest(`[${DIALOG_CLOSE_ATTR}]`);
    if (closer) closeDialog(closer);
  });
}

// ─── Keyboard Focus Ring ──────────────────────────────────────────────────────

export function initFocusRing() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' || event.key === 'ArrowUp' || event.key === 'ArrowDown'
      || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      document.body.setAttribute(KEYBOARD_NAV_ATTR, '');
    }
  });

  document.addEventListener('pointerdown', () => {
    document.body.removeAttribute(KEYBOARD_NAV_ATTR);
  });
}

// ─── Init All ─────────────────────────────────────────────────────────────────

export function initAll() {
  initRipple();
  initDialogs();
  initFocusRing();
}
