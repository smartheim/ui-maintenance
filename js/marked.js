function escape$1(html, encode) {
    if (encode) {
        if (escape$1.escapeTest.test(html)) {
        return html.replace(escape$1.escapeReplace, function (ch) { return escape$1.replacements[ch]; });
        }
    } else {
        if (escape$1.escapeTestNoEncode.test(html)) {
        return html.replace(escape$1.escapeReplaceNoEncode, function (ch) { return escape$1.replacements[ch]; });
        }
    }

    return html;
}

escape$1.escapeTest = /[&<>"']/;
escape$1.escapeReplace = /[&<>"']/g;
escape$1.replacements = {
'&': '&amp;',
'<': '&lt;',
'>': '&gt;',
'"': '&quot;',
"'": '&#39;'
};

escape$1.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
escape$1.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;

function unescape(html) {
    // explicitly match decimal, hex, and named HTML entities
    return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, 
        function(_, n) {
            n = n.toLowerCase();
            if (n === 'colon') return ':';
            if (n.charAt(0) === '#') {
                return n.charAt(1) === 'x'
                ? String.fromCharCode(parseInt(n.substring(2), 16))
                : String.fromCharCode(+n.substring(1));
            }
        return '';
    });
}

function edit(regex, opt) {
    regex = regex.source || regex;
    opt = opt || '';
    return {
        replace: function(name, val) {
            val = val.source || val;
            val = val.replace(/(^|[^\[])\^/g, '$1');
            regex = regex.replace(name, val);
            return this;
        },
        getRegex: function() {
            return new RegExp(regex, opt);
        }
    };
}

let baseUrls = {};
let originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function resolveUrl(base, href) {
    if (!baseUrls[' ' + base]) {
        // we can ignore everything in base after the last slash of its path component,
        // but we might need to add _that_
        // https://tools.ietf.org/html/rfc3986#section-3
        if (/^[^:]+:\/*[^/]*$/.test(base)) {
            baseUrls[' ' + base] = base + '/';
        } else {
            baseUrls[' ' + base] = rtrim(base, '/', true);
        }
    }
    base = baseUrls[' ' + base];

    if (href.slice(0, 2) === '//') {
        return base.replace(/:[\s\S]*/, ':') + href;
    } else if (href.charAt(0) === '/') {
        return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href;
    } else {
        return base + href;
    }
}


function noop() {}
noop.exec = noop;

function merge(obj) {
    let i = 1,
        target,
        key;

    for (; i < arguments.length; i++) {
    target = arguments[i];
        for (key in target) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
                obj[key] = target[key];
            }
        }
    }
    return obj;
}

function splitCells(tableRow, count) {
    // ensure that every cell-delimiting pipe has a space
    // before it to distinguish it from an escaped pipe
    let row = tableRow.replace(/\|/g, function (match, offset, str) {
        let escaped = false,
            curr = offset;
        while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
        if (escaped) {
            // odd number of slashes means | is escaped
            // so we leave it alone
            return '|';
        } else {
            // add space before unescaped |
            return ' |';
        }
        }),
        cells = row.split(/ \|/),
        i = 0;

    if (cells.length > count) {
        cells.splice(count);
    } else {
        while (cells.length < count) cells.push('');
    }

    for (; i < cells.length; i++) {
        // leading or trailing whitespace is ignored per the gfm spec
        cells[i] = cells[i].trim().replace(/\\\|/g, '|');
    }
    return cells;
}

// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.
function rtrim(str, c, invert) {
    if (str.length === 0) {
        return '';
    }

    // Length of suffix matching the invert condition.
    let suffLen = 0;

    // Step left until we fail to match the invert condition.
    while (suffLen < str.length) {
        let currChar = str.charAt(str.length - suffLen - 1);
        if (currChar === c && !invert) {
            suffLen++;
        } else if (currChar !== c && invert) {
            suffLen++;
        } else {
            break;
        }
    }
    return str.substr(0, str.length - suffLen);
}

