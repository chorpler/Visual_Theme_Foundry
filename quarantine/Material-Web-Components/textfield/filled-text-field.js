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
import '../field/filled-field.js';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';
import { styles as filledStyles } from './internal/filled-styles.js';
import { FilledTextField } from './internal/filled-text-field.js';
import { styles as sharedStyles } from './internal/shared-styles.js';
/**
 * TODO(b/228525797): Add docs
 * @final
 * @suppress {visibility}
 */
let MdFilledTextField = class MdFilledTextField extends FilledTextField {
    constructor() {
        super(...arguments);
        this.fieldTag = literal `md-filled-field`;
    }
    static { this.styles = [sharedStyles, filledStyles]; }
};
MdFilledTextField = __decorate([
    customElement('md-filled-text-field')
], MdFilledTextField);
export { MdFilledTextField };
