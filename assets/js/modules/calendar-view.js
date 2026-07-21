import { addDays, formatDayNumber, formatDayTitle, isSameDay } from './date-utils.js';
import { translateValue } from '../i18n.js';

const CHAMPIONSHIP_LOGOS = {
  'formula 1': 'assets/img/series/f1.webp', 'f1': 'assets/img/series/f1.webp',
  'formula 2': 'assets/img/series/f2.webp', 'f2': 'assets/img/series/f2.webp',
  'formula 3': 'assets/img/series/f3.svg', 'f3': 'assets/img/series/f3.svg',
  'formula e': 'assets/img/series/fe.webp', 'fe': 'assets/img/series/fe.webp',
  'motogp': 'assets/img/series/motogp.webp', 'moto2': 'assets/img/series/moto2.svg', 'moto3': 'assets/img/series/moto3.svg',
  'fia wec': 'assets/img/series/wec.png', 'wec': 'assets/img/series/wec.png', 'wrc': 'assets/img/series/wrc.webp',
  '24h series': 'assets/img/series/24h.webp', 'worldsbk': 'assets/img/series/wsbk.svg', 'wsbk': 'assets/img/series/wsbk.svg',
  'worldssp': 'assets/img/series/wssp.svg', 'wssp': 'assets/img/series/wssp.svg',
  'nascar cup': 'assets/img/series/nascar.svg', 'nascar': 'assets/img/series/nascar.svg',
  'indycar': 'assets/img/series/indycar.svg', 'dakar rally': 'assets/img/series/dakar.svg', 'dakar': 'assets/img/series/dakar.svg'
};

const COUNTRY_CODES = {
  'australia':'au','austria':'at','azerbaijan':'az','bahrain':'bh','belgium':'be','brazil':'br','canada':'ca','china':'cn','france':'fr','germany':'de','hungary':'hu','macaristan':'hu','italy':'it','japan':'jp','mexico':'mx','monaco':'mc','netherlands':'nl','qatar':'qa','saudi arabia':'sa','singapore':'sg','spain':'es','turkey':'tr','türkiye':'tr','united arab emirates':'ae','united kingdom':'gb','great britain':'gb','usa':'us','united states':'us',
  'hu':'hu','hun':'hu','tr':'tr','tur':'tr','de':'de','ger':'de','it':'it','ita':'it','gb':'gb','uk':'gb','us':'us','jp':'jp','jpn':'jp','fr':'fr','fra':'fr','es':'es','esp':'es','at':'at','aut':'at','be':'be','bel':'be','nl':'nl','nld':'nl','au':'au','aus':'au','ca':'ca','can':'ca','br':'br','bra':'br','mx':'mx','mex':'mx','mc':'mc','mco':'mc','az':'az','aze':'az','bh':'bh','bhr':'bh','cn':'cn','chn':'cn','qa':'qa','qat':'qa','sa':'sa','sau':'sa','sg':'sg','sgp':'sg','ae':'ae','are':'ae','se':'se','swe':'se','ke':'ke','ken':'ke','hr':'hr','cro':'hr','gr':'gr','gre':'gr','ee':'ee','est':'ee','fi':'fi','fin':'fi','py':'py','par':'py','cl':'cl','chi':'cl'
};

function championshipName(event) { return event.championship || event.categories?.[0] || 'Motorsport'; }
function logoFor(event) { return CHAMPIONSHIP_LOGOS[championshipName(event).trim().toLowerCase()] || null; }
function formatEventTime(event, locale, language) { return event.allDay ? language.timePending : new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(event.start); }
function translatedEventName(event, language) { return translateValue(language.events, event.eventName || event.summary || ''); }
function translatedSession(event, language) { return translateValue(language.sessions, event.sessionType || event.summary || language.defaultSession); }
function translatedStatus(event, language) { return language.statuses[event.status] || event.status || language.statuses.CONFIRMED; }

function eventEnd(event) {
  return event.end instanceof Date ? event.end : new Date(event.start.getTime() + 60 * 60 * 1000);
}

function temporalStatus(event, language, now = new Date()) {
  if (event.status === 'CANCELLED') return { type: 'cancelled', text: language.statuses.CANCELLED };

  const start = event.start;
  const end = eventEnd(event);

  if (now >= end) return { type: 'completed', text: language.temporal.completed };

  // Saat açıklanmamış tüm-gün kayıtları kesin saat gibi göstermiyoruz.
  if (event.allDay) return { type: 'planned', text: language.statuses.TENTATIVE };

  if (now >= start && now < end) return { type: 'live', text: language.temporal.live };

  const remaining = start.getTime() - now.getTime();
  if (remaining > 0 && remaining <= 60 * 60 * 1000) {
    const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return { type: 'countdown', text: `${language.temporal.countdown} ${minutes}:${seconds}` };
  }

  // Saati bulunan ve doğrulanmış gelecek seanslar KESİN/CONFIRMED görünür.
  if ((event.status || 'CONFIRMED') === 'CONFIRMED') {
    return { type: 'confirmed', text: language.statuses.CONFIRMED };
  }

  return { type: 'planned', text: language.statuses.TENTATIVE };
}

function countryFlagElement(country = '', language) {
  const code = COUNTRY_CODES[country.trim().toLowerCase()];
  if (!code) return null;
  const img = document.createElement('img');
  img.className = 'program-country-flag';
  img.src = `assets/img/flags/${code}.svg?v=17`;
  img.alt = `${translateValue(language.countries, country)} flag`;
  img.title = translateValue(language.countries, country);
  img.addEventListener('error', () => img.remove());
  return img;
}

