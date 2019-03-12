import * as cronstrue from '../_cronstrue';

import { html, render } from 'lit-html';

/**
 * @category Web Components
 * @customelement ui-cron-expression
 * @description A cron expression renderer
 * @example <caption>An example</caption>
 * <ui-cron-expression></ui-cron-expression>
 */
class UiCronExpression extends HTMLElement {
  constructor() {
    super();
    this._value = "* * * * *";
  }
  connectedCallback() {
    this.render();
  }
  disconnectedCallback() {
  }
  set value(val) {
    this._value = val;
    this.render();
  }
  get value() {
    return this._value;
  }
  getCronTranslation() {
    try {
      const str = cronstrue.toString(this._value, {
        throwExceptionOnParseError: true,
        verbose: false,
        dayOfWeekStartIndexZero: true,
        use24HourTimeFormat: true,
        locale: "en"
      });
      this.dispatchEvent(new CustomEvent("input", { detail: this._value }));
      return str;
    } catch (e) {
      return e.toString();
    }
  }
  render() {
    render(html`
            <input @input=${e => this.value = e.target.value} value="${this._value}">
            <div class="cronToText">${this.getCronTranslation()}</div>
        `, this);
  }
}

customElements.define('ui-cron-expression', UiCronExpression);

/**
 * Cron expressions UI module
 * 
 * Because this component is not used on every page, it has its own module.
 * 
 * @category Web Components
 * @module ui-cron-expression
 */