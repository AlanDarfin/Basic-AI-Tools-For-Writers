#!/usr/bin/env node
'use strict';
/* Rebuild / verify the standalone Obsidian main.js from modular local v3 sources. */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const mainPath=path.join(root,'main.js');
const sources=['core','complements','variants','snapshots','workspace','final-suite','tts-online','v4/editor','v4/integrations','v4/auto-grammar','v4/modules','v4/cursor-memory','v5/keyshots','v5/extended-syntax','v5/pandoc-syntax','v5/pandoc-export','v5/easy-typing','v5/easy-advanced','v5/smart-typography','v5/workspace-ux','v5/project-metadata','v6/foundation','v6/reading','v6/markup','v6/linter','v6/longform-navigation','v6/project-workspace','v6/smart-insert','v7/worldbuilding','v7/story-studio','v7/timeline-studio','v7/longform-rc','v7/stable','v8/block-edit','v8/format-blocks','v8/folder-overview','v8/inline-ai','v8/social-post','v8/media-gallery','v8/finish-blocks','v8/home-utilities','v8/home-fuzzy','v8/writing-calendar','v8/writing-study','v8/writing-home','v9/context-toolbar','v9/native-explorer','v9/smart-spaces','v9/spaces-dock','v9/password-lock','v9/calendar-core','v9/calendar-studio','v9/soundscapes','v9/click-clack','v9/explorer-flex','v9/virtual-content','v9/explorer-favorites-preview','v9/interactive-widgets','v9/research-style','v9/session-drafts','v9/pretty-properties','v9/flow-composer','v9/flow-slash','v9/pomodoro','v9/timeline-blocks','v10/bookshelf','v10/toolbox','v10/space-history','v10/enhancements','v10/calendar-exchange','v10/image-inserter','v10/inline-alignment','v10/discovery','v10/startup-cleanup','v10/block-dragger','v10/historical-helpers','v10/data-tables','v10/zotero-web','v10/study-fsrs','v10/calendar-feeds','v10/story-graph','v10/editor-pro','v10/speech-accessibility','v10/media-drag-extension','v10/integrations-107','v10/sidebar-width-1010','v10/suite-education-1011','v10/suite-notion-1011','v10/suite-numbering-1011','v11/longform-studio','v11/database-workflow','v11/numbering-extensions','v11/database-builder','v11/mobile-panel-actions','v12/unified-toolkit','v12/secure-notes','v12/task-workbench','v12/image-annotations','v12/selection-reader','v12/mobile-ux-1201','v12/settings-hub-1201','v13/ui-foundation','v13/settings-catalog','v13/settings-search-index','v13/grammar-settings','v13/setup-guide','v13/core-workflows','v13/draft-recovery','v13/draft-recovery-ui','v13/longform-dividers','v13/companion-toolkit','v13/companion-notes','v13/companion-sync','v13/grammar-companion','v13/companion-layout','v13/companion-bridge','v13/native-support-settings'];
// 10.8: Advanced modules are restored in the bundle. Their actual activation is
// deferred until after core load and isolated by the 10.7 compatibility switch.
const begin='// BEGIN WRITER V3 MODULES\n';
const end='// END WRITER V3 MODULES';
let main=fs.readFileSync(mainPath,'utf8');
let a=main.indexOf(begin),b=main.indexOf(end,a);
if(a<0||b<0||b<a)throw Error('Missing v3 bundle markers in main.js');
const modules=sources.map(name=>{
 const filename=(name.startsWith('v4/')||name.startsWith('v5/')||name.startsWith('v6/')||name.startsWith('v7/')||name.startsWith('v8/')||name.startsWith('v9/')||name.startsWith('v10/')||name.startsWith('v11/')||name.startsWith('v12/')||name.startsWith('v13/'))?'src/'+name+'.js':'src/v3/'+name+'.js';
 const source=fs.readFileSync(path.join(root,filename),'utf8').replace(/^'use strict';\s*/,'');
 return '// v3 module: '+filename+'\n'+source;
}).join('\n');
const expected=main.slice(0,a+begin.length)+modules+'\n'+main.slice(b);
if(process.argv.includes('--check')){
 if(expected!==main){console.error('main.js v3 modules are outdated. Run node scripts/build-v3.js');process.exitCode=1;}
 else console.log('v3 source and bundled main.js are synchronized.');
}else{
 fs.writeFileSync(mainPath,expected);
 console.log('Rebuilt '+sources.length+' modules into main.js.');
}
