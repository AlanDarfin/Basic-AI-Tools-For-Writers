'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=file=>fs.readFileSync(file,'utf8');
const home=read('src/v8/writing-home.js');
const finish=read('src/v8/finish-blocks.js');
const css=read('src/styles/v9-2-6-dashboard.css');

test('dashboard is bundled from its actual module and packs short cards',()=>{
 const main=read('main.js');
 assert.ok(main.includes('installWidgetGrid(grid)'));
 assert.ok(main.includes('homeWidgetSizes'));
 assert.match(home,/writer-v8-home-grid writer-v925-grid/);
 assert.match(home,/installWidgetGrid\(grid\)/);
 assert.match(home,/ResizeObserver/);
 assert.match(css,/grid-auto-flow:row dense/);
 assert.match(css,/grid-auto-rows:8px/);
 assert.match(css,/data-widget-size="wide"/);
 assert.match(css,/body\.is-mobile/);
 assert.ok(read('scripts/build-css.js').includes('v9-2-6-dashboard.css'));
});

test('widget size preferences migrate and discard malformed values',()=>{
 const merge=vm.runInNewContext(finish+'\nwriterV8FinishMerge',{
  writerV8HomeTitleClean:v=>String(v??''),writerV8HomeIconName:()=> 'book-open'
 });
 const settings={v8Finish:{homeOrder:['calendar','stats'],homeWidgetSizes:{calendar:'wide',stats:'compact',bad:'wide',recent:'broken'},homeHidden:['stats']}};
 const cfg=merge(settings);
 assert.equal(cfg.homeWidgetSizes.calendar,'wide');
 assert.equal(cfg.homeWidgetSizes.stats,'compact');
 assert.equal(cfg.homeWidgetSizes.bad,undefined);
 assert.equal(cfg.homeWidgetSizes.recent,undefined);
 assert.ok(cfg.homeHidden.includes('stats'));
 assert.equal(JSON.stringify(merge(settings).homeWidgetSizes),JSON.stringify(cfg.homeWidgetSizes));
});

test('reordering and sizing persist without changing hidden widgets',()=>{
 const View=vm.runInNewContext(home+'\nWriterV8HomeView',{ItemView:class{},writerUi:(pt,en)=>en});
 const view=Object.create(View.prototype);
 view.plugin={settings:{v8Finish:{homeOrder:['calendar','stats','quick','soundscape'],homeHidden:['quick'],homeWidgetSizes:{}}}};
 let saves=0,renders=0;
 view.saveSoon=()=>saves++;
 view.render=()=>renders++;
 view.reorderWidget('soundscape','calendar',false);
 assert.deepEqual(Array.from(view.plugin.settings.v8Finish.homeOrder),['soundscape','calendar','stats','quick']);
 view.setWidgetSize('stats','wide');
 view.setWidgetSize('stats','oversized');
 assert.equal(view.plugin.settings.v8Finish.homeWidgetSizes.stats,'wide');
 assert.deepEqual(Array.from(view.plugin.settings.v8Finish.homeHidden),['quick']);
 assert.equal(saves,2);assert.equal(renders,2);
});

test('dashboard interactions are bilingual, with an alternative to dragging',()=>{
 assert.match(home,/writerUi\('Compacto','Compact'\)/);
 assert.match(home,/writerUi\('Largo','Wide'\)/);
 assert.match(home,/writerUi\('Remover widget','Remove widget'\)/);
 assert.match(home,/Mover para cima','Move earlier/);
 assert.match(home,/grip\.addEventListener\('click'/);
 const p=JSON.parse(read('package.json')),l=JSON.parse(read('package-lock.json')),m=JSON.parse(read('manifest.json'));
 assert.equal(m.version,p.version);
 assert.equal(m.version,l.version);
 assert.equal(m.version,l.packages[''].version);
});
