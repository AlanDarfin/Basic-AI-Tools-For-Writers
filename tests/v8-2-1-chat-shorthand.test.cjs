'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const source=read('src/v8/finish-blocks.js');
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
 assert.ok(parse('[Left=Maria]\n'+Array.from({length:60},()=>'< | Hi | 12:00').join('\n')).messages.length<=50);
});
test('renderer only creates avatar element when an image exists',()=>{
 const calls=[];
 class E{constructor(tag='div',options={}){this.tag=tag;this.options=options;this.children=[];}
  createDiv(o){const e=new E('div',o);this.children.push(e);return e;}
  createEl(tag,o){const e=new E(tag,o);this.children.push(e);return e;}
  setText(value){this.text=value;}empty(){this.children=[];}}
 const local=vm.runInNewContext(source+'\n({writerV8ChatRender})',{
  writerUi:x=>x,writerV8ImagePath:(_,path)=>path?'app://local':'',
  writerV8Markdown:(_p,_c,_e,body)=>{calls.push(body);return Promise.resolve();},console});
 const one=new E();
 local.writerV8ChatRender({app:{}},'[Left=Maria, right=João]\n< | Texto | 12:00\n> | Resposta | 12:01',one,{sourcePath:'Story.md'});
 assert.ok(!JSON.stringify(one).includes('"tag":"img"'));assert.equal(calls.length,2);
 const two=new E();
 local.writerV8ChatRender({app:{}},'[Maria=blue]\n< foto.png | Maria | Texto | 12:00',two,{sourcePath:'Story.md'});
 assert.match(JSON.stringify(two),/"tag":"img"/);assert.match(JSON.stringify(two),/is-color-blue/);
});
test('bundle, CSS and localized README document both formats',()=>{
 const main=read('main.js'),css=read('styles.css');
 assert.match(main,/writerV8ChatShortMessage/);assert.match(main,/writerV8ChatDirectives/);
 assert.match(css,/writer-v8-chat-row\.is-color-red/);
 for(const path of ['README.md','docs/README.pt-BR.md']){
  const doc=read(path);
  for(const bit of ['8.2.1','[Left=Maria, right=João]','[Maria=blue','=== Maria'])
   assert.ok(doc.includes(bit),path+' missing '+bit);
 }
});
