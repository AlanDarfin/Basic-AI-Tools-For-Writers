'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('styles.css','utf8');
const main=fs.readFileSync('main.js','utf8');
const project=fs.readFileSync('projects.js','utf8');
let tests=0;
function check(condition,name){assert.ok(condition,name);console.log('PASS',name);tests++;}
const marker='Writing Suite 3.1.0-beta.2: unified form controls';
const i=css.lastIndexOf(marker);
check(i>0,'Unified controls are appended after legacy CSS rules');
const latest=css.slice(i);
for(const root of ['.writer-tool-root','.writer-tools-v3','.writer-project-root','.dictionary-settings-panel','.writer-unicode-modal','.dictionary-writer-modal','.writer-abbr-add','.writer-abbr-list']){
 check(latest.includes(root),'Uniform native controls scope: '+root);
}
check(latest.includes('select:not([multiple])'),'Only single-choice dropdowns receive fixed native height');
check(latest.includes('height:var(--writer-control-height,42px)'),'Native dropdown height overrides incompatible Obsidian themes');
check(latest.includes('padding-block:0'),'Dropdown vertical padding cannot crop selected text');
check(latest.includes('line-height:normal'),'Dropdown text line height is normalized');
check(latest.includes('padding-inline:12px 38px'),'Room for native dropdown indicator and long text');
check(latest.includes('writer-review-controls.writer-review-controls>select'),'Review mode has explicit full-height flex row');
check(latest.includes(':focus-visible'),'Form controls keep visible keyboard focus');
check(latest.includes('container-type:inline-size'),'Settings layout responds to panel width');
check(main.includes("this.reviewMode=reviewControls.createEl('select'"),'Reviewer uses standardized native select');
check(project.includes("const selector=top.createEl('select'"),'Longform project selector is covered by uniform styles');
console.log(tests+' unified control regression checks passed.');
