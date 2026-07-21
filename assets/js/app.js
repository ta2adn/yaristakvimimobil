import { CALENDAR_SOURCES } from './config.js';
import { LANGUAGES } from './i18n.js';
import { parseICS } from './modules/ics-parser.js';
import { addDays, formatPeriodTitle, startOfWeek } from './modules/date-utils.js';
import { renderDayProgram, renderWeek, updateProgramStatuses } from './modules/calendar-view.js';

const state = {
  cursor: new Date(),
  selectedDate: new Date(),
  events: [],
  languageCode: 'tr'
};

const elements = {
  grid: document.querySelector('#calendar-grid'),
  title: document.querySelector('#period-title'),
  program: document.querySelector('#daily-program'),
  programDate: document.querySelector('#program-date'),
  heroTitle: document.querySelector('#hero-title'),
  seasonSubtitle: document.querySelector('#season-subtitle'),
  clockPanel: document.querySelector('.clock-panel'),
  clockHead: document.querySelector('#clock-head'),
  seriesMarquee: document.querySelector('.series-marquee'),
  previousButton: document.querySelector('#previous-period'),
  nextButton: document.querySelector('#next-period'),
  dailyHeading: document.querySelector('#daily-heading'),
  footerText: document.querySelector('#footer-text'),
  metaDescription: document.querySelector('meta[name="description"]'),
  languageButtons: [...document.querySelectorAll('.language-button')],
  mobileTitle: document.querySelector('#mobile-title'),
  footerFlags: [...document.querySelectorAll('.footer-flag')]
};

function language() { return LANGUAGES[state.languageCode]; }

