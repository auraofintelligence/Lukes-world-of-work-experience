export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function recordHTML(r, sources, withId = true) {
  const e = escapeHTML;
  return `<article class="record" ${withId ? `id="record-${e(r.id)}"` : ''} data-type="${e(r.type)}"><p class="date">${r.type === 'work' ? 'Work' : 'Education & training'} · ${e(r.dates)}</p><h3>${e(r.title)}</h3><p class="organisation">${e(r.organisation)}</p><p class="location">${e(r.location)}</p><p>${e(r.summary)}</p>${r.note ? `<p class="note">${e(r.note)}</p>` : ''}<details><summary>Where this comes from</summary><ul>${r.sources.map(s => `<li>${e(sources.find(x => x.id === s.id).title)}, page ${s.page}. ${e(s.section)}.</li>`).join('')}</ul></details></article>`;
}
