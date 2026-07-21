export function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfWeek(date) {
  const result = startOfDay(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  return result;
}

export function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDayTitle(date, locale = 'tr-TR') {
  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
}

export function formatDayNumber(date, locale = 'tr-TR') {
  return new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date);
}

export function formatPeriodTitle(start, locale = 'tr-TR', weekSuffix = 'Haftası') {
  const end = addDays(start, 6);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = new Intl.DateTimeFormat(locale, { month: 'long' }).format(start);
  const endMonth = new Intl.DateTimeFormat(locale, { month: 'long' }).format(end);

  if (locale.startsWith('en')) {
    if (start.getMonth() === end.getMonth()) return `${startDay} - ${endDay} ${endMonth} ${weekSuffix}`;
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${weekSuffix}`;
  }

  if (start.getMonth() === end.getMonth()) return `${startDay} - ${endDay} ${endMonth} ${weekSuffix}`;
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${weekSuffix}`;
}
