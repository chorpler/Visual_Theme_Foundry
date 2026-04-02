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
import { SharedFab } from './shared.js';
// tslint:disable-next-line:enforce-comments-on-exported-symbols
export class Fab extends SharedFab {
    constructor() {
        super(...arguments);
        /**
         * The FAB color variant to render.
         */
        this.variant = 'surface';
    }
    getRenderClasses() {
        return {
            ...super.getRenderClasses(),
            'primary': this.variant === 'primary',
            'secondary': this.variant === 'secondary',
            'tertiary': this.variant === 'tertiary',
        };
    }
}
__decorate([
    property()
], Fab.prototype, "variant", void 0);
