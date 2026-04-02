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
import '../field/outlined-field.js';
import { customElement } from 'lit/decorators.js';
import { literal } from 'lit/static-html.js';
import { styles as outlinedStyles } from './internal/outlined-styles.js';
import { OutlinedTextField } from './internal/outlined-text-field.js';
import { styles as sharedStyles } from './internal/shared-styles.js';
/**
 * TODO(b/228525797): Add docs
 * @final
 * @suppress {visibility}
 */
let MdOutlinedTextField = class MdOutlinedTextField extends OutlinedTextField {
    constructor() {
        super(...arguments);
        this.fieldTag = literal `md-outlined-field`;
    }
    static { this.styles = [sharedStyles, outlinedStyles]; }
};
MdOutlinedTextField = __decorate([
    customElement('md-outlined-text-field')
], MdOutlinedTextField);
export { MdOutlinedTextField };
