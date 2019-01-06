import {Renderer,TextRenderer} from './renderer.mjs';
import {InlineLexer} from './lexer-inline.mjs';
import {unescape,merge} from './helpers.mjs';
/**
 * Parsing & Compiling
 */  
export class Parser{

    constructor(options) {
        this.tokens = [];
        this.token = null;
        this.options = options || marked.defaults;
        this.options.renderer = this.options.renderer || new Renderer();
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