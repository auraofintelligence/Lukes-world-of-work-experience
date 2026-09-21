import { escapeHTML as e, recordHTML } from './content.js';
const $ = s => document.querySelector(s);
let data, world, selected = 0, lastFocus;
const visited = new Set();
const detail = $('#detail');
const status = $('#status');
const activate = () => { document.body.classList.add('world-active'); status.textContent = ''; };
function closeDetail(){detail.hidden = true; $('#scrim').hidden = true; document.body.classList.remove('modal-open'); document.querySelector('main').inert = false; document.querySelector('header').inert = false; document.querySelector('footer').inert = false; lastFocus?.focus();}
function openPlace(index){
  if(!data) return;
  activate();
  if(detail.hidden) lastFocus = document.activeElement;
  selected = (index + data.places.length) % data.places.length;
  const p = data.places[selected]; visited.add(p.id);
  $('#detail-body').innerHTML = `<h2 id="detail-title">${e(p.name)}</h2><p class="intro">${e(p.hint)}. Look for the ${e(p.object.toLowerCase())}.</p>${data.records.filter(r=>r.place===p.id).sort((a,b)=>a.sort-b.sort).map(r=>recordHTML(r,data.sources,false)).join('')}`;
  detail.hidden=false; $('#scrim').hidden=false; detail.scrollTop=0; document.body.classList.add('modal-open');
  for(const tag of ['main','header','footer']) document.querySelector(tag).inert=true;
  $('#detail-close').focus();
  $('#progress').textContent=`${visited.size} of ${data.places.length} places discovered`;
  document.querySelectorAll(`[data-place="${p.id}"]`).forEach(b=>b.classList.add('visited'));
  world?.focus(p.position);
}
$('#detail-close').onclick=closeDetail; $('#scrim').onclick=closeDetail;
$('#previous').onclick=()=>openPlace(selected-1); $('#next').onclick=()=>openPlace(selected+1);
document.addEventListener('keydown',event=>{
  if(detail.hidden)return;
  if(event.key==='Escape')closeDetail();
  if(event.key==='Tab'){
    const all=[...detail.querySelectorAll('button,summary,a')]; const first=all[0],last=all.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
$('#enter').onclick=()=>{activate();$('#scene').focus();};
for(const id of ['tour','tour-start']) $('#'+id).onclick=()=>openPlace(0);
$('#about-open').onclick=()=>$('#about').showModal(); $('#about-close').onclick=()=>$('#about').close();
$('#read-history').onclick=()=>$('#history').focus();
function filter(){
  const q=$('#search').value.trim().toLowerCase(), type=$('#filter').value;
  let count=0;
  document.querySelectorAll('#records .record').forEach(el=>{const show=(!q||el.textContent.toLowerCase().includes(q))&&(type==='all'||el.dataset.type===type);el.hidden=!show;if(show)count++;});
  $('#result-count').textContent=`${count} entries`; $('#no-results').hidden=count>0;
}
$('#search').addEventListener('input',filter); $('#filter').addEventListener('change',filter); filter();
function fallback(reason){document.body.classList.add('fallback');status.textContent=reason+' Every chapter is available below.';$('#enter').textContent='Explore the chapters ↓';$('#enter').onclick=()=>document.querySelector('.places').scrollIntoView();}
async function init(){
  try{const res=await fetch('./content/resume.json');if(!res.ok)throw Error('Content not available');data=await res.json();}
  catch{fallback('The harbour could not load.');return;}
  // The static list is generated from the same file for browsers without JavaScript.
  $('#records').innerHTML=data.records.toSorted((a,b)=>a.sort-b.sort).map(r=>recordHTML(r,data.sources)).join('');filter();
  data.places.forEach((p,i)=>{
    const b=document.createElement('button'); b.className='place-card';b.dataset.place=p.id;b.innerHTML=`<span>${String(i+1).padStart(2,'0')} / ${data.records.filter(r=>r.place===p.id).length} entries</span><strong>${e(p.name)}</strong>`;b.onclick=()=>openPlace(i);$('#place-list').append(b);
  });
  $('#surprise').onclick=()=>{activate();const ids=['waap','drive-safe','australia-post','evocca'];const id=ids[Math.floor(Math.random()*ids.length)];const r=data.records.find(x=>x.id===id);openPlace(data.places.findIndex(p=>p.id===r.place));[...detail.querySelectorAll('.record')].find(el=>el.querySelector('h3').textContent===r.title)?.scrollIntoView({block:'center'});};
  try {const {createWorld}=await import('./world.js');world=createWorld($('#scene'),data.places,openPlace,()=>fallback('3D is unavailable in this browser.'));status.textContent='';$('#zoom-in').onclick=()=>world.zoom(1.2);$('#zoom-out').onclick=()=>world.zoom(1/1.2);$('#reset').onclick=()=>world.reset();const motion=$('#motion');let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;function updateMotion(){world.pause(paused);motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',paused?'Play moving details':'Pause moving details');motion.textContent=paused?'▷':'Ⅱ';}updateMotion();motion.onclick=()=>{paused=!paused;updateMotion();};}
  catch(error){console.warn('3D fallback:',error.message);fallback('3D is unavailable in this browser.');}
}
init();
