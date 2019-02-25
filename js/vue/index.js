import Vue from 'vue/dist/vue.esm.js';
import PortalVue from './portal-vue.mjs'
Vue.use(PortalVue);

export * from './oh-vue';
export * from './oh-vue-form';
export * from './oh-vue-list';
export * from './oh-vue-list-status';

export { Vue };

/**
 * Reactive UI web components module.
 * 
 * Exports Vue and Vue based lists and forms component.
 * We need Vue and Portal-Vue (which will be part of Vue 3).
 * 
 * Vue: Most parts of the site can be accomplished with
 * just html and web-components and are framework-agnostic. But especially for
 * reactive lists Vue is the perfect match. The html
 * templates can still be part of the website and authored
 * by anyone with basic html understanding.
 * 
 * Portal-vue: This is not a SPA, so not everything on the page
 * in in one Vue container and reactive by default.
 * Sometimes we need to render a component (say a "Save button")
 * outside of our managed Vue container (for example a "Code editor window")
 * though. Portal-vue allows that.
 
 * @see https://linusborg.github.io/portal-vue/#/guide.
 * @category Web Components (Reactive)
 * @module vue
 */