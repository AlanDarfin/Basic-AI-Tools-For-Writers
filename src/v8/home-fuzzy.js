'use strict';
/* Small deterministic, dependency-free fuzzy matcher for homepage. */
function writerV83Fold(value){
 return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
}
function writerV83EditOne(a,b){
 if(Math.abs(a.length-b.length)>1)return false;
 if(a===b)return true;
 let i=0,j=0,errors=0;
 while(i<a.length&&j<b.length){
  if(a[i]===b[j]){i++;j++;continue;}
  if(++errors>1)return false;
  if(a.length>b.length)i++;
  else if(b.length>a.length)j++;
  else {i++;j++;}
 }
 return errors+(a.length-i)+(b.length-j)<=1;
}
function writerV83FuzzyScore(hay,needle){
 const text=writerV83Fold(hay),term=writerV83Fold(needle);
 if(!text||!term)return -1;
 if(text===term)return 1100;
 if(text.startsWith(term))return 900-Math.min(text.length-term.length,90);
 const pos=text.indexOf(term);
 if(pos>=0)return (pos===0||/[^\p{L}\p{N}]/u.test(text[pos-1])?780:640)-Math.min(pos,160);
 const words=text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
 if(term.length>=3&&words.some(w=>writerV83EditOne(w,term)))return 535;
 let p=0,gaps=0,last=-1;
 for(let i=0;i<text.length&&p<term.length;i++){
  if(text[i]!==term[p])continue;
  if(last>=0)gaps+=i-last-1;
  last=i;p++;
 }
 if(p!==term.length)return -1;
 // Avoid returning unrelated files based on a few scattered letters.
 const spread=last-text.indexOf(term[0])+1;
 if(term.length<3||gaps>Math.max(4,term.length*2)||spread>term.length*3)return -1;
 return 340-Math.min(gaps*10,240);
}
function writerV83FuzzySearch(files,query,cache,max=12){
 const term=writerV83Fold(query);
 if(!term||!Array.isArray(files))return [];
 const tokens=term.split(/\s+/).filter(Boolean).slice(0,5);
 return files.map(file=>{
  const title=String(file.basename||''),path=String(file.path||'');
  const headings=(cache?.getFileCache?.(file)?.headings||[]).slice(0,60);
  const scoreTokens=tokens.map(token=>{
   const titleScore=writerV83FuzzyScore(title,token);
   const pathScore=writerV83FuzzyScore(path,token);
   const headingScore=headings.reduce((best,h)=>Math.max(best,writerV83FuzzyScore(h.heading,token)), -1);
   return Math.max(titleScore, pathScore>=0?pathScore-70:-1,headingScore>=0?headingScore-110:-1);
  });
  if(scoreTokens.some(s=>s<0))return null;
  return {file,score:scoreTokens.reduce((a,b)=>a+b,0)};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||
  String(a.file.basename).localeCompare(String(b.file.basename),undefined,{sensitivity:'base'}))
  .slice(0,Math.max(1,Math.min(30,max))).map(x=>x.file);
}
