'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const file=fs.readFileSync('src/v3/tts-online.js','utf8');
let sendCalls=[];
class MockWebSocket{
 static CONNECTING=0;static OPEN=1;
 constructor(url){
  this.url=url;this.readyState=0;this.binaryType='blob';
  sendCalls.push({kind:'url',value:url});
  setTimeout(()=>{this.readyState=1;this.onopen?.();},0);
 }
 send(value){
  sendCalls.push({kind:'payload',value});
  if(!value.includes('Path:ssml'))return;
  setTimeout(()=>{
   if(this.readyState!==1)return;
   const header=new TextEncoder().encode('Path:audio\r\nContent-Type:audio/mpeg\r\n');
   const binary=new Uint8Array(2+header.length+4);
   binary[0]=header.length>>8;binary[1]=header.length&255;
   binary.set(header,2);binary.set([0x49,0x44,0x33,0x04],header.length+2);
   this.onmessage?.({data:binary.buffer});
   this.onmessage?.({data:'Path:turn.end\r\n'});
  },0);
 }
 close(){this.readyState=3;this.onclose?.();}
}
const sandbox={WebSocket:MockWebSocket,crypto:webcrypto,Blob,TextEncoder,TextDecoder,setTimeout,clearTimeout,console};
const api=vm.runInNewContext(file+'\n({writerEdgeChunks,writerEdgeBinaryAudio,writerEdgeSynthesize,WRITER_EDGE_VOICES,WriterEdgePlayer})',sandbox);
async function test(){
 const check=(name)=>console.log('PASS',name);
 const source='um texto com frases e pausas '.repeat(600);
 const chunks=api.writerEdgeChunks(source,2800);
 assert.ok(chunks.length>4);
 assert.ok(chunks.every(c=>c.length<=2800));
 assert.equal(chunks.join(' '),source.trim());
 check('Online TTS chunks long Portuguese notes without losing words');
 assert.equal(api.WRITER_EDGE_VOICES['pt-BR'],'pt-BR-FranciscaNeural');
 check('Multilingual Edge neural voice catalog');
 const blob=await api.writerEdgeSynthesize('Olá <mundo> & amigos','pt-BR-FranciscaNeural',{timeout:2500});
 assert.equal(blob.type,'audio/mpeg');
 assert.equal(blob.size,4);
 assert.ok(sendCalls.some(e=>e.kind==='url'&&e.value.includes('Sec-MS-GEC=')));
 assert.ok(sendCalls.some(e=>e.kind==='payload'&&e.value.includes('&lt;mundo&gt; &amp; amigos')));
 check('Edge WebSocket protocol assembles MP3 and escapes SSML safely');
 const ctl=new AbortController();
 const promise=api.writerEdgeSynthesize('abort test','en-US-JennyNeural',{signal:ctl.signal,timeout:2500});
 ctl.abort();
 await assert.rejects(promise,/cancelled/);
 check('Online TTS supports cancellation');
 const markup=fs.readFileSync('styles.css','utf8');
 const code=fs.readFileSync('main.js','utf8');
 for(const selector of [
  'writer-unicode-glyph',
  'writer-unicode-favorite',
  'writer-unicode-detail',
  'writer-extras-card',
  'writer-tools-v3-tabs.writer-tools-v3-tabs',
  'writer-project-tabs.writer-project-tabs',
  'dictionary-settings-tabs.dictionary-settings-tabs',
  'writer-tool-tabs.writer-tool-tabs'
 ])assert.ok(markup.includes(selector),'Missing '+selector);
 assert.ok(code.includes('writer-tts-privacy'));
 assert.ok(code.includes('cfg.allowOnline'));
 assert.ok(code.includes('writer-unicode-category'));
 check('Unicode visual cards, scrollable tabs and online speech consent are bundled');

}
test().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
