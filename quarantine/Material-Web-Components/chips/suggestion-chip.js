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
import { customElement } from 'lit/decorators.js';
import { styles as elevatedStyles } from './internal/elevated-styles.js';
import { styles as sharedStyles } from './internal/shared-styles.js';
import { SuggestionChip } from './internal/suggestion-chip.js';
import { styles } from './internal/suggestion-styles.js';
/**
 * TODO(b/243982145): add docs
 *
 * @final
 * @suppress {visibility}
 */
let MdSuggestionChip = class MdSuggestionChip extends SuggestionChip {
    static { this.styles = [sharedStyles, elevatedStyles, styles]; }
};
MdSuggestionChip = __decorate([
    customElement('md-suggestion-chip')
], MdSuggestionChip);
export { MdSuggestionChip };
