#!/usr/bin/env node
'use strict';
// Keep source styles modular while shipping Obsidian's single styles.css.
const fs=require('node:fs');
const {pruneDuplicateDeclarations}=require('./css-v13-dedupe.js');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const cssPath=path.join(root,'styles.css');
const sections=['v8-navigation.css','v8-review-mobile.css','v8-polish.css','v8-format-blocks.css','v8-folder-inscribe.css','v8-interactive-media.css','v8-finish-suite.css','v8-calendar-studies.css','v9-final.css','v9-calendar-studio.css','v9-design-system.css','v9-1-unified.css','v9-1-2-virtual-content.css','v9-2-suite.css','v9-2-2-iconic-fixes.css','v9-2-3-home-title-favorites.css','v9-2-4-dashboard.css','v9-2-6-dashboard.css','v9-3-1-pomodoro.css','v9-5-timeline.css','v9-5-1-chat.css','v9-5-2-chat-audio.css','v10-consistency.css','v10-1-extensions.css','v10-2-workflow.css','v11-longform-studio.css','v11-1-integration.css','v11-1-2-mobile-panels.css','v12-0-1-mobile.css','v12-0-5-home-widgets.css','v12-0-5-timeline-dragger.css','v13-foundation.css','v13-recovery.css','v13-6-projects.css','v13-6-settings.css','v13-6-home.css','v13-6-tools.css','v13-7-settings.css','v13-7-typewriter.css','v13-7-review.css','v13-8-companions.css','v13-8-grammar-compat.css','v13-9-native-focus.css','v13-9-native-tasks.css','v13-9-mobile-ui.css'];
const begin='/* BEGIN V8 MODULAR STYLES */';
const end='/* END V8 MODULAR STYLES */';
const actual=fs.readFileSync(cssPath,'utf8');
const i=actual.indexOf(begin);
const original=(i>=0?actual.slice(0,i):actual).trimEnd();
const append=sections.map(name=>fs.readFileSync(path.join(root,'src/styles',name),'utf8').trimEnd()).join('\n\n');
const generated=original+'\n\n'+begin+'\n'+append+'\n'+end+'\n';
const {css:expected}=pruneDuplicateDeclarations(generated);
if(process.argv.includes('--check')){
 if(actual!==expected){console.error('styles.css is out of sync. Run npm run build:css');process.exitCode=1;}
 else console.log('styles.css matches its modular sources.');
}else{
 fs.writeFileSync(cssPath,expected);
 console.log('Built Obsidian styles.css from '+sections.length+' v8 style modules.');
}
