'use strict';
/* Basic AI v4: selective, non-destructive writing revision and per-note profiles. */
const WRITER_V4_DEFAULTS={
  enabled:true, protectMarkdown:true, maxSelectedChars:2800,
  rewritePrompt:'Improve clarity, rhythm and flow while preserving the author voice, meaning, Markdown, and language. Return ONLY the revised passage, without commentary or surrounding code fences.',
  profiles:[]
};
function writerV4Merge(settings){
  const old=settings.writerV4&&typeof settings.writerV4==='object'&&!Array.isArray(settings.writerV4)?settings.writerV4:{};
  settings.writerV4={...WRITER_V4_DEFAULTS,...old};
  if(!Array.isArray(settings.writerV4.profiles))settings.writerV4.profiles=[];
  settings.writerV4.profiles=settings.writerV4.profiles.filter(p=>p&&typeof p==='object'&&typeof p.name==='string')
    .map(p=>({name:p.name.slice(0,80),folder:String(p.folder||'').slice(0,300),instructions:String(p.instructions||'').slice(0,10000)}));
  settings.writerV4.maxSelectedChars=Math.max(300,Math.min(8000,Number(settings.writerV4.maxSelectedChars)||2800));
  settings.schemaVersion=4;
  return settings.writerV4;
}
function writerV4Profile(plugin,file){
  const profiles=plugin.settings.writerV4?.profiles||[];
  if(!file||file.extension!=='md')return null;
  const front=plugin.app.metadataCache?.getFileCache?.(file)?.frontmatter||{};
  const chosen=String(front['basic-ai-profile']||front['basic_ai_profile']||'').trim().toLocaleLowerCase();
  if(chosen)return profiles.find(p=>p.name.toLocaleLowerCase()===chosen)||null;
  const path=file.path;
  return profiles.filter(p=>{
    const folder=String(p.folder||'').trim().replace(/^\/+|\/+$/g,'');
    return folder&&(path.startsWith(folder+'/'));
  }).sort((a,b)=>b.folder.length-a.folder.length)[0]||null;
}
function writerV4ProfilePrompt(plugin,file){
  const profile=writerV4Profile(plugin,file);
  return profile?.instructions?.trim()?('Writing profile '+JSON.stringify(profile.name)+':\n'+profile.instructions.trim()+'\n'):'';
}
function writerV4ProtectedTokens(text){
  const value=String(text||''),ranges=[],add=(a,b)=>{if(b>a)ranges.push([a,b]);};
  const fm=/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/.exec(value);
  if(fm)add(0,fm[0].length);
  const fence=/^([ \t]{0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1(?:`{3,}|~{3,})[ \t]*$/gm;
  let match;
  while((match=fence.exec(value)))add(match.index,match.index+match[0].length);
  const patterns=[
    /`+[^\r\n`]*`+/g,
    /%%[\s\S]*?%%/g,/<!--[\s\S]*?-->/g,
    /!?\[\[[^\]\r\n]+\]\]/g,/!?\[[^\]\r\n]*\]\([^\r\n)]*\)/g,
    /\{\{[^\r\n]{1,6000}?\}\}\^\d+/g
  ];
  for(const re of patterns)while((match=re.exec(value)))add(match.index,match.index+match[0].length);
  ranges.sort((a,b)=>a[0]-b[0]||b[1]-a[1]);
  const out=[];let end=-1;
  for(const [a,b] of ranges){if(a<end)continue;out.push(value.slice(a,b));end=b;}
  return out;
}
function writerV4AssertProtected(before,after){
  const a=writerV4ProtectedTokens(before),b=writerV4ProtectedTokens(after);
  if(a.length!==b.length||a.some((token,i)=>token!==b[i]))throw Error(writerUi('O texto sugerido alterou YAML, links, código ou sintaxe protegida. Ajuste a proposta antes de aplicar.','The suggestion changed frontmatter, links, code or other protected syntax. Edit it before applying.'));
}
function writerV4Hunks(before,after){
  if(String(before).length>12000||String(after).length>12000)throw Error('Trecho muito longo para comparação interativa.');
  const diff=writerDiffLines(before,after,350);
  if(diff.truncated)throw Error(writerUi('Trecho com muitas linhas para o diff seletivo. Use um trecho menor.','Too many lines for selective diff. Select a smaller passage.'));
  const groups=[];let group=null;
  for(const change of diff.changes){
    if(change.type==='same'){
      if(group){groups.push(group);group=null;}
      groups.push({same:[change.line]});
    }else{
      if(!group)group={old:[],next:[]};
      if(change.type==='remove')group.old.push(change.line);
      else group.next.push(change.line);
    }
  }
  if(group)groups.push(group);
  return groups;
}
function writerV4MergeHunks(groups,accepted){
  const out=[];let h=0;
  for(const group of groups){
    if(group.same)out.push(...group.same);
    else out.push(...(accepted.has(h)?group.next:group.old)),h++;
  }
  return out.join('\n');
}
function writerV4StripFence(text){
  const value=String(text||'').trim();
  const m=/^```(?:markdown|md|text)?\r?\n([\s\S]*?)\r?\n```$/.exec(value);
  return m?m[1]:value;
}
async function writerV4OpenDiff(plugin){
  if(plugin.settings.writerV4?.enabled===false)return new Notice(writerUi('Ative a revisão seletiva nas configurações.','Enable selective review in settings.'));
  const view=plugin.app.workspace.getActiveViewOfType(MarkdownView)||plugin.app.workspace.getLeavesOfType('markdown').map(leaf=>leaf.view).find(view=>view?.file?.extension==='md'&&view?.editor?.getSelection?.()?.trim());
  if(!view?.file||!view?.editor||view.file.extension!=='md')return new Notice(writerUi('Abra uma nota Markdown no editor.','Open a Markdown note in the editor.'));
  const editor=view.editor,original=editor.getSelection(),max=plugin.settings.writerV4.maxSelectedChars||2800;
  if(!original.trim())return new Notice(writerUi('Selecione o trecho que deseja revisar.','Select a passage to review.'));
  if(original.length>max)return new Notice(writerUi('Selecione um trecho com no máximo ','Select a passage of at most ')+max+writerUi(' caracteres.',' characters.'));
  const file=view.file,from=editor.posToOffset(editor.getCursor('from')),to=editor.posToOffset(editor.getCursor('to'));
  const profile=writerV4Profile(plugin,file),modal=new Modal(plugin.app);
  let proposal=original,accepted=new Set(),busy=false;
  const render=()=>{
    modal.setTitle(writerUi('Revisão seletiva · v4','Selective review · v4'));
    const root=modal.contentEl;root.empty();root.addClass('writer-v4-diff-modal');
    root.createEl('p',{text:(profile?writerUi('Perfil: ','Profile: ')+profile.name+' · ':'')+writerUi('Nada será alterado até você aplicar as mudanças.','Nothing changes until you apply your selections.'),cls:'writer-v4-hint'});
    const heading=root.createEl('label',{text:writerUi('Versão proposta (editável)','Suggested version (editable)'),cls:'writer-v4-label'});
    const area=root.createEl('textarea',{cls:'writer-v4-candidate',attr:{'aria-label':heading.textContent}});
    area.value=proposal;area.rows=7;area.disabled=busy;
    area.addEventListener('input',()=>{proposal=area.value;apply.disabled=true;diffEl.empty();diffEl.createEl('p',{text:writerUi('Compare novamente para atualizar as alterações.','Compare again to refresh the changes.'),cls:'writer-v4-hint'});});
    const toolbar=root.createDiv({cls:'writer-v4-actions'});
    const btn=(label,click,primary=false)=>{const b=toolbar.createEl('button',{text:label,cls:primary?'mod-cta':''});b.disabled=busy;b.addEventListener('click',click);return b;};
    btn(writerUi('Comparar','Compare'),()=>{proposal=area.value;accepted=new Set();renderDiff(root);});
    btn(writerUi('Gerar com IA','Generate with AI'),async()=>{
      if(busy)return;
      busy=true;area.disabled=true;
      try{
        const task=(plugin.settings.writerV4.rewritePrompt||WRITER_V4_DEFAULTS.rewritePrompt);
        const answer=await plugin.generateWriting(task,original);
        proposal=writerV4StripFence(answer);
        if(!proposal)throw Error('A IA não retornou texto.');
        accepted=new Set();render();
      }catch(e){busy=false;new Notice(String(e?.message||e),7000);render();return;}
      busy=false;render();
    });
    const diffEl=root.createDiv({cls:'writer-v4-diff-results'});
    const apply=root.createEl('button',{text:writerUi('Aplicar mudanças selecionadas','Apply selected changes'),cls:'mod-cta writer-v4-apply'});
    const renderDiff=()=>{
      diffEl.empty();let groups;try{
        groups=writerV4Hunks(original,proposal);
        if(plugin.settings.writerV4.protectMarkdown!==false)writerV4AssertProtected(original,proposal);
      }catch(error){diffEl.createEl('p',{text:error.message,cls:'writer-v4-error'});apply.disabled=true;return;}
      const changes=groups.filter(g=>!g.same);
      if(!changes.length){diffEl.createEl('p',{text:writerUi('Nenhuma diferença encontrada.','No differences found.')});apply.disabled=true;return;}
      const toggles=diffEl.createDiv({cls:'writer-v4-actions'});
      const toggle=(label,all)=>toggles.createEl('button',{text:label}).addEventListener('click',()=>{accepted=all?new Set(changes.map((_,i)=>i)):new Set();renderDiff();});
      toggle(writerUi('Aceitar todas','Accept all'),true);toggle(writerUi('Rejeitar todas','Reject all'),false);
      let h=0;
      for(const group of groups){if(group.same)continue;
        const i=h++,card=diffEl.createDiv({cls:'writer-v4-hunk'});
        card.createEl('strong',{text:writerUi('Alteração ','Change ')+(i+1)});
        if(group.old.length)card.createEl('pre',{text:group.old.join('\n'),cls:'writer-v4-removed'});
        if(group.next.length)card.createEl('pre',{text:group.next.join('\n'),cls:'writer-v4-added'});
        const accept=card.createEl('label',{cls:'writer-v4-choice'}),input=accept.createEl('input',{type:'checkbox'});
        input.checked=accepted.has(i);accept.createSpan({text:writerUi('Aceitar esta alteração','Accept this change')});
        input.addEventListener('change',()=>{if(input.checked)accepted.add(i);else accepted.delete(i);apply.disabled=accepted.size===0;});
      }
      apply.disabled=accepted.size===0||busy;
      apply.onclick=async()=>{if(busy||!accepted.size)return;busy=true;apply.disabled=true;
        try{
          const result=writerV4MergeHunks(groups,accepted);
          if(plugin.settings.writerV4.protectMarkdown!==false)writerV4AssertProtected(original,result);
          await writerSafeReplace(plugin,file,from,to,original,result,'revisão seletiva v4');
          modal.close();new Notice(writerUi('Revisão aplicada.','Review applied.'));
        }catch(e){busy=false;new Notice(String(e?.message||e),7000);renderDiff();}
      };
    };
    renderDiff();
  };
  modal.onOpen=render;modal.open();
}
function writerV4RenderSettings(plugin,panel){
  const cfg=plugin.settings.writerV4;
  panel.createEl('h3',{text:writerUi('Revisão seletiva e perfis','Selective review and writing profiles')});
  new Setting(panel).setName(writerUi('Ativar revisão seletiva','Enable selective review')).addToggle(t=>t.setValue(cfg.enabled!==false).onChange(async v=>{cfg.enabled=v;await plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Proteger sintaxe Markdown','Protect Markdown syntax')).setDesc(writerUi('Bloqueia alterações de frontmatter, código, wikilinks e links durante a revisão seletiva.','Blocks changes to frontmatter, code, wikilinks and links during selective review.')).addToggle(t=>t.setValue(cfg.protectMarkdown!==false).onChange(async v=>{cfg.protectMarkdown=v;await plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Máximo de caracteres selecionados','Maximum selection length')).addText(t=>t.setValue(String(cfg.maxSelectedChars)).onChange(async v=>{cfg.maxSelectedChars=Math.max(300,Math.min(8000,Number(v)||2800));await plugin.saveSettings();}));
  new Setting(panel).setName(writerUi('Prompt da revisão seletiva','Selective review prompt')).addTextArea(t=>{t.inputEl.rows=5;t.setValue(cfg.rewritePrompt).onChange(async v=>{cfg.rewritePrompt=v;await plugin.saveSettings();});});
  new Setting(panel).setName(writerUi('Revisar seleção','Review selection')).addButton(b=>b.setButtonText(writerUi('Abrir comparador','Open comparator')).onClick(()=>writerV4OpenDiff(plugin)));
  panel.createEl('h4',{text:writerUi('Perfis por pasta ou nota','Profiles by folder or note')});
  panel.createEl('p',{text:writerUi('Aplique instruções a uma pasta ou configure basic-ai-profile: Nome no YAML da nota. O YAML tem prioridade; a pasta mais específica vence.','Apply instructions to a folder or set basic-ai-profile: Name in note frontmatter. Note properties take priority; the most specific folder wins.'),cls:'dictionary-muted'});
  const list=panel.createDiv({cls:'writer-v4-profiles'});
  const draw=()=>{list.empty();cfg.profiles.forEach((p,i)=>{
    const card=list.createDiv({cls:'writer-v4-profile'});
    new Setting(card).setName(writerUi('Nome do perfil','Profile name')).addText(t=>t.setValue(p.name).onChange(async v=>{p.name=v.slice(0,80);await plugin.saveSettings();}));
    new Setting(card).setName(writerUi('Pasta no cofre (opcional)','Vault folder (optional)')).addText(t=>t.setPlaceholder('Books/Novel').setValue(p.folder).onChange(async v=>{p.folder=v.replace(/^\/+/,'').slice(0,300);await plugin.saveSettings();}));
    new Setting(card).setName(writerUi('Instruções de escrita','Writing instructions')).addTextArea(t=>{t.inputEl.rows=5;t.setValue(p.instructions).onChange(async v=>{p.instructions=v.slice(0,10000);await plugin.saveSettings();});});
    new Setting(card).setName(writerUi('Excluir perfil','Delete profile')).addButton(b=>b.setButtonText(writerUi('Remover','Remove')).setWarning().onClick(()=>{
      const confirm=new Modal(plugin.app);confirm.onOpen=()=>{confirm.setTitle(writerUi('Remover perfil?','Remove profile?'));
        confirm.contentEl.createEl('p',{text:p.name});
        new Setting(confirm.contentEl).addButton(b=>b.setButtonText(writerUi('Cancelar','Cancel')).onClick(()=>confirm.close()))
          .addButton(b=>b.setButtonText(writerUi('Remover','Remove')).setWarning().onClick(async()=>{cfg.profiles.splice(i,1);await plugin.saveSettings();confirm.close();draw();}));
      };confirm.open();
    }));
  });};
  draw();
  new Setting(panel).setName(writerUi('Novo perfil','New profile')).addButton(b=>b.setButtonText(writerUi('Adicionar perfil','Add profile')).setCta().onClick(async()=>{
    cfg.profiles.push({name:writerUi('Novo perfil','New profile'),folder:'',instructions:''});await plugin.saveSettings();draw();
  }));
}
function writerV4Register(plugin){
  plugin.addCommand({id:'v4-selective-review',name:'Basic AI: '+writerUi('Revisar seleção com diff','Review selection with diff'),editorCallback:()=>writerV4OpenDiff(plugin)});
}