function logoElement(event, className) {
  const wrapper = document.createElement('div'); wrapper.className = className;
  const logo = logoFor(event);
  if (logo) { const img = document.createElement('img'); img.src = logo; img.alt = championshipName(event); wrapper.appendChild(img); }
  else { const text = document.createElement('span'); text.textContent = championshipName(event); wrapper.appendChild(text); }
  return wrapper;
}

function uniqueChampionships(events) {
  const seen = new Set();
  return events.filter(event => { const key = championshipName(event).trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
}

function locationParts(location = '') {
  const parts = location.split(',').map(value => value.trim()).filter(Boolean);
  return { place: parts.slice(0, -1).join(', ') || parts[0] || '', country: parts.length > 1 ? parts.at(-1) : '' };
}

export function renderWeek({ container, events, weekStart, selectedDate, onSelectDate, language }) {
  container.innerHTML = '';
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(weekStart, i);
    const column = document.createElement('button');
    column.type = 'button'; column.className = 'day-column';
    const today = new Date();
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dateStart < todayStart) column.classList.add('past-day');
    if (isSameDay(date, today)) column.classList.add('today');
    if (isSameDay(date, selectedDate)) column.classList.add('selected');
    column.setAttribute('aria-label', `${formatDayTitle(date, language.locale)} ${formatDayNumber(date, language.locale)} ${language.showProgram}`);
    const heading = document.createElement('div'); heading.className = 'day-column__heading';
    const monthShort = new Intl.DateTimeFormat(language.locale, { month: 'short' }).format(date).replace('.', '').toUpperCase();
    const mobileDayNamesTr = ['Pazar', 'P.Tesi', 'Salı', 'Çarş.', 'Perş.', 'C.Tesi', 'Pazar'];
    const fullDayTitle = formatDayTitle(date, language.locale);
    const mobileDayTitle = String(language.locale || '').toLowerCase().startsWith('tr') ? mobileDayNamesTr[date.getDay()] : fullDayTitle;
    heading.innerHTML = `<strong data-mobile-day="${mobileDayTitle}">${fullDayTitle}</strong><span>${formatDayNumber(date, language.locale)}</span><em>${monthShort}</em>`;
    column.appendChild(heading);
    const dayEvents = events.filter(event => isSameDay(event.start, date));
    const logos = document.createElement('div'); logos.className = 'day-column__logos';
    const uniqueDayChampionships = uniqueChampionships(dayEvents);
    logos.style.setProperty('--mobile-logo-count', Math.max(1, uniqueDayChampionships.length));
    uniqueDayChampionships.forEach(event => logos.appendChild(logoElement(event, 'week-logo')));
    column.appendChild(logos);
    column.addEventListener('click', () => onSelectDate(date));
    container.appendChild(column);
  }
}

export function renderDayProgram({ container, events, selectedDate, language }) {
  container.innerHTML = '';
  const dayEvents = events.filter(event => isSameDay(event.start, selectedDate)).sort((a, b) => a.start - b.start);
  if (!dayEvents.length) { container.classList.add('empty'); return; }
  container.classList.remove('empty');

  const table = document.createElement('div'); table.className = 'program-table';
  const c = language.columns;
  table.innerHTML = `<div class="program-row program-row--head"><div>${c.time}</div><div>${c.championship}</div><div class="program-head-event" data-mobile-label="${c.session}">${c.event}</div><div>${c.session}</div><div class="program-head-location" data-mobile-label="${String(language.locale || '').toLowerCase().startsWith('tr') ? 'Ülke' : 'Country'}">${c.location}</div><div>${c.status}</div></div>`;
  dayEvents.forEach(event => {
    const row = document.createElement('article'); row.className = 'program-row';
    const status = temporalStatus(event, language);
    if (status.type === 'completed') row.classList.add('past');
    if (status.type === 'live') row.classList.add('live-row');
    const loc = locationParts(event.location);
    const translatedCountry = translateValue(language.countries, loc.country);
    const cells = [
      `<div class="program-time-stack"><time class="program-time ${event.allDay ? 'program-time--pending' : ''}">${formatEventTime(event, language.locale, language)}</time></div>`,
      `<div class="program-logo-cell"></div>`,
      `<div class="program-event"><span class="program-championship-mobile">${championshipName(event)}</span><span>${translatedEventName(event, language)}</span></div>`,
      `<div class="program-session">${translatedSession(event, language)}</div>`,
      `<div class="program-location"><span class="program-place">${loc.place || event.location || ''}</span><span class="program-flag-slot" title="${translatedCountry}"></span></div>`,
      `<div><span class="program-status program-status--${status.type}" data-start="${event.start.toISOString()}" data-end="${eventEnd(event).toISOString()}" data-source-status="${event.status || 'CONFIRMED'}" data-all-day="${event.allDay ? '1' : '0'}">${status.text}</span></div>`
    ];
    row.innerHTML = cells.map(cell => `<div>${cell}</div>`).join('');
    row.children[1].firstElementChild.appendChild(logoElement(event, 'program-logo'));
    const flag = countryFlagElement(event.countryCode || loc.country, language);
    if (flag) row.querySelector('.program-flag-slot').appendChild(flag);
    table.appendChild(row);
  });
  container.appendChild(table);
}


export function updateProgramStatuses({ container, language }) {
  const now = new Date();
  container.querySelectorAll('.program-status[data-start]').forEach(element => {
    const event = {
      start: new Date(element.dataset.start),
      end: new Date(element.dataset.end),
      status: element.dataset.sourceStatus,
      allDay: element.dataset.allDay === '1'
    };
    const status = temporalStatus(event, language, now);
    element.className = `program-status program-status--${status.type}`;
    element.textContent = status.text;
    const row = element.closest('.program-row');
    if (row) {
      row.classList.toggle('past', status.type === 'completed');
      row.classList.toggle('live-row', status.type === 'live');
    }
  });
}
