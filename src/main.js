import { escapeHTML as e, recordHTML } from './content.js';
const $ = selector => document.querySelector(selector);
let data, world, selected = 0, lastFocus, activeScene = 'work', navigation = 0, sceneNavigation = 0;
const visited = new Set();
const detail = $('#detail');
const status = $('#status');
const activate = () => { document.body.classList.add('world-active'); status.textContent = ''; };
const placeLabels = { work: 'WORK', education: 'LEARNING', volunteering: 'VOLUNTEERING' };

function renderSceneNavigation() {
  const navigation = $('.scene-switch');
  navigation.replaceChildren();
  for (const scene of data.scenes) {
    const button = document.createElement('button');
    button.dataset.scene = scene.id;
    button.textContent = scene.name;
    button.setAttribute('aria-pressed', String(scene.id === activeScene));
    button.onclick = () => { activate(); showScene(scene.id); };
    navigation.append(button);
  }
  navigation.hidden = false;
}

function renderRoute() {
  const scene = data.scenes.find(scene => scene.id === activeScene);
  const kinds = new Set(data.places.filter(place => place.scene === activeScene).map(place => place.kind));
  const kind = kinds.size === 1 ? [...kinds][0] : 'mixed';
  $('#place-list').replaceChildren();
  data.places.forEach((place, index) => {
    if (place.scene !== activeScene) return;
    const button = document.createElement('button');
    button.className = 'place-card' + (visited.has(place.id) ? ' visited' : '');
    button.dataset.place = place.id;
    button.innerHTML = `<span>${String(index + 1).padStart(2, '0')} / ${placeLabels[place.kind] || 'HISTORY'}</span><strong>${e(place.name)}</strong>`;
    button.onclick = () => openPlace(index);
    $('#place-list').append(button);
  });
  $('#place-list').scrollLeft = 0;
  const routeLabels = { work: 'Every job has its own place', education: 'A building for each educator', volunteering: 'Discover the volunteering stories' };
  const actions = { work: 'Pick a job', education: 'Pick a building', volunteering: 'Pick a contribution' };
  $('.route-title > span').textContent = scene.routeLabel || routeLabels[kind] || 'Choose a place';
  $('.instructions').textContent = 'Drag to explore · Zoom for a closer look · ' + (actions[kind] || 'Pick a place');
  document.querySelectorAll('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === activeScene)));
  const activeButton = $('.scene-switch [aria-pressed="true"]');
  if (activeButton) $('.scene-switch').scrollLeft = activeButton.offsetLeft - ($('.scene-switch').clientWidth - activeButton.clientWidth) / 2;
  document.body.dataset.worldScene = activeScene;
  $('#world').style.setProperty('--scene-art', `url(${JSON.stringify(new URL(scene.image, document.baseURI).href)})`);
  const defaultHeadings = { work: 'A working life.\nA world to explore.', education: 'A lifetime\nof learning.', volunteering: 'Time shared.\nStories connected.' };
  $('.world-heading h1').innerHTML = e(scene.heading || defaultHeadings[kind] || scene.name).replace(/\n/g, '<br>');
  $('#scene').setAttribute('aria-label', `${scene.name}. Drag to explore, use the zoom buttons for a closer look, or select a numbered place. Arrow keys pan when focused.`);
}

async function showScene(id) {
  const scene = data?.scenes.find(scene => scene.id === id);
  if (!scene) return;
  const request = ++sceneNavigation;
  activeScene = id;
  renderRoute();
  if (world && !document.body.classList.contains('fallback')) {
    $('#world').classList.add('scene-loading');
    status.textContent = 'Opening ' + scene.name.toLowerCase() + '...';
    try {
      await world.setScene(id);
      if (request === sceneNavigation) status.textContent = '';
    } catch {
      if (request === sceneNavigation) fallback('This illustrated view could not load.');
    } finally {
      if (request === sceneNavigation) $('#world').classList.remove('scene-loading');
    }
  }
}

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
  renderSceneNavigation();
  renderRoute();
  $('#surprise').onclick = () => {
    const candidates = data.places.map((place, index) => ({ place, index })).filter(({ place }) => place.scene === activeScene);
    openPlace(candidates[Math.floor(Math.random() * candidates.length)].index);
  };
  try {
    const { createWorld } = await import('./world.js');
    world = await createWorld($('#scene'), data, openPlace, () => fallback('3D is unavailable in this browser.'));
    await showScene(activeScene);
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
