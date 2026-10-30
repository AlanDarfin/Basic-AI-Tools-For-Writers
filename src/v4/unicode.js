'use strict';
/* Unicode picker: offline catalog + arbitrary code point input. */
const W4_UNICODE_NAMED=[
 ['→','right arrow','seta direita'],['←','left arrow','seta esquerda'],['↑','up arrow','seta cima'],['↓','down arrow','seta baixo'],
 ['↗','northeast arrow','seta diagonal'],['↘','southeast arrow','seta diagonal'],['↖','northwest arrow','seta diagonal'],
 ['⇒','right double arrow','seta dupla'],['⇐','left double arrow','seta dupla'],['⇔','double arrow both','equivalência'],
 ['↔','left right arrow','seta dupla'],['↞','two headed left arrow','seta esquerda'],['↠','two headed right arrow','seta direita'],
 ['⤛','right arrow tail','seta decorativa'],['⤜','left arrow tail','seta decorativa'],
 ['•','bullet','ponto lista'],['◦','white bullet','ponto lista'],['▪','small square bullet','ponto quadrado'],
 ['✓','check mark','marca confirmação'],['✔','heavy check mark','marca confirmação'],['✕','multiplication cross','cruz'],
 ['✗','ballot x','cruz'],['★','black star','estrela'],['☆','white star','estrela vazia'],['✦','black four pointed star','estrela quatro pontas'],
 ['✧','white four pointed star','estrela quatro pontas'],['✪','star in circle','estrela círculo'],['❖','diamond','diamante'],
 ['◇','white diamond','losango'],['◆','black diamond','losango'],['○','white circle','círculo'],['●','black circle','círculo'],
 ['□','white square','quadrado'],['■','black square','quadrado'],['△','white triangle','triângulo'],['▲','black triangle','triângulo'],
 ['▽','white down triangle','triângulo baixo'],['▼','black down triangle','triângulo baixo'],['∞','infinity','infinito'],
 ['≈','almost equal','aproximadamente'],['≠','not equal','diferente'],['≤','less than or equal','menor igual'],['≥','greater than or equal','maior igual'],
 ['±','plus minus','mais menos'],['×','multiplication','multiplicação'],['÷','division','divisão'],
 ['∑','summation','somatório'],['∏','product','produtório'],['√','square root','raiz quadrada'],['∫','integral','integral'],
 ['∂','partial derivative','derivada parcial'],['∇','nabla','gradiente'],['∈','element of','pertence'],['∉','not element of','não pertence'],
 ['∅','empty set','conjunto vazio'],['∩','intersection','interseção'],['∪','union','união'],['⊂','subset','subconjunto'],
 ['α','greek alpha','alfa grego'],['β','greek beta','beta grego'],['γ','greek gamma','gama grego'],['δ','greek delta','delta grego'],
 ['θ','greek theta','teta grego'],['λ','greek lambda','lambda grego'],['μ','greek mu','mu grego'],['π','greek pi','pi grego'],
 ['σ','greek sigma','sigma grego'],['φ','greek phi','fi grego'],['ω','greek omega','ômega grego'],
 ['Δ','greek uppercase delta','delta maiúsculo'],['Ω','greek uppercase omega','ômega maiúsculo'],
 ['«','left guillemet','aspas angulares esquerda'],['»','right guillemet','aspas angulares direita'],
 ['“','left double quotation','aspas duplas abrir'],['”','right double quotation','aspas duplas fechar'],
 ['‘','left single quotation','aspas simples abrir'],['’','right single quotation','aspas simples fechar'],
 ['—','em dash','travessão'],['–','en dash','meia risca'],['…','ellipsis','reticências'],['•','middle bullet','ponto'],['·','middle dot','ponto médio'],
 ['°','degree sign','grau'],['′','prime','minuto'],['″','double prime','segundo'],['№','numero sign','número'],
 ['©','copyright','direito autoral'],['®','registered','marca registrada'],['™','trademark','marca comercial'],
 ['§','section sign','seção'],['¶','pilcrow','parágrafo'],['†','dagger','adaga'],['‡','double dagger','adaga dupla'],
 ['♩','quarter note','nota musical'],['♪','eighth note','nota musical'],['♫','beamed eighth notes','notas musicais'],
 ['♭','music flat','bemol'],['♯','music sharp','sustenido'],['♮','natural note','bequadro'],
 ['♠','spade suit','espadas'],['♥','heart suit','copas'],['♦','diamond suit','ouros'],['♣','club suit','paus'],
 ['⚠','warning','aviso'],['⚡','high voltage','raio'],['☀','sun','sol'],['☾','crescent moon','lua crescente'],
 ['☁','cloud','nuvem'],['☂','umbrella','guarda chuva'],['☕','hot beverage','café'],['☘','shamrock','trevo'],
 ['❤','heart','coração'],['❥','heart bullet','coração'],['☯','yin yang','yin yang'],['☮','peace symbol','paz'],
 ['ℵ','aleph','alef'],['℘','weierstrass p','p caligráfico'],['ℝ','double struck r','reais'],['ℕ','double struck n','naturais'],
 ['ℤ','double struck z','inteiros'],['℃','celsius','grau celsius'],['℉','fahrenheit','fahrenheit']
];
function w4UnicodeFromCode(value){
 const match=/^(?:U\+|0x|\\u)([a-f\d]{2,6})$/i.exec(String(value||'').trim());
 if(!match)return null;
 const cp=parseInt(match[1],16);
 if(cp<0||cp>0x10FFFF||cp>=0xD800&&cp<=0xDFFF)return null;
 return {char:String.fromCodePoint(cp),name:'Unicode U+'+cp.toString(16).toUpperCase(),pt:'',code:cp};
}
class WriterUnicode{
 constructor(plugin){this.plugin=plugin;this.catalog=null;}
 items(){
  if(this.catalog)return this.catalog;
  const map=new Map();
  const add=(ch,name,pt)=>{
   const cp=ch.codePointAt(0);
   if(!map.has(ch))map.set(ch,{char:ch,name,pt,code:cp});
  };
  for(const [ch,name,pt] of W4_UNICODE_NAMED)add(ch,name,pt);
  // Offline coverage for symbols, arrows, box drawing and dingbats.
  for(const [start,end] of [[0x00A1,0x024F],[0x2000,0x27BF],[0x2900,0x2BFF],[0x1F300,0x1F64F]]){
   for(let cp=start;cp<=end;cp++){
    if(cp>=0xD800&&cp<=0xDFFF)continue;
    const char=String.fromCodePoint(cp);
    add(char,'U+'+cp.toString(16).toUpperCase(),'');
   }
  }
  return this.catalog=[...map.values()];
 }
 insert(item){
  const editor=this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
  if(!editor)return new Notice(w4text(this.plugin,'Abra uma nota Markdown.','Open a Markdown note.'));
  editor.replaceSelection(item.char);editor.focus();
  const cfg=this.plugin.settings.unicode;
  cfg.recent=[item.char,...(cfg.recent||[]).filter(x=>x!==item.char)].slice(0,30);
  this.plugin.saveSettings();
 }
 favorite(char){
  const fav=this.plugin.settings.unicode.favorites||[];
  this.plugin.settings.unicode.favorites=fav.includes(char)?fav.filter(x=>x!==char):[char,...fav];
  this.plugin.saveSettings();
 }
 open(){
  if(!this.plugin.settings.unicode.enabled)return new Notice(w4text(this.plugin,'Busca Unicode desativada.','Unicode search disabled.'));
  const plugin=this.plugin,owner=this;
  class Picker extends FuzzySuggestModal{
   getItems(){return owner.items();}
   getItemText(item){return item.char+' '+item.name+' '+item.pt+' U+'+item.code.toString(16).toUpperCase();}
   renderSuggestion(match,el){
    const item=match.item;
    el.createSpan({text:item.char,cls:'writer-unicode-preview'});
    const info=el.createDiv({cls:'writer-unicode-descriptor'});
    info.createSpan({text:w4locale(plugin)==='pt'&&item.pt?item.pt:item.name});
    info.createEl('small',{text:'U+'+item.code.toString(16).toUpperCase()});
   }
   onChooseItem(item){owner.insert(item);}
  }
  new Picker(this.plugin.app).open();
 }
 insertCodePoint(text){
  const item=w4UnicodeFromCode(text);if(!item)return new Notice(w4text(this.plugin,'Código Unicode inválido. Exemplo: U+2764','Invalid Unicode code point. Example: U+2764'));
  this.insert(item);
 }
 renderPanel(panel){
  const cfg=this.plugin.settings.unicode,txt=(p,e)=>w4text(this.plugin,p,e);
  panel.createEl('h4',{text:txt('Busca Unicode','Unicode search')});
  const row=panel.createDiv({cls:'writer-v4-unicode-row'});
  const input=row.createEl('input',{attr:{type:'text',placeholder:'U+2764'}});
  row.createEl('button',{text:txt('Inserir código','Insert code point')}).addEventListener('click',()=>this.insertCodePoint(input.value));
  row.createEl('button',{text:txt('Pesquisar símbolos','Search symbols')}).addEventListener('click',()=>this.open());
  const favorites=panel.createDiv({cls:'writer-v4-unicode-favorites'});
  favorites.createEl('strong',{text:txt('Favoritos','Favorites')});
  for(const ch of cfg.favorites||[]){
   favorites.createEl('button',{text:ch}).addEventListener('click',()=>this.insert({char:ch}));
  }
  panel.createEl('p',{text:txt('Busca local por símbolo, nome, descrição e U+ hexadecimal.','Offline search by symbol, name, description and U+ hexadecimal.'),cls:'writer-tools-muted'});
 }
 register(){
  const p=this.plugin;
  p.addCommand({id:'v4-search-unicode',name:w4text(p,'Pesquisar caracteres Unicode','Search Unicode characters'),callback:()=>this.open()});
  p.addCommand({id:'v4-open-unicode-tool',name:w4text(p,'Abrir ferramenta Unicode','Open Unicode tool'),callback:()=>p.openWritingTools('unicode')});
 }
}
