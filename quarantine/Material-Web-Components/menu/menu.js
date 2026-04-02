/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement } from 'lit/decorators.js';
import { Menu } from './internal/menu.js';
import { styles } from './internal/menu-styles.js';
export { CloseReason, FocusState, } from './internal/controllers/shared.js';
export { Corner } from './internal/menu.js';
/**
 * @summary Menus display a list of choices on a temporary surface.
 *
 * @description
 * Menus appear when users interact with a button, action, or other control.
 *
 * They can be opened from a variety of elements, most commonly icon buttons,
 * buttons, and text fields.
 *
 * md-menu listens for the `close-menu` and `deselect-items` events.
 *
 * - `close-menu` closes the menu when dispatched from a child element.
 * - `deselect-items` deselects all of its immediate menu-item children.
 *
 * @example
 * ```html
 * <div style="position:relative;">
 *   <button
 *       id="anchor"
 *       @click=${() => this.menuRef.value.show()}>
 *     Click to open menu
 *   </button>
 *   <!--
 *     `has-overflow` is required when using a submenu which overflows the
 *     menu's contents.
 *
 *     Additionally, `anchor` ingests an idref which do not pass through shadow
 *     roots. You can also set `.anchorElement` to an element reference if
 *     necessary.
 *   -->
 *   <md-menu anchor="anchor" has-overflow ${ref(menuRef)}>
 *     <md-menu-item headline="This is a headline"></md-menu-item>
 *     <md-sub-menu>
 *       <md-menu-item
 *           slot="item"
 *           headline="this is a submenu item">
 *       </md-menu-item>
 *       <md-menu slot="menu">
 *         <md-menu-item headline="This is an item inside a submenu">
 *         </md-menu-item>
 *       </md-menu>
 *     </md-sub-menu>
 *   </md-menu>
 * </div>
 * ```
 *
 * @final
 * @suppress {visibility}
 */
let MdMenu = class MdMenu extends Menu {
    static { this.styles = [styles]; }
};
MdMenu = __decorate([
    customElement('md-menu')
], MdMenu);
export { MdMenu };
