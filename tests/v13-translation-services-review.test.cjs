'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=['src/editor/editor.js','src/v13/core-workflows.js','src/v13/translation-services.js'].map(name=>fs.readFileSync(name,'utf8')).join('\n');
const plain=value=>JSON.parse(JSON.stringify(value));
const cfg=id=>({translationProvider:id,translationKeys:{[id]:'example-private-key'},translationEndpoint:'https://translate.example',sourceLanguage:'en',targetLanguage:'pt'});
function result(id,values){
 const json=id==='deepl'?{translations:values.map(text=>({text}))}:
  id==='google-translate'?{data:{translations:values.map(translatedText=>({translatedText}))}}:
  id==='microsoft-translator'?values.map(text=>({translations:[{text}]})):{translatedText:values};
 return {status:200,json};
}
function fixture(language='en'){
 const requests=[];let reply=async()=>{throw Error('Unexpected network request');};
 const api=vm.runInNewContext(code+'\n({writerTranslationOptions,writerTranslationLibreEndpoint,writerTranslationConnection,writerTranslationPair,writerTranslationRequest,writerTranslationDecode,writerTranslationSend,writerTranslationServicePlan,writerTranslateService})',{
  URL,URLSearchParams,LANGS:{pt:'Português',en:'English',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano',ja:'日本語'},
  AI_PROVIDERS:[['openai','OpenAI'],['ollama','Ollama']],msg:(pt,en)=>language==='pt'?pt:en,
  requestUrl:async options=>{requests.push(options);return reply(options);}
 });
 return {api,requests,send:callback=>{reply=callback;},echo(id,transform=text=>text.toUpperCase()){
  reply=async options=>{const body=JSON.parse(options.body),segments=id==='deepl'?body.text:id==='microsoft-translator'?body.map(x=>x.Text):body.q;return result(id,segments.map(transform));};
 }};
}
function deferred(){let resolve;const promise=new Promise(ok=>{resolve=ok;});return {promise,resolve};}

test('protected translation retains properties, fenced code and multiline code spans byte for byte',async()=>{
 const h=fixture(),settings=cfg('deepl');h.echo('deepl');
 const front='\uFEFF---\r\ntitle: do not translate\r\n...\r\n';
 const fence='````md\r\n```\r\nUse `code` here\r\n```\r\n````';
 const codeSpan='`keep\r\nthese words`',nested='``keep `nested`\ncode``';
 const source=front+'# opening prose\r\n'+fence+'\r\nVisible '+codeSpan+' prose and '+nested+' ending prose.';
 const output=await h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),source,{protect:true});
 for(const raw of [front,fence,codeSpan,nested])assert.ok(output.includes(raw),raw);
 assert.ok(output.includes('# OPENING PROSE'));
 assert.ok(output.includes('ENDING PROSE.'));
 const sent=h.requests.flatMap(request=>JSON.parse(request.body).text).join('\n');
 assert.doesNotMatch(sent,/do not translate|these words|nested|Use `code`/);
 assert.equal((output.match(/\r\n/g)||[]).length,(source.match(/\r\n/g)||[]).length);
});

test('protected translation keeps multiline HTML attributes and quoted greater-than signs out of requests',async()=>{
 const h=fixture(),settings=cfg('deepl');h.echo('deepl');
 const tag='<figure\n data-note="keep > attrs"\n class="keep-this">';
 const multiline='<span title="keep\nthis attribute">';
 const raw='<script data-note="keep > script">const variable = "never translate";</script>';
 const source=tag+'\nvisible prose\n'+multiline+'more prose</span>\n</figure>\n'+raw;
 const output=await h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),source,{protect:true});
 for(const value of [tag,multiline,raw,'</span>','</figure>'])assert.ok(output.includes(value),value);
 assert.ok(output.includes('VISIBLE PROSE'));assert.ok(output.includes('MORE PROSE'));
 const sent=h.requests.flatMap(request=>JSON.parse(request.body).text).join('\n');
 assert.doesNotMatch(sent,/data-note|class=|title=|variable|never translate/);
});

