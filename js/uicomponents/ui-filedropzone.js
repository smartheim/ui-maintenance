import { html, render } from 'lit-html';
import style from './ui-filedropzone.scss';

/**
 * @category Web Components
 * @customelement ui-drop-zone
 * @description A file drop zone

 * @example <caption>A drop-zone</caption>
 * <ui-drop-zone></ui-drop-zone>
 */
class UiDropZone extends HTMLElement {
  constructor() {
    super();
    this.droppedFiles = [];
    this.url = this.hasAttribute("url") ? this.getAttribute("url") : '#';
    this.method = this.hasAttribute("method") ? this.getAttribute("method") : 'post';
    this.attachShadow({ mode: 'open' });
  }
  connectedCallback() {
    this.render();
  }
  disconnectedCallback() {
  }

  render() {
    render(html`
        <style>${style}</style>
        <form method="${this.method}" action="${this.url}" enctype="multipart/form-data"
        @submit="${(e) => this.submit(e)}" @reset="${(e) => this.restart(e)}"
        @drag="${unwanted}" @dragstart="${unwanted}"
        @drop="${(e) => this.drop(e)}" @dragover="${drag}" @dragenter="${drag}" @dragleave="${dragover}" @dragend="${dragover}">
          <div @drag="${ignore}" @dragstart="${ignore}">
            <input @change="${(e) => this.fileschange(e)}" @focus="${focus}" @blur="${blur}" type="file" name="files[]" id="file" multiple />
            <label for="file"><slot name="label">Select file...</slot></label>
          </div>
          <div class="uploading"><slot name="uploading">Uploading&hellip;</slot></div>
          <div class="success"><slot name="success">Done!</slot> <input type="reset"></div>
          <div class="error"><slot name="error">Error!</slot> <span></span>. <input type="reset"></div>
        </form>`, this.shadowRoot);
  }

  triggerFormSubmit() {
    const form = this.shadowRoot.querySelector('form');
    form.dispatchEvent(new Event("submit"));
  }

  fileschange(event) {
    this.droppedFiles = event.target.files;
    this.triggerFormSubmit();
  }

  restart(e) {
    this.droppedFiles = [];
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('is-error', 'is-success');
  }

  drop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('is-dragover');
    this.droppedFiles = e.dataTransfer.files; // the files that were dropped
    this.triggerFormSubmit();
  }

  submit(event) {
    const form = event.target;
    const input = form.querySelector('input[type="file"]');
    const errorMsg = form.querySelector('.error span');

    // preventing the duplicate submissions if the current one is in progress
    if (form.classList.contains('is-uploading')) return false;

    form.classList.add('is-uploading');
    form.classList.remove('is-error');

    event.preventDefault();

    if (!this.droppedFiles.length) return;

    // gathering the form data
    var formdata = new FormData(form);
    console.log(this.droppedFiles);
    if (this.droppedFiles.length) {
      for (var file of this.droppedFiles)
        formdata.append(input.getAttribute('name'), file);
    }

    // ajax request
    var ajax = new XMLHttpRequest();
    ajax.open(form.getAttribute('method'), form.getAttribute('action'), true);

    ajax.onload = function () {
      form.classList.remove('is-uploading');
      if (ajax.status >= 200 && ajax.status < 400) {
        var data = JSON.parse(ajax.responseText);
        form.classList.add(data.success == true ? 'is-success' : 'is-error');
        if (!data.success)
          errorMsg.textContent = data.error;
      }
      else {
        form.classList.add('is-error');
        errorMsg.textContent = "Server responded with " + ajax.status;
      }
    };

    ajax.onerror = function (e) {
      form.classList.remove('is-uploading');
      form.classList.add('is-error');
      errorMsg.textContent = e;
    };

    ajax.send(formdata);
  }
}

customElements.define('ui-drop-zone', UiDropZone);

function unwanted(e) {
  e.preventDefault();
  e.stopPropagation();
}

function ignore(e) {
  e.preventDefault();
}

function focus(e) {
  e.target.classList.add('has-focus');
}

function blur(e) {
  e.target.classList.remove('has-focus');
}

function drag(e) {
  e.preventDefault();
  e.stopPropagation();
  e.target.classList.add('is-dragover');
}

function dragover(e) {
  e.preventDefault();
  e.stopPropagation();
  e.target.classList.remove('is-dragover');
}