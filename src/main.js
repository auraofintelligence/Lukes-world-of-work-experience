import { escapeHTML as e, recordHTML } from './content.js';
const $ = selector => document.querySelector(selector);
let data, world, selected = 0, lastFocus;
const visited = new Set();
const detail = $('#detail');
const status = $('#status');
const menu = $('#world-menu');
const activate = () => { document.body.classList.add('world-active'); status.textContent = ''; };
const placeLabels = { work: 'WORK', education: 'LEARNING', volunteering: 'VOLUNTEERING' };

function renderRoute() {
  $('#place-list').replaceChildren();
  $('#place-jump').innerHTML = '<option value="">Find a place...</option>';
  data.places.forEach((place, index) => {
    const button = document.createElement('button');
    button.className = 'place-card' + (visited.has(place.id) ? ' visited' : '');
    button.dataset.place = place.id;
    button.innerHTML = `<span>${String(index + 1).padStart(2, '0')} / ${placeLabels[place.kind] || 'HISTORY'}</span><strong>${e(place.name)}</strong>`;
    button.onclick = () => openPlace(index);
    $('#place-list').append(button);
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${String(index + 1).padStart(2, '0')} · ${place.name}`;
    $('#place-jump').append(option);
  });
  $('.route-title > span').textContent = `${data.places.length} places in one connected world`;
  $('.instructions').textContent = 'Drag to explore · Zoom for a closer look · Choose any place';
  $('#world').style.setProperty('--world-art', `url(${JSON.stringify(new URL(data.world.image, document.baseURI).href)})`);
  $('#scene').setAttribute('aria-label', `${data.world.name}. One connected map of work, education and volunteering. Drag or use arrow keys to pan. Use plus and minus to zoom, and Home to see the whole world.`);
}

function renderTicker() {
  const ticker = $('#job-ticker');
  const track = $('#ticker-track');
  const jobs = data.places.map((place, index) => ({ place, index })).filter(({ place }) => place.kind === 'work');
  const group = document.createElement('div');
  group.className = 'ticker-group';
  for (const { place, index } of jobs) {
    const button = document.createElement('button');
    button.className = 'ticker-job';
    button.dataset.tickerIndex = String(index);
    button.textContent = place.name;
    button.onclick = () => openPlace(index);
    group.append(button);
  }
  const copy = group.cloneNode(true);
  copy.classList.add('ticker-copy');
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  copy.querySelectorAll('button').forEach(button => button.tabIndex = -1);
  track.replaceChildren(group, copy);
  track.style.setProperty('--ticker-duration', `${Math.max(30, jobs.length * 4)}s`);
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function update() {
    ticker.dataset.paused = String(paused);
    $('#ticker-pause').setAttribute('aria-pressed', String(paused));
    $('#ticker-pause').setAttribute('aria-label', paused ? 'Play jobs ticker' : 'Pause jobs ticker');
    $('#ticker-pause').textContent = paused ? '▷' : 'Ⅱ';
  }
  update();
  $('#ticker-pause').onclick = () => { paused = !paused; update(); };
  ticker.addEventListener('pointerdown', event => { if (event.pointerType === 'touch') { paused = true; update(); } });
  // The repeated visual strip is inert for screen readers and tab navigation.
  // Its visible area still selects the corresponding original job on click.
  $('.ticker-window').addEventListener('click', event => {
    if (event.target.closest('.ticker-group:not(.ticker-copy) button')) return;
    const hit = [...copy.querySelectorAll('[data-ticker-index]')].find(button => {
      const rect = button.getBoundingClientRect();
      return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    });
    if (hit) openPlace(Number(hit.dataset.tickerIndex));
  });
  group.addEventListener('focusin', event => {
    if (event.target.matches('button')) event.target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  });
  group.addEventListener('focusout', event => {
    if (!group.contains(event.relatedTarget)) $('.ticker-window').scrollLeft = 0;
  });
}

function filterPlaces() {
  const query = $('#place-search').value.trim().toLowerCase();
  let count = 0;
  document.querySelectorAll('#place-list .place-card').forEach(button => {
    button.hidden = !!query && !button.textContent.toLowerCase().includes(query);
    if (!button.hidden) count++;
  });
  $('#place-matches').textContent = `${count} places`;
}

function closeDetail() {
  detail.hidden = true;
  $('#scrim').hidden = true;
  document.body.classList.remove('modal-open');
  for (const element of document.querySelectorAll('main, header, footer')) element.inert = false;
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  else $('#scene').focus({ preventScroll: true });
}

function openPlace(index) {
  if (!data || !Number.isInteger(index)) return;
  activate();
  if (detail.hidden) lastFocus = menu.open ? $('#menu-open') : document.activeElement;
  if (menu.open) menu.close();
  selected = (index + data.places.length) % data.places.length;
  const place = data.places[selected];
  visited.add(place.id);
  $('#detail-body').innerHTML = `<h2 id="detail-title">${e(place.name)}</h2><p class="intro">${e(place.hint)}. Look for the ${e(place.object.toLowerCase())}.</p>${data.records.filter(r => r.place === place.id).sort((a, b) => a.sort - b.sort).map(r => recordHTML(r, data.sources, false)).join('')}`;
  detail.hidden = false;
  $('#scrim').hidden = false;
  detail.scrollTop = 0;
  document.body.classList.add('modal-open');
  for (const element of document.querySelectorAll('main, header, footer')) element.inert = true;
  $('#detail-close').focus();
  $('#progress').textContent = `${visited.size} of ${data.places.length} places discovered`;
  $('#place-jump').value = String(selected);
  document.querySelectorAll('[data-place]').forEach(button => {
    const active = button.dataset.place === place.id;
    button.classList.toggle('selected', active);
    if (active) button.classList.add('visited');
    if (button.classList.contains('place-card')) {
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
  });
  world?.focus(place);
}
$('#detail-close').onclick = closeDetail;
$('#scrim').onclick = closeDetail;
$('#previous').onclick = () => openPlace(selected - 1);
$('#next').onclick = () => openPlace(selected + 1);
$('#place-jump').onchange = event => { if (event.target.value !== '') openPlace(Number(event.target.value)); };
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
$('#menu-open').onclick = () => menu.showModal();
$('#menu-close').onclick = () => menu.close();
menu.addEventListener('click', event => { if (event.target === menu && (event.offsetX < 0 || event.offsetY < 0 || event.offsetX > menu.clientWidth || event.offsetY > menu.clientHeight)) menu.close(); });
$('#show-markers').onchange = event => document.body.classList.toggle('hide-markers', !event.target.checked);
$('#show-ticker').onchange = event => { $('#job-ticker').hidden = !event.target.checked; document.body.classList.toggle('hide-ticker', !event.target.checked); };
$('#place-search').addEventListener('input', filterPlaces);
$('#enter').onclick = () => { activate(); menu.close(); $('#scene').focus({ preventScroll: true }); };
for (const id of ['tour', 'tour-start']) $('#' + id).onclick = () => openPlace(0);
$('#about-open').onclick = () => { menu.close(); $('#about').showModal(); };
$('#about-close').onclick = () => $('#about').close();
$('#about').addEventListener('close', () => $('#menu-open').focus({ preventScroll: true }));
$('#read-history').onclick = () => { menu.close(); $('#history').focus(); };

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
  status.textContent = reason + ' Choose a place below, or read the full history.';
  $('#enter').textContent = 'Choose a place below';
  $('#enter').onclick = () => $('.places').scrollIntoView();
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
  renderTicker();
  filterPlaces();
  $('#surprise').onclick = () => openPlace(Math.floor(Math.random() * data.places.length));
  try {
    const { createWorld } = await import('./world.js');
    world = await createWorld($('#scene'), data, openPlace, () => fallback('3D is unavailable in this browser.'));
    status.textContent = '';
    $('#zoom-in').onclick = () => { activate(); world.zoom(1.3); };
    $('#zoom-out').onclick = () => { activate(); world.zoom(1 / 1.3); };
    $('#reset').onclick = () => { activate(); world.reset(); };
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
