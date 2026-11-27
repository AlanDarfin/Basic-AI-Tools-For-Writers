'use strict';
/* Basic AI v5.2 — optional Longform project metadata stored in index frontmatter. */
const WRITER_PROJECT_LICENSES=[
 ['unspecified','Não definido','Not specified','Não há licença informada; isso não permite reutilização automática.','No license specified; reuse is not automatically allowed.'],
 ['all-rights-reserved','Todos os direitos reservados','All rights reserved','Reprodução e adaptação exigem autorização, salvo exceções legais.','Reuse and adaptation require permission, subject to legal exceptions.'],
 ['cc-by-4.0','CC BY 4.0 — Atribuição','CC BY 4.0 — Attribution','Permite uso e adaptação, inclusive comercial, com crédito.','Use and adaptation, including commercially, with attribution.'],
 ['cc-by-sa-4.0','CC BY-SA 4.0','CC BY-SA 4.0','Permite adaptações com crédito e mesma licença.','Adaptations require attribution and the same license.'],
 ['cc-by-nc-4.0','CC BY-NC 4.0','CC BY-NC 4.0','Uso e adaptação não comerciais, com crédito.','Noncommercial use and adaptation with attribution.'],
 ['cc-by-nd-4.0','CC BY-ND 4.0','CC BY-ND 4.0','Permite compartilhar a obra sem alterações, com crédito.','Allows sharing the unchanged work with attribution.'],
 ['cc-by-nc-sa-4.0','CC BY-NC-SA 4.0','CC BY-NC-SA 4.0','Uso não comercial e adaptações com crédito e mesma licença.','Noncommercial adaptations with attribution and the same license.'],
 ['cc-by-nc-nd-4.0','CC BY-NC-ND 4.0','CC BY-NC-ND 4.0','Compartilhamento inalterado, não comercial, com crédito.','Unchanged noncommercial sharing with attribution.'],
 ['cc0-1.0','CC0 1.0 — Dedicação ao domínio público','CC0 1.0 — Public-domain dedication','O titular renuncia aos direitos até onde a lei permitir.','The rights holder waives rights as far as applicable law allows.'],
 ['public-domain','Domínio público (verifique os direitos)','Public domain (verify rights)','Use apenas se a obra já estiver em domínio público.','Choose only if the work is already in the public domain.']
];
function writerProjectLicenseInfo(id){
 return WRITER_PROJECT_LICENSES.find(([key])=>key===id)||WRITER_PROJECT_LICENSES[0];
}
function writerProjectCoverFiles(app){
 return (app?.vault?.getFiles?.()||[]).filter(file=>file instanceof TFile&&/^(png|jpe?g|webp|gif|svg|avif)$/i.test(file.extension||'')).sort((a,b)=>a.path.localeCompare(b.path));
}
function writerProjectValidCover(app,path){
 const file=typeof path==='string'&&path?app.vault.getAbstractFileByPath(path):null;
 return file instanceof TFile&&/^(png|jpe?g|webp|gif|svg|avif)$/i.test(file.extension||'')?file:null;
}
function writerProjectNormalizeDescription(value){return String(value||'').trim().slice(0,2000);}
function writerProjectRenamedPath(selected,oldPath,newPath){
 if(typeof selected!=='string'||!selected||!oldPath||!newPath)return selected;
 if(selected===oldPath)return newPath;
 if(selected.startsWith(oldPath+'/'))return newPath+selected.slice(oldPath.length);
 return selected;
}
function writerProjectRemember(view,path){
 if(!path||typeof path!=='string')return;
 view.selected=path;
 if(view.plugin.settings.lastLongformProject!==path){
  view.plugin.settings.lastLongformProject=path;
  void view.plugin.saveSettings();
 }
}
function writerProjectMetaRender(view,panel,project){
 const info=panel.createDiv({cls:'writer-project-metadata'});
 info.createEl('h4',{text:lfMsg('Apresentação da história','Story details')});
 const file=writerProjectValidCover(view.app,project.meta.cover);
 const preview=info.createDiv({cls:'writer-project-cover-preview'});
 if(file){
  preview.createEl('img',{attr:{src:view.app.vault.getResourcePath(file),alt:lfMsg('Capa do projeto ','Cover for project ')+project.title,loading:'lazy'}});
 }else{
  preview.createEl('p',{text:project.meta.cover?lfMsg('Capa não encontrada no cofre.','Cover not found in vault.'):lfMsg('Nenhuma capa selecionada.','No cover selected.'),cls:'dictionary-muted'});
 }
 const current=typeof project.meta.cover==='string'?project.meta.cover:'';
 new Setting(info).setName(lfMsg('Capa','Cover'))
  .setDesc(lfMsg('Escolha uma imagem existente no cofre. O arquivo original não será alterado.','Choose an existing vault image. The source image is not modified.'))
  .addDropdown(d=>{
   d.addOption('',lfMsg('Sem capa','No cover'));
   const files=writerProjectCoverFiles(view.app);
   for(const image of files)d.addOption(image.path,image.path);
   if(current&&!files.some(image=>image.path===current))d.addOption(current,lfMsg('Arquivo ausente: ','Missing file: ')+current);
   d.setValue(current).onChange(async path=>{
    if(path&&!writerProjectValidCover(view.app,path)){new Notice(lfMsg('Selecione uma imagem válida do cofre.','Choose a valid vault image.'));return;}
    project.meta.cover=path;
    await view.updateIndex(project,data=>{if(path)data.cover=path;else delete data.cover;});
   });
  });
 let description=typeof project.meta.description==='string'?project.meta.description:'';
 new Setting(info).setName(lfMsg('Descrição / sinopse','Description / synopsis'))
  .setDesc(lfMsg('Resumo breve da história, salvo no índice Longform (máximo 2.000 caracteres).','Short story summary saved in the Longform index (up to 2,000 characters).'))
  .addTextArea(t=>{
   t.inputEl.rows=4;t.inputEl.maxLength=2000;
   t.setPlaceholder(lfMsg('Sobre o que é esta história?','What is this story about?'))
    .setValue(description).onChange(v=>{description=v;});
  }).addButton(b=>b.setButtonText(lfMsg('Salvar','Save')).onClick(async()=>{
   const value=writerProjectNormalizeDescription(description);
   project.meta.description=value;
   await view.updateIndex(project,data=>{if(value)data.description=value;else delete data.description;});
  }));
 const currentLicense=typeof project.meta.copyright==='string'?project.meta.copyright:'unspecified';
 const explanation=info.createEl('p',{cls:'writer-project-copyright-explanation'});
 const show=value=>{
  const option=writerProjectLicenseInfo(value);
  explanation.setText(lfMsg(option[3],option[4]));
 };
 new Setting(info).setName(lfMsg('Direitos autorais / licença','Copyright / license'))
  .setDesc(lfMsg('Escolha a licença declarada. Leia os termos oficiais antes de oferecer permissões.','Choose the declared license. Read official terms before granting permissions.'))
  .addDropdown(d=>{
   for(const [id,pt,en] of WRITER_PROJECT_LICENSES)d.addOption(id,lfMsg(pt,en));
   if(!WRITER_PROJECT_LICENSES.some(([id])=>id===currentLicense))d.addOption(currentLicense,currentLicense);
   d.setValue(currentLicense).onChange(async value=>{
    show(value);project.meta.copyright=value;
    await view.updateIndex(project,data=>{if(value==='unspecified')delete data.copyright;else data.copyright=value;});
   });
  });
 show(currentLicense);
}