/**
 * Renderer
 */
class Renderer$1{

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
          + (escaped ? code : escape$1(code, true))
          + '</code></pre>';
      }
    
      return '<pre><code class="'
        + this.options.langPrefix
        + escape$1(lang, true)
        + '">'
        + (escaped ? code : escape$1(code, true))
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
      let out = '<a href="' + escape$1(href) + '"';
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
    
    class TextRenderer{}    
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

/**
 * Block-Level Grammar
 */
let block = {
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  bullet : /(?:[*+-]|\d+\.)/,
  code: /^( {4}[^\n]+\n*)+/,
  _comment : /<!--(?!-?>)[\s\S]*?-->/,
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  fences: noop,
  heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  html: '^ {0,3}(?:' // optional indentation
        + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
        + '|comment[^\\n]*(\\n+|$)' // (2)
        + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
        + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
        + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
        + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
        + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
        + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
        + ')', 
  item : /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/,
  _label : /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  newline: /^\n+/,
  nptable: noop,
  paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  table: noop,  
  text: /^[^\n]+/,
  _title : /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
  _tag : 'address|article|aside|base|basefont|blockquote|body|caption'
          + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
          + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
          + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
          + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
          + '|track|ul'
};

/**
 * Normal Block Grammar
 */

block.def = edit(block.def)
            .replace('label', block._label)
            .replace('title', block._title)
            .getRegex();
    
block.item = edit(block.item, 'gm')
            .replace(/bull/g, block.bullet)
            .getRegex();

block.list = edit(block.list)
            .replace(/bull/g, block.bullet)
            .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
            .replace('def', '\\n+(?=' + block.def.source + ')')
            .getRegex();

block.html = edit(block.html, 'i')
            .replace('comment', block._comment)
            .replace('tag', block._tag)
            .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
            .getRegex();

block.paragraph = edit(block.paragraph)
                  .replace('hr', block.hr)
                  .replace('heading', block.heading)
                  .replace('lheading', block.lheading)
                  .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
                  .getRegex();

block.blockquote = edit(block.blockquote)
                  .replace('paragraph', block.paragraph)
                  .getRegex();
    
block.normal = merge({}, block);
/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\n? *\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = edit(block.paragraph)
  .replace('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  .getRegex();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
});
    
/**
 * Pedantic grammar
 */

