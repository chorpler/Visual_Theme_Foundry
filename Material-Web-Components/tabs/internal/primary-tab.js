/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { property } from 'lit/decorators.js';
import { Tab } from './tab.js';
/**
 * A primary tab component.
 */
export class PrimaryTab extends Tab {
    constructor() {
        super(...arguments);
        /**
         * Whether or not the icon renders inline with label or stacked vertically.
         */
        this.inlineIcon = false;
    }
    getContentClasses() {
        return {
            ...super.getContentClasses(),
            'stacked': !this.inlineIcon,
        };
    }
}
__decorate([
    property({ type: Boolean, attribute: 'inline-icon' })
], PrimaryTab.prototype, "inlineIcon", void 0);
