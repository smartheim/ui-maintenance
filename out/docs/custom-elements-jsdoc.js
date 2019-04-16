'use strict';
/* eslint-env commonjs, es6 */

exports.defineTags = function (dictionary) {
  dictionary.defineTag('customelement', {
    mustHaveValue: true,
    mustNotHaveDescription: false,
    canHaveType: false,
    canHaveName: false,
    onTagged: function (doclet, tag) {
      if (!doclet.customelements) {
        doclet.customelements = [];
      }

      doclet.customelements.push({
        'name': tag.value
      });
    }
  });
  dictionary.defineTag('attribute', {
    mustHaveValue: true,
    mustNotHaveDescription: false,
    canHaveType: false,
    canHaveName: true,
    onTagged: function (doclet, tag) {
      if (!doclet.ce_attributes) {
        doclet.ce_attributes = [];
      }

      let example = null;
      if (tag.value.description) {
        example = tag.value.description.match(/\[(.*)\]/);
        example = (example && example.length > 1) ? example[1] : "";
      }
      doclet.ce_attributes.push({
        'name': tag.value.name,
        'example': example,
        'type': 'String',
        'optional': tag.value.optional === undefined ? '' : '<optional>',
        'description': tag.value.description || '',
      });
    }
  });
};


exports.handlers = {
  newDoclet: function (e) {
    const parameters = e.doclet.customelements;
    if (parameters) {
      e.doclet.kind = 'external';
      e.doclet.name = e.doclet.longname = e.doclet.customelements.map(a => `${a.name}`).join(', ');
      e.doclet.description = `
      ${e.doclet.description}
      <code style="margin-bottom:10px;display: block;">${e.doclet.customelements.map(a =>
          `&lt;${a.name}
          ${(e.doclet.ce_attributes || []).filter(b => b.example).map(b => `${b.name}="${b.example}"`).join(' ')}&gt;`
        ).join('\n')}
      </code>`;
      delete e.doclet.meta.code;
      if (!e.doclet.examples) {
        console.log('\x1b[33m%s\x1b[0m', 'NO EXAMPLES FOR:' + e.doclet.name);
      }
    }
    const ce_attributes = e.doclet.ce_attributes;
    if (ce_attributes) {
      const tableBuilder = require('./parameterTableBuilder');
      const table = tableBuilder.build('Attributes', ce_attributes);
      e.doclet.description = `${e.doclet.description}
                              ${table}`;
    }
  }

}