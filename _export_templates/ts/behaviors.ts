/**
 * behaviors.ts — Material Design 3 Theme Scaffold
 * ─────────────────────────────────────────────────────────────────────────────
 * Optional interactive behaviors for MD3-styled plain HTML elements.
 * No external dependencies. Include or omit based on your project's needs.
 *
 * This file is part of the exported theme scaffold. It provides JS-only UI
 * behaviors that CSS alone cannot replicate. If your framework or component
 * library already handles these behaviors, skip this file entirely.
 *
 * Toolchain note:
 *   This source targets ES2022 and requires the TypeScript compiler (tsc).
 *   The pre-compiled drop-in equivalent is behaviors.js in the js/ folder.
 *
 * ─── Behaviors ───────────────────────────────────────────────────────────────
 *
 * Ripple
 *   Ink ripple effect originating at the pointer position, expanding to fill
 *   the element and fading out. Applied to buttons and any element marked with
 *   the [data-ripple] attribute. Uses currentColor at MD3 state-layer opacity
 *   so it naturally matches the element's foreground token color.
 *
 *   Selector coverage (default):
 *     button, [role="button"], a[href], [data-ripple]
 *
 *   To add ripple to a custom element, add the attribute:
 *     <div role="button" data-ripple>...</div>
 *
 *   To exclude an element from ripple, add:
 *     <button data-no-ripple>...</button>
 *
 * Dialog
 *   Open/close management for native <dialog> elements. Uses the browser's
 *   built-in dialog API (showModal / close). Handles backdrop click-to-dismiss
 *   and Escape key out of the box via the native implementation.
 *
 *   Trigger attributes (place on any element):
 *     data-dialog-open="dialog-id"   → opens the target <dialog> as a modal
 *     data-dialog-close              → closes the nearest ancestor <dialog>
 *
 *   Example:
 *     <button data-dialog-open="confirm-dialog">Open</button>
 *     <dialog id="confirm-dialog">
 *       <p>Are you sure?</p>
 *       <button data-dialog-close>Cancel</button>
 *       <button data-dialog-close>Confirm</button>
 *     </dialog>
 *
 * Keyboard Focus Ring
 *   Adds a [data-keyboard-nav] attribute to <body> while the user is navigating
 *   with the keyboard. Remove it when the pointer is used. Pair with a CSS rule
 *   that shows a visible focus ring only during keyboard navigation:
 *
 *     body:not([data-keyboard-nav]) *:focus { outline: none; }
 *     body[data-keyboard-nav] *:focus-visible { outline: 2px solid var(--md-sys-color-primary); }
 *
 *   In browsers that support :focus-visible natively (all modern browsers as of
 *   2024), this JS enhancement is optional — CSS :focus-visible alone is
 *   sufficient. Include it only if you need to support older browsers or want
 *   the body attribute for additional CSS targeting.
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   Initialize all behaviors at once (recommended):
 *     import { initAll } from './behaviors.js';
 *     initAll();
 *
 *   Or initialize individually:
 *     import { initRipple, initDialogs, initFocusRing } from './behaviors.js';
 *     initRipple();
 *     initDialogs();
 *     initFocusRing();
 *
 *   Call after DOM is ready (place script at end of <body> or use DOMContentLoaded).
 *
 * ─── Ripple CSS injection ─────────────────────────────────────────────────────
 *
 *   initRipple() injects a <style> block into <head> containing the @keyframes
 *   rule for the ripple animation. If you are integrating the source SCSS into
 *   your build pipeline, add the equivalent rule to your SCSS instead and set
 *   INJECT_RIPPLE_STYLES = false to suppress the JS injection.
 *
 *   SCSS equivalent (add to your _components.scss or equivalent):
 *
 *     @keyframes md-ripple-expand {
 *       to { transform: scale(1); opacity: 0; }
 *     }
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Set to false if your Sass build already includes the md-ripple-expand
 * @keyframes rule and you do not want behaviors.ts to inject a duplicate.
 */
const INJECT_RIPPLE_STYLES = true;

/** Selectors that receive ripple behavior. Extend as needed. */
const RIPPLE_SELECTORS = 'button, [role="button"], a[href], [data-ripple]';

/** Attribute to exclude an element from ripple despite matching RIPPLE_SELECTORS. */
const NO_RIPPLE_ATTR = 'data-no-ripple';

/** Attribute on the dialog open trigger. Value must be the target dialog's id. */
const DIALOG_OPEN_ATTR = 'data-dialog-open';

/** Attribute on the dialog close trigger. Closes nearest ancestor <dialog>. */
const DIALOG_CLOSE_ATTR = 'data-dialog-close';

/** Attribute added to <body> during keyboard navigation sessions. */
const KEYBOARD_NAV_ATTR = 'data-keyboard-nav';

