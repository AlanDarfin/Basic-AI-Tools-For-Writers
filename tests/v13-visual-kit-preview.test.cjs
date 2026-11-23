'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {buildSync}=require('../vendor/visual-kit/node_modules/esbuild');
const {JSDOM}=require('../vendor/visual-kit/node_modules/jsdom');

test('full HTML preview disables navigation from HTML links, image maps and SVG anchors',()=>{
 const {outputFiles}=buildSync({entryPoints:['vendor/visual-kit/src/html-notes/FullPreview.ts'],
  bundle:true,format:'iife',globalName:'visualKit',platform:'browser',write:false});
 const {window}=new JSDOM('<main></main>',{runScripts:'outside-only'});
 try{
  const {document}=window;
  window.createEl=tag=>document.createElement(tag);
  const host=document.querySelector('main');
  host.createEl=(tag,{attr})=>{
   const node=document.createElement(tag);
   for(const [name,value] of Object.entries(attr))node.setAttribute(name,value);
   return host.appendChild(node);
  };
  const {fullPreview}=window.eval(outputFiles[0].text+'\nvisualKit');
  fullPreview(host,`<a href="https://preview.invalid/link">Link</a>
   <img src="images/example.png" srcset="https://preview.invalid/image 2x" usemap="#figure">
   <map name="figure"><area href="https://preview.invalid/map" shape="rect" coords="0,0,40,40"></map>
   <svg><a xlink:href="https://preview.invalid/svg"><rect width="40" height="40"/></a></svg>`,
   path=>path==='images/example.png'?'app://vault/example.png':undefined);
  const frame=host.querySelector('iframe');
  const preview=new window.DOMParser().parseFromString(frame.srcdoc,'text/html');
  assert.equal(frame.getAttribute('sandbox'),'');
  assert.match(preview.head.firstElementChild.getAttribute('content'),/default-src 'none'/);
  assert.equal(preview.querySelector('a').hasAttribute('href'),false);
  assert.equal(preview.querySelector('area').hasAttribute('href'),false);
  assert.equal(preview.querySelector('svg a').hasAttribute('xlink:href'),false);
  const image=preview.querySelector('img');
  assert.equal(image.getAttribute('src'),'app://vault/example.png');
  assert.equal(image.hasAttribute('srcset'),false);
 }finally{window.close();}
});
