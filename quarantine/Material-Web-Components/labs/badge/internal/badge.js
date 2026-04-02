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
import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
/**
 * b/265340196 - add docs
 */
export class Badge extends LitElement {
    constructor() {
        super(...arguments);
        this.value = '';
    }
    render() {
        const classes = { 'md3-badge--large': this.value };
        return html `<div class="md3-badge ${classMap(classes)}">
      <p class="md3-badge__value">${this.value}</p>
    </div>`;
    }
}
__decorate([
    property()
], Badge.prototype, "value", void 0);
