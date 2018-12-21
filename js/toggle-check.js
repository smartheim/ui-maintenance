import { html, define, dispatch, property } from './hybrids.js';

export function changeState(host, event) {
  if (host.storekey != "") {
    host.checked = event.target.checked;
  }
  dispatch(host, 'change');
}

export function checkedOrUnchecked(checked, changeState) {
  if (checked)
    return html`<input onchange="${changeState}" type="checkbox" checked>`;
  else
    return html`<input onchange="${changeState}" type="checkbox">`;
}

export const ToggleCheck = {
  storekey: "",
  checked: {
    set: (host, value) => {
      if (host.storekey!="") localStorage.setItem(host.storekey, value);
      return value;
    },
    get: (host, lastValue) => {
      const value = localStorage.getItem(host.storekey);
      if (value == "true") return true;
      return lastValue;
    }
  },
  render: ({ checked }) => html`
    <style>
    label {
      display: flex;
      align-items: center;
    }
    label span {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
    }
    input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: .4s;
        transition: .4s;
    }
    .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }
    input:checked+.slider {
        background-color: #ff7214;
    }
    input:focus+.slider {
        box-shadow: 0 0 1px #ff7214;
    }
    input:checked+.slider:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }
    .round {
        border-radius: 34px;
    }
    .round:before {
        border-radius: 50%;
    }
    div {
        padding-left: 10px;
    }
    </style>
    <label>
      <span>
        ${checkedOrUnchecked(checked, changeState)}
        <span class="slider round"></span>
      </span><div><slot></slot></div>
    </label>
  `
};

define('toggle-check', ToggleCheck);
// Usage: <toggle-check disabled>Fancy button!</button>
