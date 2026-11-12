#!/usr/bin/env node
'use strict';
/* Build a label-only search index. Source files are tokenized, never evaluated.
 * Routes deliberately name settings renderers, excluding editors and modals. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'src/v13/settings-search-index.js');
const routes=[
 ['general','v13/core-workflows','writerV13RenderStart'],
 ['general','v12/settings-hub-1201','writerV1201SettingsOverview'],
 ['modules','v4/modules','writerRenderModuleSettings'],
 ['workspaceProfiles','v5/workspace-ux','renderSettings'],
 ['diagnostics','v4/modules','writerRenderDiagnostics'],
 ['diagnostics','v5/workspace-ux','writerWorkspaceRenderHotkeys'],
 ['homepage','v8/writing-home','writerV8FinishSettings'],
 ['soundscapes','v9/soundscapes','writerV91SoundSettings'],
 ['v9Toolbar','v9/context-toolbar','writerV9ToolbarSettings'],
 ['v9Explorer','v9/native-explorer','writerV9ExplorerSettings'],
 ['v9Explorer','v9/explorer-flex','writerV91FlexSettings'],
 ['v9Explorer','v9/explorer-favorites-preview','writerV92ExplorerSettings'],
 ['v9Pretty','v9/pretty-properties','writerV9215PrettySettings'],
 ['v9Spaces','v9/smart-spaces','writerV9SpacesSettings'],
 ['v9Spaces','v10/space-history','writerV101SpaceHistorySettings'],
 ['v9Calendar','v9/calendar-studio','writerV9CalendarSettings'],
 ['v9Calendar','v10/calendar-exchange','writerV101CalendarExchangeSettings'],
 ['v9Calendar','v10/calendar-feeds','writerV107CalendarSettings'],
 ['v9Flow','v9/flow-slash','writerV9215FlowSettings'],
 ['v9Pomodoro','v9/pomodoro','writerV931PomodoroSettings'],
 ['v9Lock','v9/password-lock','writerV9LockSettings'],
 ['privacy','v12/settings-hub-1201','writerV1201SettingsPrivacy'],
 ['privacy','v12/secure-notes','writerV12SecureSettings'],
 ['v10Tools','v10/toolbox','writerV10ToolboxSettings'],
 ['v10Tools','v10/toolbox','writerV1044DoubleKeySettings'],
 ['v10Tools','v10/enhancements','writerV101EnhancementsSettings'],
 ['v10Tools','v10/sidebar-width-1010','writerV1010Settings'],
 ['v10Bookshelf','v10/bookshelf','writerV10BookshelfSettings'],
 ['keyshots','v5/keyshots','renderSettings'],
 ['typing','v5/easy-typing','renderSettings'],
 ['typing','v5/easy-advanced','renderSettings'],
 ['typing','v5/smart-typography','renderSettings'],
 ['cursor','v4/cursor-memory','renderSettings'],
 ['clickClack','v9/click-clack','writerV91ClickSettings'],
 ['typewriter','v4/integrations','writerV137TypewriterSettings'],
 ['writingProfiles','v4/editor','writerV4RenderSettings'],
 ['integrationsV4','v4/integrations','renderSettings'],
 ['integrationsV4','v12/settings-hub-1201','writerV1201SettingsConnections'],
 ['extendedSyntax','v5/extended-syntax','renderSettings'],
 ['extendedSyntax','v10/inline-alignment','writerV102AlignSettings'],
 ['pandocSyntax','v5/pandoc-syntax','renderSettings'],
 ['pandocSyntax','v5/pandoc-export','renderSettings'],
 ['v6Markdown','v6/markup','renderSettings'],
 ['v6Linter','v6/linter','renderSettings'],
 ['smartInsert','v6/smart-insert','renderSettings'],
 ['bookNavigation','v6/longform-navigation','renderSettings'],
 ['virtualContent','v9/virtual-content','writerV912VirtualSettings'],
 ['writingWidgets','v9/interactive-widgets','writerV92BlockSettings'],
 ['research','v9/research-style','writerV92ResearchSettings'],
 ['research','v10/zotero-web','writerV107ZoteroSettings'],
 ['sessionDrafts','v9/session-drafts','writerV92SessionSettings'],
 ['v6Reading','v6/reading','renderSettings'],
 ['v7Worldbuilding','v7/worldbuilding','renderSettings'],
 ['projects','v11/longform-studio','writerV11StudioSettings'],
 ['images','v10/image-inserter','writerV102ImagesSettings'],
 ['images','v12/settings-hub-1201','writerV1201SettingsImages'],
 ['images','v12/image-annotations','writerV12AnnotationSettings'],
 ['quickActions','v12/settings-hub-1201','writerV1201SettingsWriting'],
 ['tasks','v12/settings-hub-1201','writerV1201SettingsTasks'],
 ['databases','v10/data-tables','writerV107DbSettings'],
 ['databases','v10/suite-notion-1011','writerV1011NotionSettings'],
 ['databases','v11/database-builder','writerV111DbBuilderSettings'],
 ['numbering','v10/suite-numbering-1011','writerV1011NumberSettings'],
 ['numbering','v11/numbering-extensions','writerV111NumberSettings'],
 ['study','v8/writing-study','writerV83StudySettings'],
 ['study','v10/suite-education-1011','writerV1011StudySettings'],
 ['study','v10/study-fsrs','writerV107StudySettings'],
 ['graph','v10/story-graph','writerV107GraphSettings'],
 ['editorAdvanced','v10/editor-pro','writerV107EditorSettings'],
 ['media','v10/media-drag-extension','writerV107MediaSettings'],
 ['speech','v12/selection-reader','writerV12ReaderSettings'],
 ['speech','v10/speech-accessibility','writerV107SpeechSettings'],
 ['compatibility','v10/integrations-107','writerV107Settings'],
 ['assistant','v8/inline-ai','renderSettings']
];
function tokenize(source){
 const tokens=[];let index=0,previous='',at=0;
 const push=(value,type='punct')=>{tokens.push({value,type,at});previous=value;};
 const quoted=quote=>{
  let value='';index++;
  while(index<source.length){
   const char=source[index++];if(char===quote)return value;
   if(char!=='\\'){value+=char;continue;}
   const next=source[index++];
   if(next==='\n')continue;
   if(next==='\r'){if(source[index]==='\n')index++;continue;}
   const escapes={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v','0':'\0'};
   if(next==='x'&&/^[a-f\d]{2}$/i.test(source.slice(index,index+2))){value+=String.fromCharCode(parseInt(source.slice(index,index+2),16));index+=2;}
   else if(next==='u'&&/^[a-f\d]{4}$/i.test(source.slice(index,index+4))){value+=String.fromCharCode(parseInt(source.slice(index,index+4),16));index+=4;}
   else value+=escapes[next]??next;
  }
  throw Error('Unterminated source string');
 };
 while(index<source.length){
  at=index;
  const char=source[index],next=source[index+1];
  if(/\s/.test(char)){index++;continue;}
  if(char==='/'&&next==='/'){index=source.indexOf('\n',index+2);if(index<0)break;continue;}
  if(char==='/'&&next==='*'){const end=source.indexOf('*/',index+2);if(end<0)throw Error('Unterminated source comment');index=end+2;continue;}
  if(char==='"'||char==="'"){push(quoted(char),'string');continue;}
  if(char==='`'){
   // Templates are dynamic presentation, never labels for this static index.
   quoted('`');push('<template>','dynamic');continue;
  }
  if(char==='/'&&(!previous||['=','(','[','{',',',':',';','!','?','&&','||','??','=>','return','case','throw'].includes(previous))){
   index++;let bracket=false;
   while(index<source.length){const value=source[index++];if(value==='\\'){index++;continue;}if(value==='[')bracket=true;if(value===']')bracket=false;if(value==='/'&&!bracket)break;}
   while(/[a-z]/i.test(source[index]||'')&&index<source.length)index++;
   push('<regex>','dynamic');continue;
  }
  const identifier=/^[A-Za-z_$][\w$]*/.exec(source.slice(index));
  if(identifier){push(identifier[0],'identifier');index+=identifier[0].length;continue;}
  const number=/^\d+(?:\.\d+)?/.exec(source.slice(index));
  if(number){push(number[0],'number');index+=number[0].length;continue;}
  const operator=['===','!==','=>','==','!=','&&','||','??','?.','++','--','+=','-=','>=','<=','...'].find(value=>source.startsWith(value,index));
  if(operator){push(operator);index+=operator.length;continue;}
  push(char);index++;
 }
 const pairs=new Map(),stack=[];
 for(let i=0;i<tokens.length;i++){
  if(tokens[i].type!=='punct')continue;
  const value=tokens[i].value;
  if(['(','[','{'].includes(value))stack.push(i);
  if([')',']','}'].includes(value)){
   const start=stack.pop();
   if(start==null||'([{'.indexOf(tokens[start].value)!==')]}'.indexOf(value))throw Error('Unbalanced source near '+source.slice(Math.max(0,tokens[i].at-90),tokens[i].at+90));
   pairs.set(start,i);pairs.set(i,start);
  }
 }
 if(stack.length)throw Error('Unbalanced source at end');
 return {tokens,pairs};
}
function split(model,start,end){
 const result=[];let from=start;
 for(let i=start;i<end;i++){
  if(model.tokens[i].type==='punct'&&['(','[','{'].includes(model.tokens[i].value)){i=model.pairs.get(i);continue;}
  if(model.tokens[i].type==='punct'&&model.tokens[i].value===','){result.push([from,i]);from=i+1;}
 }
 if(from<end)result.push([from,end]);return result;
}
function scope(model,name){
 const {tokens,pairs}=model;
 for(let i=0;i<tokens.length;i++)if(tokens[i].value===name&&tokens[i+1]?.value==='('){
  const end=pairs.get(i+1);
  if(tokens[end+1]?.value==='{')return [end+2,pairs.get(end+1)];
 }
 throw Error('Missing settings renderer '+name);
}
function arrayRows(model,range){
 if(!range)return [];
 let [start,end]=range;
 if(model.tokens[start]?.value!=='['||model.pairs.get(start)!==end-1)return [];
 return split(model,start+1,end-1).filter(([a,b])=>model.tokens[a]?.value==='['&&model.pairs.get(a)===b-1)
  .map(([a,b])=>split(model,a+1,b-1));
}
const translated={dictionary:['Arquivo do dicionário','Dictionary file'],provider:['Provedor de IA','AI provider'],transProvider:['Provedor de tradução','Translation provider'],source:['Idioma de origem','Source language'],target:['Idioma de destino','Target language']};
function evaluate(model,range,env={},labels={},depth=0){
 if(!range||depth>12)return null;
 let [start,end]=range;const {tokens,pairs}=model;
 while(tokens[start]?.value==='('&&pairs.get(start)===end-1){start++;end--;}
 if(end-start===1){
  const token=tokens[start];
  if(token.type==='string')return token.value;
  if(env[token.value])return Object.hasOwn(env[token.value],'literal')?env[token.value].literal:
   evaluate(model,env[token.value],{},labels,depth+1);
  return null;
 }
 const name=tokens[start]?.value;
 if(tokens[start+1]?.value!=='('||pairs.get(start+1)!==end-1)return null;
 const args=split(model,start+2,end-1);
 if(['writerUi','msg','label'].includes(name)&&args.length>=2){
  const pt=evaluate(model,args[0],env,labels,depth+1),en=evaluate(model,args[1],env,labels,depth+1);
  if(typeof pt==='string'&&typeof en==='string')return {pt,en};
 }
 if(name==='translateLabel'||name==='t'){
  const value=evaluate(model,args[0],env,labels,depth+1);
  if(typeof value==='string')return name==='t'&&translated[value]?{pt:translated[value][0],en:translated[value][1]}:{pt:labels[value]||value,en:value};
 }
 return null;
}
function variants(model,range,env={},labels={},depth=0){
 if(!range||depth>10)return [];
 const value=evaluate(model,range,env,labels);if(value!=null)return [value];
 let [start,end]=range;const {tokens,pairs}=model;
 while(tokens[start]?.value==='('&&pairs.get(start)===end-1){start++;end--;}
 if(end-start===1&&env[tokens[start].value]&&!Object.hasOwn(env[tokens[start].value],'literal'))
  return variants(model,env[tokens[start].value],{},labels,depth+1);
 for(let i=start;i<end;i++){
  if(tokens[i].type==='punct'&&['(','[','{'].includes(tokens[i].value)){i=pairs.get(i);continue;}
  if(tokens[i].value!=='?')continue;
  let nested=0;
  for(let j=i+1;j<end;j++){
   if(tokens[j].type==='punct'&&['(','[','{'].includes(tokens[j].value)){j=pairs.get(j);continue;}
   if(tokens[j].value==='?')nested++;
   if(tokens[j].value===':'&&nested--===0)return [...variants(model,[i+1,j],env,labels,depth+1),...variants(model,[j+1,end],env,labels,depth+1)];
  }
 }
 if(['writerUi','msg','label'].includes(tokens[start]?.value)&&tokens[start+1]?.value==='('&&pairs.get(start+1)===end-1){
  const args=split(model,start+2,end-1),pt=variants(model,args[0],env,labels,depth+1),en=variants(model,args[1],env,labels,depth+1),out=[];
  for(let i=0;i<Math.max(pt.length,en.length);i++){
   const first=pt[Math.min(i,pt.length-1)],second=en[Math.min(i,en.length-1)];
   if(typeof first==='string'&&typeof second==='string')out.push({pt:first,en:second});
  }
  return out;
 }
 return [];
}
function pair(value,labels){return typeof value==='string'?{pt:labels[value]||value,en:value}:value;}
function statementEnd(model,start,limit=model.tokens.length){
 for(let i=start;i<limit;i++){
  if(model.tokens[i].type==='punct'&&['(','[','{'].includes(model.tokens[i].value)){i=model.pairs.get(i);continue;}
  if(model.tokens[i].type==='punct'&&model.tokens[i].value===';')return i;
 }
 return limit;
}
function extract(model,range){
 const {tokens,pairs}=model,[start,end]=range,labels={},arrays=new Map(),loops=[],helpers=[];
 for(let i=0;i<tokens.length;i++){
  if(tokens[i].type==='string'&&tokens[i+1]?.value===':'&&tokens[i+2]?.type==='string')labels[tokens[i].value]=tokens[i+2].value;
  if(tokens[i].value==='const'&&tokens[i+1]?.type==='identifier'&&tokens[i+2]?.value==='='&&tokens[i+3]?.value==='[')
   arrays.set(tokens[i+1].value,[i+3,pairs.get(i+3)+1]);
 }
 for(let i=start;i<end;i++)if(tokens[i].value==='for'&&tokens[i+1]?.value==='('){
  const headerEnd=pairs.get(i+1),header=tokens.slice(i+2,headerEnd),of=header.findIndex(token=>token.value==='of');
  if(of<0)continue;
  const variableStart=i+2+header.findIndex(token=>token.value==='['),variableEnd=pairs.get(variableStart);
  if(!variableEnd||variableEnd>i+2+of)continue;
  const variables=split(model,variableStart+1,variableEnd).map(([a])=>tokens[a].value);
  const valueStart=i+3+of;
  const rows=arrayRows(model,tokens[valueStart]?.value==='['?[valueStart,pairs.get(valueStart)+1]:arrays.get(tokens[valueStart]?.value));
  if(!rows.length)continue;
  const bodyStart=headerEnd+1,bodyEnd=tokens[bodyStart]?.value==='{'?pairs.get(bodyStart):statementEnd(model,bodyStart,end);
  loops.push({start:bodyStart,end:bodyEnd,variables,rows});
 }
 const environments=index=>{
  let values=[{}];
  for(const loop of loops.filter(item=>index>item.start&&index<item.end)){
   const next=[];
   for(const base of values)for(const row of loop.rows){
    const env={...base};loop.variables.forEach((name,i)=>{if(row[i])env[name]=row[i];});next.push(env);
   }
   values=next.slice(0,500);
  }
  return values;
 };
 // Local arrow helpers and named helpers (e.g. writerV1201SettingToggle)
 // preserve their label argument without ever running their implementation.
 for(let i=0;i<tokens.length;i++){
  let name,params,bodyStart,bodyEnd;
  if(tokens[i].value==='function'&&tokens[i+1]?.type==='identifier'&&tokens[i+2]?.value==='('){
   name=tokens[i+1].value;const close=pairs.get(i+2);params=split(model,i+3,close).map(([a])=>tokens[a].value);bodyStart=close+1;bodyEnd=pairs.get(bodyStart);
  }else if(tokens[i].value==='const'&&tokens[i+1]?.type==='identifier'&&tokens[i+2]?.value==='='&&tokens[i+3]?.value==='('){
   const close=pairs.get(i+3);if(tokens[close+1]?.value!=='=>')continue;
   name=tokens[i+1].value;params=split(model,i+4,close).map(([a])=>tokens[a].value);bodyStart=close+2;
   bodyEnd=tokens[bodyStart]?.value==='{'?pairs.get(bodyStart):statementEnd(model,bodyStart);
  }
  if(!name||!bodyEnd)continue;
  const setters=[];
  for(let j=bodyStart;j<bodyEnd;j++)if(tokens[j].value==='setName'&&tokens[j+1]?.value==='(')setters.push([j+2,pairs.get(j+1)]);
  if(setters.length)helpers.push({name,params,start:bodyStart,end:bodyEnd,setters});
 }
 const result=[];
 const add=(label,description)=>{
  const title=pair(label,labels),desc=pair(description,labels);
  if(!title||!title.pt?.trim()||!title.en?.trim())return;
  result.push({titlePt:title.pt.trim(),titleEn:title.en.trim(),...(desc?{descriptionPt:desc.pt.trim(),descriptionEn:desc.en.trim()}:{} )});
 };
 for(let i=start;i<end;i++){
  if(tokens[i].value==='setName'&&tokens[i+1]?.value==='('){
   const close=pairs.get(i+1),desc=tokens[close+1]?.value==='.'&&tokens[close+2]?.value==='setDesc'&&tokens[close+3]?.value==='('? [close+4,pairs.get(close+3)]:null;
   for(const env of environments(i))for(const value of variants(model,[i+2,close],env,labels))add(value,evaluate(model,desc,env,labels));
  }
  if(tokens[i].type!=='identifier'||tokens[i+1]?.value!=='(')continue;
  const helper=helpers.find(item=>item.name===tokens[i].value&&!(i>=item.start&&i<item.end));
  if(helper){
   const args=split(model,i+2,pairs.get(i+1));
   for(const outer of environments(i)){
    const env={...outer};helper.params.forEach((name,index)=>{if(args[index]){
     const value=evaluate(model,args[index],outer,labels);env[name]=value==null?args[index]:{literal:value};
    }});
    for(const setter of helper.setters)for(const value of variants(model,setter,env,labels))add(value);
   }
  }
  if(['compactField','colorField','styledSelect'].includes(tokens[i].value)){
   const args=split(model,i+2,pairs.get(i+1));
   for(const env of environments(i))add(evaluate(model,args[tokens[i].value==='styledSelect'?1:0],env,labels));
  }
 }
 // Some compact settings use native controls rather than Obsidian Setting rows.
 // Include their explicit accessible labels and button text, excluding <option>.
 for(let i=start;i<end;i++)if((tokens[i].value==='aria-label'||tokens[i].value==='text')&&tokens[i+1]?.value===':'){
  let call=-1;
  for(let j=i-1;j>=start;j--)if(tokens[j].value==='('&&pairs.get(j)>i){call=j;break;}
  if(call<0||tokens[call-1]?.value!=='createEl')continue;
  const tag=tokens[call+1]?.value;
  if(!['input','select','textarea','button'].includes(tag)||(tokens[i].value==='text'&&tag!=='button'))continue;
  let valueEnd=i+2;
  while(valueEnd<end){
   if(tokens[valueEnd].type==='punct'&&['(','[','{'].includes(tokens[valueEnd].value)){valueEnd=pairs.get(valueEnd)+1;continue;}
   if(tokens[valueEnd].type==='punct'&&[',','}'].includes(tokens[valueEnd].value))break;
   valueEnd++;
  }
  for(const env of environments(i))for(const value of variants(model,[i+2,valueEnd],env,labels))add(value);
 }
 return result;
}
function branch(model,id,variable='id'){
 const {tokens,pairs}=model;
 for(let i=0;i<tokens.length;i++)if(tokens[i].value===variable&&tokens[i+1]?.value==='==='&&tokens[i+2]?.type==='string'&&tokens[i+2].value===id){
  let end=i+3;while(end<tokens.length&&tokens[end].value!==')')end++;
  if(tokens[end+1]?.value==='{')return [end+2,pairs.get(end+1)];
  return [end+1,statementEnd(model,end+1)];
 }
 return null;
}
function build(){
 const cache=new Map(),entries=[],seen=new Set();
 const load=name=>{
  if(!cache.has(name)){
   const file=path.join(root,'src',name+'.js');
   try{cache.set(name,tokenize(fs.readFileSync(file,'utf8')));}catch(error){throw Error(name+': '+error.message);}
  }
  return cache.get(name);
 };
 const add=(id,item)=>{
  const key=id+'\0'+item.titlePt+'\0'+item.titleEn;
  if(seen.has(key))return;seen.add(key);entries.push({id,...item});
 };
 for(const [id,file,name] of routes){
  const model=load(file);
  for(const item of extract(model,scope(model,name)))add(id,item);
 }
 // Shared renderers choose their controls through stable section IDs.
 for(const id of ['complements','variants','snapshots']){
  const model=load('v3/workspace'),range=branch(model,id);
  if(range)for(const item of extract(model,range))add(id,item);
 }
 for(const id of ['abbreviations','anotherName','viewMode','templates','unicode','toc','tts']){
  const model=load('v3/final-suite'),range=branch(model,id,'section');
  add(id,{titlePt:'Ativado',titleEn:'Enabled'});
  if(range)for(const item of extract(model,range))add(id,item);
 }
 const source=fs.readFileSync(path.join(root,'main.js'),'utf8');
 const settingStart=source.indexOf('class DictionarySettings extends'),settingEnd=source.indexOf('module.exports=class AlansOfflineDictionary',settingStart);
 if(settingStart<0||settingEnd<0)throw Error('Missing native settings source');
 const main=tokenize(source.slice(settingStart,settingEnd));
 for(const id of ['general','projectTasks','dictionary','translation','assistant','review','reviewAI','projects','prompts','typewriter']){
  const range=branch(main,id);
  if(range)for(const item of extract(main,range))add(id,item);
 }
 const connectionSource=source.slice(source.indexOf('function writerV131RenderAISettings('),settingStart);
 const connections=tokenize(connectionSource);
 for(const item of extract(connections,scope(connections,'writerV131RenderAISettings')))add('providers',item);
 const credentialBranch=branch(connections,'providers','mode');
 const modelSource=credentialBranch?connectionSource.slice(0,connections.tokens[credentialBranch[0]].at)+
  connectionSource.slice(connections.tokens[credentialBranch[1]].at):connectionSource;
 const models=tokenize(modelSource);
 for(const item of extract(models,scope(models,'writerV131RenderAISettings')))add('models',item);
 const grammar=path.join(root,'src/v13/grammar-settings.js');
 if(fs.existsSync(grammar)){
  const model=load('v13/grammar-settings');
  for(const item of extract(model,scope(model,'writerV137GrammarSettings')))add('review',item);
 }
 entries.sort((a,b)=>a.id.localeCompare(b.id,'en')||a.titleEn.localeCompare(b.titleEn,'en')||a.titlePt.localeCompare(b.titlePt,'pt'));
 return "'use strict';\n// Generated by scripts/settings-search-index.js. Labels only: no saved values or executable source.\nconst WRITER_SETTINGS_SEARCH_INDEX="+JSON.stringify(entries,null,1)+';\n';
}
if(require.main===module){
 const expected=build();
 if(process.argv.includes('--check')){
  if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==expected){console.error('Settings search index is outdated. Run node scripts/settings-search-index.js');process.exitCode=1;}
  else console.log('Settings search index matches its renderer sources.');
 }else{fs.writeFileSync(output,expected);console.log('Built settings search index.');}
}
module.exports={build,tokenize,extract,scope,branch};
