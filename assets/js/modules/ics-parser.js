function unfoldLines(text) {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
}
function unescapeText(value = '') {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}
function parseDate(value, rawKey = '') {
  if (!value) return null;
  if (/VALUE=DATE/i.test(rawKey) || /^\d{8}$/.test(value)) {
    const m=value.match(/^(\d{4})(\d{2})(\d{2})$/); if(!m) return null;
    return { date: new Date(+m[1], +m[2]-1, +m[3]), allDay: true };
  }
  const match=value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/); if(!match) return null;
  const [,y,m,d,hh,mm,ss,utc]=match;
  return { date: utc ? new Date(Date.UTC(+y,+m-1,+d,+hh,+mm,+ss)) : new Date(+y,+m-1,+d,+hh,+mm,+ss), allDay:false };
}
export function parseICS(text) {
  const events=[]; let current=null;
  for (const line of unfoldLines(text)) {
    if(line==='BEGIN:VEVENT'){current={};continue;} if(line==='END:VEVENT'){if(current?.start)events.push(current);current=null;continue;}
    if(!current||!line.includes(':'))continue;
    const colon=line.indexOf(':'); const rawKey=line.slice(0,colon); const rawValue=line.slice(colon+1); const key=rawKey.split(';')[0].toUpperCase(); const value=unescapeText(rawValue);
    switch(key){
      case'UID':current.uid=value;break; case'SUMMARY':current.summary=value;break; case'DESCRIPTION':current.description=value;break; case'LOCATION':current.location=value;break;
      case'DTSTART':{const p=parseDate(value,rawKey);current.start=p?.date;current.allDay=p?.allDay||false;break;}
      case'DTEND':{const p=parseDate(value,rawKey);current.end=p?.date;break;}
      case'STATUS':current.status=value;break; case'CATEGORIES':current.categories=value.split(',').map(v=>v.trim());break;
      case'X-CHAMPIONSHIP':current.championship=value;break; case'X-SESSION-TYPE':current.sessionType=value;break; case'X-EVENT-NAME':current.eventName=value;break; case'X-COUNTRY':current.countryCode=value.toLowerCase();break; case'X-CIRCUIT':current.circuit=value;break;
    }
  }
  return events.sort((a,b)=>a.start-b.start);
}
