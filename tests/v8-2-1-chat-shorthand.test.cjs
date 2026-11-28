'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const source=read('src/blocks/finish-blocks.js');
const api=vm.runInNewContext(source+'\n({writerV8ChatParse,writerV8ChatSplitFields,writerV8ChatRender})',{console});
const {writerV8ChatParse:parse,writerV8ChatSplitFields:split}=api;
test('explicit avatar, no avatar, and no prefix variants',()=>{
 const data=parse(['title: Conversa','< foto.png | Maria | Olá, João! | 10:01','> | João | Já vou! | 10:02','< Maria | Chegou? | 10:03'].join('\n'));
 assert.equal(data.title,'Conversa');assert.equal(data.messages.length,3);
 assert.equal(data.messages[0].avatar,'foto.png');assert.equal(data.messages[0].name,'Maria');
 assert.equal(data.messages[0].body,'Olá, João!');assert.equal(data.messages[0].time,'10:01');
 assert.equal(data.messages[1].avatar,'');assert.equal(data.messages[1].name,'João');assert.equal(data.messages[1].side,'right');
 assert.equal(data.messages[2].name,'Maria');
});
test('speaker colors and avatars, default sides, and one-off avatar overrides',()=>{
 const data=parse(['[Maria=blue, João=red]','[Maria=[[Imagens/maria.webp]], João=Fotos/joao.png]','[Left=Maria, right=João]',
 '< | A carta chegou! | 11:22','> | Estou a caminho. | 11:23','< | Outra mensagem | 11:24',
 '> [[Custom/avatar.png]] | João | Aqui está! | 11:25'].join('\n'));
 const m=data.messages;assert.equal(m.length,4);
 assert.equal(m[0].name,'Maria');assert.equal(m[0].color,'blue');assert.equal(m[0].avatar,'[[Imagens/maria.webp]]');
 assert.equal(m[1].name,'João');assert.equal(m[1].color,'red');assert.equal(m[1].avatar,'Fotos/joao.png');
 assert.equal(m[2].name,'Maria');assert.equal(m[3].avatar,'[[Custom/avatar.png]]');
});
test('Markdown embeds, links, escaped delimiters and inline code keep pipes',()=>{
 const body='Veja ![[Imagens/arquivo.png|240]] e [link](https://example.test/a|b) e \x60a|b\x60 e x\\|y.';
 const data=parse('[Left=Maria]\n< | '+body+' | 15:01');
 assert.equal(data.messages.length,1);assert.equal(data.messages[0].body,body);assert.equal(data.messages[0].time,'15:01');
 const parts=split(' | Olha ![[Imagem.png|200]] | 12:00');
 assert.equal(parts.length,3);assert.equal(parts[1],'Olha ![[Imagem.png|200]]');
});
test('avatar-only metadata and inline spoilers keep the intended message fields',()=>{
 const data=parse([
  '[Ana=balão: grey]',
  '< [[Pessoas/ana.png|Ana]] | Ana | Este ||segredo | com barra|| chegou.',
  '> Leo | ||Mensagem oculta|| | 10:02',
  '<||Voltei.'
 ].join('\n'));
 const [first,second,third]=data.messages;
 assert.equal(first.name,'Ana');
 assert.equal(first.avatar,'[[Pessoas/ana.png|Ana]]');
 assert.equal(first.bubbleColor,'gray');
 assert.equal(first.body,'Este ||segredo | com barra|| chegou.');
 assert.equal(first.time,'');
 assert.equal(second.body,'||Mensagem oculta||');
 assert.equal(second.time,'10:02');
 assert.equal(third.name,'Ana');
 assert.equal(third.body,'Voltei.');
});
test('Multiline Markdown images, lists and extended Basic AI notation survive',()=>{
 const text=['[Left=Maria, right=João]','< | **Atenção** ++sublinhado++ e =={blue}cor== | 20:30',
 '![Legenda](Fotos/porto.png)','![[Imagens/mapa.png|left|200]]','- Uma lista','- Outra lista',
 '','||spoiler|| com [[Nota vinculada]]','> | Resposta com *itálico* | 20:31'].join('\n');
 const data=parse(text);
 assert.equal(data.messages.length,2);
 for(const fragment of ['++sublinhado++','=={blue}cor==','![[Imagens/mapa.png|left|200]]','||spoiler||','[[Nota vinculada]]'])
  assert.ok(data.messages[0].body.includes(fragment));
 assert.equal(data.messages[1].body,'Resposta com *itálico*');
 assert.match(source,/writerV8Markdown\(plugin,ctx,bubble,msg\.body\)/);
});
test('old === Nome syntax still works, with optional profiles',()=>{
 const data=parse(['title: Legado','[Maria=green]','[Maria=Imagens/maria.png]',
 '=== Maria','side: left','time: 09:10','---','**Olá**',
 '=== João','side: right','---','Tudo bem.'].join('\n'));
 assert.equal(data.title,'Legado');assert.equal(data.messages.length,2);
 assert.equal(data.messages[0].color,'green');assert.equal(data.messages[0].avatar,'Imagens/maria.png');
 assert.equal(data.messages[0].body,'**Olá**');assert.equal(data.messages[1].body,'Tudo bem.');
});
test('malformed color strings and oversized inputs do not affect styles or memory',()=>{
 const data=parse('[Maria=red; background:url(https://bad.test)]\n[Left=Maria]\n< | Mensagem | 13:30');
 assert.equal(data.messages[0].color,'');assert.equal(data.messages[0].avatar,'');
 assert.equal(parse('x'.repeat(33000)),null);
 assert.equal(parse('[Left=Maria]\n'+Array.from({length:60},()=>'< | Hi | 12:00').join('\n')).messages.length,60);
 const long='x'.repeat(9000);
 assert.equal(parse('< Maria | '+long).messages[0].body,long);
});
class E{
 constructor(tag='div',options={}){this.tag=tag;this.options=options;this.children=[];this.handlers={};}
 createDiv(o){return this.createEl('div',o);}
 createEl(tag,o){const e=new E(tag,o);this.children.push(e);Object.defineProperty(e,'parent',{value:this});return e;}
 setText(value){this.text=value;}
 empty(){this.children=[];}
 setAttribute(key,value){(this.options.attr??={})[key]=value;}
 addEventListener(kind,handler){this.handlers[kind]=handler;}
 focus(){this.focused=true;}
 remove(){this.parent.children.splice(this.parent.children.indexOf(this),1);}
}
function renderer(calls){
 return vm.runInNewContext(source+'\n({writerV8ChatRender})',{
  writerUi:x=>x,writerV8ImagePath:(_,path)=>path?'app://local/'+path:'',
  writerV8Markdown:(_p,_c,_e,body)=>{calls.push(body);return Promise.resolve();},console}).writerV8ChatRender;
}
test('renderer only creates avatar element when an image exists',()=>{
 const calls=[],render=renderer(calls);
 const one=new E();
 render({app:{}},'[Left=Maria, right=João]\n< | Texto | 12:00\n> | Resposta | 12:01',one,{sourcePath:'Story.md'});
 assert.ok(!JSON.stringify(one).includes('"tag":"img"'));assert.equal(calls.length,2);
 const two=new E();
 render({app:{}},'[Maria=blue]\n< foto.png | Maria | Texto | 12:00',two,{sourcePath:'Story.md'});
 assert.match(JSON.stringify(two),/"tag":"img"/);assert.match(JSON.stringify(two),/is-color-blue/);
});
test('one-off avatars show within a run of messages from the same speaker',()=>{
 const render=renderer([]),element=new E();
 render({app:{}},[
  '[Maria=usual.png]','< Maria | First','< special.png | Maria | Second','< Maria | Third'
 ].join('\n'),element,{sourcePath:'Story.md'});
 const list=element.children[0].children[0];
 assert.deepEqual(list.children.map(row=>row.children[0].options.attr.src),[
  'app://local/usual.png','app://local/special.png','app://local/usual.png'
 ]);
});
test('long chats keep every message and progressively render later batches',()=>{
 const calls=[],render=renderer(calls),element=new E();
 const messages=Array.from({length:101},(_,index)=>'< Ana | Mensagem '+(index+1));
 render({app:{}},messages.join('\n'),element,{sourcePath:'Story.md'});
 const root=element.children[0];
 const [list,more]=root.children;
 assert.equal(calls.length,50);
 assert.equal(list.children.length,50);
 assert.equal(more.tag,'button');
 more.handlers.click();
 assert.equal(calls.length,100);
 assert.equal(list.children[50].focused,true);
 assert.match(list.children[50].options.cls,/is-continuation/);
 more.handlers.click();
 assert.equal(calls[100],'Mensagem 101');
 assert.equal(list.children[100].focused,true);
 assert.equal(root.children.length,1);
});
test('bundle, CSS and linked localized guides document both chat formats',()=>{
 const main=read('main.js'),css=read('styles.css');
 assert.match(main,/writerV8ChatShortMessage/);assert.match(main,/writerV8ChatDirectives/);
 assert.match(css,/writer-v8-chat-row\.is-color-red/);
 for(const [readme,path] of [
  ['README.md','docs/SUITES_AND_INTEGRATIONS.en.md'],
  ['docs/README.pt-BR.md','docs/SUITES_AND_INTEGRATIONS.pt-BR.md']
 ]){
  assert.ok(read(readme).includes(path.split('/').pop()),readme+' links the feature guide');
  const doc=read(path);
  for(const bit of ['[Left=Maria, right=João]','[Maria=blue','=== Maria'])
   assert.ok(doc.includes(bit),path+' missing '+bit);
 }
});