test('protected translation preserves footnote identifiers, links, reference definitions and email autolinks',async()=>{
 const h=fixture(),settings=cfg('deepl');h.echo('deepl');
 const protectedText=['[^original-note]','[link](https://example.org/a_(b) "keep title")','[[Book/Chapter|Keep label]]',
  '[reference][keep-id]','[keep-id]: https://example.org/original','<person@example.org>','<https://example.org/path>'];
 const source='opening prose '+protectedText.slice(0,4).join(' ')+'\n\n'+protectedText[4]+'\n'+protectedText.slice(5).join(' ')+'\n[^original-note]: keep definition';
 const output=await h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),source,{protect:true});
 for(const value of [...protectedText,'[^original-note]: keep definition'])assert.ok(output.includes(value),value);
 assert.ok(output.includes('OPENING PROSE'));
 const sent=h.requests.flatMap(request=>JSON.parse(request.body).text).join('\n');
 assert.doesNotMatch(sent,/original-note|keep-id|person@example|keep title/);
});

test('protected escapes and HTML entities remain intact while their surrounding prose translates',async()=>{
 const h=fixture(),settings=cfg('deepl');h.echo('deepl');
 const source='start \\*literal\\* prose &nbsp; &#x1F642; &amp;.';
 const output=await h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),source,{protect:true});
 assert.equal(output,'START \\*LITERAL\\* PROSE &nbsp; &#x1F642; &amp;.');
 const sent=h.requests.flatMap(request=>JSON.parse(request.body).text).join('\n');
 assert.doesNotMatch(sent,/\\|&nbsp;|&#x1F642;|&amp;/);
});

test('inline code parsing does not pair a fence or an escaped opener with later prose',async()=>{
 const h=fixture(),settings=cfg('deepl');h.echo('deepl');
 const source='```text\n` unmatched inside fence\n```\nvisible prose \\`literal and `keep\ncode` ending prose.';
 const output=await h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),source,{protect:true});
 assert.ok(output.startsWith('```text\n` unmatched inside fence\n```\nVISIBLE PROSE'));
 assert.ok(output.includes('\\`LITERAL AND `keep\ncode` ENDING PROSE.'));
});

test('DeepL Free/Pro and language mappings use their own API contract',()=>{
 const h=fixture(),settings=cfg('deepl');settings.translationKeys.deepl='example-key:fx';
 const connection=h.api.writerTranslationConnection(settings);
 let request=h.api.writerTranslationRequest(connection,['hello'],{source:'auto',target:'pt'}),body=JSON.parse(request.body);
 assert.equal(request.url,'https://api-free.deepl.com/v2/translate');
 assert.equal(request.headers.Authorization,'DeepL-Auth-Key example-key:fx');
 assert.deepEqual(body,{text:['hello'],target_lang:'PT-BR',preserve_formatting:true});
 connection.key='example-pro-key';request=h.api.writerTranslationRequest(connection,['你好'],{source:'zh',target:'en'});body=JSON.parse(request.body);
 assert.equal(request.url,'https://api.deepl.com/v2/translate');
 assert.equal(body.source_lang,'ZH');assert.equal(body.target_lang,'EN-US');
 assert.equal(h.api.writerTranslationRequest(connection,['hello'],{source:'en',target:'zh'}).body.includes('ZH-HANS'),true);
});

test('Google Cloud mappings and response entity decoding retain text rather than HTML',async()=>{
 const h=fixture(),connection=h.api.writerTranslationConnection(cfg('google-translate'));
 const request=h.api.writerTranslationRequest(connection,['hello'],{source:'en',target:'zh'}),body=JSON.parse(request.body);
 assert.equal(request.url,'https://translation.googleapis.com/language/translate/v2');
 assert.equal(request.headers['x-goog-api-key'],'example-private-key');
 assert.deepEqual(body,{q:['hello'],target:'zh-CN',format:'text',source:'en'});
 h.send(async()=>result('google-translate',['Tom &amp; Jerry &#x1F642; &amp;lt;']));
 assert.deepEqual(plain(await h.api.writerTranslationSend(connection,{source:'auto',target:'pt'},['text'])),['Tom & Jerry 🙂 &lt;']);
 assert.equal(h.api.writerTranslationDecode('&#xD800; &#1114112; &#0;'),'&#xD800; &#1114112; &#0;');
 const auto=JSON.parse(h.api.writerTranslationRequest(connection,['hello'],{source:'auto',target:'en'}).body);assert.equal('source' in auto,false);
});

