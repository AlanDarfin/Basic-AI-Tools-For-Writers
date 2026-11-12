'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function runtime(settings={}){
 const rows=[],saves=[];
 class Setting{
  constructor(){this.row={controls:[]};rows.push(this.row);}
  setName(value){this.row.name=value;return this;}
  setDesc(){return this;}
  addControl(type,register){
   const control={type,inputEl:{},setValue(value){this.value=value;return this;},
    setLimits(){return this;},setDynamicTooltip(){return this;},addOption(){return this;},
    setButtonText(){return this;},setCta(){return this;},
    onChange(callback){this.change=callback;return this;},onClick(callback){this.click=callback;return this;}};
   this.row.controls.push(control);register(control);return this;
  }
  addToggle(register){return this.addControl('toggle',register);}
  addSlider(register){return this.addControl('slider',register);}
  addText(register){return this.addControl('text',register);}
  addButton(register){return this.addControl('button',register);}
  addDropdown(register){return this.addControl('dropdown',register);}
 }
 const context={Setting,writerUi:(_pt,en)=>en,console,
  WriterV83CalendarView:class{async onOpen(){}},WRITER_V83_CAL_VIEW:'calendar',writerV8HomeIsMobile:()=>false};
 const files=['src/v12/unified-toolkit.js','src/v12/settings-hub-1201.js','src/v10/suite-education-1011.js',
  'src/v9/calendar-studio.js','src/v10/image-inserter.js'];
 const code=files.map(file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8')).join('\n');
 const api=vm.runInNewContext(code+'\n({writerV12Config,writerV12On,writerV1201SettingsWriting,writerV1201SettingsTasks,writerV1011StudyCfg,writerV1011StudySettings,writerV9CalendarMerge,writerV9CalendarSettings,writerV102ImagesMerge,writerV102ImagesSettings})',context);
 const plugin={settings,app:{workspace:{getLeavesOfType:()=>[]}},
  saveSettings:async()=>{saves.push(JSON.parse(JSON.stringify(settings)));}};
 const control=(name,type)=>{
  const row=rows.find(item=>item.name===name);
  assert.ok(row,'Missing setting '+name);
  const found=row.controls.find(item=>item.type===type);
  assert.ok(found,'Missing '+type+' control for '+name);
  return found;
 };
 return {api,plugin,rows,saves,control,panel:{createEl:()=>({})}};
}

test('formatting, capture and folder focus toggles save after all sibling controls render',async()=>{
 const h=runtime({v12Toolkit:{enabled:true,customLegacyValue:'preserve'}});
 h.api.writerV1201SettingsWriting(h.plugin,h.panel);
 for(const [label,key] of [['Formatting palette','palette'],['Local capture and brainstorm','localInbox'],['Explorer folder focus','folderFocus']]){
  await h.control(label,'toggle').change(false);
  assert.equal(h.plugin.settings.v12Toolkit[key],false,label);
  assert.equal(h.saves.at(-1).v12Toolkit[key],false,label+' saved');
  assert.equal(h.api.writerV12On(h.plugin,key),false,label+' runtime behavior');
 }
 assert.equal(h.plugin.settings.v12Toolkit.customLegacyValue,'preserve');
});

test('task controls persist through later configuration reads and keep unrelated choices',async()=>{
 const h=runtime({v12Toolkit:{maxTaskFiles:75,localInbox:false}});
 h.api.writerV1201SettingsTasks(h.plugin,h.panel);
 h.api.writerV12On(h.plugin,'taskNavigator');
 await h.control('Maximum notes to scan','slider').change(500);
 await h.control('Task navigator','toggle').change(false);
 assert.equal(h.plugin.settings.v12Toolkit.maxTaskFiles,500);
 assert.equal(h.plugin.settings.v12Toolkit.taskNavigator,false);
 assert.equal(h.plugin.settings.v12Toolkit.localInbox,false);
 assert.equal(h.saves.at(-1).v12Toolkit.maxTaskFiles,500);
});

