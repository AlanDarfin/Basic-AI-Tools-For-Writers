'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const home=fs.readFileSync('src/v8/writing-home.js','utf8');
const frames=fs.readFileSync('src/v8/finish-blocks.js','utf8');
const spaces=fs.readFileSync('src/v9/smart-spaces.js','utf8');
const timeline=fs.readFileSync('src/v9/timeline-blocks.js','utf8');
const drag=fs.readFileSync('src/v10/block-dragger.js','utf8');
const css=fs.readFileSync('src/styles/v12-0-5-timeline-dragger.css','utf8');
const homeCss=fs.readFileSync('src/styles/v12-0-5-home-widgets.css','utf8');
const normalize=vm.runInNewContext(frames+'\nwriterV8HomeNormalizeFrames',{writerV8HomeValidURL:()=>null,writerV8HomeIconName:()=> 'globe',writerV9SafeHex:()=>''});
const dragAPI=vm.runInNewContext(drag+'\n({writerV106DragHasText,writerV106DragBlocks,writerV106DragBlockAt,writerV106DragMove})',{console,writerUi:pt=>pt});
const parse=vm.runInNewContext(timeline+'\nwriterV95TimelineParse',{console,writerUi:pt=>pt});
test('widget size settings clamp invalid entries and only allow named widgets',()=>{
 const result=normalize({webBookmarks:{columns:12,height:200,width:410},calendar:{columns:120,height:9999,width:-300},fake:{columns:9,height:200}},['webBookmarks','calendar']);
 assert.equal(result.webBookmarks.columns,12);
 assert.equal(result.webBookmarks.height,200);
 assert.equal(result.calendar.columns,12);
 assert.equal(result.calendar.height,1100);
 assert.equal(result.calendar.width,160);
 assert.equal('fake' in result,false);
});
test('widgets have edge and corner pointer/keyboard resize, grid and free modes',()=>{
 for(const keyword of ['installWidgetResizing(grid)','setWidgetAlignment(alignment)','resetWidgetFrame(key)',
  "['right','bottom','corner']","handle.addEventListener('pointerdown'",
  "handle.addEventListener('keydown'","grid.dataset.widgetAlignment",
  "homeWidgetFrames","homeWidgetAlignment","setPointerCapture"])assert.ok(home.includes(keyword),keyword);
 assert.match(homeCss,/\.writer-v1205-resize-right/);
 assert.match(homeCss,/\.writer-v1205-resize-bottom/);
 assert.match(homeCss,/\.writer-v1205-resize-corner/);
 assert.match(homeCss,/data-widget-alignment="free"/);
 assert.match(spaces,/homeWidgetFrames,homeWidgetAlignment,layoutSnapshot/);
 assert.match(frames,/writerV8HomeNormalizeFrames\(cfg\.homeWidgetFrames,allowed\)/);
});
test('timeline theme and line classes have distinct styles and avoid clipping in horizontal mode',()=>{
 const all=['classic','cards','minimal','compact','editorial','poster','glass','terminal'];
 for(const theme of all){
  const result=parse('layout: horizontal\ntheme: '+theme+'\n\n+ 2026-01-01\n+ A\n+ Event');
  assert.equal(result.config.theme,theme);
  assert.equal(result.config.layout,'horizontal');
  assert.equal(result.events.length,1);
  assert.match(css,new RegExp('\\.writer-v95-timeline\\.is-theme-'+theme.replace(/-/g,'\\-')));
 }
 assert.match(css,/overflow-x:auto;overflow-y:auto/);
 assert.match(css,/--writer-v95-marker-size/);
 assert.match(css,/inset-inline-start:calc\(var\(--writer-v95-marker-size\)\/2/);
 assert.match(css,/\.writer-v95-timeline\.is-layout-horizontal\.is-body-3/);
});
test('dragger handles only nonempty lines, captures grip on body, and preserves nearby pointer state',()=>{
 const lines=['first','','  ','- item','  - child','','final'];
 assert.equal(dragAPI.writerV106DragHasText(lines,0),true);
 assert.equal(dragAPI.writerV106DragHasText(lines,1),false);
 assert.equal(dragAPI.writerV106DragHasText(lines,2),false);
 assert.equal(dragAPI.writerV106DragHasText(lines,3),true);
 assert.equal(dragAPI.writerV106DragHasText(lines,99),false);
 assert.match(drag,/plugin\.registerDomEvent\(handle,'pointerdown',pointerdown,true\)/);
 assert.match(drag,/if\(nearHandle\(e\)\)return; \/\/ keep the source/);
 assert.match(drag,/if\(!line\.textContent\?\.trim\(\)\)/);
 assert.match(drag,/if\(!writerV106DragHasText\(lines,pos\.line\)\)return null/);
 assert.ok(dragAPI.writerV106DragBlocks(lines).length>=3);
 assert.ok(dragAPI.writerV106DragMove('first\n\nsecond',0,1,3));
});
