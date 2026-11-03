'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('src/styles/v9-calendar-studio.css','utf8');
const bundle=fs.readFileSync('styles.css','utf8');
const calendar=fs.readFileSync('src/v9/calendar-studio.js','utf8');
test('mobile day numbers are upper-left without circular backgrounds',()=>{
 const small=source.slice(source.indexOf('/* 9.0.4:'));
 assert.match(small,/@media\s*\(max-width:680px\)/);
 assert.match(small,/body\.is-mobile/);
 assert.match(small,/writer-v9-calendar-month-dayhead\s*\{\s*justify-content:flex-start/);
 assert.match(small,/writer-v9-calendar-month-dayhead \.writer-v9-calendar-button/);
 assert.match(small,/border-radius:0;background:transparent;box-shadow:none/);
 assert.match(small,/min-width:0;width:auto;min-height:24px/);
});
test('current day colors entire tile, not the date button, in narrow and native mobile',()=>{
 const small=source.slice(source.indexOf('/* 9.0.4:'));
 const currentDay=small.match(/\.writer-v9-calendar-month-day\.is-today\s*\{\s*background:var\(--interactive-accent\);border-color:var\(--interactive-accent\);/g)||[];
 assert.equal(currentDay.length,2,'native mobile and narrow viewports each have tile coloring');
 assert.match(small,/color:var\(--text-on-accent\)/);
 assert.match(small,/\.is-today \.writer-v9-calendar-month-dayhead \.writer-v9-calendar-button\{/);
 assert.ok(bundle.includes(small),'shipping stylesheet must contain mobile corrections');
});
test('date button keeps day-navigation click behavior and calendar events',()=>{
 assert.match(calendar,/view\.anchor=day;view\.mode='day';view\.render\(\);/);
 assert.match(calendar,/writerV9CalendarEntry\(view,box,event,true\)/);
 assert.match(calendar,/day===writerV83DateOf\(new Date\(\)\)\?' is-today'/);
});