block.pedantic = merge({}, block.normal, {
  html: edit(
    '^ *(?:comment *(?:\\n|\\s*$)'
    + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
    .replace('comment', block._comment)
    .replace(/tag/g, '(?!(?:'
      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
      + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
      + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
    .getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/
});

/**
 * Inline-Level Grammar
 */
    
let inline = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: noop,
    tag: '^comment'
    + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
    link: /^!?\[(label)\]\(href(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
    nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
    strong: /^__([^\s])__(?!_)|^\*\*([^\s])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
    em: /^_([^\s_])_(?!_)|^\*([^\s*"<\[])\*(?!\*)|^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s_][\s\S]*?[^\s])_(?!_)|^\*([^\s"<\[][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: noop,
    text: /^(`+|[^`])[\s\S]*?(?=[\\<!\[`*]|\b_| {2,}\n|$)/,
    _escapes: /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g,
    _scheme : /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/,
    _email : /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
    _attribute : /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/,
    _label : /(?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|[^\[\]\\])*?/,
    _href : /\s*(<(?:\\[<>]?|[^\s<>\\])*>|(?:\\[()]?|\([^\s\x00-\x1f\\]*\)|[^\s\x00-\x1f()\\])*?)/,
    _title : /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/
};

inline.autolink = edit(inline.autolink)
    .replace('scheme', inline._scheme)
    .replace('email', inline._email)
    .getRegex();

inline.tag = edit(inline.tag)
    .replace('comment', block._comment)
    .replace('attribute', inline._attribute)
    .getRegex();

inline.link = edit(inline.link)
    .replace('label', inline._label)
    .replace('href', inline._href)
    .replace('title', inline._title)
    .getRegex();

inline.reflink = edit(inline.reflink)
    .replace('label', inline._label)
    .getRegex();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
    link: edit(/^!?\[(label)\]\((.*?)\)/)
    .replace('label', inline._label)
    .getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
    .replace('label', inline._label)
    .getRegex()
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
    escape: edit(inline.escape).replace('])', '~|])').getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^~+(?=\S)([\s\S]*?\S)~+/,
    text: edit(inline.text)
    .replace(']|', '~]|')
    .replace('|$', '|https?://|ftp://|www\\.|[a-zA-Z0-9.!#$%&\'*+/=?^_`{\\|}~-]+@|$')
    .getRegex()
});

inline.gfm.url = edit(inline.gfm.url)
    .replace('email', inline.gfm._extended_email)
    .getRegex();
/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
    br: edit(inline.br).replace('{2,}', '*').getRegex(),
    text: edit(inline.gfm.text).replace('{2,}', '*').getRegex()
});

/**
 * Inline Lexer & Compiler
 */ 
class InlineLexer{
    constructor(links, options) {
        this.options = options || marked.defaults;
        this.links = links;
        this.rules = inline.normal;
        this.renderer = this.options.renderer || new Renderer();
        this.renderer.options = this.options;

        if (!this.links) {
            throw new Error('Tokens array requires a `links` property.');
        }

        /**
         * Expose Inline Rules
         */
        if (this.options.pedantic) {
            this.rules = inline.pedantic;
        } else if (this.options.gfm) {
            if (this.options.breaks) {
                this.rules = inline.breaks;
            } else {
                this.rules = inline.gfm;
            }
        }else{
          this.rules = inline;
        }

      }
    
    /**
     * Static Lexing/Compiling Method
     */
    static output(src, links, options) {
        let inline = new InlineLexer(links, options);
        return inline.output(src);
    };
    //Non static method
    output(src) {
        //console.log("prepping output for: ",src);
        let out = '',
            link,
            text,
            href,
            title,
            cap,
            prevCapZero;
      
        while (src) {
          // escape
          if (cap = this.rules.escape.exec(src)) {
            //console.log('escape');
            src = src.substring(cap[0].length);
            out += cap[1];
            continue;
          }
      
          // autolink
          if (cap = this.rules.autolink.exec(src)) {
            //console.log('autolink');
            src = src.substring(cap[0].length);
            if (cap[2] === '@') {
              text = escape(this.mangle(cap[1]));
              href = 'mailto:' + text;
            } else {
              text = escape(cap[1]);
              href = text;
            }
            out += this.renderer.link(href, null, text);
            continue;
          }
      
          // url (gfm)
          if (!this.inLink && (cap = this.rules.url.exec(src))) {
            //console.log('url (gfm)');
            if (cap[2] === '@') {
              text = escape(cap[0]);
              href = 'mailto:' + text;
            } else {
              // do extended autolink path validation
              do {
                prevCapZero = cap[0];
                cap[0] = this.rules._backpedal.exec(cap[0])[0];
              } while (prevCapZero !== cap[0]);
              text = escape(cap[0]);
              if (cap[1] === 'www.') {
                href = 'http://' + text;
              } else {
                href = text;
              }
            }
            src = src.substring(cap[0].length);
            out += this.renderer.link(href, null, text);
            continue;
          }
      
          // tag
          if (cap = this.rules.tag.exec(src)) {
            //console.log('tag');
            if (!this.inLink && /^<a /i.test(cap[0])) {
              this.inLink = true;
            } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
              this.inLink = false;
            }
            if (!this.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              this.inRawBlock = true;
            } else if (this.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              this.inRawBlock = false;
            }
      
            src = src.substring(cap[0].length);
            out += this.options.sanitize
              ? this.options.sanitizer
                ? this.options.sanitizer(cap[0])
                : escape(cap[0])
              : cap[0];
            continue;
          }
      
          // link
          if (cap = this.rules.link.exec(src)) {
            //console.log('link');
            src = src.substring(cap[0].length);
            this.inLink = true;
            href = cap[2];
            if (this.options.pedantic) {
              link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
      
              if (link) {
                href = link[1];
                title = link[3];
              } else {
                title = '';
              }
            } else {
              title = cap[3] ? cap[3].slice(1, -1) : '';
            }
            href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
            out += this.outputLink(cap, {
              href: InlineLexer.escapes(href),
              title: InlineLexer.escapes(title)
            });
            this.inLink = false;
            continue;
          }
      
          // reflink, nolink
          if ((cap = this.rules.reflink.exec(src))
              || (cap = this.rules.nolink.exec(src))) {
                //console.log('reflink, nolink');
            src = src.substring(cap[0].length);
            link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
            link = this.links[link.toLowerCase()];
            if (!link || !link.href) {
              out += cap[0].charAt(0);
              src = cap[0].substring(1) + src;
              continue;
            }
            this.inLink = true;
            out += this.outputLink(cap, link);
            this.inLink = false;
            continue;
          }
      
          // strong
          if (cap = this.rules.strong.exec(src)) {
            //console.log('strong');
            src = src.substring(cap[0].length);
            out += this.renderer.strong(this.output(cap[4] || cap[3] || cap[2] || cap[1]));
            continue;
          }
      
          // em
          if (cap = this.rules.em.exec(src)) {
            //console.log('em');
            src = src.substring(cap[0].length);
            out += this.renderer.em(this.output(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]));
            continue;
          }
      
          // code
          if (cap = this.rules.code.exec(src)) {
            //console.log('code');
            src = src.substring(cap[0].length);
            out += this.renderer.codespan(escape(cap[2].trim(), true));
            continue;
          }
      
          // br
          if (cap = this.rules.br.exec(src)) {
            //console.log('br');
            src = src.substring(cap[0].length);
            out += this.renderer.br();
            continue;
          }
      
          // del (gfm)
          if (cap = this.rules.del.exec(src)) {
            //console.log('del (gfm)');
            src = src.substring(cap[0].length);
            out += this.renderer.del(this.output(cap[1]));
            continue;
          }
      
          // text
          if (cap = this.rules.text.exec(src)) {
            //console.log('text');
            src = src.substring(cap[0].length);
            //if (this.inRawBlock) {
              //console.log('text inRawBlock');
              out += this.renderer.text(cap[0]);
           // } else {
             // //console.log('text needs escaping');
              //out += this.renderer.text(escape(this.smartypants(cap[0])));
            //}
            continue;
          }
      
          if (src) {
            throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
          }
        }
        return out;
      };

    static escapes(text) {
      return text ? text.replace(InlineLexer.rules._escapes, '$1') : text;
    };

      /**
       * Compile Link
      */
    outputLink(cap, link) {
        let href = link.href,
            title = link.title ? escape(link.title) : null;
      
        return cap[0].charAt(0) !== '!'
          ? this.renderer.link(href, title, this.output(cap[1]))
          : this.renderer.image(href, title, escape(cap[1]));
      };

       /**
       * Smartypants Transformations
        */
      smartypants(text) {
        if (!this.options.smartypants) return text;
        return text
          // em-dashes
          .replace(/---/g, '\u2014')
          // en-dashes
          .replace(/--/g, '\u2013')
          // opening singles
          .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
          // closing singles & apostrophes
          .replace(/'/g, '\u2019')
          // opening doubles
          .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
          // closing doubles
          .replace(/"/g, '\u201d')
          // ellipses
          .replace(/\.{3}/g, '\u2026');
      };

      /**
      * Mangle Links
      */
      mangle(text) {
        if (!this.options.mangle) return text;
        let out = '',
            l = text.length,
            i = 0,
            ch;
      
        for (; i < l; i++) {
          ch = text.charCodeAt(i);
          if (Math.random() > 0.5) {
            ch = 'x' + ch.toString(16);
          }
          out += '&#' + ch + ';';
        }
        return out;
      };
}

InlineLexer.rules = inline.normal;

/**
 * Parsing & Compiling
 */  
class Parser{

    constructor(options) {
        this.tokens = [];
        this.token = null;
        this.options = options || marked.defaults;
        this.options.renderer = this.options.renderer || new Renderer$1();
        this.renderer = this.options.renderer;
        this.renderer.options = this.options;
    }
    
    /**
     * Static Parse Method
     */
    
    static parse(tokens, options) {
      let parser = new Parser(options);
      
      return parser.parse(tokens);
    };
    
    /**
     * Parse Loop
     */
    
    parse(tokens) {
      //console.warn("Parser.parse: ",tokens);
      this.inline = new InlineLexer(tokens.links, this.options);
      // use an InlineLexer with a TextRenderer to extract pure text
      this.inlineText = new InlineLexer(
        tokens.links,
        merge({}, this.options, {renderer: new TextRenderer()})
      );
      this.tokens = tokens.reverse();
    
      let out = '';
      while (this.next()) {
        out += this.tok();
      }
      //console.warn("out: ",out);
      return out;
    };
    
    /**
     * Next Token
     */
    
    next(){
      return this.token = this.tokens.pop();
    };
    
    /**
     * Preview Next Token
     */
    
    peek() {
      return this.tokens[this.tokens.length - 1] || 0;
    };
    
    /**
     * Parse Text Tokens
     */
    
    parseText(){
      let body = this.token.text;
    
      while (this.peek().type === 'text') {
        body += '\n' + this.next().text;
      }
    
      return this.inline.output(body);
    };
    
    /**
     * Parse Current Token
     */
    
    tok(){
      let body = '';
      switch (this.token.type) {
        case 'space': {
          return '';
        }
        case 'hr': {
          return this.renderer.hr();
        }
        case 'heading': {
          //console.log("placing "+this.token.text+" into a heading tag");
          let inlineOutPut = this.inline.output(this.token.text);
          //console.log("inlineOutPut: ",inlineOutPut);
          return this.renderer.heading(
            inlineOutPut,
            this.token.depth,
            unescape(this.inlineText.output(this.token.text)));
        }
        case 'code': {
          return this.renderer.code(this.token.text,
            this.token.lang,
            this.token.escaped);
        }
        case 'table': {
          let header = '',
              body = '',
              i,
              row,
              cell,
              j;
    
          // header
          cell = '';
          for (i = 0; i < this.token.header.length; i++) {
            cell += this.renderer.tablecell(
              this.inline.output(this.token.header[i]),
              { header: true, align: this.token.align[i] }
            );
          }
          header += this.renderer.tablerow(cell);
    
          for (i = 0; i < this.token.cells.length; i++) {
            row = this.token.cells[i];
    
            cell = '';
            for (j = 0; j < row.length; j++) {
              cell += this.renderer.tablecell(
                this.inline.output(row[j]),
                { header: false, align: this.token.align[j] }
              );
            }
    
            body += this.renderer.tablerow(cell);
          }
          return this.renderer.table(header, body);
        }
        case 'blockquote_start': {
          body = '';
          while (this.next().type !== 'blockquote_end') {
            body += this.tok();
          }
          return this.renderer.blockquote(body);
        }
        case 'list_start': {
          body = '';
          let ordered = this.token.ordered,
              start = this.token.start;
    
          while (this.next().type !== 'list_end') {
            body += this.tok();
          }
          return this.renderer.list(body, ordered, start);
        }
        case 'list_item_start': {
          body = '';
          let loose = this.token.loose;
    
          if (this.token.task) {
            body += this.renderer.checkbox(this.token.checked);
          }
    
          while (this.next().type !== 'list_item_end') {
            body += !loose && this.token.type === 'text'
              ? this.parseText()
              : this.tok();
          }
    
          return this.renderer.listitem(body);
        }
        case 'html': {
          // TODO parse inline content if parameter markdown=1
          return this.renderer.html(this.token.text);
        }
        case 'paragraph': {
          return this.renderer.paragraph(this.inline.output(this.token.text));
        }
        case 'text': {
          return this.renderer.paragraph(this.parseText());
        }
      }
    };
}

/**
 * Block Lexer
 */
class Lexer{
    constructor(options) {
      this.tokens = [];
      this.tokens.links = Object.create(null);
      this.options = options || marked.defaults;
      this.rules = block.normal;
    
      if (this.options.pedantic) {
        this.rules = block.pedantic;
      } else if (this.options.gfm) {
        if (this.options.tables) {
          this.rules = block.tables;
        } else {
          this.rules = block.gfm;
        }
      }
    }
    
    /**
     * Static Lex Method
     */
    
    static lex(src, options) {
      let lexer = new Lexer(options);
      return lexer.lex(src);
    };
    
    /**
     * Preprocessing
     */
    
    lex(src){
      src = src
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/\u00a0/g, ' ')
        .replace(/\u2424/g, '\n');
    
      return this.tokenize(src, true);
    };
    
    /**
     * Lexing
     */
    
    tokenize(src, top) {
      src = src.replace(/^ +$/gm, '');
      let next,
          loose,
          cap,
          bull,
          b,
          item,
          listStart,
          listItems,
          t,
          space,
          i,
          tag,
          l,
          isordered,
          istask,
          ischecked;
    
      while (src) {
        // newline
        if (cap = this.rules.newline.exec(src)) {
          src = src.substring(cap[0].length);
          if (cap[0].length > 1) {
            this.tokens.push({
              type: 'space'
            });
          }
          //console.log('space');
        }
        
        // code
        if (cap = this.rules.code.exec(src)) {
          src = src.substring(cap[0].length);
          cap = cap[0].replace(/^ {4}/gm, '');
          this.tokens.push({
            type: 'code',
            text: !this.options.pedantic
              ? rtrim(cap, '\n')
              : cap
          });
          //console.log('code');
          continue;
        }
        
        // fences (gfm)
        if (cap = this.rules.fences.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'code',
            lang: cap[2],
            text: cap[3] || ''
          });
          //console.log('fences');
          continue;
        }
    
        // heading
        if (cap = this.rules.heading.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'heading',
            depth: cap[1].length,
            text: cap[2]
          });
          //console.log('heading');
          continue;
        }
    
        // table no leading pipe (gfm)
        if (top && (cap = this.rules.nptable.exec(src))) {
          //console.log('nptables');
          item = {
            type: 'table',
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
            align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
          };
    
          if (item.header.length === item.align.length) {
            src = src.substring(cap[0].length);
    
            for (i = 0; i < item.align.length; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = 'right';
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = 'center';
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = 'left';
              } else {
                item.align[i] = null;
              }
            }
    
            for (i = 0; i < item.cells.length; i++) {
              item.cells[i] = splitCells(item.cells[i], item.header.length);
            }
    
            this.tokens.push(item);    
            continue;
          }
        }
    
        // hr
        if (cap = this.rules.hr.exec(src)) {
          //console.log('hr');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'hr'
          });
          continue;
        }
    
        // blockquote
        if (cap = this.rules.blockquote.exec(src)) {
          //console.log('blockquote');
          src = src.substring(cap[0].length);    
          this.tokens.push({
            type: 'blockquote_start'
          });
    
          cap = cap[0].replace(/^ *> ?/gm, '');
    
          // Pass `top` to keep the current
          // "toplevel" state. This is exactly
          // how markdown.pl works.
          this.tokenize(cap, top);
    
          this.tokens.push({
            type: 'blockquote_end'
          });
    
          continue;
        }
    
        // list
        if (cap = this.rules.list.exec(src)) {
          //console.log('list');
          src = src.substring(cap[0].length);
          bull = cap[2];
          isordered = bull.length > 1;
    
          listStart = {
            type: 'list_start',
            ordered: isordered,
            start: isordered ? +bull : '',
            loose: false
          };
    
          this.tokens.push(listStart);
    
          // Get each top-level item.
          cap = cap[0].match(this.rules.item);
    
          listItems = [];
          next = false;
          l = cap.length;
          i = 0;
    
          for (; i < l; i++) {
            item = cap[i];
    
            // Remove the list item's bullet
            // so it is seen as the next token.
            space = item.length;
            item = item.replace(/^ *([*+-]|\d+\.) +/, '');
    
            // Outdent whatever the
            // list item contains. Hacky.
            if (~item.indexOf('\n ')) {
              space -= item.length;
              item = !this.options.pedantic
                ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
                : item.replace(/^ {1,4}/gm, '');
            }
    
            // Determine whether the next list item belongs here.
            // Backpedal if it does not belong in this list.
            if (this.options.smartLists && i !== l - 1) {
              b = block.bullet.exec(cap[i + 1])[0];
              if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                src = cap.slice(i + 1).join('\n') + src;
                i = l - 1;
              }
            }
    
            // Determine whether item is loose or not.
            // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
            // for discount behavior.
            loose = next || /\n\n(?!\s*$)/.test(item);
            if (i !== l - 1) {
              next = item.charAt(item.length - 1) === '\n';
              if (!loose) loose = next;
            }
    
            if (loose) {
              listStart.loose = true;
            }
    
            // Check for task list items
            istask = /^\[[ xX]\] /.test(item);
            ischecked = undefined;
            if (istask) {
              ischecked = item[1] !== ' ';
              item = item.replace(/^\[[ xX]\] +/, '');
            }
    
            t = {
              type: 'list_item_start',
              task: istask,
              checked: ischecked,
              loose: loose
            };
    
            listItems.push(t);
            this.tokens.push(t);
    
            // Recurse.
            this.tokenize(item, false);
    
            this.tokens.push({
              type: 'list_item_end'
            });
          }
    
          if (listStart.loose) {
            l = listItems.length;
            i = 0;
            for (; i < l; i++) {
              listItems[i].loose = true;
            }
          }
    
          this.tokens.push({
            type: 'list_end'
          });
    
          continue;
        }
    
        // html
        if (cap = this.rules.html.exec(src)) {
          //console.log('html');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: this.options.sanitize
              ? 'paragraph'
              : 'html',
            pre: !this.options.sanitizer
              && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
            text: cap[0]
          });
          continue;
        }
    
        // def
        if (top && (cap = this.rules.def.exec(src))) {
          //console.log('def');
          src = src.substring(cap[0].length);
          if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
          tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
          if (!this.tokens.links[tag]) {
            this.tokens.links[tag] = {
              href: cap[2],
              title: cap[3]
            };
          }
          continue;
        }
    
        // table (gfm)
        if (top && (cap = this.rules.table.exec(src))) {
          //console.log('table (GFM)');
          item = {
            type: 'table',
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
            align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/(?: *\| *)?\n$/, '').split('\n') : []
          };
    
          if (item.header.length === item.align.length) {
            src = src.substring(cap[0].length);
    
            for (i = 0; i < item.align.length; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = 'right';
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = 'center';
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = 'left';
              } else {
                item.align[i] = null;
              }
            }
    
            for (i = 0; i < item.cells.length; i++) {
              item.cells[i] = splitCells(
                item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
                item.header.length);
            }
    
            this.tokens.push(item);
    
            continue;
          }
        }
    
        // lheading
        if (cap = this.rules.lheading.exec(src)) {
          //console.log('lheading');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'heading',
            depth: cap[2] === '=' ? 1 : 2,
            text: cap[1]
          });
          continue;
        }
    
        // top-level paragraph
        if (top && (cap = this.rules.paragraph.exec(src))) {
          //console.log('paragraph');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'paragraph',
            text: cap[1].charAt(cap[1].length - 1) === '\n'
              ? cap[1].slice(0, -1)
              : cap[1]
          });
          continue;
        }
    
        // text
        if (cap = this.rules.text.exec(src)) {
          //console.log('text');
          // Top-level should never reach here.
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'text',
            text: cap[0]
          });
          continue;
        }
    
        if (src) {
          throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
        }
      }
      //console.warn("this.tokens: ",this.tokens);
      return this.tokens;
    };
}

