import fs from 'node:fs';
import {recordHTML} from '../src/content.js';
const data=JSON.parse(fs.readFileSync('public/content/resume.json','utf8'));
const html=data.records.toSorted((a,b)=>a.sort-b.sort).map(r=>recordHTML(r,data.sources)).join('\n');
const page=fs.readFileSync('index.html','utf8').replace(/<!-- RECORDS_START -->[\s\S]*?<!-- RECORDS_END -->/,`<!-- RECORDS_START -->\n${html}\n<!-- RECORDS_END -->`);
fs.writeFileSync('index.html',page);
let map="# World objects and résumé facts\n\nThe harbour is fictional. Every factual entry is sourced in public/content/resume.json. Decorations such as the boat, trees and jetty are scenery and make no biographical claim.\n\n";
for(const p of data.places){map+=`## ${p.name}\n\nObject: ${p.object}. Scene position: ${p.position.join(', ')}.\n\n| Entry | Role or study | Organisation | Dates | Source |\n|---|---|---|---|---|\n`;for(const r of data.records.filter(r=>r.place===p.id))map+=`| ${r.id} | ${r.title} | ${r.organisation} | ${r.dates} | ${r.sources.map(s=>`${s.id}, p. ${s.page}: ${s.section}`).join('; ')} |\n`;map+='\n';}
fs.writeFileSync('public/content-map.md',map.trimEnd()+'\n');
fs.writeFileSync('public/LICENSE.md',fs.readFileSync('LICENSE.md','utf8').trimEnd()+'\n');
console.log(`Built readable history and content map: ${data.records.length} entries in ${data.places.length} places.`);
