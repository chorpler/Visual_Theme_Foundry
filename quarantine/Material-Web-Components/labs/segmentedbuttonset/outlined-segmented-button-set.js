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
import { OutlinedSegmentedButtonSet } from './internal/outlined-segmented-button-set.js';
import { styles as outlinedStyles } from './internal/outlined-styles.js';
import { styles as sharedStyles } from './internal/shared-styles.js';
/**
 * MdOutlinedSegmentedButtonSet is the custom element for the Material
 * Design outlined segmented button set component.
 * @final
 * @suppress {visibility}
 */
let MdOutlinedSegmentedButtonSet = class MdOutlinedSegmentedButtonSet extends OutlinedSegmentedButtonSet {
    static { this.styles = [sharedStyles, outlinedStyles]; }
};
MdOutlinedSegmentedButtonSet = __decorate([
    customElement('md-outlined-segmented-button-set')
], MdOutlinedSegmentedButtonSet);
export { MdOutlinedSegmentedButtonSet };
