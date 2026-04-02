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
import { html, isServer, LitElement } from 'lit';
import { queryAssignedElements } from 'lit/decorators.js';
import { ListController, NavigableKeys } from './list-controller.js';
const NAVIGABLE_KEY_SET = new Set(Object.values(NavigableKeys));
// tslint:disable-next-line:enforce-comments-on-exported-symbols
export class List extends LitElement {
    /** @export */
    get items() {
        return this.listController.items;
    }
    constructor() {
        super();
        this.listController = new ListController({
            isItem: (item) => item.hasAttribute('md-list-item'),
            getPossibleItems: () => this.slotItems,
            isRtl: () => getComputedStyle(this).direction === 'rtl',
            deactivateItem: (item) => {
                item.tabIndex = -1;
            },
            activateItem: (item) => {
                item.tabIndex = 0;
            },
            isNavigableKey: (key) => NAVIGABLE_KEY_SET.has(key),
            isActivatable: (item) => !item.disabled && item.type !== 'text',
        });
        this.internals = 
        // Cast needed for closure
        this.attachInternals();
        if (!isServer) {
            this.internals.role = 'list';
            this.addEventListener('keydown', this.listController.handleKeydown);
        }
    }
    render() {
        return html `
      <slot
        @deactivate-items=${this.listController.onDeactivateItems}
        @request-activation=${this.listController.onRequestActivation}
        @slotchange=${this.listController.onSlotchange}>
      </slot>
    `;
    }
    /**
     * Activates the next item in the list. If at the end of the list, the first
     * item will be activated.
     *
     * @return The activated list item or `null` if there are no items.
     */
    activateNextItem() {
        return this.listController.activateNextItem();
    }
    /**
     * Activates the previous item in the list. If at the start of the list, the
     * last item will be activated.
     *
     * @return The activated list item or `null` if there are no items.
     */
    activatePreviousItem() {
        return this.listController.activatePreviousItem();
    }
}
__decorate([
    queryAssignedElements({ flatten: true })
], List.prototype, "slotItems", void 0);
