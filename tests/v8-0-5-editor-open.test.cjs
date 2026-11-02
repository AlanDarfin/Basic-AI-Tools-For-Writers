'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('src/v8/inline-ai.js','utf8'),main=fs.readFileSync('main.js','utf8');
function harness(){
 let captured=null;
 const none={empty:true};
 const Decoration={none,set:ranges=>({ranges}),widget:({widget,side})=>({range:at=>({at,widget,side})})};
 const EditorView={decorations:{from:(field,mapper)=>{captured={field,mapper};return mapper;}}};
 const StateField={define:spec=>({spec})};
 const StateEffect={define:()=>({of:x=>x})};
 const plugin={
  settings:{visibleModules:{inlineAI:true},inlineAI:{enabled:false,auto:false}},
  registerEditorExtension:extensions=>{plugin.extensions=extensions;},
  addCommand:command=>{(plugin.commands??=[]).push(command);}
 };
 const mocks={
  require:mod=>{
   if(mod==='@codemirror/view')return {WidgetType:class {},keymap:{of:rules=>({rules})}};
   if(mod==='@codemirror/state')return {Prec:{highest:value=>value}};
   throw Error('Unexpected '+mod);
  },
  ViewPlugin:{fromClass:cls=>({cls})},EditorView,StateField,StateEffect,
  Decoration,writerUi:pt=>pt,writerModuleOn:()=>true,setTimeout,clearTimeout,console
 };
 const Ctor=vm.runInNewContext(source+'\nWriterV8InlineAI',mocks);
 const instance=new Ctor(plugin);instance.register();
 const field=plugin.extensions[0];
 const mapper=field.spec.provide(field);
 return {captured,mapper,field,plugin,instance,none};
}
test('opening a Markdown editor is safe when inline AI is disabled',()=>{
 const h=harness();
 assert.equal(h.plugin.settings.inlineAI.enabled,false);
 assert.doesNotThrow(()=>h.mapper(null));
 assert.equal(h.mapper(null),h.none);
});
test('field VALUE is mapped into decorations without calling state.field()',()=>{
 const h=harness();
 assert.equal(h.captured.field,h.field);
 const decorated=h.mapper({at:3,text:' continuar'});
 assert.equal(decorated.ranges.length,1);
 assert.equal(decorated.ranges[0].at,3);
 assert.equal(decorated.ranges[0].widget.value,' continuar');
 assert.equal(h.mapper({at:-1,text:'irrelevant'}),h.none);
});
test('bundled main.js contains the safe mapper',()=>{
 const start=main.indexOf('// v3 module: src/v8/inline-ai.js');
 const extracted=main.slice(start,main.indexOf('// END WRITER V3 MODULES',start));
 assert.match(source,/EditorView\.decorations\.from\(f,info=>/);
 assert.match(extracted,/EditorView\.decorations\.from\(f,info=>/);
 assert.doesNotMatch(extracted,/decorations\.from\(f,state=>/);
});