test('Microsoft Translator carries resource region, text arrays and locale mappings correctly',()=>{
 const h=fixture(),settings=cfg('microsoft-translator');settings.translationAzureRegion='BrazilSouth';
 const connection=h.api.writerTranslationConnection(settings),request=h.api.writerTranslationRequest(connection,['hello','next'],{source:'pt',target:'zh'});
 const url=new URL(request.url);assert.equal(url.origin,'https://api.cognitive.microsofttranslator.com');
 assert.equal(url.searchParams.get('api-version'),'3.0');assert.equal(url.searchParams.get('from'),'pt');assert.equal(url.searchParams.get('to'),'zh-Hans');
 assert.equal(url.searchParams.get('textType'),'plain');assert.equal(request.headers['Ocp-Apim-Subscription-Key'],'example-private-key');
 assert.equal(request.headers['Ocp-Apim-Subscription-Region'],'brazilsouth');
 assert.deepEqual(JSON.parse(request.body),[{Text:'hello'},{Text:'next'}]);
 assert.equal(new URL(h.api.writerTranslationRequest(connection,['hello'],{source:'auto',target:'pt'}).url).searchParams.has('from'),false);
});

test('LibreTranslate accepts an optional key and restricts HTTP endpoints to loopback',()=>{
 const h=fixture();
 for(const [input,expected] of [['https://translate.example','https://translate.example/translate'],['https://translate.example/api/translate/','https://translate.example/api/translate'],
  ['http://localhost:5000','http://localhost:5000/translate'],['http://127.0.0.1:5000','http://127.0.0.1:5000/translate'],['http://[::1]:5000','http://[::1]:5000/translate']])assert.equal(h.api.writerTranslationLibreEndpoint(input),expected);
 for(const input of ['http://public.example','https://user:secret@translate.example','https://translate.example?key=secret','https://translate.example#secret','javascript:alert(1)'])assert.equal(h.api.writerTranslationLibreEndpoint(input),'');
 const settings=cfg('libretranslate');settings.translationKeys={};const connection=h.api.writerTranslationConnection(settings);
 assert.equal(connection.problem,'');
 assert.deepEqual(JSON.parse(h.api.writerTranslationRequest(connection,['hello'],{source:'auto',target:'pt'}).body),{q:['hello'],source:'auto',target:'pt',format:'text'});
 connection.key='optional-key';assert.equal(JSON.parse(h.api.writerTranslationRequest(connection,['hello'],{source:'en',target:'pt'}).body).api_key,'optional-key');
});

test('all four service decoders reject incomplete, empty and invalid response arrays',async()=>{
 for(const id of ['deepl','google-translate','microsoft-translator','libretranslate']){
  const h=fixture(),connection=h.api.writerTranslationConnection(cfg(id));
  h.send(async()=>result(id,['one','two']));assert.deepEqual(plain(await h.api.writerTranslationSend(connection,{source:'en',target:'pt'},['first','second'])),['one','two']);
  for(const values of [['only one'],['one',''],['one',null]]){
   h.send(async()=>result(id,values));await assert.rejects(h.api.writerTranslationSend(connection,{source:'en',target:'pt'},['first','second']),/invalid or incomplete/);
  }
  h.send(async()=>({status:200,json:{}}));await assert.rejects(h.api.writerTranslationSend(connection,{source:'en',target:'pt'},['text']),/invalid or incomplete/);
 }
});

