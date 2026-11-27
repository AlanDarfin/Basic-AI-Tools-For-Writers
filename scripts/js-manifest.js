'use strict';
// Preserve declaration and override order. A source ID is the stable bundle
// marker. Its location may change independently. Domains describe ownership.
const domains=Object.freeze(['core','platform','editor','blocks','writing','projects','workspace','integrations','settings','persistence','compat']);
const entries=Object.freeze(validateEntries([
 ['src/v3/core.js','core'],
 ['src/v3/complements.js','writing'],
 ['src/v3/variants.js','writing'],
 ['src/v3/snapshots.js','persistence'],
 ['src/v3/workspace.js','workspace'],
 ['src/v3/final-suite.js','writing'],
 ['src/v3/tts-online.js','integrations'],
 ['src/v4/editor.js','editor','src/editor/editor.js'],
 ['src/v4/integrations.js','integrations'],
 ['src/v4/auto-grammar.js','writing','src/writing/auto-grammar.js'],
 ['src/v4/modules.js','settings'],
 ['src/v4/cursor-memory.js','editor','src/editor/cursor-memory.js'],
 ['src/v5/keyshots.js','editor','src/editor/keyshots.js'],
 ['src/v5/extended-syntax.js','editor','src/editor/extended-syntax.js'],
 ['src/v5/pandoc-syntax.js','editor','src/editor/pandoc-syntax.js'],
 ['src/v5/pandoc-export.js','writing','src/writing/pandoc-export.js'],
 ['src/v5/pandoc-format-compat.js','compat','src/compat/pandoc-format-compat.js'],
 ['src/v5/easy-typing.js','editor','src/editor/easy-typing.js'],
 ['src/v5/easy-advanced.js','editor','src/editor/easy-advanced.js'],
 ['src/v5/smart-typography.js','editor','src/editor/smart-typography.js'],
 ['src/v5/workspace-ux.js','workspace'],
 ['src/v5/project-metadata.js','projects'],
 ['src/v6/foundation.js','core'],
 ['src/v6/reading.js','editor','src/editor/reading.js'],
 ['src/v6/markup.js','editor','src/editor/markup.js'],
 ['src/v6/linter.js','writing','src/writing/linter.js'],
 ['src/v6/longform-navigation.js','projects'],
 ['src/v6/project-workspace.js','projects'],
 ['src/v6/smart-insert.js','editor','src/editor/smart-insert.js'],
 ['src/v7/worldbuilding.js','projects'],
 ['src/v7/story-studio.js','projects'],
 ['src/v7/timeline-studio.js','projects'],
 ['src/v7/longform-rc.js','projects'],
 ['src/v7/stable.js','core'],
 ['src/v8/block-edit.js','blocks'],
 ['src/v8/format-blocks.js','blocks'],
 ['src/v8/folder-overview.js','blocks'],
 ['src/v8/inline-ai.js','writing'],
 ['src/v8/social-post.js','blocks'],
 ['src/v8/media-gallery.js','blocks'],
 ['src/v8/finish-blocks.js','blocks'],
 ['src/v8/home-utilities.js','workspace'],
 ['src/v8/home-fuzzy.js','workspace'],
 ['src/v8/writing-calendar.js','workspace'],
 ['src/v8/writing-study.js','writing'],
 ['src/v8/writing-home.js','workspace'],
 ['src/v9/context-toolbar.js','editor','src/editor/context-toolbar.js'],
 ['src/v9/native-explorer.js','workspace'],
 ['src/v9/smart-spaces.js','workspace'],
 ['src/v9/spaces-dock.js','workspace'],
 ['src/v9/password-lock.js','workspace'],
 ['src/v9/calendar-core.js','workspace'],
 ['src/v9/calendar-studio.js','workspace'],
 ['src/v9/soundscapes.js','integrations'],
 ['src/v9/click-clack.js','editor','src/editor/click-clack.js'],
 ['src/v9/explorer-flex.js','workspace'],
 ['src/v9/virtual-content.js','blocks'],
 ['src/v9/explorer-favorites-preview.js','workspace'],
 ['src/v9/interactive-widgets.js','blocks'],
 ['src/v9/research-style.js','writing'],
 ['src/v9/session-drafts.js','writing'],
 ['src/v9/pretty-properties.js','editor','src/editor/pretty-properties.js'],
 ['src/v9/flow-composer.js','editor','src/editor/flow-composer.js'],
 ['src/v9/flow-slash.js','editor','src/editor/flow-slash.js'],
 ['src/v9/pomodoro.js','workspace'],
 ['src/v9/timeline-blocks.js','blocks'],
 ['src/v10/bookshelf.js','projects'],
 ['src/v10/toolbox.js','workspace'],
 ['src/v10/space-history.js','workspace'],
 ['src/v10/enhancements.js','core'],
 ['src/v10/calendar-exchange.js','integrations'],
 ['src/v10/image-inserter.js','editor','src/editor/image-inserter.js'],
 ['src/v10/inline-alignment.js','editor','src/editor/inline-alignment.js'],
 ['src/v10/discovery.js','workspace'],
 ['src/v10/startup-cleanup.js','core'],
 ['src/v10/block-dragger.js','editor','src/editor/block-dragger.js'],
 ['src/v10/historical-helpers.js','compat','src/compat/historical-helpers.js'],
 ['src/v10/data-tables.js','blocks'],
 ['src/v10/zotero-web.js','integrations','src/integrations/zotero-web.js'],
 ['src/v10/study-fsrs.js','writing'],
 ['src/v10/calendar-feeds.js','integrations','src/integrations/calendar-feeds.js'],
 ['src/v10/story-graph.js','projects'],
 ['src/v10/editor-pro.js','editor','src/editor/editor-pro.js'],
 ['src/v10/speech-accessibility.js','integrations'],
 ['src/v10/media-drag-extension.js','editor','src/editor/media-drag-extension.js'],
 ['src/v10/integrations-107.js','integrations'],
 ['src/v10/sidebar-width-1010.js','workspace'],
 ['src/v10/suite-education-1011.js','integrations'],
 ['src/v10/suite-notion-1011.js','integrations'],
 ['src/v10/suite-numbering-1011.js','editor','src/editor/suite-numbering-1011.js'],
 ['src/v11/longform-studio.js','projects'],
 ['src/v11/database-workflow.js','workspace'],
 ['src/v11/numbering-extensions.js','editor','src/editor/numbering-extensions.js'],
 ['src/v11/database-builder.js','workspace'],
 ['src/v11/mobile-panel-actions.js','platform'],
 ['src/v12/unified-toolkit.js','core'],
 ['src/v12/secure-notes.js','workspace'],
 ['src/v12/task-workbench.js','writing'],
 ['src/v12/image-annotations.js','editor','src/editor/image-annotations.js'],
 ['src/v12/selection-reader.js','editor','src/editor/selection-reader.js'],
 ['src/v12/mobile-ux-1201.js','platform'],
 ['src/v12/settings-hub-1201.js','settings'],
 ['src/v13/ui-foundation.js','core'],
 ['src/v13/story-planning.js','projects'],
 ['src/v13/editorial-queue.js','projects'],
 ['src/v13/prose-rhythm.js','writing'],
 ['src/v13/settings-catalog.js','settings'],
 ['src/v13/settings-search-index.js','settings'],
 ['src/v13/grammar-settings.js','settings','src/settings/grammar-settings.js'],
 ['src/v13/setup-guide.js','settings'],
 ['src/v13/core-workflows.js','writing'],
 ['src/v13/translation-services.js','integrations'],
 ['src/v13/draft-recovery.js','persistence'],
 ['src/v13/draft-recovery-ui.js','writing'],
 ['src/v13/longform-dividers.js','projects'],
 ['src/v13/companion-toolkit.js','integrations'],
 ['src/v13/companion-notes.js','integrations'],
 ['src/v13/companion-sync.js','integrations'],
 ['src/v13/grammar-companion.js','integrations','src/integrations/grammar-companion.js'],
 ['src/v13/companion-layout.js','integrations'],
 ['src/v13/companion-bridge.js','integrations'],
 ['src/v13/native-support-settings.js','settings'],
 ['src/v13/mobile-status.js','platform'],
 ['src/v13/visual-kit.js','integrations'],
]).map(([id,domain,path=id])=>Object.freeze({id,domain,path})));
const sourceIds=Object.freeze(entries.map(entry=>entry.id));

