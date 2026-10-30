'use strict';
// Independent Edge Read Aloud integration. Uses a public, undocumented consumer
// endpoint; it may change without notice. Never sends text until users opt in.
const WRITER_EDGE_VOICES={
 'pt-BR':'pt-BR-FranciscaNeural','pt-PT':'pt-PT-RaquelNeural',
 'en-US':'en-US-JennyNeural','en-GB':'en-GB-SoniaNeural',
 'es-ES':'es-ES-ElviraNeural','fr-FR':'fr-FR-DeniseNeural',
 'de-DE':'de-DE-KatjaNeural','it-IT':'it-IT-ElsaNeural',
 'ja-JP':'ja-JP-NanamiNeural','zh-CN':'zh-CN-XiaoxiaoNeural'
};
const WRITER_EDGE_CLIENT='6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WRITER_EDGE_REVISION='1-130.0.2849.68';
const writerEdgeXml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function writerEdgeChunks(raw,size=2800){
 const words=String(raw||'').replace(/\s+/g,' ').trim().split(/(?<=\s)/);
 const chunks=[];let current='';
 for(const word of words){
  if(current.length+word.length>size&&current.trim()){chunks.push(current.trim());current='';}
  if(word.length>size){
   for(let i=0;i<word.length;i+=size)chunks.push(word.slice(i,i+size));
  }else current+=word;
 }
 if(current.trim())chunks.push(current.trim());
 return chunks.filter(Boolean);
}
async function writerEdgeUrl(){
 if(typeof crypto==='undefined'||!crypto.subtle)throw Error('Secure crypto is unavailable; Edge online TTS cannot start.');
 const round=Math.floor((Date.now()/1000+11644473600)/300)*300;
 const input=new TextEncoder().encode((round*1e7).toFixed(0)+WRITER_EDGE_CLIENT);
 const digest=await crypto.subtle.digest('SHA-256',input);
 const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
 const id=typeof crypto.randomUUID==='function'?crypto.randomUUID():[Date.now().toString(16),Math.floor(Math.random()*1e12).toString(16)].join('-');
 return 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken='+WRITER_EDGE_CLIENT+'&Sec-MS-GEC='+hash+'&Sec-MS-GEC-Version='+WRITER_EDGE_REVISION+'&ConnectionId='+id;
}
function writerEdgeBinaryAudio(buffer){
 const data=new Uint8Array(buffer);
 if(data.length<3)return null;
 const headerBytes=data[0]*256+data[1];
 if(headerBytes+2>data.length)return null;
 const header=new TextDecoder().decode(data.subarray(2,headerBytes+2));
 if(!/\bPath:audio\b/i.test(header))return null;
 return data.slice(headerBytes+2);
}
function writerEdgeSynthesize(text,voice,{signal,timeout=25000}={}){
 return new Promise(async(resolve,reject)=>{
  let socket=null,clock=null,done=false,received=[],turnEnd=false;
  const cleanup=()=>{
   if(clock!==null)clearTimeout(clock);
   signal?.removeEventListener('abort',onAbort);
   if(socket&&socket.readyState<2)try{socket.close();}catch(_){}
  };
  const fail=error=>{
   if(done)return;done=true;cleanup();reject(error instanceof Error?error:Error(String(error)));
  };
  const finish=()=>{
   if(done)return;
   if(!received.length){fail(Error('The Edge voice server returned no audio. It may be unavailable.'));return;}
   done=true;cleanup();resolve(new Blob(received,{type:'audio/mpeg'}));
  };
  const onAbort=()=>fail(Error('Speech request cancelled.'));
  if(signal?.aborted)return fail(Error('Speech request cancelled.'));
  signal?.addEventListener('abort',onAbort,{once:true});
  try{
   if(typeof WebSocket==='undefined')throw Error('WebSocket unavailable on this device.');
   const url=await writerEdgeUrl();if(done)return;
   socket=new WebSocket(url);socket.binaryType='arraybuffer';
   clock=setTimeout(()=>fail(Error('Edge voice service did not respond in time.')),timeout);
   socket.onopen=()=>{
    const ts=new Date().toUTCString();
    const cfg={context:{synthesis:{audio:{metadataoptions:{sentenceBoundaryEnabled:false,wordBoundaryEnabled:true},outputFormat:'audio-24khz-48kbitrate-mono-mp3'}}}};
    socket.send('X-Timestamp:'+ts+'\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n'+JSON.stringify(cfg));
    const request=typeof crypto.randomUUID==='function'?crypto.randomUUID():String(Date.now());
    const ssml='<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="'+writerEdgeXml(voice)+'"><prosody rate="+0%" pitch="+0Hz" volume="+0%">'+writerEdgeXml(text)+'</prosody></voice></speak>';
    socket.send('X-RequestId:'+request+'\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:'+ts+'\r\nPath:ssml\r\n\r\n'+ssml);
   };
   socket.onmessage=event=>{
    if(done)return;
    if(typeof event.data==='string'){
     if(/Path:turn\.end/i.test(event.data)){turnEnd=true;finish();}
    }else if(event.data instanceof ArrayBuffer){
     const audio=writerEdgeBinaryAudio(event.data);
     if(audio?.length)received.push(audio);
    }else if(typeof Blob!=='undefined'&&event.data instanceof Blob){
     event.data.arrayBuffer().then(bytes=>{if(!done){const audio=writerEdgeBinaryAudio(bytes);if(audio?.length)received.push(audio);}}).catch(fail);
    }
   };
   socket.onerror=()=>fail(Error('Could not connect to Edge online TTS. The service may have changed.'));
   socket.onclose=()=>{if(!done)finish();};
  }catch(error){fail(error);}
 });
}
class WriterEdgePlayer{
 constructor(onState=()=>{}){this.onState=onState;this.generation=0;this.audio=null;this.url=null;this.abort=null;this.status='idle';}
 emit(status,message=''){this.status=status;try{this.onState(status,message);}catch(_){}}
 clearAudio(){
  if(this.audio){this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.audio=null;}
  if(this.url){URL.revokeObjectURL(this.url);this.url=null;}
 }
 stop(){
  this.generation++;
  this.abort?.abort();this.abort=null;
  this.clearAudio();this.emit('idle');
 }
 pause(){if(this.audio&&!this.audio.paused){this.audio.pause();this.emit('paused');}}
 resume(){if(this.audio?.paused){this.audio.play().then(()=>this.emit('playing')).catch(error=>this.emit('error',error.message));}}
 async start(text,voice,rate=1){
  this.stop();const serial=this.generation;
  const chunks=writerEdgeChunks(text);
  if(!chunks.length)return;
  for(let i=0;i<chunks.length&&this.generation===serial;i++){
   this.emit('loading',(i+1)+' / '+chunks.length);
   this.abort=new AbortController();
   let blob;
   try{blob=await writerEdgeSynthesize(chunks[i],voice,{signal:this.abort.signal});}
   catch(error){if(this.generation===serial)this.emit('error',error.message);return;}
   if(this.generation!==serial)return;
   this.abort=null;
   this.url=URL.createObjectURL(blob);
   const audio=new Audio(this.url);
   this.audio=audio;
   audio.playbackRate=Math.max(.5,Math.min(2,Number(rate)||1));
   const finish=new Promise((resolve,reject)=>{
    audio.addEventListener('ended',resolve,{once:true});
    audio.addEventListener('error',()=>reject(Error('Audio playback failed.')),{once:true});
   });
   try{await audio.play();this.emit('playing',(i+1)+' / '+chunks.length);await finish;}
   catch(error){if(this.generation===serial)this.emit('error',error.message);return;}
   this.clearAudio();
  }
  if(this.generation===serial)this.emit('idle');
 }
}
