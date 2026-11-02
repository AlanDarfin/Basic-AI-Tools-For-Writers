'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const util=read('src/v8/home-utilities.js'),home=read('src/v8/writing-home.js'),finish=read('src/v8/finish-blocks.js'),css=read('src/styles/v8-finish-suite.css');
const obs={Platform:{isMobile:false}};
const api=vm.runInNewContext(util+'\n({writerV8HomeValidURL,writerV8HomeIconName,writerV8HomeCalendarCells,writerV8HomeOpenURL,writerV8HomeAttachedEmpty,writerV8HomeIsRootEmpty})',{
 URL,require:name=>name==='obsidian'?obs:null,writerUi:pt=>pt,console
});
test('homepage icon is a supported Lucide token, not arbitrary HTML',()=>{
 assert.equal(api.writerV8HomeIconName('moon-star'),'moon-star');
 assert.equal(api.writerV8HomeIconName('<img onerror=alert()>'),'book-open');
});
test('calendar starts on Monday and updates for leap years, month boundaries',()=>{
 const feb=api.writerV8HomeCalendarCells(2024,1);
 assert.equal(feb.filter(x=>x!==null).length,29);
 assert.equal(feb.indexOf(1),3); // Thu, February 1, 2024
 assert.equal(api.writerV8HomeCalendarCells(2026,10).filter(x=>x!==null).length,30);
 assert.equal(api.writerV8HomeCalendarCells(2026,12).length,0);
});
test('web URL parser accepts http(s) and rejects dangerous/nonweb schemes',()=>{
 assert.equal(api.writerV8HomeValidURL('obsidian.md'),'https://obsidian.md/');
 assert.equal(api.writerV8HomeValidURL('https://example.org/a?q=x'),'https://example.org/a?q=x');
 for(const text of ['javascript:alert(1)','data:text/html,bad','file:///tmp/test','obsidian://open','https://u:p@example.com/','https://example.org/ a','']){
  assert.equal(api.writerV8HomeValidURL(text),'',text);
 }
});
test('native desktop Web Viewer when enabled, mobile always goes to external browser',async()=>{
 const desktop={isMobile:false,internalPlugins:{getPluginById:()=>({enabled:true})},workspace:{
  getLeaf:()=>({setViewState:async state=>{desktop.result=state;},getViewState:()=>({type:'webviewer'})})}};
 assert.equal(await api.writerV8HomeOpenURL({app:desktop},'https://example.org'),'webviewer');
 assert.equal(desktop.result.type,'webviewer');
 assert.equal(desktop.result.state.url,'https://example.org/');
 const calls=[];
 const mobile={isMobile:true,internalPlugins:{getPluginById:()=>({enabled:true})},workspace:{containerEl:{ownerDocument:{defaultView:{
  open:(url,target)=>calls.push({url,target})
 }}}}};
 assert.equal(await api.writerV8HomeOpenURL({app:mobile},'https://example.org'),'external');
 assert.deepEqual(calls,[{url:'https://example.org/',target:'_system'}]);
});
test('only attached ROOT empty tabs are eligible for automatic homepage',()=>{
 const empty={view:{getViewType:()=> 'empty'},getViewState:()=>({type:'empty'})};
 const note={view:{getViewType:()=> 'markdown'},getViewState:()=>({type:'markdown'})};
 const web={view:{getViewType:()=> 'webviewer'},getViewState:()=>({type:'webviewer'})};
 const side={view:{getViewType:()=> 'empty'},getViewState:()=>({type:'empty'})};
 const root={iterateRootLeaves:fn=>[empty,note,web].forEach(fn)};
 assert.equal(api.writerV8HomeAttachedEmpty(root).length,1);
 assert.equal(api.writerV8HomeAttachedEmpty(root)[0],empty);
 assert.equal(api.writerV8HomeIsRootEmpty(note),false);
 assert.equal(api.writerV8HomeIsRootEmpty(web),false);
 assert.ok(!api.writerV8HomeAttachedEmpty(root).includes(side));
 assert.match(home,/workspace\.on\('layout-change',schedule\)/);
 assert.match(home,/workspace\.on\('active-leaf-change',leaf=>/);
 assert.match(home,/__writerV8HomeConverting/);
});
test('search is rendered first next to clock, regardless of card order',()=>{
 const top=home.indexOf('this.renderSearch(top)');
 const clock=home.indexOf('writerV8HomeRenderCalendar(this,schedule)');
 const grid=home.indexOf("const grid=this.contentEl.createDiv({cls:'writer-v8-home-grid'})");
 assert.ok(top>=0&&clock>top&&grid>clock);
 assert.match(home,/if\(key!=='search'\)/);
 assert.match(home,/writerV8HomeValidURL\(input\.value\)/);
 assert.match(css,/\.writer-v8-home-top\{/);
 assert.match(css,/\.writer-v8-home-calendar-days/);
});
test('home customization and defaults survive settings migration',()=>{
 const fn=vm.runInNewContext(finish+'\n({writerV8FinishMerge})',{writerV8HomeIconName:api.writerV8HomeIconName});
 const settings={};fn.writerV8FinishMerge(settings);
 assert.equal(settings.v8Finish.homeOnNewTab,true);
 assert.equal(settings.v8Finish.homeAtStartup,false);
 assert.equal(settings.v8Finish.homeIcon,'book-open');
 assert.ok(!settings.v8Finish.homeOrder.includes('search'));
 const prior={v8Finish:{homeOnNewTab:false,homeTitle:'Author workspace',homeIcon:'invalid',homeOrder:['quick','search','recent']}};
 fn.writerV8FinishMerge(prior);
 assert.equal(prior.v8Finish.homeOnNewTab,false);
 assert.equal(prior.v8Finish.homeIcon,'book-open');
 assert.equal(prior.v8Finish.homeTitle,'Author workspace');
 assert.equal(prior.v8Finish.homeOrder[0],'quick');
 assert.ok(!prior.v8Finish.homeOrder.includes('search'));
});
test('new code never adds global editor extensions or rebuilds open notes',()=>{
 for(const text of [home,util])assert.doesNotMatch(text,/registerEditorExtension\(/);
 assert.doesNotMatch(home,/detachLeavesOfType\(|closeAllTabs\(/);
 assert.match(home,/getViewState\(\)\?\.type|writerV8HomeAttachedEmpty/);
 assert.match(util,/type:'webviewer'/);
});
test('documentation and bundles include all new homepage functions',()=>{
 const source=read('main.js'),styles=read('styles.css');
 for(const piece of ['writerV8HomeCalendarCells','writerV8HomeOpenURL','homeOnNewTab'])assert.ok(source.includes(piece),piece);
 assert.match(styles,/writer-v8-home-clock-digits/);
 for(const path of ['README.md','docs/README.pt-BR.md']){
  const md=read(path);
  for(const piece of ['8.3.0','Web Viewer','calend','homeOnNewTab'])assert.ok(md.toLowerCase().includes(piece.toLowerCase()),path+': '+piece);
 }
});