function resolveSourcePath(id){
 const entry=entries.find(row=>row.id===id);
 if(!entry)throw Error('Unknown JS source ID: '+id);
 return entry.path;
}

function validateEntries(rows){
 if(!Array.isArray(rows)||!rows.length)throw Error('Empty JS manifest');
 const sources=new Set(),ids=new Set();
 const modulePath=/^src\/(?:[a-z0-9-]+\/)+[a-z0-9-]+\.js$/;
 for(const row of rows){
  if(!Array.isArray(row)||row.length<2||row.length>3)throw Error('Invalid JS manifest entry');
  const [id,domain,path=id]=row;
  if(typeof id!=='string'||typeof path!=='string'||!modulePath.test(id)||!modulePath.test(path))
   throw Error('Invalid JS module: '+id+' at '+path);
  if(!domains.includes(domain))throw Error('Invalid JS domain: '+domain);
  if(ids.has(id))throw Error('Duplicate JS source ID: '+id);
  if(sources.has(path))throw Error('Duplicate JS source path: '+path);
  ids.add(id);
  sources.add(path);
 }
 return rows;
}

const legacyDictionary=Object.freeze({
 path:'src/writing/legacy-dictionary.js',
 anchor:'function parseDictionary('
});
module.exports={domains,entries,sourceIds,legacyDictionary,validateEntries,resolveSourcePath};
