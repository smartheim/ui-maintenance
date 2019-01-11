/**
 * @file A UI component with a filter bar and a button group "grid"/"list"/"textual".
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
 * - "change": The user clicked on the filter 
 * @author David Graeff
 */
import { html, define, render, dispatch } from "./hybrids.js";

function search(host, event) {
  event.preventDefault();
  var formData = new FormData(event.target);
  if (!formData.get("filter")) {
    formData = new FormData(event.target.parentNode.parentNode.parentNode);
  }
  host.value = formData.get("filter");
  dispatch(host, 'change', { detail: { value: host.value } });
}

function modeChange(host, event) {
  event.preventDefault();
  host.mode = event.target.dataset.mode;
  dispatch(host, 'mode', { detail: { mode: host.mode } });
}

function selectChanged(host, event) {
  event.preventDefault();
  host.selectmode = !host.selectmode;
  if (host.selectpeerid) {
    const peer = document.getElementById(host.selectpeerid);
    if (peer) {
      if (host.selectmode)
        peer.classList.remove("invisible");
      else
        peer.classList.add("invisible");
    }
  }
  dispatch(host, 'selectmode', { detail: { selectmode: host.selectmode } });
}

export const UiFilter = {
  placeholder: "",
  value: "",
  mode: "grid",
  grid: "",
  list: "",
  textual: "",
  select: "",
  selectmode: false,
  selectpeerid: "", // add/remove hidden css class depending on the selectmode
  render: render(({ placeholder, value, mode, grid, list, textual, selectmode, select }) => html`
  <style>
    .filterform {
      display:flex;
    }
    .filterform > .input-group {
      flex:1;
    }
    .filterform i {
      pointer-events:none;
    }
    .filterform input::before {
      content: ' ',
      position: absolute;
      top: 0;
      bottom: 0;
      left:0;
      right: 0;
      animation: bgconfirm 1s ease-in-out 0s 1;
      animation-play-state: paused;
    }
  </style>
  <form onsubmit="${search}" name="filterform" class="filterform">
  <button type="button" title="${select}" onclick="${selectChanged}" class="mr-3 btn ${selectmode ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-large"></i></button>
    <div class="input-group mr-3">
      <input class="form-control py-2" type="search" name="filter" placeholder="${placeholder}" value="${value}">
      <span class="input-group-append">
        <button class="btn btn-outline-secondary" type="button" onclick="${search}">
          <i class="fa fa-search"></i>
        </button>
      </span>
    </div>
    <div class="btn-group" role="group" aria-label="Change view mode">
      <button type="button" title="${grid}" data-mode="grid" onclick="${modeChange}" class="btn ${mode == "grid" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-large"></i></button>
      <button type="button" title="${list}" data-mode="list" onclick="${modeChange}" class="btn ${mode == "list" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-th-list"></i></button>
      <button type="button" title="${textual}" data-mode="textual" onclick="${modeChange}" class="btn ${mode == "textual" ? "btn-primary" : "btn-secondary"}"><i class="fas fa-align-justify"></i></button>
    </div>
  </form>
  `, { shadowRoot: false })
};

define('ui-filter', UiFilter);
