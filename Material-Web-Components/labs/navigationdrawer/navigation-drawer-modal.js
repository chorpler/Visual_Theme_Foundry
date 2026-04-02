/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { customElement } from 'lit/decorators.js';
import { NavigationDrawerModal } from './internal/navigation-drawer-modal.js';
import { styles } from './internal/navigation-drawer-modal-styles.js';
import { styles as sharedStyles } from './internal/shared-styles.js';
/**
 * @final
 * @suppress {visibility}
 */
let MdNavigationDrawerModal = class MdNavigationDrawerModal extends NavigationDrawerModal {
    static { this.styles = [sharedStyles, styles]; }
};
MdNavigationDrawerModal = __decorate([
    customElement('md-navigation-drawer-modal')
], MdNavigationDrawerModal);
export { MdNavigationDrawerModal };
