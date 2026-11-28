'use strict';

const WRITER_TRANSLATION_SERVICES=[
 ['deepl','DeepL'],['google-translate','Google Translate (Cloud)'],
 ['microsoft-translator','Microsoft Translator'],['libretranslate','LibreTranslate']
];
const WRITER_TRANSLATION_LOCALES={
 pt:'PT-BR',en:'EN-US',es:'ES',fr:'FR',de:'DE',it:'IT',ja:'JA',zh:'ZH-HANS',
 ko:'KO',ru:'RU',nl:'NL',pl:'PL',ar:'AR',tr:'TR',uk:'UK',id:'ID'
};
function writerBasicToolsTitle(){return msg('Ferramentas Básicas','Basic Tools');}
function writerTranslationLanguages(){
 return {...LANGS,zh:'中文',ko:'한국어',ru:'Русский',nl:'Nederlands',pl:'Polski',ar:'العربية',tr:'Türkçe',uk:'Українська',id:'Bahasa Indonesia'};
}
function writerTranslationProviders(){return [...WRITER_TRANSLATION_SERVICES,...AI_PROVIDERS];}
function writerTranslationService(id){return WRITER_TRANSLATION_SERVICES.find(([name])=>name===id);}
function writerTranslationLibreEndpoint(input){
 try{
  const url=new URL(String(input||'').trim());
  if(url.username||url.password||url.search||url.hash)return '';
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))return '';
  const pathname=url.pathname.replace(/\/+$/,'');
  url.pathname=pathname.endsWith('/translate')?pathname:pathname+'/translate';
  return url.href;
 }catch(_){return '';}
}
function writerTranslationConnection(cfg,mode='translate'){
 const id=cfg.translationProvider,service=writerTranslationService(id);
 if(!service)return writerV13Connection(cfg,id,mode);
 const key=String(cfg.translationKeys?.[id]||'').trim();
 const endpoint=id==='libretranslate'?writerTranslationLibreEndpoint(cfg.translationEndpoint):'';
 const region=String(cfg.translationAzureRegion||'').trim().toLowerCase();
 let problem='';
 if(id==='libretranslate'&&!endpoint)problem=msg('Configure o endereço da sua instância.','Configure your instance URL.');
 else if(id!=='libretranslate'&&!key)problem=msg('Adicione a chave da API de tradução.','Add the translation API key.');
 else if(id==='microsoft-translator'&&region&&!/^[a-z0-9-]{2,40}$/.test(region))problem=msg('Informe a região do recurso, como brazilsouth.','Enter the resource region, such as brazilsouth.');
 return {id,title:id==='google-translate'?msg('Google Tradutor (Cloud)','Google Translate (Cloud)'):service[1],key,endpoint,region,problem,section:'translation',service:true};
}
function writerTranslationOptions(){
 return writerTranslationProviders().map(([id,label])=>[id,id==='google-translate'?msg('Google Tradutor (Cloud)','Google Translate (Cloud)'):writerTranslationService(id)?label:msg('IA · ','AI · ')+label]);
}
function writerTranslationNormalize(cfg){
 if(!writerTranslationProviders().some(([id])=>id===cfg.translationProvider))cfg.translationProvider=cfg.provider;
 for(const [field,fallback] of [['sourceLanguage','auto'],['targetLanguage','pt']]){
  if(!Object.hasOwn(writerTranslationLanguages(),cfg[field])&&cfg[field]!==fallback)cfg[field]=fallback;
 }
 if(!cfg.translationKeys||typeof cfg.translationKeys!=='object'||Array.isArray(cfg.translationKeys))cfg.translationKeys={};
}
function writerTranslationPair(settings){
 const source=settings.sourceLanguage||'auto',target=settings.targetLanguage||'pt',languages=writerTranslationLanguages();
 if(!Object.hasOwn(languages,target)||(source!=='auto'&&!Object.hasOwn(languages,source)))
  throw Error(msg('Escolha idiomas válidos para tradução.','Choose valid translation languages.'));
 if(source===target)throw Error(msg('Escolha idiomas de origem e destino diferentes.','Choose different source and target languages.'));
 return {source,target};
}
function writerTranslationRequest(connection,segments,{source,target}){
 const {id,key,endpoint,region}=connection;
 const headers={'Content-Type':'application/json; charset=utf-8'};
 let url,body;
 if(id==='deepl'){
  url='https://'+(key.endsWith(':fx')?'api-free':'api')+'.deepl.com/v2/translate';
  headers.Authorization='DeepL-Auth-Key '+key;
  const src=source==='zh'?'ZH':source.toUpperCase();
  body={text:segments,target_lang:WRITER_TRANSLATION_LOCALES[target],...(source==='auto'?{}:{source_lang:src}),preserve_formatting:true};
 }else if(id==='google-translate'){
  url='https://translation.googleapis.com/language/translate/v2';
  headers['x-goog-api-key']=key;
  body={q:segments,target:target==='zh'?'zh-CN':target,format:'text',...(source==='auto'?{}:{source:source==='zh'?'zh-CN':source})};
 }else if(id==='microsoft-translator'){
  const code=lang=>lang==='zh'?'zh-Hans':lang==='pt'?'pt-br':lang;
  const params=new URLSearchParams({'api-version':'3.0',to:code(target),textType:'plain'});
  if(source!=='auto')params.set('from',source==='pt'?'pt':code(source));
  url='https://api.cognitive.microsofttranslator.com/translate?'+params;
  headers['Ocp-Apim-Subscription-Key']=key;
  if(region)headers['Ocp-Apim-Subscription-Region']=region;
  body=segments.map(Text=>({Text}));
 }else if(id==='libretranslate'){
  url=endpoint;
  body={q:segments,source,target,format:'text',...(key?{api_key:key}:{})};
 }else throw Error(msg('Tradutor não reconhecido.','Unknown translator.'));
 return {url,method:'POST',headers,body:JSON.stringify(body),throw:false};
}
function writerTranslationDecode(value){
 return value.replace(/&(?:amp|lt|gt|quot|apos|#\d{1,7}|#x[a-f\d]{1,6});/gi,entity=>{
  const code=entity.slice(1,-1).toLowerCase();
  if(code[0]!=='#')return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[code];
  const n=code[1]==='x'?parseInt(code.slice(2),16):Number(code.slice(1));
  return !n||n>0x10ffff||(n>=0xd800&&n<=0xdfff)?entity:String.fromCodePoint(n);
 });
}
async function writerTranslationSend(connection,pair,segments){
 let response;
 try{response=await requestUrl(writerTranslationRequest(connection,segments,pair));}
 catch(_){throw Error(connection.title+' · '+msg('Não foi possível acessar o serviço.','Could not reach the service.'));}
 const status=response.status;
 if(status<200||status>=300){
  const detail=[401,403].includes(status)?msg('Confira sua chave e a configuração da API.','Check your key and API configuration.'):
   [429,456].includes(status)?msg('Limite ou cota atingida.','Rate limit or quota reached.'):
   msg('Confira os idiomas, a conexão e os limites do serviço.','Check the languages, connection and service limits.');
  throw Error(connection.title+' · HTTP '+status+' · '+detail);
 }
 let data;
 try{data=response.json;}catch(_){}
 const id=connection.id;
 const texts=values=>Array.isArray(values)?values:null;
 let values=id==='deepl'?texts(data?.translations)?.map(x=>x?.text):
  id==='google-translate'?texts(data?.data?.translations)?.map(x=>typeof x?.translatedText==='string'?writerTranslationDecode(x.translatedText):null):
  id==='microsoft-translator'?(Array.isArray(data)?data.map(x=>x?.translations?.[0]?.text):null):
  (segments.length===1&&typeof data?.translatedText==='string'?[data.translatedText]:data?.translatedText);
 if(!Array.isArray(values)||values.length!==segments.length||Array.from(values).some(x=>typeof x!=='string'||!x.trim()))
  throw Error(connection.title+' · '+msg('O serviço retornou uma tradução inválida ou incompleta.','The service returned an invalid or incomplete translation.'));
 return values.map(text=>text.trim());
}
function writerTranslationServicePlan(source,protect){
 const ranges=protect?writerV4ProtectedRanges(source):[];
 if(protect){
  const structural=/^(?: {4}|\t)[^\r\n]*|^[ \t]{0,3}\[[^\]\r\n]+\]:[^\r\n]*|<(script|style|code|pre|textarea)\b(?:[^<>"']|"[^"]*"|'[^']*')*>[\s\S]*?(?:<\/\1\s*>|$)|<[^<>\s@]+@[^<>\s@]+>|<(?:\/?[A-Za-z][A-Za-z\d:-]*(?=[\s/>])|!|\?)(?:[^<>"']|"[^"]*"|'[^']*')*>/gim;
  for(const match of source.matchAll(structural))ranges.push([match.index,match.index+match[0].length]);
  // Reparse inline code across line endings without pairing ticks from a
  // fenced block, link, HTML tag or comment with the surrounding prose.
  const blocked=ranges.filter(([from,to])=>source[from]!=='\x60'||source.slice(from,to).includes('\n')).sort((a,b)=>a[0]-b[0]||b[1]-a[1]);
  const ticks=[];let boundary=0;
  for(const match of source.matchAll(/\x60+/g)){
   while(boundary<blocked.length&&blocked[boundary][1]<=match.index)boundary++;
   if(boundary<blocked.length&&blocked[boundary][0]<=match.index)continue;
   ticks.push(match);
  }
  const next=new Map(),closing=[];
  for(let i=ticks.length-1;i>=0;i--){closing[i]=next.get(ticks[i][0].length);next.set(ticks[i][0].length,i);}
  for(let i=0;i<ticks.length;i++){
   const end=closing[i];if(end===undefined)continue;
   let escaped=0;for(let p=ticks[i].index-1;source[p]==='\\';p--)escaped++;
   if(escaped%2||/\r?\n[ \t]*\r?\n/.test(source.slice(ticks[i].index,ticks[end].index)))continue;
   ranges.push([ticks[i].index,ticks[end].index+ticks[end][0].length]);i=end;
  }
  const syntax=/\\[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]|\[\^[^\]\r\n]+\]|&(?:[A-Za-z][A-Za-z\d]{1,31}|#(?:\d{1,8}|[xX][a-fA-F\d]{1,8}));|^[ \t]*(?:(?:#{1,6}|>+|[-+*]|\d+[.)])(?=[ \t])(?:[ \t]+\[[ xX]\])?[ \t]+|(?:[-*_][ \t]*){3,}$)|!?(?:\[\[[^\r\n]+?\]\]|\[[^\r\n\]]+\]\[[^\r\n\]]*\])|(?<!\w)https?:\/\/[^\s<>]+|[\x60*_~]+|(?<=\s)\^[A-Za-z\d-]+(?=[ \t]*\r?$)/gm;
  for(const match of source.matchAll(syntax))ranges.push([match.index,match.index+match[0].length]);
 }
 ranges.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);
 const parts=[];
 const pass=text=>{
  for(const line of text.split(/(\r?\n)/)){
   for(const part of writerV13TranslationParts(line,2400))parts.push(part);
  }
 };
 let offset=0;
 for(const [from,to] of ranges){
  if(to<=offset)continue;
  if(from>offset)pass(source.slice(offset,from));
  parts.push({raw:source.slice(Math.max(offset,from),to),text:''});
  offset=to;
 }
 pass(source.slice(offset));
 const batches=[];
 let batch=[],count=0;
 for(const part of parts){
  if(!/[\p{L}\p{N}]/u.test(part.text))continue;
  if(batch.length&&(count+part.text.length>4500||batch.length===32)){
   batches.push(batch);batch=[];count=0;
  }
  batch.push(part);count+=part.text.length;
 }
 if(batch.length)batches.push(batch);
 return {parts,batches};
}
async function writerTranslateService(settings,connection,source,{protect=false,active=()=>true,progress=()=>{}}={}){
 if(connection.problem)throw Error(connection.problem);
 if(source.length>200000)throw Error(msg('Limite de 200 mil caracteres por tradução.','Limit of 200,000 characters per translation.'));
 const pair=writerTranslationPair(settings),{parts,batches}=writerTranslationServicePlan(source,protect);
 if(!batches.length)throw Error(msg('Não há texto para traduzir.','There is no text to translate.'));
 for(const [i,batch] of batches.entries()){
  if(!active())return '';
  progress(i+1,batches.length);
  if(!active())return '';
  const values=await writerTranslationSend(connection,pair,batch.map(p=>p.text));
  if(!active())return '';
  for(const [j,part] of batch.entries())part.translated=values[j];
 }
 return parts.map(p=>p.translated===undefined?p.raw:p.before+p.translated+p.after).join('');
}
function writerTranslationServiceSettings(plugin,panel){
 const settings=plugin.settings,connection=writerTranslationConnection(settings);
 if(!connection.service)return;
 const id=connection.id;
 const keySetting=new Setting(panel).setName(msg('Chave da API de tradução','Translation API key'))
  .setDesc(msg('Salva localmente nos dados do plugin, sem criptografia. LibreTranslate só precisa de chave se a instância exigir.',
   'Stored locally in plugin data without encryption. LibreTranslate only needs a key if the instance requires it.'));
 keySetting.addText(input=>{
  input.inputEl.type='password';input.inputEl.autocomplete='off';input.inputEl.spellcheck=false;
  input.setValue(connection.key).onChange(value=>{(settings.translationKeys??={})[id]=value.trim();void plugin.saveSettings();});
 });
 if(id==='libretranslate')new Setting(panel).setName(msg('Endereço do LibreTranslate','LibreTranslate address'))
  .setDesc(msg('Use HTTPS ou HTTP no próprio dispositivo (localhost).','Use HTTPS or HTTP on this device (localhost).'))
  .addText(input=>input.setPlaceholder('http://localhost:5000').setValue(settings.translationEndpoint||'')
   .onChange(value=>{settings.translationEndpoint=value.trim();void plugin.saveSettings();}));
 if(id==='microsoft-translator')new Setting(panel).setName(msg('Região do recurso Azure','Azure resource region'))
  .setDesc(msg('Necessária para recursos regionais ou de vários serviços.','Required for regional or multi-service resources.'))
  .addText(input=>input.setPlaceholder('brazilsouth').setValue(settings.translationAzureRegion||'')
   .onChange(value=>{settings.translationAzureRegion=value.trim();void plugin.saveSettings();}));
 const status=panel.createEl('p',{cls:'dictionary-muted',attr:{role:'status'}});
 let running=false;
 new Setting(panel).setName(msg('Testar tradução','Test translation')).setDesc(connection.title).addButton(button=>button.setButtonText(msg('Testar tradução','Test translation')).onClick(async()=>{
  if(running)return;
  running=true;
  const cfg=writerV13CaptureAISettings(settings),current=writerTranslationConnection(cfg);
  status.setText(msg('Testando com uma frase de exemplo…','Testing with a sample sentence…'));
  try{
   await writerTranslateService({...cfg,sourceLanguage:'en',targetLanguage:'pt'},current,'Hello.');
   if(status.isConnected!==false)status.setText(msg('Tradução de exemplo concluída.','Sample translation completed.'));
  }catch(error){if(status.isConnected!==false)status.setText(error.message);}
  finally{running=false;}
 }));
}
