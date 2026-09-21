import { escapeHTML as e, recordHTML } from './content.js';
const $ = selector => document.querySelector(selector);
let data, world, selected = 0, lastFocus, activeScene = 'work', navigation = 0;
const visited = new Set();
const detail = $('#detail');
const status = $('#status');
const activate = () => { document.body.classList.add('world-active'); status.textContent = ''; };

function renderRoute() {
  $('#place-list').replaceChildren();
  data.places.forEach((place, index) => {
    if (place.scene !== activeScene) return;
    const button = document.createElement('button');
    button.className = 'place-card' + (visited.has(place.id) ? ' visited' : '');
    button.dataset.place = place.id;
    button.innerHTML = `<span>${String(index + 1).padStart(2, '0')} / ${place.kind === 'work' ? 'WORK' : 'LEARNING'}</span><strong>${e(place.name)}</strong>`;
    button.onclick = () => openPlace(index);
    $('#place-list').append(button);
  });
  $('#place-list').scrollLeft = 0;
  $('.route-title > span').textContent = activeScene === 'work' ? 'Every job has its own place' : 'A building for each educator';
  $('.instructions').textContent = 'Drag to explore · Zoom for a closer look · ' + (activeScene === 'work' ? 'Pick a job' : 'Pick a building');
  document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === activeScene)));
  document.body.classList.toggle('education-scene', activeScene === 'education');
  $('.world-heading h1').innerHTML = activeScene === 'education' ? 'A lifetime<br>of learning.' : 'A working life.<br>A world to explore.';
}

async function showScene(id) {
  if (!data) return;
  activeScene = id;
  renderRoute();
  if (world) {
    status.textContent = 'Opening ' + data.scenes.find(s => s.id === id).name.toLowerCase() + '...';
    try { await world.setScene(id); status.textContent = ''; }
    catch { fallback('This illustrated view could not load.'); }
  }
}
document.querySelectorAll('[data-scene]').forEach(button => {
  button.onclick = () => { activate(); showScene(button.dataset.scene); };
});

function closeDetail() {
  navigation++;
  detail.hidden = true;
  $('#scrim').hidden = true;
  document.body.classList.remove('modal-open');
  for (const tag of ['main', 'header', 'footer']) document.querySelector(tag).inert = false;
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  else $('#scene').focus({ preventScroll: true });
}

async function openPlace(index) {
  if (!data) return;
  const request = ++navigation;
  activate();
  if (detail.hidden) lastFocus = document.activeElement;
  selected = (index + data.places.length) % data.places.length;
  const place = data.places[selected];
  visited.add(place.id);
  $('#detail-body').innerHTML = `<h2 id="detail-title">${e(place.name)}</h2><p class="intro">${e(place.hint)}. Look for the ${e(place.object.toLowerCase())}.</p>${data.records.filter(r => r.place === place.id).sort((a, b) => a.sort - b.sort).map(r => recordHTML(r, data.sources, false)).join('')}`;
  detail.hidden = false;
  $('#scrim').hidden = false;
  detail.scrollTop = 0;
  document.body.classList.add('modal-open');
  for (const tag of ['main', 'header', 'footer']) document.querySelector(tag).inert = true;
  $('#detail-close').focus();
  $('#progress').textContent = `${visited.size} places discovered`;
  if (activeScene !== place.scene) await showScene(place.scene);
  if (request !== navigation) return;
  document.querySelectorAll(`[data-place="${place.id}"]`).forEach(button => button.classList.add('visited'));
  world?.focus(place);
}
$('#detail-close').onclick = closeDetail;
$('#scrim').onclick = closeDetail;
$('#previous').onclick = () => openPlace(selected - 1);
$('#next').onclick = () => openPlace(selected + 1);
document.addEventListener('keydown', event => {
  if (detail.hidden) return;
  if (event.key === 'Escape') closeDetail();
  if (event.key === 'Tab') {
    const all = [...detail.querySelectorAll('button,summary,a')];
    const first = all[0], last = all.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
$('#enter').onclick = () => { activate(); $('#scene').focus({ preventScroll: true }); };
for (const id of ['tour', 'tour-start']) $('#' + id).onclick = () => openPlace(data?.places.findIndex(p => p.scene === activeScene) ?? 0);
$('#about-open').onclick = () => $('#about').showModal();
$('#about-close').onclick = () => $('#about').close();
$('#read-history').onclick = () => $('#history').focus();

function filter() {
  const query = $('#search').value.trim().toLowerCase(), type = $('#filter').value;
  let count = 0;
  document.querySelectorAll('#records .record').forEach(element => {
    const show = (!query || element.textContent.toLowerCase().includes(query)) && (type === 'all' || element.dataset.type === type);
    element.hidden = !show;
    if (show) count++;
  });
  $('#result-count').textContent = `${count} documented entries so far`;
  $('#no-results').hidden = count > 0;
}
$('#search').addEventListener('input', filter);
$('#filter').addEventListener('change', filter);
filter();
function fallback(reason) {
  document.body.classList.add('fallback');
  status.textContent = reason + ' Every record is available below.';
  $('#enter').textContent = 'Explore the places ↓';
  $('#enter').onclick = () => document.querySelector('.places').scrollIntoView();
}
async function init() {
  try {
    const response = await fetch('./content/resume.json');
    if (!response.ok) throw Error('Content not available');
    data = await response.json();
  } catch { fallback('The world could not load.'); return; }
  $('#records').innerHTML = data.records.toSorted((a, b) => a.sort - b.sort).map(r => recordHTML(r, data.sources)).join('');
  filter();
  renderRoute();
  $('#surprise').onclick = () => {
    const candidates = data.places.map((place, index) => ({ place, index })).filter(({ place }) => place.scene === activeScene);
    openPlace(candidates[Math.floor(Math.random() * candidates.length)].index);
  };
  try {
    const { createWorld } = await import('./world.js');
    world = await createWorld($('#scene'), data, openPlace, () => fallback('3D is unavailable in this browser.'));
    if (activeScene !== 'work') await world.setScene(activeScene);
    status.textContent = '';
    $('#zoom-in').onclick = () => world.zoom(1.2);
    $('#zoom-out').onclick = () => world.zoom(1 / 1.2);
    $('#reset').onclick = () => world.reset();
    const motion = $('#motion');
    let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function updateMotion() {
      world.pause(paused);
      motion.setAttribute('aria-pressed', String(paused));
      motion.setAttribute('aria-label', paused ? 'Play moving details' : 'Pause moving details');
      motion.textContent = paused ? '▷' : 'Ⅱ';
    }
    updateMotion();
    motion.onclick = () => { paused = !paused; updateMotion(); };
  } catch (error) { console.warn('3D fallback:', error.message); fallback('3D is unavailable in this browser.'); }
}
init();
