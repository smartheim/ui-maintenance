import { html, define, render } from './hybrids.js';

export const NavButtons = {
  prevLink: {
    get: (host, lastValue) => {
      const value = document.querySelector('link[rel="prev"]');
      if (value) return value.href;
      return "";
    }
  },
  nextLink: {
    get: (host, lastValue) => {
      const value = document.querySelector('link[rel="next"]');
      if (value) return value.href;
      return "";
    }
  },
  prevEnabled: {
    get: (host, lastValue) => {
      return host.prevLink != "";
    }
  },
  nextEnabled: {
    get: (host, lastValue) => {
      return host.nextLink != "";
    }
  },
  render: render ( ({ prevEnabled, nextEnabled, prevLink, nextLink }) => html`
  <div style="display: flex;justify-content: flex-end;margin:inherit;padding:inherit;">
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${prevEnabled ? "" : "disabled"}" href="${prevLink}">Back</a>
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${nextEnabled ? "" : "disabled"}" href="${nextLink}">Next</a>
  </div>
  `, { shadowRoot: false })
};

define('nav-buttons', NavButtons);
// Usage: <nav-buttons></nav-buttons>