/**
 * marked - a markdown parser
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 * Refactored by Sara Garmin @saragarmee
 * https://github.com/telepathic-elements/marked
 */

class Marked{
    constructor(){
        this.defaults = Marked.getDefaults();
        this.Parser = Parser;
        this.parser = Parser.parse;
        this.Renderer = Renderer$1;
        this.TextRenderer = TextRenderer;
        this.Lexer = Lexer;
        this.lexer = Lexer.lex;
        this.InlineLexer = InlineLexer;
        this.inlineLexer = InlineLexer.output;
    }

    async parse(src, opt, callback) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
            throw new Error('Marked.parse(): input parameter is undefined or null');
        }
        if (typeof src !== 'string') {
            throw new Error('Marked.parse(): input parameter is of type '+ Object.prototype.toString.call(src) + ', string expected');
        }
    
        if (callback || typeof opt === 'function') {
            if (!callback) {
                callback = opt;
                opt = null;
            }
    
            opt = merge({}, this.defaults, opt || {});
        
            let highlight = opt.highlight;
           
            let tokens = 0;
            let pending = 0;
            try {
                tokens = Lexer.lex(src, opt);
            } catch (e) {
                return callback(e);
            }
    
            pending = tokens.length;
    
            let done = (err)=>{
                if (err) {
                    opt.highlight = highlight;
                    return callback(err);
                }
        
                let out;
        
                try {
                    out = Parser.parse(tokens, opt);
                } catch (e) {
                    err = e;
                }
                opt.highlight = highlight;
                return err ? callback(err) : callback(null, out);
            };
    
            if (!highlight || highlight.length < 3) {
                return done();
            }
    
            delete opt.highlight;
    
            if (!pending) return done();
    
            for(let token of tokens) {
                
                if (token.type !== 'code') {
                    return --pending || done();
                }
                return highlight(token.text, token.lang, function(err, code) {
                    if (err) return done(err);
                    if (code == null || code === token.text) {
                    return --pending || done();
                    }
                    token.text = code;
                    token.escaped = true;
                    --pending || done();
                });
            }
    
            return;
        }

        try {
            if (opt){
                opt = merge({}, this.defaults, opt);
            }else{
                opt = this.defaults;
            }
            
            return Parser.parse(Lexer.lex(src, opt), opt);
        } catch (e) {
            e.message += '\nPlease report this to https://github.com/markedjs/marked.';
            if ((opt || this.defaults).silent) {
                return '<p>An error occurred:</p><pre>'
                + escape$1(e.message + '', true)
                + '</pre>';
            }
            throw e;
        }
    }
    static renderer(){
        return new Renderer$1(null,Marked.getDefaults());
    }

    static getDefaults() {
        return {
          baseUrl: null,
          breaks: false,
          gfm: true,
          headerIds: true,
          headerPrefix: '',
          highlight: null,
          langPrefix: 'language-',
          mangle: true,
          pedantic: false,
          sanitize: false,
          sanitizer: null,
          silent: false,
          smartLists: false,
          smartypants: false,
          tables: true,
          xhtml: false
        };
    };
    
    /**
    * Options
    */
    setOptions(opt) {
        merge(this.defaults, opt);
        return this;
    };
}

export { Marked };
