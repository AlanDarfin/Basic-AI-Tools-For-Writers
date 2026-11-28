'use strict';
/* Small deterministic, dependency-free fuzzy matcher for homepage. */
const WRITER_V83_FUZZY_EXACT_SCORE=1100;
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
 return writerV83FuzzyScoreFolded(writerV83Fold(hay),writerV83Fold(needle));
}
function writerV83FuzzyScoreFolded(text,term){
 if(!text||!term)return -1;
 if(text===term)return WRITER_V83_FUZZY_EXACT_SCORE;
 if(text.startsWith(term))return 900-Math.min(text.length-term.length,90);
 const pos=text.indexOf(term);
 if(pos>=0)return (pos===0||/[^\p{L}\p{N}]/u.test(text[pos-1])?780:640)-Math.min(pos,160);
 if(term.length<3)return -1;
 const words=text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
 if(words.some(w=>writerV83EditOne(w,term)))return 535;
 let p=0,gaps=0,last=-1;
 for(let i=0;i<text.length&&p<term.length;i++){
  if(text[i]!==term[p])continue;
  if(last>=0)gaps+=i-last-1;
  last=i;p++;
 }
 if(p!==term.length)return -1;
 // Avoid returning unrelated files based on a few scattered letters.
 const spread=last-text.indexOf(term[0])+1;
 if(gaps>Math.max(4,term.length*2)||spread>term.length*3)return -1;
 return 340-Math.min(gaps*10,240);
}
function writerV83FuzzySearch(files,query,cache,max=12){
 const term=writerV83Fold(query);
 if(!term||!Array.isArray(files))return [];
 const tokens=term.split(/\s+/).filter(Boolean).slice(0,5);
 const pathPenalty=70,headingPenalty=110;
 const matches=[];
 fileLoop: for(const file of files){
  const title=writerV83Fold(file.basename),path=writerV83Fold(file.path);
  let headings,score=0;
  for(const token of tokens){
   const titleScore=writerV83FuzzyScoreFolded(title,token);
   const pathScore=writerV83FuzzyScoreFolded(path,token);
   let best=Math.max(titleScore,pathScore-pathPenalty);
   // Skip heading lookups when even an exact match cannot improve the score.
   if(best<WRITER_V83_FUZZY_EXACT_SCORE-headingPenalty){
    headings??=(cache?.getFileCache?.(file)?.headings||[]).slice(0,60)
     .map(h=>writerV83Fold(h.heading));
    for(const heading of headings){
     const headingScore=writerV83FuzzyScoreFolded(heading,token);
     best=Math.max(best,headingScore-headingPenalty);
     if(headingScore===WRITER_V83_FUZZY_EXACT_SCORE)break;
    }
   }
   if(best<0)continue fileLoop;
   score+=best;
  }
  matches.push({file,score});
 }
 const collator=new Intl.Collator(undefined,{sensitivity:'base'});
 return matches.sort((a,b)=>b.score-a.score||collator.compare(String(a.file.basename),String(b.file.basename)))
  .slice(0,Math.max(1,Math.min(30,max))).map(match=>match.file);
}
