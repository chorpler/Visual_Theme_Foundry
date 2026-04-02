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
import '../../elevation/elevation.js';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { Chip } from './chip.js';
/**
 * An assist chip component.
 */
export class AssistChip extends Chip {
    constructor() {
        super(...arguments);
        this.elevated = false;
        this.href = '';
        /**
         * The filename to use when downloading the linked resource.
         * If not specified, the browser will determine a filename.
         * This is only applicable when the chip is used as a link (`href` is set).
         */
        this.download = '';
        this.target = '';
    }
    get primaryId() {
        return this.href ? 'link' : 'button';
    }
    get rippleDisabled() {
        // Link chips cannot be disabled
        return !this.href && (this.disabled || this.softDisabled);
    }
    getContainerClasses() {
        return {
            ...super.getContainerClasses(),
            // Link chips cannot be disabled
            disabled: !this.href && (this.disabled || this.softDisabled),
            elevated: this.elevated,
            link: !!this.href,
        };
    }
    renderPrimaryAction(content) {
        const { ariaLabel } = this;
        if (this.href) {
            return html `
        <a
          class="primary action"
          id="link"
          aria-label=${ariaLabel || nothing}
          href=${this.href}
          download=${this.download || nothing}
          target=${this.target || nothing}
          >${content}</a
        >
      `;
        }
        return html `
      <button
        class="primary action"
        id="button"
        aria-label=${ariaLabel || nothing}
        aria-disabled=${this.softDisabled || nothing}
        ?disabled=${this.disabled && !this.alwaysFocusable}
        type="button"
        >${content}</button
      >
    `;
    }
    renderOutline() {
        if (this.elevated) {
            return html `<md-elevation part="elevation"></md-elevation>`;
        }
        return super.renderOutline();
    }
}
__decorate([
    property({ type: Boolean })
], AssistChip.prototype, "elevated", void 0);
__decorate([
    property()
], AssistChip.prototype, "href", void 0);
__decorate([
    property()
], AssistChip.prototype, "download", void 0);
__decorate([
    property()
], AssistChip.prototype, "target", void 0);
