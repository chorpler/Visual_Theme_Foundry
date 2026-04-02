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
import { NavigationBar } from './internal/navigation-bar.js';
import { styles } from './internal/navigation-bar-styles.js';
/**
 * @final
 * @suppress {visibility}
 */
let MdNavigationBar = class MdNavigationBar extends NavigationBar {
    static { this.styles = [styles]; }
};
MdNavigationBar = __decorate([
    customElement('md-navigation-bar')
], MdNavigationBar);
export { MdNavigationBar };
