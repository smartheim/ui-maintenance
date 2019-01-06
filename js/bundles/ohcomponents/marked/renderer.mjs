import {escape,unescape,originIndependentUrl,resolveUrl} from './helpers.mjs';

/**
 * Renderer
 */
export class Renderer{

    constructor(options,defaults) {
      this.options = options || defaults;
    }
    
    code(code, lang, escaped) {
      if (this.options.highlight) {
        let out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
          escaped = true;
          code = out;
        }
      }
    
      if (!lang) {
        return '<pre><code>'
          + (escaped ? code : escape(code, true))
          + '</code></pre>';
      }
    
      return '<pre><code class="'
        + this.options.langPrefix
        + escape(lang, true)
        + '">'
        + (escaped ? code : escape(code, true))
        + '</code></pre>\n';
    };
    
    blockquote(quote) {
      return '<blockquote>\n' + quote + '</blockquote>\n';
    };
    
    html(html) {
      return html;
    };
    
    heading(text, level, raw) {
      if (this.options.headerIds) {
        return '<h'
          + level
          + ' id="'
          + this.options.headerPrefix
          + raw.toLowerCase().replace(/[^\w]+/g, '-')
          + '">'
          + text
          + '</h'
          + level
          + '>\n';
      }
      // ignore IDs
      return '<h' + level + '>' + text + '</h' + level + '>\n';
    };
    
    hr(){
      return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
    };
    
    list(body, ordered, start){
      let type = ordered ? 'ol' : 'ul',
          startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
      return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
    };
    
    listitem(text) {
      return '<li>' + text + '</li>\n';
    };
    
    checkbox(checked) {
      return '<input '
        + (checked ? 'checked="" ' : '')
        + 'disabled="" type="checkbox"'
        + (this.options.xhtml ? ' /' : '')
        + '> ';
    };
    
    paragraph(text) {
      return '<p>' + text + '</p>\n';
    };
    
    table(header, body) {
      if (body) body = '<tbody>' + body + '</tbody>';
    
      return '<table>\n'
        + '<thead>\n'
        + header
        + '</thead>\n'
        + body
        + '</table>\n';
    };
    
    tablerow(content) {
      return '<tr>\n' + content + '</tr>\n';
    };
    
    tablecell(content, flags) {
      let type = flags.header ? 'th' : 'td';
      let tag = flags.align
        ? '<' + type + ' align="' + flags.align + '">'
        : '<' + type + '>';
      return tag + content + '</' + type + '>\n';
    };
    
    // span level renderer
    strong(text) {
      return '<strong>' + text + '</strong>';
    };
    
    em(text) {
      return '<em>' + text + '</em>';
    };
    
    codespan(text) {
      return '<code>' + text + '</code>';
    };
    
    br() {
      return this.options.xhtml ? '<br/>' : '<br>';
    };
    
    del(text) {
      return '<del>' + text + '</del>';
    };
    
    link(href, title, text) {
      if (this.options.sanitize) {
        try {
          let prot = decodeURIComponent(unescape(href))
            .replace(/[^\w:]/g, '')
            .toLowerCase();
        } catch (e) {
          return text;
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
          return text;
        }
      }
      if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
      }
      try {
        href = encodeURI(href).replace(/%25/g, '%');
      } catch (e) {
        return text;
      }
      let out = '<a href="' + escape(href) + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += '>' + text + '</a>';
      return out;
    };
    
    image(href, title, text) {
      if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
      }
      let out = '<img src="' + href + '" alt="' + text + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += this.options.xhtml ? '/>' : '>';
      return out;
    };
    
    text(text) {
      return text;
    };
}

    /**
     * TextRenderer
     * returns only the textual part of the token
     */
    
    export class TextRenderer{};
    
    // no need for block level renderers
    
    TextRenderer.prototype.strong =
    TextRenderer.prototype.em =
    TextRenderer.prototype.codespan =
    TextRenderer.prototype.del =
    TextRenderer.prototype.text = function (text) {
      return text;
    };
    
    TextRenderer.prototype.link =
    TextRenderer.prototype.image = function(href, title, text) {
      return '' + text;
    };
    
    TextRenderer.prototype.br = function() {
      return '';
    };