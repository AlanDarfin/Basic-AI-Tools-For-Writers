'use strict';
/* Basic AI v6 — bounded Markdown scanning shared by all opt-in additions. */
function writerV6ProtectedRanges(source){
 const text=String(source||''),ranges=[];let offset=0,fence=null,front=false;
 for(const line of text.split('\n')){
  const end=offset+line.length,trim=line.trim();
  if(offset===0&&trim==='---'){front=true;ranges.push([offset,end]);offset=end+1;continue;}
  if(front){ranges.push([offset,end]);if(trim==='---')front=false;offset=end+1;continue;}
  const f=/^ {0,3}(\x60{3,}|~{3,})/.exec(line);
  if(f){
   const marker=f[1];if(!fence)fence=[marker[0],marker.length];
   else if(fence[0]===marker[0]&&marker.length>=fence[1])fence=null;
   ranges.push([offset,end]);offset=end+1;continue;
  }
  if(fence||/^( {4}|\t)/.test(line)){ranges.push([offset,end]);offset=end+1;continue;}
  const rx=/(\x60+)([^\x60\n]*?)\1|!?\[[^\]\n]{0,512}\]\([^\)\n]{0,1000}\)|<https?:\/\/[^>\n]+>|https?:\/\/[^\s<>()]+/g;
  for(const match of line.matchAll(rx))ranges.push([offset+match.index,offset+match.index+match[0].length]);
  offset=end+1;
 }
 return ranges;
}
function writerV6Overlaps(ranges,from,to){return ranges.some(([a,b])=>from<b&&to>a);}
function writerV6SafeTextNodes(root){
 if(!root?.ownerDocument?.createTreeWalker)return [];
 const walker=root.ownerDocument.createTreeWalker(root,4),nodes=[];
 while(walker.nextNode()){
  const n=walker.currentNode;
  if(!n.nodeValue?.trim())continue;
  if(n.parentElement?.closest('a,code,pre,kbd,samp,math,svg,script,style,textarea,ruby,.cm-editor,.writer-v6-rendered,.writer-v5-ext,.writer-v5-fenced-div'))continue;
  nodes.push(n);
 }
 return nodes;
}
function writerV6Allowed(plugin,key){
 return plugin.settings.v6?.[key]?.enabled===true&&writerModuleOn(plugin,key);
}
const WRITER_V6_DEFAULTS={
 readingTime:{enabled:false,wpm:230,skipCode:true,skipFrontmatter:true,status:true},
 timestamps:{enabled:false,locale:'auto',timezone:'local',showRelative:true,recent:[]},
 ruby:{enabled:false,livePreview:true,lv1Size:50,lv2Size:45},
 discordSyntax:{enabled:false,subtext:true,blockSpoilers:false},
 ratings:{enabled:false,symbol:'star',max:5,full:'◆',empty:'◇',half:'◈',showValue:'none'},
 linter:{enabled:false,trimTrailing:true,finalNewline:true,collapseBlanks:false,headingSpace:true,listSpace:true,footnoteSpace:true,quoteSpace:false,yamlSpacing:false,manualOnly:true,excluded:''}
};
function writerV6Merge(settings){
 const original=settings.v6&&typeof settings.v6==='object'&&!Array.isArray(settings.v6)?settings.v6:{};
 const result={};
 for(const [key,defaults] of Object.entries(WRITER_V6_DEFAULTS)){
  const old=original[key]&&typeof original[key]==='object'&&!Array.isArray(original[key])?original[key]:{};
  result[key]={...defaults,...old,enabled:old.enabled===true};
 }
 result.readingTime.wpm=Math.max(60,Math.min(900,Number(result.readingTime.wpm)||230));
 result.ratings.max=Math.max(2,Math.min(10,Math.floor(Number(result.ratings.max)||5)));
 result.ruby.lv1Size=Math.max(25,Math.min(100,Number(result.ruby.lv1Size)||50));
 result.ruby.lv2Size=Math.max(25,Math.min(100,Number(result.ruby.lv2Size)||45));
 result.linter.excluded=String(result.linter.excluded||'').slice(0,3000);
 settings.v6=result;return result;
}
function writerV6Refresh(plugin){try{writerV5RefreshEditors(plugin);}catch(_){}}
