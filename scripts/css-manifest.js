'use strict';
// Ordered manifest: category is ownership metadata, never cascade priority.
// Keep paths stable until references and byte-equivalent builds have been checked.
const categories=Object.freeze(["core","native","editor","blocks","mobile","compat","features"]);
const entries=Object.freeze([
 Object.freeze({path:'v8-navigation.css',category:'native'}),
 Object.freeze({path:'v8-review-mobile.css',category:'mobile'}),
 Object.freeze({path:'v8-polish.css',category:'features'}),
 Object.freeze({path:'v8-format-blocks.css',category:'blocks'}),
 Object.freeze({path:'v8-folder-inscribe.css',category:'blocks'}),
 Object.freeze({path:'v8-interactive-media.css',category:'blocks'}),
 Object.freeze({path:'v8-finish-suite.css',category:'features'}),
 Object.freeze({path:'v8-calendar-studies.css',category:'features'}),
 Object.freeze({path:'v9-final.css',category:'features'}),
 Object.freeze({path:'v9-calendar-studio.css',category:'features'}),
 Object.freeze({path:'v9-design-system.css',category:'core'}),
 Object.freeze({path:'v9-1-unified.css',category:'features'}),
 Object.freeze({path:'v9-1-2-virtual-content.css',category:'blocks'}),
 Object.freeze({path:'v9-2-suite.css',category:'features'}),
 Object.freeze({path:'v9-2-2-iconic-fixes.css',category:'native'}),
 Object.freeze({path:'v9-2-3-home-title-favorites.css',category:'features'}),
 Object.freeze({path:'v9-2-4-dashboard.css',category:'features'}),
 Object.freeze({path:'v9-2-6-dashboard.css',category:'features'}),
 Object.freeze({path:'v9-3-1-pomodoro.css',category:'features'}),
 Object.freeze({path:'v9-5-timeline.css',category:'blocks'}),
 Object.freeze({path:'v9-5-1-chat.css',category:'blocks'}),
 Object.freeze({path:'v9-5-2-chat-audio.css',category:'blocks'}),
 Object.freeze({path:'v10-consistency.css',category:'core'}),
 Object.freeze({path:'v10-1-extensions.css',category:'features'}),
 Object.freeze({path:'v10-2-workflow.css',category:'features'}),
 Object.freeze({path:'v11-longform-studio.css',category:'features'}),
 Object.freeze({path:'v11-1-integration.css',category:'features'}),
 Object.freeze({path:'v11-1-2-mobile-panels.css',category:'mobile'}),
 Object.freeze({path:'v12-0-1-mobile.css',category:'mobile'}),
 Object.freeze({path:'v12-0-5-home-widgets.css',category:'features'}),
 Object.freeze({path:'v12-0-5-timeline-dragger.css',category:'blocks'}),
 Object.freeze({path:'v13-foundation.css',category:'core'}),
 Object.freeze({path:'v13-recovery.css',category:'features'}),
 Object.freeze({path:'v13-6-projects.css',category:'features'}),
 Object.freeze({path:'v13-6-settings.css',category:'features'}),
 Object.freeze({path:'v13-6-home.css',category:'features'}),
 Object.freeze({path:'v13-6-tools.css',category:'features'}),
 Object.freeze({path:'v13-7-settings.css',category:'features'}),
 Object.freeze({path:'v13-7-typewriter.css',category:'editor'}),
 Object.freeze({path:'v13-7-review.css',category:'features'}),
 Object.freeze({path:'v13-8-companions.css',category:'features'}),
 Object.freeze({path:'v13-8-grammar-compat.css',category:'compat'}),
 Object.freeze({path:'v13-9-native-focus.css',category:'native'}),
 Object.freeze({path:'v13-9-native-tasks.css',category:'native'}),
 Object.freeze({path:'v13-9-mobile-ui.css',category:'mobile'}),
 Object.freeze({path:'v13-story-planning.css',category:'features'}),
 Object.freeze({path:'v13-editorial-queue.css',category:'features'}),
 Object.freeze({path:'v13-prose-rhythm.css',category:'editor'}),
 Object.freeze({path:'v13-visual-kit.css',category:'blocks'}),
 Object.freeze({path:'panel-density.css',category:'core'}),
 Object.freeze({path:'compat/legacy-dictionary-settings.css',category:'compat'}),
 Object.freeze({path:'compat/legacy-templates.css',category:'compat'}),
 Object.freeze({path:'editor/legacy-writing-tools.css',category:'editor'}),
]);
function validateEntries(items){
 if(!Array.isArray(items)||!items.length)throw Error('Empty CSS manifest');
 const seen=new Set();
 for(const item of items){
  if(!item||typeof item.path!=='string'||! /^(?:[a-z0-9-]+\/)*[a-z0-9-]+\.css$/.test(item.path))throw Error('Invalid CSS module path: '+item?.path);
  if(!categories.includes(item.category))throw Error('Invalid CSS category: '+item.category);
  if(seen.has(item.path))throw Error('Duplicate CSS module: '+item.path);
  seen.add(item.path);
 }
 return items.map(item=>item.path);
}
const sections=Object.freeze(validateEntries(entries));
module.exports={categories,entries,sections,validateEntries};
