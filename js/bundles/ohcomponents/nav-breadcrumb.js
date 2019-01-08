import { html, define, render } from './hybrids.js';

export const NavBreadcrumb = {
  parentLink: {
    get: (host, lastValue) => {
      var link;
      link = document.querySelector('link[rel="parent"]');
      if (link) return link.href;
      return "#";
    }
  },
  parent: "Home",
  title: {
    get: (host, lastValue) => {
      var link;
      link = document.querySelector('section.header > h4');
      if (link) return link.innerText;
      return document.title;
    }
  },
  render: render(({ title, parent, parentLink }) => html`
  <div style="padding: inherit;margin: inherit;">
    <a class="" href="${parentLink}">${parent}</a> →
    <a class="disabled" href="#">${title}</a>
  </div>
  `, { shadowRoot: false })
};

define('nav-breadcrumb', NavBreadcrumb);
// Usage: <nav-breadcrumb></nav-breadcrumb>