test('study folder fields preserve every successive keystroke and later field changes',async()=>{
 const h=runtime({v1011Study:{root:'Notes',customLegacyValue:'preserve'}});
 h.api.writerV1011StudySettings(h.plugin,h.panel);
 const root=h.control('Root folder','text');
 for(const value of ['R','Re','Res','Research'])await root.change(value);
 await h.control('Class notes folder','text').change('Seminars');
 await h.control('Timetable note','text').change('Semester.md');
 await h.control('Enable academic center','toggle').change(false);
 const cfg=h.plugin.settings.v1011Study;
 assert.equal(cfg.root,'Research');
 assert.equal(cfg.classes,'Seminars');
 assert.equal(cfg.timetable,'Semester.md');
 assert.equal(cfg.enabled,false);
 assert.equal(cfg.customLegacyValue,'preserve');
 assert.equal(h.saves.at(-1).v1011Study.classes,'Seminars');
});

test('existing writable settings stay current while defaults and invalid values normalize',()=>{
 const toolkit={palette:false,maxTaskFiles:9000,syncProvider:'unknown',legacy:{keep:true}};
 const study={enabled:false,root:'../outside',daily:'Journal',maxRows:9000,legacy:{keep:true}};
 const h=runtime({v12Toolkit:toolkit,v1011Study:study});
 assert.equal(h.api.writerV12Config(h.plugin),toolkit);
 assert.equal(h.api.writerV1011StudyCfg(h.plugin.settings),study);
 assert.equal(toolkit.palette,false);assert.equal(toolkit.maxTaskFiles,1000);assert.equal(toolkit.syncProvider,'none');
 assert.equal(study.enabled,false);assert.equal(study.root,'Estudos');assert.equal(study.daily,'Journal');assert.equal(study.maxRows,300);
 assert.equal(toolkit.legacy.keep,true);assert.equal(study.legacy.keep,true);
 for(const value of [null,[],true,'invalid']){
  const invalid=runtime({v12Toolkit:value,v1011Study:value});
  assert.equal(invalid.api.writerV12Config(invalid.plugin).maxTaskFiles,250);
  assert.equal(invalid.api.writerV1011StudyCfg(invalid.plugin.settings).root,'Estudos');
  assert.equal(Array.isArray(invalid.plugin.settings.v12Toolkit),false);
  assert.equal(Array.isArray(invalid.plugin.settings.v1011Study),false);
 }
});

test('calendar hour changes keep later controls current and synchronize the displayed valid range',async()=>{
 const h=runtime();
 h.api.writerV9CalendarMerge(h.plugin.settings);
 h.api.writerV9CalendarSettings(h.plugin,h.panel);
 const start=h.control('Timeline start hour','slider'),end=h.control('Timeline end hour','slider');
 await start.change(9);
 await end.change(17);
 assert.equal(h.plugin.settings.v9Calendar.startHour,9);
 assert.equal(h.plugin.settings.v9Calendar.endHour,17);
 await start.change(20);
 assert.equal(h.plugin.settings.v9Calendar.startHour,20);
 assert.equal(h.plugin.settings.v9Calendar.endHour,21);
 assert.equal(end.value,21,'Visible end hour reflects normalization');
 await end.change(24);
 await h.control('Maximum month events per day','slider').change(5);
 await h.control('Compact month','toggle').change(false);
 assert.equal(h.plugin.settings.v9Calendar.endHour,24);
 assert.equal(h.plugin.settings.v9Calendar.maxMonthEvents,5);
 assert.equal(h.plugin.settings.v9Calendar.compactMonth,false);
 assert.equal(h.saves.at(-1).v9Calendar.startHour,20);
});

test('image folder typing keeps all characters and subsequent provider, width and key choices',async()=>{
 const h=runtime({v102Images:{credits:false,pexelsKey:'existing-key',legacy:'preserve'}});
 h.api.writerV102ImagesMerge(h.plugin.settings);
 h.api.writerV102ImagesSettings(h.plugin,h.panel);
 const folder=h.control('Downloaded images folder','text');
 for(const value of ['R','Re','Research','Research/Photos'])await folder.change(value);
 h.api.writerV102ImagesMerge(h.plugin.settings);
 await h.control('Default provider','dropdown').change('pexels');
 await h.control('Inserted width (0 = original)','slider').change(640);
 await h.control('Pixabay API key','text').change(' new-key ');
 const cfg=h.plugin.settings.v102Images;
 assert.equal(cfg.folder,'Research/Photos');
 assert.equal(cfg.provider,'pexels');assert.equal(cfg.width,640);
 assert.equal(cfg.pixabayKey,'new-key');assert.equal(cfg.pexelsKey,'existing-key');
 assert.equal(cfg.credits,false);assert.equal(cfg.legacy,'preserve');
 assert.equal(h.saves.at(-1).v102Images.folder,'Research/Photos');
});
