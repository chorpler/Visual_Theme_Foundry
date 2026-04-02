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
import { Switch } from './internal/switch.js';
import { styles } from './internal/switch-styles.js';
/**
 * @summary Switches toggle the state of a single item on or off.
 *
 * @description
 * There's one type of switch in Material. Use this selection control when the
 * user needs to toggle a single item on or off.
 *
 * @final
 * @suppress {visibility}
 */
let MdSwitch = class MdSwitch extends Switch {
    static { this.styles = [styles]; }
};
MdSwitch = __decorate([
    customElement('md-switch')
], MdSwitch);
export { MdSwitch };