function updateClock() {
  const now = new Date();
  const lang = language();
  const localTime = new Intl.DateTimeFormat(lang.locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
  const localDate = new Intl.DateTimeFormat(lang.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  document.querySelectorAll('#local-clock,[data-local-clock]').forEach(el => { el.textContent = localTime; });
  document.querySelectorAll('#local-date,[data-local-date]').forEach(el => { el.textContent = localDate; });
  document.querySelectorAll('#local-zone,[data-local-zone]').forEach(el => { el.textContent = localZone; });
  document.querySelectorAll('#utc-clock,[data-utc-clock]').forEach(el => { el.textContent = utcTime; });
}

function selectedDateTitle() {
  return new Intl.DateTimeFormat(language().locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(state.selectedDate);
}

function mobilePeriodTitle(start, locale) {
  const end = addDays(start, 6);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = new Intl.DateTimeFormat(locale, { month: 'long' }).format(start);
  const endMonth = new Intl.DateTimeFormat(locale, { month: 'long' }).format(end);
  return start.getMonth() === end.getMonth()
    ? `${startDay}-${endDay} ${endMonth}`
    : `${startDay} ${startMonth}-${endDay} ${endMonth}`;
}

function applyLanguage() {
  const lang = language();
  document.documentElement.lang = lang.htmlLang;
  document.title = lang.pageTitle;
  elements.metaDescription.content = lang.metaDescription;
  elements.heroTitle.innerHTML = lang.heroTitle;
  elements.mobileTitle.textContent = state.languageCode === 'tr' ? 'FIA FIM ŞAMPİYONA TAKVİMİ' : 'FIA FIM CHAMPIONSHIP CALENDAR';
  document.querySelectorAll('[data-clock-head]').forEach(el => { el.textContent = lang.clockHead; });
  elements.seasonSubtitle.textContent = lang.seasonSubtitle;
  elements.clockHead.textContent = lang.clockHead;
  elements.clockPanel.setAttribute('aria-label', lang.clockHead);
  elements.seriesMarquee.setAttribute('aria-label', lang.championshipsLabel);
  elements.previousButton.setAttribute('aria-label', lang.previousPeriod);
  elements.nextButton.setAttribute('aria-label', lang.nextPeriod);
  elements.dailyHeading.textContent = lang.dailyProgram;
  elements.footerText.textContent = lang.footer;
  elements.footerFlags.forEach(flag => {
    const isEnglish = state.languageCode === 'en';
    flag.src = isEnglish ? 'assets/img/flags/gb.svg?v=17' : 'assets/img/flags/tr.svg?v=17';
    flag.alt = isEnglish ? lang.ukFlag : lang.turkeyFlag;
  });
  elements.languageButtons.forEach(button => {
    const active = button.dataset.language === state.languageCode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  updateClock();
  render();
}

async function loadCalendars() {
  try {
    const responses = await Promise.all(CALENDAR_SOURCES.map(async source => {
      const response = await fetch(source.file, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${source.label}: ${response.status} ${response.statusText}`);
      return parseICS(await response.text());
    }));
    state.events = responses.flat().sort((a, b) => a.start - b.start);
    render();
  } catch (error) {
    const lang = language();
    elements.grid.innerHTML = `<p class="error-message">${lang.calendarError}: ${error.message}. ${lang.serverHint}</p>`;
  }
}

async function animateDailyChange(date) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    elements.program.classList.add('is-changing');
    elements.programDate.classList.add('is-changing');
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  state.selectedDate = new Date(date);
  render();
  elements.program.classList.remove('is-changing');
  elements.programDate.classList.remove('is-changing');
  if (!reduceMotion) {
    elements.program.classList.add('is-entering');
    setTimeout(() => elements.program.classList.remove('is-entering'), 430);
  }
  document.querySelector('.program-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectDate(date) {
  animateDailyChange(date);
}

function render() {
  const lang = language();
  const weekStart = startOfWeek(state.cursor);
  elements.title.textContent = formatPeriodTitle(weekStart, lang.locale, lang.weekSuffix);
  elements.title.dataset.mobileTitle = mobilePeriodTitle(weekStart, lang.locale);
  elements.programDate.textContent = selectedDateTitle();
  renderWeek({ container: elements.grid, events: state.events, weekStart, selectedDate: state.selectedDate, onSelectDate: selectDate, language: lang });
  renderDayProgram({ container: elements.program, events: state.events, selectedDate: state.selectedDate, language: lang });
}

async function changeWeek(dayOffset) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const leaving = dayOffset > 0 ? '-28px' : '28px';
  const entering = dayOffset > 0 ? '28px' : '-28px';

  if (!reduceMotion) {
    elements.grid.style.setProperty('--slide-direction', leaving);
    elements.title.classList.add('is-changing');
    elements.grid.classList.add('is-leaving');
    await new Promise(resolve => setTimeout(resolve, 210));
  }

  state.cursor = addDays(state.cursor, dayOffset);
  state.selectedDate = addDays(state.selectedDate, dayOffset);
  render();

  elements.title.classList.remove('is-changing');
  elements.grid.classList.remove('is-leaving');
  if (!reduceMotion) {
    elements.grid.style.setProperty('--enter-direction', entering);
    elements.grid.classList.add('is-entering');
    setTimeout(() => elements.grid.classList.remove('is-entering'), 470);
  }
}


// Mobilde hafta şeridini sağa/sola kaydırarak hafta değiştir.
let weekTouchStartX = null;
let weekTouchStartY = null;

elements.grid.addEventListener('touchstart', event => {
  if (!window.matchMedia('(max-width: 700px)').matches || event.touches.length !== 1) return;
  weekTouchStartX = event.touches[0].clientX;
  weekTouchStartY = event.touches[0].clientY;
}, { passive: true });

elements.grid.addEventListener('touchend', event => {
  if (weekTouchStartX === null || !window.matchMedia('(max-width: 700px)').matches) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - weekTouchStartX;
  const deltaY = touch.clientY - weekTouchStartY;
  weekTouchStartX = null;
  weekTouchStartY = null;

  if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
  changeWeek(deltaX < 0 ? 7 : -7);
}, { passive: true });

elements.previousButton.addEventListener('click', () => changeWeek(-7));
elements.nextButton.addEventListener('click', () => changeWeek(7));

elements.languageButtons.forEach(button => {
  button.addEventListener('click', () => {
    state.languageCode = button.dataset.language;
    applyLanguage();
  });
});

applyLanguage();
setInterval(() => {
  updateClock();
  updateProgramStatuses({ container: elements.program, language: language() });
}, 1000);
loadCalendars();
