import { html, define, render, dispatch } from "./utils/hybrids.js";
import style from './ui-filterbar.scss';

/**
 * A UI component with a filter bar and a button group "grid"/"list"/"textual".
 * 
 * Attributes:
 * - "placeholder": A placeholder for the filter bar
 * - "value": A value for the filter bar
 * - "mode": The current mode. Must be one of "grid","list","textual"
 * - "grid": The tooltip title of the grid button
 * - "list": The tooltip title of the list button
 * - "textual": The tooltip title of the textual button
 * 
 * Events:
 * - "filter": The user clicked on the filter button or hit enter
 */
const UiFilter = {
  placeholder: "",
  value: "",
  mode: "grid",
  grid: "",
  list: "",
  textual: "",
  select: "",
  selectmode: false,
  render: render(({ placeholder, value, mode, grid, list, textual, selectmode, select }) => html`
  <style>${style}</style>
  <form onsubmit="${search}" name="filterform" class="filterform">
    <button type="button" title="${select}" onclick="${selectChanged}" class="btn ${selectmode ? "btn-primary" : "btn-secondary"}">
      <i class="fas fa-check-double"></i>
    </button>
    ${selectmode && html`<slot></slot>`}
    <div class="input-group ml-3">
      <input class="form-control py-2" type="search" name="filter" placeholder="${placeholder}" value="${value}" oninput="${searchI}">
      <span class="input-group-append">
        <button class="btn btn-outline-secondary" type="button" onclick="${searchBtn}">
          <i class="fa fa-search"></i>
        </button>
      </span>
    </div>
    ${(grid.length > 0 || list.length > 0 || textual.length > 0) && html`
    <div class="btn-group ml-3" role="group" aria-label="Change view mode">
    ${grid.length > 0 && html`<button type="button" title="${grid}" data-mode="grid" onclick="${modeChange}"
        class="btn ${mode == "grid" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-large"></i></button>`}
    ${list.length > 0 && html`<button type="button" title="${list}" data-mode="list" onclick="${modeChange}"
        class="btn ${mode == "list" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-list"></i></button>`}
    ${textual.length > 0 && html`<button type="button" title="${textual}" data-mode="textual" onclick="${modeChange}"
        class="btn ${mode == "textual" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-align-justify"></i></button>`}
    </div>
    `}
  </form>
  `, { shadowRoot: true })
};

function searchI(host, event) {
  event.preventDefault();
  host.value = event.target.value;
  dispatch(host, 'filter', { detail: { value: host.value, typing: true } });
}
function search(host, event) {
  event.preventDefault();
  var formData = new FormData(event.target);
  host.value = formData.get("filter");
  dispatch(host, 'filter', { detail: { value: host.value } });
}
function searchBtn(host, event) {
  event.preventDefault();
  formData = new FormData(event.target.parentNode.parentNode.parentNode);
  host.value = formData.get("filter");
  dispatch(host, 'filter', { detail: { value: host.value } });
}

function modeChange(host, event) {
  event.preventDefault();
  host.mode = event.target.dataset.mode;
  dispatch(host, 'mode', { detail: { mode: host.mode } });
}

function selectChanged(host, event) {
  event.preventDefault();
  host.selectmode = !host.selectmode;
  dispatch(host, 'selectmode', { detail: { selectmode: host.selectmode } });
}

define('ui-filter', UiFilter);
