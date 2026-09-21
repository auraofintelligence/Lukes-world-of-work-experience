import fs from 'node:fs';
import assert from 'node:assert/strict';
import {recordHTML} from '../src/content.js';
const data=JSON.parse(fs.readFileSync('public/content/resume.json','utf8'));
const ids=new Set();const places=new Set(data.places.map(p=>p.id));
assert.equal(places.size,data.places.length);
for(const p of data.places){assert(p.position.length===2&&p.position.every(Number.isFinite));assert(data.records.some(r=>r.place===p.id));}
for(const r of data.records){assert(!ids.has(r.id),`Duplicate ${r.id}`);ids.add(r.id);assert(places.has(r.place));assert(['work','education'].includes(r.type));assert(r.title&&r.organisation&&r.dates&&r.summary);assert(Number.isFinite(r.sort));assert(r.sources.length);for(const ref of r.sources){const src=data.sources.find(s=>s.id===ref.id);assert(src&&ref.page>=1&&ref.page<=src.pages&&ref.section);}}
const index=fs.readFileSync('index.html','utf8');
for(const r of data.records)assert(index.includes(`id="record-${r.id}"`),`Missing no-JS entry ${r.id}`);
const fake={...data.records[0],title:'<img src=x onerror=alert(1)>'};assert(recordHTML(fake,data.sources).includes('&lt;img'));
assert(!JSON.stringify(data).match(/490452049|1982-12-03|Sanjay|Rhys Yorke|@gmail\.com/i),'Private material in data');
assert(data.records.every(r=>!/founder|volunteer|solopreneur/i.test(r.title)), 'Excluded role in data');
assert(data.records.find(r=>r.id==='evocca').note.includes('Not completed'));
assert(data.records.find(r=>r.id==='automotive-study').note.includes('needs confirmation'));
assert(data.records.find(r=>r.id==='yorke').note.includes('not been confirmed'));
for(const path of ['src/main.js','src/world.js','src/style.css','public/favicon.svg','public/assets/harbour-concept.png','public/content-map.md','public/sources.md','LICENSE.md'])assert(fs.existsSync(path),`Missing ${path}`);
if(fs.existsSync('dist/index.html')){const built=fs.readFileSync('dist/index.html','utf8');for(const match of built.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)){const file=match[1].slice(2);assert(fs.existsSync('dist/'+file),`Broken built asset ${file}`);}assert(!built.includes('/src/main.js'));}
console.log(`PASS: ${data.records.length} sourced entries, ${places.size} mapped places, static fallback, qualification caveats, HTML escaping and asset links.`);