// ─── Ripple ───────────────────────────────────────────────────────────────────

/**
 * injectRippleStyles
 * Injects the @keyframes rule required by the ripple animation into <head>.
 * Called once by initRipple(). No-ops if INJECT_RIPPLE_STYLES is false.
 *
 * @returns void
 *
 * @example
 *   // Called internally by initRipple() — not typically called directly.
 *   injectRippleStyles();
 */
function injectRippleStyles(): void {
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

/**
 * handleRipplePointerDown
 * Creates and animates a ripple wave originating at the pointer position.
 * Cleans up the element after the animation completes.
 *
 * @param event - The PointerEvent from the pointerdown listener.
 * @returns void
 *
 * @example
 *   element.addEventListener('pointerdown', handleRipplePointerDown);
 */
function handleRipplePointerDown(event: PointerEvent): void {
  const target = event.currentTarget as HTMLElement;
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

/**
 * initRipple
 * Attaches ripple behavior to all elements matching RIPPLE_SELECTORS.
 * Uses event delegation on document so elements added after init are covered.
 * Also injects the required @keyframes CSS if INJECT_RIPPLE_STYLES is true.
 *
 * @returns void
 *
 * @example
 *   initRipple();
 */
export function initRipple(): void {
  injectRippleStyles();

  document.addEventListener('pointerdown', (event: PointerEvent) => {
    const target = event.target as Element | null;
    if (!target) return;

    const rippleTarget = target.closest(RIPPLE_SELECTORS) as HTMLElement | null;
    if (!rippleTarget) return;
    if (rippleTarget.hasAttribute(NO_RIPPLE_ATTR)) return;

    // Synthesize a currentTarget-equivalent for the handler since we are
    // delegating from document rather than attaching directly to each element.
    const syntheticEvent = Object.create(event, {
      currentTarget: { value: rippleTarget },
    }) as PointerEvent;

    handleRipplePointerDown(syntheticEvent);
  });
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

/**
 * openDialog
 * Opens the <dialog> with the given id as a modal.
 * Logs a warning if no matching dialog is found.
 *
 * @param id - The id attribute of the target <dialog> element.
 * @returns void
 *
 * @example
 *   openDialog('confirm-dialog');
 */
export function openDialog(id: string): void {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  if (!dialog || dialog.tagName !== 'DIALOG') {
    console.warn(`behaviors.ts: no <dialog> found with id "${id}"`);
    return;
  }
  dialog.showModal();
}

/**
 * closeDialog
 * Closes the nearest ancestor <dialog> relative to the given element.
 * Logs a warning if no ancestor dialog is found.
 *
 * @param trigger - The element that triggered the close action.
 * @returns void
 *
 * @example
 *   closeDialog(document.querySelector('[data-dialog-close]'));
 */
export function closeDialog(trigger: Element): void {
  const dialog = trigger.closest('dialog') as HTMLDialogElement | null;
  if (!dialog) {
    console.warn('behaviors.ts: closeDialog could not find an ancestor <dialog>');
    return;
  }
  dialog.close();
}

/**
 * initDialogs
 * Attaches open/close behavior to elements using data-dialog-open and
 * data-dialog-close attributes. Uses event delegation on document.
 *
 * Open trigger:  <button data-dialog-open="my-dialog-id">Open</button>
 * Close trigger: <button data-dialog-close>Cancel</button>
 *
 * @returns void
 *
 * @example
 *   initDialogs();
 */
export function initDialogs(): void {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as Element | null;
    if (!target) return;

    const opener = target.closest(`[${DIALOG_OPEN_ATTR}]`) as HTMLElement | null;
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

/**
 * initFocusRing
 * Toggles [data-keyboard-nav] on <body> based on input device.
 * Added on Tab/arrow key press; removed on pointerdown.
 *
 * Pair with CSS to show focus rings only during keyboard navigation:
 *
 *   body:not([data-keyboard-nav]) *:focus         { outline: none; }
 *   body[data-keyboard-nav] *:focus-visible        { outline: 2px solid var(--md-sys-color-primary); outline-offset: 2px; }
 *
 * Note: In all modern browsers (2024+) CSS :focus-visible alone is sufficient.
 * Use this function only if you need older browser support or the body
 * attribute for additional CSS targeting.
 *
 * @returns void
 *
 * @example
 *   initFocusRing();
 */
export function initFocusRing(): void {
  document.addEventListener('keydown', (event: KeyboardEvent) => {
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

/**
 * initAll
 * Initializes all behaviors: ripple, dialogs, and focus ring.
 * Recommended entry point for most projects.
 *
 * @returns void
 *
 * @example
 *   import { initAll } from './behaviors.js';
 *   initAll();
 */
export function initAll(): void {
  initRipple();
  initDialogs();
  initFocusRing();
}
