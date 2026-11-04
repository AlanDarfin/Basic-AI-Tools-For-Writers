'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const source=read('src/v9/pomodoro.js');
class TFile{constructor(path){this.path=path;this.extension='md';}}
const mod=vm.runInNewContext(source+
 '\n({writerV931PomodoroMerge,writerV931PomodoroClock,writerV931PomodoroRemaining,writerV931PomodoroDuration,WriterV931PomodoroController})',
 {TFile,Notice:class {},require:()=>({ItemView:class {}}),writerUi:pt=>pt,console,Date});
test('Pomodoro settings clamp durations, never auto-start on installation and maintain mode state',()=>{
 const settings={v931Pomodoro:{focusMinutes:300,shortMinutes:-3,longEvery:99,mode:'invalid'}};
 mod.writerV931PomodoroMerge(settings);
 const cfg=settings.v931Pomodoro;
 assert.equal(cfg.focusMinutes,180);assert.equal(cfg.shortMinutes,5);
 assert.equal(cfg.longEvery,12);assert.equal(cfg.mode,'focus');
 assert.equal(cfg.running,false);assert.equal(cfg.endsAt,0);
 assert.equal(mod.writerV931PomodoroClock(75),'01:15');
 assert.equal(mod.writerV931PomodoroDuration(cfg,'focus'),10800);
 assert.equal(cfg.statusBar,true);assert.equal(cfg.sidebar,true);
});
test('start, pause, reset, change phase and skip are persisted without counting a skipped focus',async()=>{
 const settings={};mod.writerV931PomodoroMerge(settings);let saves=0;
 const plugin={settings,saveSettings:async()=>{saves++;},app:{vault:{}}};
 const timer=new mod.WriterV931PomodoroController(plugin);const cfg=timer.cfg;
 cfg.notify=false;
 await timer.toggle();assert.equal(cfg.running,true);assert.ok(cfg.endsAt>Date.now());
 await timer.toggle();assert.equal(cfg.running,false);assert.ok(cfg.remaining>0);
 await timer.setMode('long');assert.equal(cfg.mode,'long');
 assert.equal(cfg.remaining,cfg.longMinutes*60);
 await timer.reset();assert.equal(cfg.remaining,cfg.longMinutes*60);
 await timer.setMode('focus');await timer.skip();
 assert.equal(cfg.completed,0);assert.equal(cfg.mode,'short');
 assert.ok(saves>=5);
});
test('expiry goes to a break, and only a completed focus increments the daily count',async()=>{
 const settings={};mod.writerV931PomodoroMerge(settings);
 const timer=new mod.WriterV931PomodoroController({settings,saveSettings:async()=>{},app:{vault:{}}});
 const cfg=timer.cfg;cfg.notify=false;cfg.autoAdvance=false;
 cfg.running=true;cfg.endsAt=Date.now()-1000;
 await timer.tick();
 assert.equal(cfg.mode,'short');assert.equal(cfg.completed,1);
 assert.equal(cfg.todayCompleted,1);assert.equal(cfg.running,false);
 cfg.running=true;cfg.endsAt=Date.now()-1000;
 await timer.tick();assert.equal(cfg.mode,'focus');assert.equal(cfg.completed,1);
});
test('daily log is opt-in, touches only an existing daily note, and never creates new files',async()=>{
 const settings={};mod.writerV931PomodoroMerge(settings);
 const cfg=settings.v931Pomodoro;cfg.logDaily=true;cfg.notify=false;cfg.dailyFolder='Daily';cfg.task='Write book chapter';
 let text='## Today',modified=0,created=0,lookups=[];
 const file=new TFile('Daily/'+[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-')+'.md');
 const vault={
  getAbstractFileByPath:path=>{lookups.push(path);return path===file.path?file:null;},
  process:async(_file,fn)=>{modified++;text=fn(text);},
  create:async()=>{created++;}
 };
 const timer=new mod.WriterV931PomodoroController({settings,saveSettings:async()=>{},app:{vault}});
 cfg.running=true;cfg.endsAt=Date.now()-1000;await timer.tick();
 assert.equal(modified,1);assert.equal(created,0);assert.match(text,/Write book chapter/);
 assert.ok(lookups.includes(file.path));
});
test('preview button uses neutral color and only clipped descriptions render three-dot indicator',()=>{
 const css=read('src/styles/v9-2-2-iconic-fixes.css');
 const source=read('src/v9/explorer-favorites-preview.js');
 assert.match(css,/writer-v921-preview-toggle\.is-active/);
 assert.match(css,/color:var\(--text-muted\)/);
 assert.match(css,/writer-v931-truncated::after/);
 assert.match(css,/content:"\.\.\."/);
 assert.match(css,/-webkit-line-clamp:3/);
 assert.match(source,/writer-v931-truncated/);
 assert.match(source,/copy\.getBoundingClientRect\(\)\.height/);
 assert.match(source,/previewLines:3/);
 assert.match(source,/touchstart/);
});
test('responsive Pomodoro UI uses an isolated sidebar and desktop-only status bar',()=>{
 assert.match(source,/registerView\(WRITER_V931_POMODORO_VIEW/);
 assert.match(source,/getRightLeaf\?\.\(true\)/);
 assert.match(source,/!plugin\.app\.isMobile&&!obs\.Platform\?\.isMobile/);
 assert.match(source,/registerInterval\(window\.setInterval/);
 assert.match(source,/writerV931PomodoroSettings/);
 assert.match(read('src/styles/v9-3-1-pomodoro.css'),/body\.is-mobile/);
 assert.doesNotMatch(source,/fetch\s*\(/);
});
