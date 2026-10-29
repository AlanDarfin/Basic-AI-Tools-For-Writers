const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync(require('node:path').join(__dirname, '../main.js'), 'utf8');
const sandbox = { require: () => ({Plugin:class{}, ItemView:class{}, PluginSettingTab:class{}}), module:{exports:{}}, console };
vm.runInNewContext(code + '\nmodule.exports.__test = {parseDictionary, normalize};', sandbox);
const {parseDictionary, normalize} = sandbox.module.exports.__test;
test('parses headings without separators', () => {
 const entries=parseDictionary('# First\nA definition\n# Second\nAnother definition');
 assert.equal(entries.length,2);assert.equal(entries[0].word,'First');assert.match(entries[1].markdown,/Another definition/);
});
test('preserves nested headings',()=>{const entries=parseDictionary('# Word\n## Synonyms\n- test');assert.equal(entries.length,1);assert.match(entries[0].markdown,/## Synonyms/);});
test('accepts optional separators',()=>{assert.equal(parseDictionary('# One\n---\n# Two').length,2);});
test('normalizes case and accents',()=>{assert.equal(normalize('AÇÃO'),normalize('acao'));});
test('handles empty dictionary',()=>{assert.equal(parseDictionary('').length,0);});