test('service failures never echo private provider response bodies, credentials or source text',async()=>{
 for(const id of ['deepl','google-translate','microsoft-translator','libretranslate']){
  const h=fixture(),connection=h.api.writerTranslationConnection(cfg(id));
  for(const status of [400,401,403,429,456,500]){
   h.send(async()=>({status,json:{error:'private manuscript and example-private-key'}}));
   await assert.rejects(h.api.writerTranslationSend(connection,{source:'en',target:'pt'},['private manuscript']),error=>/HTTP/.test(error.message)&&!/private manuscript|example-private-key/.test(error.message));
  }
  h.send(async()=>{throw Error('private manuscript and example-private-key');});
  await assert.rejects(h.api.writerTranslationSend(connection,{source:'en',target:'pt'},['private manuscript']),error=>/Could not reach/.test(error.message)&&!/private manuscript|example-private-key/.test(error.message));
 }
});

test('batches obey character and segment bounds and preserve whitespace and surrogate pairs',async()=>{
 const h=fixture(),settings=cfg('deepl');h.echo('deepl',text=>text);
 const source='  '+('hello🙂word '.repeat(1000))+'\r\n'+Array.from({length:70},(_,i)=>'line '+i+'  ').join('\r\n')+'\r\n';
 const output=await h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),source);
 assert.equal(output,source);assert.ok(h.requests.length>2);
 for(const request of h.requests){
  const segments=JSON.parse(request.body).text;assert.ok(segments.length<=32);assert.ok(segments.reduce((sum,text)=>sum+text.length,0)<=4500);
  for(const text of segments){assert.ok(text.length<=2400);assert.doesNotMatch(text,/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/);}
 }
});

test('cancellation before a batch, in progress callback or while waiting prevents later transports and partial output',async()=>{
 for(const when of ['before','progress','waiting']){
  const h=fixture(),settings=cfg('deepl'),pending=deferred();let active=when!=='before';
  const source=('long sentence '.repeat(500))+'\nnext passage';
  h.send(async options=>{const segments=JSON.parse(options.body).text;await pending.promise;return result('deepl',segments.map(()=> 'translated'));});
  const work=h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),source,{active:()=>active,progress:()=>{if(when==='progress')active=false;}});
  if(when==='waiting'){assert.equal(h.requests.length,1);active=false;}
  pending.resolve();assert.equal(await work,'');assert.equal(h.requests.length,when==='waiting'?1:0);
 }
});

test('a failed later batch rejects instead of returning a partial manuscript',async()=>{
 const h=fixture(),settings=cfg('deepl');let calls=0;
 h.send(async options=>++calls===2?{status:429,json:{}}:result('deepl',JSON.parse(options.body).text.map(()=> 'translated')));
 await assert.rejects(h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),'sentence '.repeat(1500)),/HTTP 429/);
 assert.equal(calls,2);
});

test('invalid language pairs and oversized sources are rejected before any transport',async()=>{
 const h=fixture();
 for(const settings of [{...cfg('deepl'),sourceLanguage:'pt'},{...cfg('deepl'),sourceLanguage:'wrong'},{...cfg('deepl'),targetLanguage:'wrong'}])
  await assert.rejects(h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),'text'));
 const settings=cfg('deepl');await assert.rejects(h.api.writerTranslateService(settings,h.api.writerTranslationConnection(settings),'a'.repeat(200001)),/200,000/);
 assert.equal(h.requests.length,0);
});

test('AI provider labels follow the selected interface language',()=>{
 for(const language of ['en','pt']){
  const h=fixture(language),options=h.api.writerTranslationOptions();
  assert.equal(options.find(([id])=>id==='openai')[1],language==='pt'?'IA · OpenAI':'AI · OpenAI');
  assert.equal(options.find(([id])=>id==='deepl')[1],'DeepL');
  assert.equal(options.find(([id])=>id==='google-translate')[1],language==='pt'?'Google Tradutor (Cloud)':'Google Translate (Cloud)');
 }
});
