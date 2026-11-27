function parseDictionary(text) {
  const entries=[]; let word=null, lines=[],fence=null;
  const flush=()=>{if(word) entries.push({word, markdown:('# '+word+'\n'+lines.join('\n')).trim()});};
  for(const line of text.split(/\r?\n/)){
    const code=/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    const insideFence=Boolean(fence);
    if(code){
      if(!fence)fence=code[1];
      else if(code[1][0]===fence[0]&&code[1].length>=fence.length&&!code[2].trim())fence=null;
    }
    const heading=!insideFence&&!code&&/^#\s+(.+?)\s*$/.exec(line);
    if(heading){flush();word=heading[1];lines=[];}
    else if(word){if(!insideFence&&/^---+\s*$/.test(line)) continue;lines.push(line);}
  }
  flush();return entries;
}

const AI_PROVIDERS=[['openai','OpenAI'],['gemini','Gemini'],['grok','Grok (xAI)'],['claude','Claude (Anthropic)'],['custom','Custom (OpenAI-compatible)'],['ollama','Ollama'],['openrouter','OpenRouter'],['groqcloud','Groq Cloud']];
const I18N={
 en:{title:'Word checker',search:'Search a word...',provider:'AI provider',language:'Definition language',lookup:'Define word',save:'Save definition',translate:'Translate word',translateMeaning:'Translate meaning',synonyms:'Synonyms',antonyms:'Antonyms',context:'Optional sentence or context',result:'Definition',translation:'Translation',copy:'Copy',missing:'No local entry found.',saved:'Definition saved.',noWord:'Enter a word first.',noResult:'No definition returned.',error:'Request failed',settings:'Word checker settings',dictionary:'Local Markdown dictionary',target:'Translation target language',source:'Translation source language',key:'API key',model:'Model',endpoint:'Custom HTTPS endpoint',offline:'Local entries',notice:'API keys are stored in Obsidian plugin data without encryption. Do not sync them to untrusted devices.',transProvider:'Translation AI provider',detect:'Detect language',compare:'Compare meaning',original:'Original meaning',translated:'Translated meaning',alternatives:'Contextual alternatives',needAI:'Configure an AI provider and API key in settings.'},
 pt:{title:'Verificador de palavras',search:'Pesquisar palavra...',provider:'Provedor de IA',language:'Idioma da definição',lookup:'Definir palavra',save:'Salvar definição',translate:'Traduzir palavra',translateMeaning:'Traduzir significado',synonyms:'Sinônimos',antonyms:'Antônimos',context:'Frase ou contexto opcional',result:'Definição',translation:'Tradução',copy:'Copiar',missing:'Nenhuma entrada local encontrada.',saved:'Definição salva.',noWord:'Digite uma palavra primeiro.',noResult:'Nenhuma definição retornada.',error:'Falha na solicitação',settings:'Configurações do verificador',dictionary:'Dicionário Markdown local',target:'Idioma de destino da tradução',source:'Idioma de origem da tradução',key:'Chave de API',model:'Modelo',endpoint:'Endpoint HTTPS personalizado',offline:'Entradas locais',notice:'As chaves de API ficam nos dados do plugin sem criptografia. Não sincronize com dispositivos não confiáveis.',transProvider:'IA para tradução',detect:'Detectar idioma',compare:'Comparar significado',original:'Significado original',translated:'Significado traduzido',alternatives:'Alternativas contextuais',needAI:'Configure um provedor de IA e sua chave nas opções.'}
};
const t=k=>(I18N[getLocale()]||I18N.en)[k]||k;
const PROMPT_DEFAULTS={
 definition:'You are a precise dictionary. Define the word in {language}. Give part of speech, concise senses and one short example. No introduction or closing remarks. Return Markdown.',
 synonyms:'In {language}, provide 5 contextual synonyms for the given word. For each, give a short nuance and example. No introductory text or conclusion. Return only a Markdown list.',
 antonyms:'In {language}, provide contextual antonyms, their nuances and short examples. No introductory text or conclusion. Return only a Markdown list.',
 translate:'Translate the user text from {source} into {target}. If source is auto, infer the source language from the text. Preserve meaning, tone and formatting. Return only the translation.',
 writing:'You are a writing assistant. Follow the task and preserve the author intent. Return only the requested text, formatted as Markdown.',
 test:'Reply with OK only.'
};
const LANGS={pt:'Português',en:'English',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano',ja:'日本語'};
function selectOptions(el,options,value,onChange){for(const [id,label] of options){const opt=el.createEl('option',{text:label});opt.value=id;}el.value=value;el.addEventListener('change',()=>onChange(el.value));}

class MarkdownVaultPicker extends FuzzySuggestModal{
 constructor(app,callback){super(app);this.callback=callback;this.setPlaceholder(msg('Pesquisar arquivos Markdown…','Search Markdown files…'));}
 getItems(){return this.app.vault.getMarkdownFiles();}
 getItemText(file){return file.path;}
 onChooseItem(file){this.callback(file);}
}
