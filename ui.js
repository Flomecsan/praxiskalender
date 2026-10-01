// Praxis-Kalender-Prototyp – Oberfläche
(function () {
  'use strict';
  const P = window.PKP;
  const st = () => P.S.state, cfg = () => P.S.state.config, ix = () => P.S.idx;
  const $ = s => document.querySelector(s);
  // Abläufe ohne Timer verketten (Hintergrund-Tabs drosseln setTimeout stark)
  const defer = (f) => window.__syncDefer ? f() : Promise.resolve().then(f);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // samedi-Palette (gemessen): Name -> Hintergrund ; Rahmen ; Schrift
  const PALRAW = { alpenveilchen: '152,41,92;122,52,84;255,255,255', altrosa: '247,212,220;217,149,164;0,0,0', aquamarin: '191,255,234;114,230,191;0,0,0', babyblau: '210,233,247;145,191,216;0,0,0', black: '247,247,247;215,215,215;0,0,0', blue: '195,212,241;122,152,203;0,0,0', blue2: '44,91,173;57,87,138;255,255,255', blue3: '203,222,255;132,169,233;0,0,0', brown: '130,65,0;99,59,18;255,255,255', deprirosa: '255,224,224;239,164,164;0,0,0', flieder: '255,221,255;238,160,238;0,0,0', fuchs: '255,191,146;218,116,44;0,0,0', fuchsia: '182,2,2;140,26,26;255,255,255', gold: '255,235,128;195,170,34;0,0,0', grashuepfer: '119,255,119;32,182,32;0,0,0', gray: '89,89,89;80,80,80;255,255,255', green: '199,245,205;129,211,139;0,0,0', green2: '184,220,188;105,162,112;0,0,0', green3: '206,255,212;136,234,148;0,0,0', hagebutte: '164,44,0;125,50,22;255,255,255', herbstlaub: '255,255,119;182,182,32;0,0,0', himmelblau: '203,255,255;132,233,233;0,0,0', holz: '255,210,167;224,149,77;0,0,0', korallweiss: '255,240,255;243,189,243;0,0,0', lachs: '255,208,189;229,144,110;0,0,0', lime: '229,254,178;182,224,94;0,0,0', lime2: '209,228,168;143,174,80;0,0,0', lime3: '61,89,1;51,68,13;255,255,255', magenta: '173,0,114;132,23,95;255,255,255', mintgruen: '205,255,205;134,234,134;0,0,0', muschel: '255,250,247;245,218,199;0,0,0', olivgruen: '229,255,184;181,228,102;0,0,0', orange: '249,232,201;220,188,130;0,0,0', orange2: '223,210,185;168,147,107;0,0,0', orange3: '255,237,204;234,197,134;0,0,0', pink: '255,221,235;238,160,191;0,0,0', pink2: '131,70,94;110,71,86;255,255,255', purple: '239,216,252;201,153,230;0,0,0', purple2: '96,13,147;82,30,114;255,255,255', red: '255,233,233;241,177,177;0,0,0', sand: '255,233,205;234,190,135;0,0,0', sandpapier: '255,243,221;238,210,159;0,0,0', seegruen: '224,255,224;164,239,164;0,0,0', sonnenblume: '255,224,146;218,169,45;0,0,0', stahlgrau: '240,247,240;198,218,198;0,0,0', swimmingpool: '177,220,255;92,165,226;0,0,0', turquoise: '224,255,255;163,238,239;0,0,0', turquoise2: '205,229,230;139,182,183;0,0,0', turquoise3: '4,90,92;15,70,71;255,255,255', white: '255,255,255;230,230,230;0,0,0', yellow: '255,254,230;240,236,173;0,0,0', yellow2: '230,229,209;183,181,147;0,0,0', yellow3: '204,203,189;135,134,112;0,0,0' };
  const PAL = Object.fromEntries(Object.entries(PALRAW).map(([k, v]) => { const [bg, bd, fg] = v.split(';'); return [k, { bg: 'rgb(' + bg + ')', bd: 'rgb(' + bd + ')', fg: 'rgb(' + fg + ')' }]; }));
  const COLORS = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.bg]));
  const pal = c => PAL[c] || PAL.white;
  const col = c => pal(c).bg;
  const ink = () => '#000';
  // Linien-Icons im Stil der samedi-Oberfläche
  const ICONS = {
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    people: '<circle cx="8" cy="8" r="2.6"/><circle cx="16" cy="8" r="2.6"/><path d="M3 19c0-3 2.2-5 5-5s5 2 5 5M11 19c0-3 2.2-5 5-5s5 2 5 5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    stats: '<path d="M4 4v16h16M8 16V11M12 16V7M16 16v-4"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.6 1.6-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 13h4"/>',
    mega: '<path d="M4 10v4h3l7 4V6L7 10H4zM17 9.5a3.5 3.5 0 0 1 0 5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.7 2.5 14.3 0 17M12 3.5c-2.5 2.7-2.5 14.3 0 17"/>',
    check: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l3 3 5-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>',
    views: '<rect x="4" y="8" width="11" height="11" rx="1.5"/><path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4H19a1 1 0 0 1 1 1v9.5a1.5 1.5 0 0 1-1.5 1.5H15"/>',
    left: '<path d="M14.5 6l-6 6 6 6"/>', right: '<path d="M9.5 6l6 6-6 6"/>',
    day: '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v4M16 3v4"/><rect x="9" y="12.5" width="6" height="4"/>',
    week: '<rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M8 3v4M16 3v4M7 13.5h10M7 16.5h10"/>',
    print: '<path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><rect x="7" y="14" width="10" height="6"/>',
    clip: '<rect x="5" y="5" width="14" height="16" rx="1.5"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8.5 11h7M8.5 14h7M8.5 17h4"/>',
    alarm: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M4 5l3-2.5M20 5l-3-2.5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 10.5v6M13.5 10.5v6"/>',
    calPlus: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M12 12v5M9.5 14.5h5"/>',
    calLink: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M10.5 15.5h-1a1.6 1.6 0 0 1 0-3.2h1M13.5 12.3h1a1.6 1.6 0 0 1 0 3.2h-1M10.5 13.9h3"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
    personClock: '<circle cx="9" cy="8" r="3.3"/><path d="M3 19.5c0-3.5 2.6-5.8 6-5.8 1.2 0 2.2.3 3.1.8"/><circle cx="17" cy="16.5" r="4"/><path d="M17 14.5v2l1.4 1"/>',
    list: '<path d="M9 7h11M9 12h11M9 17h11M4 7l1 1 2-2M4 12l1 1 2-2M4 17l1 1 2-2"/>',
    peopleArrows: '<circle cx="7" cy="6" r="2.2"/><circle cx="17" cy="6" r="2.2"/><path d="M5 20v-6l-1-3h6l-1 3v6M15 20v-6l-1-3h6l-1 3v6M10 15h4M12.5 13.5L14 15l-1.5 1.5M11.5 13.5L10 15l1.5 1.5"/>',
    arrowR: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  };
  const icon = (n, cls) => `<svg class="ico ${cls || ''}" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;
  const STATUS = ['geplant', 'wartend', 'in Behandlung', 'fertig', 'nicht erschienen'];
  const STICON = { geplant: '', wartend: '⏳', 'in Behandlung': '▶', fertig: '✓', 'nicht erschienen': '✗', abgesagt: '⊘' };
  const simIso = () => { const n = P.splitAbs(P.nowAbs()); return n.date + 'T' + P.fmtMin(n.min); };
  const TODAY = () => P.splitAbs(P.nowAbs()).date; // simulierte Zeit berücksichtigen
  const ui = { date: null, mode: 'day', view: 0, weekRes: null, page: 'kalender' };

  // ---------- Grundbausteine ----------
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2200); }
  function dialog(title, body, buttons) {
    $('#dlgTitle').textContent = title; $('#dlgBody').innerHTML = ''; $('#dlgFoot').innerHTML = ''; $('#dlg').style.width = '';
    if (typeof body === 'string') $('#dlgBody').innerHTML = body; else $('#dlgBody').appendChild(body);
    for (const b of buttons || []) {
      const el = document.createElement('button'); el.textContent = b.label; if (b.cls) el.className = b.cls; if (b.id) el.id = b.id;
      el.onclick = () => { const r = b.onClick ? b.onClick() : null; if (r !== false && !b.keep) closeDlg(); };
      $('#dlgFoot').appendChild(el);
    }
    const d = $('#dlg'); if (!d.open) d.showModal();
    return $('#dlgBody');
  }
  function dialog2(title, html, buttons) {
    $('#dlg2Title').textContent = title; $('#dlg2Body').innerHTML = html; $('#dlg2Foot').innerHTML = ''; $('#dlg2').style.width = '';
    for (const b of buttons) { const el = document.createElement('button'); el.textContent = b.label; if (b.cls) el.className = b.cls; el.onclick = () => { const r = b.onClick ? b.onClick($('#dlg2Body')) : null; if (r !== false) $('#dlg2').close(); }; $('#dlg2Foot').appendChild(el); }
    $('#dlg2X').onclick = () => $('#dlg2').close();
    $('#dlg2').showModal(); const f = $('#dlg2Body').querySelector('input,select,textarea'); if (f) f.focus();
    return $('#dlg2Body');
  }
  // Rückfrage im ExtJS-Stil statt Browser-confirm
  function ask(title, text, okLabel, onOk) { dialog2(title, `<div style="padding:4px 0 8px">${text}</div>`, [{ label: 'Abbrechen' }, { label: okLabel || 'OK', cls: 'primary', onClick: () => { onOk(); } }]); }
  function closeDlg() { const d = $('#dlg'); if (d.open) d.close(); }
  function h(html) { const t = document.createElement('div'); t.innerHTML = html; return t; }
  const patName = p => p ? p.last + ', ' + p.first : '';
  const patLabel = p => p ? patName(p) + ' (' + p.id + ', ' + P.fmtDate(p.birth) + ')' : '—';
  const age = p => { const [y, m, d] = p.birth.split('-').map(Number); const [Y, M, D] = TODAY().split('-').map(Number); return Y - y - ((M < m || (M === m && D < d)) ? 1 : 0); };
  const typeOf = id => ix().types.get(id);
  const resOf = id => ix().res.get(id);
  const patOf = id => ix().patients.get(id);
  function apptText(a) {
    const t = typeOf(a.typeId), p = patOf(a.patientId);
    const f = Object.values(a.fields || {}).filter(Boolean).join(' ');
    if (!a.typeId) return esc(a.title) + '; ' + P.fmtDur(a.dur);
    return (p ? '<b>' + esc(patName(p)) + '</b>; ' : '') + esc(t ? t.name : '?') + '; ' + P.fmtDur(a.dur) + (f ? ' ' + esc(f) : '') + (a.note ? ' · ' + esc(a.note) : '');
  }
  function save() { P.reindex(); P.save(); }
  function rerender() { render(ui.page); }

  // ---------- Navigation ----------
  document.querySelectorAll('nav#top a').forEach(a => a.onclick = () => go(a.dataset.page));
  function go(page) {
    ui.page = page;
    document.querySelectorAll('nav#top a').forEach(a => a.classList.toggle('active', a.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'p-' + page));
    render(page);
  }
  function render(page) {
    ({ kalender: renderCal, callcenter: renderCallCenter, warteliste: renderWaitlist, patienten: renderPatients, online: renderOnline, recall: renderRecall, statistik: renderStats, todos: renderTodos, einstellungen: renderSettings })[page]();
  }
  function tickClock() {
    const n = P.splitAbs(P.nowAbs());
    $('#clock').textContent = (st().settings.simNow ? 'Simuliert: ' : '') + P.fmtDate(n.date, true) + ' ' + P.fmtMin(n.min);
  }

  // =====================================================================
  // KALENDER (Optik samedi)
  // =====================================================================
  function viewCols() {
    if (ui.mode === 'week') {
      const rid = ui.weekRes || ((st().views[ui.view] || {}).resIds || [])[0] || cfg().resources[0].id; ui.weekRes = rid;
      const di = P.dayIndex(ui.date), wd = (new Date(di * 86400000).getUTCDay() + 6) % 7;
      return [0, 1, 2, 3, 4, 5, 6].map(i => { const d = P.addDays(ui.date, i - wd); return { resId: rid, date: d, head: P.weekday(d) + '. ' + d.slice(8) + '.' + d.slice(5, 7) + '.' }; });
    }
    const v = st().views[ui.view] || st().views[0];
    return v.resIds.filter(id => resOf(id)).map(id => ({ resId: id, date: ui.date, head: resOf(id).name }));
  }
  function timeCol(side, d0, d1, ppm) {
    let s = `<div class="timecol ${side}"><div class="colhead"></div><div style="position:relative;height:${(d1 - d0) * ppm}px">`;
    for (let m = d0; m < d1; m += 5) s += `<div class="tl ${m % 60 === 0 ? 'h' : ''}" style="top:${(m - d0) * ppm}px;height:${5 * ppm}px;line-height:${5 * ppm}px">${m % 60 === 0 ? P.pad(m / 60) : P.pad(m % 60)}</div>`;
    return s + '</div></div>';
  }
  function evHtml(a, p, lo, hi, ppm, lane, lanes) {
    const t = typeOf(a.typeId), pat = patOf(a.patientId);
    const top = (Math.max(p.s, lo) - lo) * ppm, ht = Math.max(5 * ppm, (Math.min(p.e, hi) - Math.max(p.s, lo)) * ppm);
    const c = t ? pal(t.color || (typeOf(a.viaType) || {}).color) : pal('white');
    const w = 100 / lanes;
    const f = Object.values(a.fields || {}).filter(Boolean).join(' ');
    const partDur = p.e - p.s;
    const st_ = a.patientId ? statusIcon(a.status) : '';
    const corner = pat && pat.insurance !== 'GKV' ? '<span class="corner" title="' + esc(pat.insurance) + '"></span>' : (a.channel === 'online' ? '<span class="corner web" title="online gebucht"></span>' : '');
    const cm = (f || a.note) ? `<svg class="cm" viewBox="0 0 16 13"><path d="M2 1h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 3V9H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="#cfe2fb" stroke="#6b9bd8"/></svg>` : '';
    let txt;
    if (!a.typeId) txt = esc(a.title) + '; ' + P.fmtDur(partDur);
    else txt = (pat ? '<span class="att">' + esc(pat.last) + ', ' + esc(pat.first) + ';</span> ' : '') + esc(t ? t.name : '?') + (p.label ? ' - ' + esc(p.label) : '') + '; ' + P.fmtDur(partDur) + (f ? ' <b>' + esc(f) + '</b>' : '') + (a.note ? ' ' + esc(a.note) : '');
    const cls = ['ev', a.typeId ? '' : 'blocker', a.status === 'fertig' ? 'done' : '', a.overbooked ? 'over' : ''].join(' ');
    return `<div class="${cls}" data-id="${a.id}" style="top:${top}px;height:${ht}px;left:calc(${lane * w}% + 1px);width:calc(${w}% - 2px)"><div class="inner" style="background:${c.bg};border-color:${c.bd};color:${c.fg}">${corner}${st_}${cm}${txt}</div></div>`;
  }
  // Status-Eckchen: Klick schaltet geplant → wartet → in Behandlung → fertig → geplant (ohne Fenster)
  const STATUS_CYCLE = { geplant: 'wartend', wartend: 'in Behandlung', 'in Behandlung': 'fertig', fertig: 'geplant', 'nicht erschienen': 'geplant' };
  const STATUS_LABEL = { geplant: 'geplant', wartend: 'wartet (im Wartezimmer)', 'in Behandlung': 'in Behandlung', fertig: 'fertig', 'nicht erschienen': 'nicht erschienen' };
  function statusIcon(stv) {
    const ic = { geplant: ['○', '#8a8a8a'], wartend: ['⧗', '#e69500'], 'in Behandlung': ['▶', '#1e6fd9'], fertig: ['✔', '#2e9e2e'], 'nicht erschienen': ['✘', '#d32f2f'] }[stv] || ['○', '#8a8a8a'];
    return `<span class="stx act" style="color:${ic[1]}" title="Status: ${STATUS_LABEL[stv] || stv} – Klick: ${STATUS_LABEL[STATUS_CYCLE[stv] || 'geplant']}">${ic[0]}</span>`;
  }
  function cycleStatus(id) {
    const a = st().appts.find(x => x.id === id); if (!a || !a.patientId) return;
    a.status = STATUS_CYCLE[a.status] || 'geplant';
    if (a.status === 'wartend') a.arrivedAt = simIso(); if (a.status === 'geplant') delete a.arrivedAt;
    save(); renderCalGrid(); if (ui.sideTab === 'wait' && !ui.bk) renderCalSide();
  }
  // gleiche Terminart beim anderen Arzt: „Arztgespräch Kurz (FCB)“ → „Arztgespräch Kurz (MMS)“
  const typeBase = n => n.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const typeKz = n => (n.match(/\(([^)]+)\)\s*$/) || [])[1];
  function equivalentType(t, resId) {
    const r = resOf(resId); if (!t || !r) return null; const kz = typeKz(r.name); if (!kz) return null;
    const base = typeBase(t.name);
    return cfg().eventTypes.find(x => x.id !== t.id && !x.chainOnly && x.intern && typeKz(x.name) === kz && typeBase(x.name) === base && typeMatchesRes(x, resId)) || null;
  }
  function renderCal() { renderCalGrid(); renderCalSide(); }
  // Buchbare Startzeiten der Terminart im Buchungsfenster (samedi: bookable_times-layer)
  function bookableMap(cols) {
    const bk = ui.bk; if (!bk || bk.blocker || !bk.typeId) return null;
    const m = new Map(); const dates = [...new Set(cols.map(c => c.date))];
    const opt = { days: 1, max: 5000, perDay: 5000, channel: 'intern', patient: patOf(bk.patientId) };
    for (const d of dates) for (const sl of P.findSlots(bk.typeId, d, opt))
      for (const p of sl.parts) { const k = p.resId + '|' + d; if (!m.has(k)) m.set(k, []); m.get(k).push({ s: p.s, start: sl.start, date: d }); }
    // andere Ärzte in der Ansicht: gleiche Terminart mit deren Kürzel (heller markiert, Klick wechselt die Terminart)
    const t = typeOf(bk.typeId);
    if (t && !t.alts.length) for (const c of cols) {
      if (typeMatchesRes(t, c.resId)) continue; const eq = equivalentType(t, c.resId); if (!eq) continue;
      for (const sl of P.findSlots(eq.id, c.date, opt)) for (const p of sl.parts) if (p.resId === c.resId) { const k = p.resId + '|' + c.date; if (!m.has(k)) m.set(k, []); m.get(k).push({ s: p.s, start: sl.start, date: c.date, typeId: eq.id }); }
    }
    return m;
  }
  function renderCalGrid() {
    const s = st().settings, ppm = s.pxPerMin, d0 = s.dayStart, d1 = s.dayEnd, H = (d1 - d0) * ppm, row = 5 * ppm;
    const wr = $('#calWeekRes'); wr.style.display = ui.mode === 'week' ? '' : 'none';
    const cols = viewCols();
    if (ui.mode === 'week') wr.innerHTML = cfg().resources.filter(r => !r.hidden).map(r => `<option value="${r.id}" ${r.id === ui.weekRes ? 'selected' : ''}>${esc(r.name)}</option>`).join('');
    $('#calDay').classList.toggle('on', ui.mode === 'day'); $('#calWeek').classList.toggle('on', ui.mode === 'week');
    const [y, mo, d] = ui.date.split('-');
    $('#calTitle').innerHTML = ui.mode === 'week'
      ? `<b>KW ${isoWeek(ui.date)}</b> ${esc((resOf(ui.weekRes) || {}).name || '')}`
      : `<b>${P.weekday(ui.date)}.</b> ${d}.${mo}.${y} <span class="kw">KW ${isoWeek(ui.date)}</span>`;
    const nowA = P.nowAbs();
    const gridBg = `background-image:repeating-linear-gradient(to bottom,transparent 0,transparent ${row - 1}px,var(--grid) ${row - 1}px,var(--grid) ${row}px)`;
    let hl = ''; for (let m = d0 + 60 - (d0 % 60 || 60) + (d0 % 60 ? 0 : 60); m < d1; m += 60) hl += `<div class="hline" style="top:${(m - d0) * ppm}px"></div>`;
    let html = timeCol('l', d0, d1, ppm);
    const btm = bookableMap(cols); const bk = ui.bk;
    for (const c of cols) {
      const r = resOf(c.resId); const dayA = P.absOf(c.date, 0), lo = dayA + d0, hi = dayA + d1;
      const stx = ix().status.get(c.resId + '|' + c.date);
      const hrs = stx ? [] : P.hoursOn(r.oh, c.date);
      let bg = '';
      let cur = d0; for (const [a, b] of hrs) { if (b <= d0 || a >= d1) continue; if (a > cur) bg += `<div class="closed" style="top:${(cur - d0) * ppm}px;height:${(a - cur) * ppm}px"></div>`; cur = Math.max(cur, b); }
      if (cur < d1) bg += `<div class="closed" style="top:${(cur - d0) * ppm}px;height:${(d1 - cur) * ppm}px"></div>`;
      if (stx) { const sc = pal(stx.status === 'Krank' ? 'red' : 'sand'); bg += `<div class="roster" style="top:0;height:${H}px;background:${sc.bg};color:#000;opacity:.85"><b>${esc(stx.status)}</b>${stx.note ? ' ' + esc(stx.note) : ''}</div>`; }
      for (const t of cfg().displayTemplates) {
        if (!t.resIds.includes(c.resId)) continue;
        const tc = pal(t.color);
        for (const [a, b] of P.hoursOn(t.oh, c.date)) {
          if (b <= d0 || a >= d1 || (a === 0 && b === 1440)) continue;
          const top = (Math.max(a, d0) - d0) * ppm, ht = (Math.min(b, d1) - Math.max(a, d0)) * ppm;
          bg += `<div class="roster" style="top:${top}px;height:${ht}px;background:${tc.bg};color:${tc.fg}" title="${esc(t.label)} ${P.fmtMin(a)}–${P.fmtMin(b)}">${esc(t.label)}</div>`;
        }
      }
      const items = [];
      for (const a of st().appts) {
        if (a.status === 'abgesagt') continue;
        for (const p of a.parts) if (p.resId === c.resId && p.s < hi && p.e > lo) items.push({ a, p });
      }
      items.sort((x, y) => x.p.s - y.p.s || y.p.e - x.p.e);
      // Spuren nur innerhalb überlappender Gruppen (wie samedi), nicht für die ganze Spalte
      let cluster = [], clEnd = -Infinity;
      const flush = () => { const le = []; for (const it of cluster) { let l = le.findIndex(e => e <= it.p.s); if (l < 0) { l = le.length; le.push(0); } le[l] = it.p.e; it.lane = l; } cluster.forEach(it => it.lanes = le.length); cluster = []; };
      for (const it of items) { if (cluster.length && it.p.s >= clEnd) { flush(); clEnd = -Infinity; } cluster.push(it); clEnd = Math.max(clEnd, it.p.e); }
      flush();
      const ap = items.map(it => evHtml(it.a, it.p, lo, hi, ppm, it.lane, it.lanes)).join('');
      let btH = '';
      if (btm) { const seen = new Set(); for (const b of btm.get(c.resId + '|' + c.date) || []) { const m = b.s - P.absOf(c.date, 0); if (m < d0 || m >= d1 || seen.has(m)) continue; seen.add(m); btH += `<div class="bt ${b.typeId ? 'alt' : ''}" data-start="${b.start}" ${b.typeId ? `data-type="${b.typeId}"` : ''} style="top:${(m - d0) * ppm}px;height:${row}px" title="frei ${P.fmtMin(b.start)}${b.typeId ? ' – ' + esc(typeOf(b.typeId).name) : ''}"></div>`; } }
      if (bk && bk.start != null && bk.date === c.date) {
        if (bk.ev && bk.ev.ok) { for (const p of bk.ev.parts) if (p.resId === c.resId) btH += `<div class="bsel" style="top:${(p.s - lo) * ppm}px;height:${(p.e - p.s) * ppm}px"></div>`; }
        else if (bk.resId === c.resId) btH += `<div class="bsel bad" style="top:${(bk.start - d0) * ppm}px;height:${row * 2}px"></div>`;
      }
      const now = nowA >= lo && nowA <= hi ? `<div class="nowline" style="top:${(nowA - lo) * ppm}px"></div>` : '';
      const dotc = stx ? '#f3a6a6' : (hrs.some(([a, b]) => !(a === 0 && b === 1440)) ? '#9bdcc4' : '#d6d6d6');
      html += `<div class="rcol"><div class="colhead" data-res="${c.resId}" data-date="${c.date}" title="${esc(r.name)} – Klick: Wochenansicht"><span class="cd" style="background:${dotc}"></span>${esc(c.head)}</div><div class="rbody" data-res="${c.resId}" data-date="${c.date}" style="height:${H}px;${gridBg}">${bg}${hl}${btH}${ap}${now}<div class="ghost"></div></div></div>`;
    }
    html += timeCol('r', d0, d1, ppm);
    $('#calGrid').innerHTML = html;
    $('#calGrid').querySelectorAll('.rbody').forEach(el => {
      const gh = el.querySelector('.ghost');
      el.onmousemove = e => { if (e.target.closest('.ev')) { gh.style.display = 'none'; return; } const rect = el.getBoundingClientRect(); const m = Math.floor((e.clientY - rect.top) / ppm / 5) * 5; gh.style.top = m * ppm + 'px'; gh.style.height = row + 'px'; gh.style.display = 'block'; };
      el.onmouseleave = () => gh.style.display = 'none';
      el.onclick = e => {
        if (e.target.closest('.ev')) return;
        const btEl = e.target.closest('.bt');
        const rect = el.getBoundingClientRect(); const m = btEl ? +btEl.dataset.start : d0 + Math.floor((e.clientY - rect.top) / ppm / 5) * 5;
        if (ui.bk) {
          const bk = ui.bk; bk.date = el.dataset.date; bk.start = m; bk.resId = el.dataset.res; if (bk.blocker) bk.bres = el.dataset.res;
          let switched = null;
          if (!bk.blocker && bk.typeId) {
            const t = typeOf(bk.typeId);
            const target = btEl && btEl.dataset.type ? typeOf(btEl.dataset.type) : (t && !typeMatchesRes(t, bk.resId) ? equivalentType(t, bk.resId) : null);
            if (target && target.id !== bk.typeId) { bk.typeId = target.id; switched = target.name; }
          }
          bkEval(); renderCalGrid();
          if (switched) { renderBookingPanel(); toast('Arzt gewechselt: ' + switched); } else bkSyncInputs();
          return;
        }
        openNewAppt({ date: el.dataset.date, start: m, resId: el.dataset.res });
      };
    });
    $('#calGrid').querySelectorAll('.ev').forEach(el => el.onclick = e => { e.stopPropagation(); if (e.target.closest('.stx.act')) return cycleStatus(el.dataset.id); openAppt(el.dataset.id); });
    // Rechtsklick wie in samedi: freie Fläche → Blocker/Termin, Termin → Status/Absage/Verschieben
    $('#calGrid').querySelectorAll('.rbody').forEach(el => el.oncontextmenu = e => {
      e.preventDefault(); e.stopPropagation();
      const evEl = e.target.closest('.ev');
      if (evEl) return apptMenu(evEl.dataset.id, { x: e.clientX, y: e.clientY });
      const rect = el.getBoundingClientRect(); const m = d0 + Math.floor((e.clientY - rect.top) / ppm / 5) * 5; const rid = el.dataset.res, d = el.dataset.date;
      popMenu({ x: e.clientX, y: e.clientY }, [
        { label: 'Blocker hier eintragen … (' + P.fmtMin(m) + ')', onClick: () => quickBlocker(rid, d, m) },
        { label: 'Termin hier buchen …', onClick: () => openNewAppt({ date: d, start: m, resId: rid }) },
        { sep: true },
        { label: 'Status „Krank“ für ' + P.fmtDate(d), onClick: () => setResStatus(rid, d, d, 'Krank') },
        { label: 'Status „Urlaub“ …', onClick: () => setResStatus(rid, d, null, 'Urlaub') },
      ]);
    });
    $('#calGrid').querySelectorAll('.rcol .colhead').forEach(el => el.onclick = e => {
      e.stopPropagation();
      const rid = el.dataset.res, d = el.dataset.date, cur = ix().status.get(rid + '|' + d);
      popMenu(el, [
        ui.mode === 'day' ? { label: 'Wochenansicht dieser Ressource', onClick: () => { ui.mode = 'week'; ui.weekRes = rid; renderCal(); } } : { label: 'Tagesansicht ' + P.fmtDate(d, true), onClick: () => { ui.mode = 'day'; ui.date = d; renderCal(); } },
        { label: 'Status „Krank“ für ' + P.fmtDate(d), onClick: () => setResStatus(rid, d, d, 'Krank') },
        { label: 'Status „Urlaub“ für ' + P.fmtDate(d) + ' …', onClick: () => setResStatus(rid, d, null, 'Urlaub') },
        ...(cur ? [{ label: 'Status zurücksetzen (wieder verfügbar)', onClick: () => { st().resStatus = st().resStatus.filter(x => !(x.date === d && (x.resId === rid || relatedRes(rid).includes(x.resId)))); save(); renderCal(); toast('Status zurückgesetzt'); } }] : []),
      ]);
    });
    if (!renderCal._scrolled) { renderCal._scrolled = true; $('#calScroll').scrollTop = Math.max(0, (7 * 60 + 15 - d0) * ppm); }
  }
  function scrollToAppt(a) {
    const s = st().settings, sc = $('#calScroll');
    sc.scrollTop = Math.max(0, (a.start - s.dayStart - 30) * s.pxPerMin);
    const colEl = [...document.querySelectorAll('.rbody')].find(el => el.dataset.res === a.parts[0].resId);
    if (colEl) { const r = colEl.getBoundingClientRect(), sr = sc.getBoundingClientRect(); if (r.left < sr.left + 30 || r.right > sr.right - 30) sc.scrollLeft += r.left - sr.left - 60; }
  }
  function isoWeek(date) { const d = new Date(P.dayIndex(date) * 86400000); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3); const fy = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return 1 + Math.round(((d - fy) / 86400000 - 3 + ((fy.getUTCDay() + 6) % 7)) / 7); }
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  function miniMonth(y, m, sel) {
    const first = P.dayIndex(y + '-' + P.pad(m) + '-01'); const wd = (new Date(first * 86400000).getUTCDay() + 6) % 7;
    let html = `<table class="mc"><tr>${['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((x, i) => `<th class="${i > 4 ? 'we' : ''}">${x}</th>`).join('')}</tr>`;
    for (let w = 0; w < 6; w++) { html += '<tr>'; for (let i = 0; i < 7; i++) { const di = first - wd + w * 7 + i, d = P.dateOf(di), inM = +d.slice(5, 7) === m; html += `<td data-d="${d}" class="${i > 4 ? 'we' : ''} ${inM ? '' : 'o'} ${d === TODAY() ? 't' : ''} ${d === sel && inM ? 's' : ''}"><span>${+d.slice(8)}</span></td>`; } html += '</tr>'; }
    return html + '</table>';
  }
  function touchRecent(pid) { if (!pid) return; ui.recent = [pid].concat((ui.recent || []).filter(x => x !== pid)).slice(0, 30); }
  function initRecent() {
    if (ui.recent) return;
    const today = TODAY();
    ui.recent = [];
    st().appts.filter(a => a.patientId && a.date === today).sort((a, b) => b.start - a.start).forEach(a => { if (!ui.recent.includes(a.patientId)) ui.recent.push(a.patientId); });
    ui.recent = ui.recent.slice(0, 15);
  }
  function renderCalSide() {
    initRecent();
    const [y, m] = ui.date.split('-').map(Number);
    const n2 = m === 12 ? [y + 1, 1] : [y, m + 1];
    const tabs = [['recent', 'personClock', 'Zuletzt verwendete Patienten'], ['todo', 'clip', 'Todo-Listen'], ['list', 'list', 'Terminliste des Tages'], ['wait', 'peopleArrows', 'Wartezimmer'], ['recall', 'alarm', 'Recall fällig']];
    ui.sideTab = ui.sideTab || 'recent';
    $('#calSide').innerHTML = `<div class="mcHead"><button id="mPrev">‹</button><span class="mt">${MONTHS[m - 1]} <span>${y} ˅</span></span><span class="today" id="mToday" style="cursor:pointer">${+TODAY().slice(8)}.${+TODAY().slice(5, 7)}.</span><span class="mt">${MONTHS[n2[1] - 1]} <span>${n2[0]} ˅</span></span><button id="mNext">›</button></div>
      <div class="mcs">${miniMonth(y, m, ui.date)}<div style="width:1px;background:var(--line)"></div>${miniMonth(n2[0], n2[1], ui.date)}</div>
      <div class="sideBtns"><button id="sbTermin">${icon('calPlus')}Termin</button><button id="sbKette">${icon('calLink')}Terminkette</button></div>
      ${ui.bk ? '<div id="bkPanel"></div>' : `<div class="sideTabs">${tabs.map(([k, ic, tt]) => `<button data-tab="${k}" title="${tt}" class="${ui.sideTab === k ? 'on' : ''}">${icon(ic)}</button>`).join('')}</div>
      <div id="sideList"></div>`}`;
    $('#calSide').querySelectorAll('td[data-d]').forEach(td => td.onclick = () => { ui.date = td.dataset.d; if (ui.bk) { renderCalGrid(); renderCalSideMonths(); } else renderCal(); });
    $('#mPrev').onclick = () => { ui.date = P.addDays(ui.date.slice(0, 8) + '01', -1).slice(0, 8) + '01'; calNav(); };
    $('#mNext').onclick = () => { ui.date = P.addDays(ui.date.slice(0, 8) + '28', 7).slice(0, 8) + '01'; calNav(); };
    $('#mToday').onclick = () => { ui.date = TODAY(); calNav(); };
    $('#sbTermin').onclick = () => openNewAppt({ date: ui.date });
    $('#sbKette').onclick = () => openChainDialog();
    if (ui.bk) { renderBookingPanel(); initBkSplit(); return; }
    $('#calSide').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { ui.sideTab = b.dataset.tab; renderCalSide(); });
    const L = $('#sideList');
    const today = TODAY();
    const row = (p, extra) => `<div class="sl" data-p="${p.id}"><span class="nm">${esc(p.last)}, ${esc(p.first)} (${p.id.slice(1)}, ${P.fmtDate(p.birth)})${extra || ''}</span><span class="a" data-act="book" title="Termin buchen">${icon('calPlus')}</span><span class="a" data-act="pat" title="Patientenakte">${icon('person')}</span><span class="a g" data-act="next" title="zum nächsten Termin">${icon('arrowR')}</span></div>`;
    if (ui.sideTab === 'recent') L.innerHTML = ui.recent.map(id => patOf(id)).filter(Boolean).map(p => row(p)).join('') || '<div class="sl muted">keine</div>';
    else if (ui.sideTab === 'wait') { const w = st().appts.filter(a => a.date === today && a.status === 'wartend').sort((a, b) => a.start - b.start); L.innerHTML = w.map(a => row(patOf(a.patientId), ' · ' + P.fmtMin(a.start) + ' ' + esc(typeOf(a.typeId)?.name || ''))).join('') || '<div class="sl muted">Wartezimmer leer</div>'; }
    else if (ui.sideTab === 'list') { const w = st().appts.filter(a => a.date === ui.date && a.patientId && a.status !== 'abgesagt').sort((a, b) => a.start - b.start); L.innerHTML = w.map(a => row(patOf(a.patientId), ' · ' + P.fmtMin(a.start) + ' ' + esc(typeOf(a.typeId)?.name || ''))).join('') || '<div class="sl muted">keine Termine</div>'; }
    else if (ui.sideTab === 'recall') { const w = st().recalls.filter(r => !r.done && r.due <= P.addDays(today, 30)).sort((a, b) => a.due.localeCompare(b.due)); L.innerHTML = w.map(r => row(patOf(r.patientId), ' · fällig ' + P.fmtDate(r.due))).join('') || '<div class="sl muted">nichts fällig</div>'; }
    else if (ui.sideTab === 'todo') { L.innerHTML = st().todos.lists.map(l => `<div class="sl" style="background:#f3f7fd;font-weight:700">${esc(l.name)}</div>` + l.items.map(it => `<div class="sl" style="font-weight:400;background:#fff">${it.done ? '☑' : '☐'} <span class="nm">${esc(it.text)}</span></div>`).join('')).join(''); }
    L.querySelectorAll('.sl[data-p]').forEach(el => {
      const pid = el.dataset.p;
      el.onclick = e => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'book') return openNewAppt({ patientId: pid, date: ui.date });
        if (act === 'next') { const nx = st().appts.filter(a => a.patientId === pid && a.status !== 'abgesagt' && (a.date > today || (a.date === today))).sort((a, b) => (a.date + String(a.start).padStart(4, '0')).localeCompare(b.date + String(b.start).padStart(4, '0')))[0]; if (!nx) return toast('kein künftiger Termin'); ui.date = nx.date; ui.mode = 'day'; renderCal(); return; }
        openPatient(pid);
      };
    });
  }
  function relatedRes(rid) {
    const r = resOf(rid); const kz = (r.name.match(/\(([^)]+)\)/) || [])[1]; if (!kz) return [];
    return cfg().resources.filter(x => x.id !== rid && /^Zeit/.test(x.name) && x.name.includes('(' + kz + ')')).map(x => x.id);
  }
  function setResStatus(rid, from, to, status) {
    const go2 = (f, t, note) => {
      const ids = [rid].concat(relatedRes(rid));
      for (let d = f; d <= t; d = P.addDays(d, 1)) for (const id of ids) { st().resStatus = st().resStatus.filter(x => !(x.resId === id && x.date === d)); st().resStatus.push({ resId: id, date: d, status, note: note || '', busy: true }); }
      save(); renderCal(); toast(resOf(rid).name + ': ' + status + ' ' + P.fmtDate(f) + (t !== f ? '–' + P.fmtDate(t) : ''));
      affectedDialog(rid, f, t, status);
    };
    if (to) return go2(from, to, '');
    dialog2(status + ' eintragen: ' + resOf(rid).name, `<div class="cols" style="gap:8px"><div><label>von</label><input type="date" id="sF" value="${from}"></div><div><label>bis</label><input type="date" id="sT" value="${from}"></div></div><label>Notiz</label><input id="sN" style="width:100%"><p class="muted">Zugehörige Zeit-/Puffer-Ressourcen werden mitgesperrt.</p>`, [{ label: 'Abbrechen' }, { label: 'Eintragen', cls: 'primary', onClick: B => go2(B.querySelector('#sF').value, B.querySelector('#sT').value, B.querySelector('#sN').value) }]);
  }
  // Betroffene Termine nach Krank/Urlaub: Liste zum Abtelefonieren mit Umbuchen
  function affectedDialog(rid, from, to, status) {
    const ids = new Set([rid].concat(relatedRes(rid)));
    const list = st().appts.filter(a => a.patientId && a.status !== 'abgesagt' && a.date >= from && a.date <= to && a.parts.some(p => ids.has(p.resId))).sort((a, b) => (a.date + String(a.start).padStart(4, '0')).localeCompare(b.date + String(b.start).padStart(4, '0')));
    const reason = 'Praxis sagt ab (' + resOf(rid).name + ' ' + status.toLowerCase() + ')';
    const render = () => {
      const open = list.filter(a => a.status !== 'abgesagt').length;
      dialog('Betroffene Termine – ' + resOf(rid).name + ' ' + status, `<p>${list.length} Termine betroffen, davon <b>${open}</b> noch nicht bearbeitet. Patienten anrufen, dann absagen oder direkt umbuchen.</p>
        <table class="grid"><tr><th>Termin</th><th>Patient</th><th>Telefon</th><th>Terminart</th><th>Status</th><th></th></tr>${list.map(a => { const p = patOf(a.patientId); return `<tr><td>${P.fmtDate(a.date, true)} ${P.fmtMin(a.start)}</td><td>${esc(patLabel(p))}</td><td>${esc(p.phone)}${p.sms ? ' <span class="chip">SMS ok</span>' : ''}</td><td>${esc(typeOf(a.typeId)?.name || '')}</td><td>${a.status === 'abgesagt' ? '<span class="bad">abgesagt</span>' : esc(a.status)}</td><td style="white-space:nowrap">${a.status === 'abgesagt' ? '' : `<button class="small" data-x="${a.id}">absagen</button> <button class="small primary" data-u="${a.id}">absagen & neu buchen</button>`}</td></tr>`; }).join('') || '<tr><td colspan=6 class="muted">keine Termine betroffen</td></tr>'}</table>`,
        [{ label: 'Alle offenen absagen', onClick: () => { list.forEach(a => { if (a.status !== 'abgesagt') { a.status = 'abgesagt'; a.cancelReason = reason; a.cancelledAt = simIso(); } }); save(); renderCal(); toast('alle abgesagt'); } }, { label: 'Schließen', onClick: () => renderCal() }]);
      $('#dlgBody').querySelectorAll('[data-x]').forEach(b => b.onclick = () => { const a = list.find(x => x.id === b.dataset.x); a.status = 'abgesagt'; a.cancelReason = reason; a.cancelledAt = simIso(); save(); render(); });
      $('#dlgBody').querySelectorAll('[data-u]').forEach(b => b.onclick = () => { const a = list.find(x => x.id === b.dataset.u); a.status = 'abgesagt'; a.cancelReason = reason + ' – umgebucht'; a.cancelledAt = simIso(); save(); closeDlg(); renderCal(); ui.afterBook = () => affectedDialog(rid, from, to, status); defer(() => openNewAppt({ patientId: a.patientId, date: a.date, start: a.start, typeId: a.typeId }), 50); });
    };
    render();
  }
  function apptMenu(id, pos) {
    const a = st().appts.find(x => x.id === id); if (!a) return;
    const setSt = v => () => { a.status = v; if (v === 'wartend') a.arrivedAt = simIso(); save(); renderCal(); toast(v); };
    const items = [{ label: 'Öffnen …', onClick: () => openAppt(id) }];
    if (a.patientId) items.push({ sep: true }, { label: 'Angekommen (Wartezimmer)', onClick: setSt('wartend') }, { label: 'Aufrufen (in Behandlung)', onClick: setSt('in Behandlung') }, { label: 'Fertig', onClick: setSt('fertig') }, { label: 'Nicht erschienen', onClick: setSt('nicht erschienen') }, { sep: true },
      { label: 'Absagen …', onClick: () => { openAppt(id); const b = [...document.querySelectorAll('#dlgFoot button')].find(x => x.textContent === 'Absagen'); if (b) b.click(); } },
      { label: 'Verschieben …', onClick: () => { openAppt(id); const n = $('#mNext'); if (n) n.focus(); } },
      { label: 'Folgetermin buchen …', onClick: () => openNewAppt({ patientId: a.patientId, typeId: a.typeId, date: P.addDays(a.date, 7), start: a.start }) },
      { label: 'Patientenakte …', onClick: () => openPatient(a.patientId) });
    else items.push({ label: 'Blocker löschen', onClick: () => ask('Blocker löschen', '„' + esc(a.title) + '“ entfernen?', 'Löschen', () => { P.remove(a.id); renderCal(); toast('Blocker gelöscht'); }) });
    popMenu(pos, items);
  }
  const BLOCKER_PRESETS = ['Pause', 'Teambesprechung', 'Admin / Doku', 'Rückrufe', 'Hausbesuch', 'Pflegeheim-Visite', 'Urlaub', 'Fortbildung', 'Laborfahrer kommt', 'Notfall'];
  function quickBlocker(rid, date, start) {
    const B = dialog2('Blocker eintragen', `<datalist id="blkDL">${BLOCKER_PRESETS.map(x => `<option value="${x}">`).join('')}</datalist>
      <label>Titel</label><input id="qbT" list="blkDL" value="Pause" style="width:100%">
      <div class="cols" style="gap:8px"><div><label>Datum</label><input type="date" id="qbD" value="${date}"></div><div><label>von</label><input type="time" step="300" id="qbS" value="${P.fmtMin(start)}"></div><div><label>Dauer</label><select id="qbL">${[10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 480].map(x => `<option value="${x}" ${x === 30 ? 'selected' : ''}>${x >= 60 ? (x / 60) + ' h' : x + ' min'}</option>`).join('')}</select></div></div>
      <label>Ressource</label><select id="qbR" style="width:100%">${cfg().resources.filter(r => !r.hidden).map(r => `<option value="${r.id}" ${r.id === rid ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select>
      <label><input type="checkbox" id="qbZ" checked> zugehörige Zeit-/Puffer-Ressourcen mitsperren (keine Online-Buchung in der Zeit)</label>
      <div id="qbWarn"></div>`,
      [{ label: 'Abbrechen' }, { label: 'Eintragen', cls: 'primary', onClick: B => {
        const r = B.querySelector('#qbR').value, d = B.querySelector('#qbD').value, m0 = P.parseHM(B.querySelector('#qbS').value), dur = +B.querySelector('#qbL').value, title = B.querySelector('#qbT').value.trim() || 'Blocker';
        const ids = [r].concat(B.querySelector('#qbZ').checked ? relatedRes(r) : []);
        // vorhandene Patiententermine im Zeitraum melden
        const s0 = P.absOf(d, m0), e0 = s0 + dur; const hit = st().appts.filter(a => a.patientId && a.status !== 'abgesagt' && a.parts.some(p => ids.includes(p.resId) && p.s < e0 && p.e > s0));
        if (hit.length && !B.dataset.ok) { B.dataset.ok = '1'; B.querySelector('#qbWarn').innerHTML = '<div class="reason bad"><b>Achtung:</b> ' + hit.length + ' Patiententermin(e) in diesem Zeitraum:<br>' + hit.map(a => esc(apptWho(a.id))).join('<br>') + '<br>Nochmal „Eintragen“ = trotzdem blocken.</div>'; return false; }
        const blk = P.blocker(r, d, m0, dur, title); const s1 = blk.parts[0].s;
        for (const id of ids.slice(1)) blk.parts.push({ resId: id, s: s1, e: s1 + dur, label: '' });
        P.update(blk); renderCal(); toast('Blocker „' + title + '“ eingetragen');
      } }]);
    B.querySelector('#qbT').select();
  }
  function popMenu(anchor, items) {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: anchor.x, bottom: anchor.y - 2 }; const m = document.createElement('div'); m.className = 'menu'; m.style.left = Math.min(r.left, innerWidth - 240) + 'px'; m.style.top = Math.min(r.bottom + 2, innerHeight - 30 * items.length - 10) + 'px';
    items.forEach(it => { const d = document.createElement('div'); if (it.sep) { d.className = 'sep'; m.appendChild(d); return; } d.textContent = it.label; if (it.on) d.className = 'on'; d.onclick = () => { m.remove(); it.onClick(); }; m.appendChild(d); });
    document.body.appendChild(m); setTimeout(() => document.addEventListener('click', function f() { m.remove(); document.removeEventListener('click', f); }), 0);
  }
  function calNav() { if (ui.bk) { renderCalGrid(); renderCalSideMonths(); } else renderCal(); }
  $('#calToday').onclick = () => { ui.date = TODAY(); calNav(); };
  $('#calPrev').onclick = () => { ui.date = P.addDays(ui.date, ui.mode === 'week' ? -7 : -1); calNav(); };
  $('#calNext').onclick = () => { ui.date = P.addDays(ui.date, ui.mode === 'week' ? 7 : 1); calNav(); };
  $('#calDay').onclick = () => { ui.mode = 'day'; renderCal(); };
  $('#calWeek').onclick = () => { ui.mode = 'week'; renderCal(); };
  $('#calWeekRes').onchange = e => { ui.weekRes = e.target.value; renderCal(); };
  $('#calViewBtn').onclick = e => { e.stopPropagation(); popMenu($('#calViewBtn'), st().views.map((v, i) => ({ label: v.name, on: i === ui.view, onClick: () => { ui.view = i; ui.mode = 'day'; renderCal(); } })).concat([{ label: '+ Ansicht bearbeiten / neu …', onClick: () => editViewCols(ui.view) }])); };
  $('#calCols').onclick = () => editViewCols(ui.view);
  $('#calPrint').onclick = () => window.print();
  $('#calWait').onclick = () => go('warteliste');
  $('#calList').onclick = () => {
    const list = st().appts.filter(a => a.date === ui.date && a.status !== 'abgesagt').sort((a, b) => a.start - b.start);
    dialog('Terminliste ' + P.fmtDate(ui.date, true), `<table class="grid"><tr><th>Zeit</th><th>Patient</th><th>Terminart</th><th>Ressourcen</th><th>Status</th></tr>${list.map(a => `<tr data-go="${a.id}" style="cursor:pointer"><td>${P.fmtMin(a.start)}</td><td>${esc(patLabel(patOf(a.patientId)) || a.title)}</td><td>${esc((typeOf(a.typeId) || {}).name || '')} <b>${esc(Object.values(a.fields || {}).join(' '))}</b></td><td>${a.parts.map(p => esc(resOf(p.resId)?.name || '')).join(', ')}</td><td>${esc(a.status)}</td></tr>`).join('')}</table>`, [{ label: 'Drucken', onClick: () => { window.print(); return false; } }, { label: 'Schließen' }]);
    $('#dlgBody').querySelectorAll('[data-go]').forEach(tr => tr.onclick = () => { closeDlg(); openAppt(tr.dataset.go); });
  };
  $('#calCancelled').onclick = () => {
    const list = st().appts.filter(a => a.status === 'abgesagt').sort((a, b) => (b.cancelledAt || '').localeCompare(a.cancelledAt || ''));
    dialog('Zuletzt abgesagte Termine', `<table class="grid"><tr><th>Termin</th><th>Patient</th><th>Terminart</th><th>Grund</th><th></th></tr>${list.map(a => `<tr><td>${P.fmtDate(a.date, true)} ${P.fmtMin(a.start)}</td><td>${esc(patLabel(patOf(a.patientId)))}</td><td>${esc((typeOf(a.typeId) || {}).name || a.title)}</td><td>${esc(a.cancelReason || '')}</td><td><button class="small" data-re="${a.id}">reaktivieren</button></td></tr>`).join('') || '<tr><td colspan=5 class="muted">keine</td></tr>'}</table>`, [{ label: 'Schließen' }]);
    $('#dlgBody').querySelectorAll('[data-re]').forEach(b => b.onclick = () => { const a = st().appts.find(x => x.id === b.dataset.re); const ev = P.evaluate(a.typeId, a.date, a.start, { ignoreNow: true, ignoreAppt: a.id }); const doIt = () => { if (ev.ok) a.parts = ev.parts; else a.overbooked = true; a.status = 'geplant'; save(); closeDlg(); renderCal(); toast('Termin reaktiviert'); }; if (ev.ok) doIt(); else ask('Slot belegt', 'Slot inzwischen nicht mehr frei:<br>' + ev.reasons.map(esc).join('<br>') + '<br><br>Trotzdem reaktivieren (Überbuchung)?', 'Überbuchen', doIt); });
  };
  $('#calSearchWrap').onsubmit = e => {
    e.preventDefault(); const q = $('#calSearch').value.trim().toLowerCase(); if (!q) return;
    const hits = st().appts.filter(a => { const p = patOf(a.patientId), t = typeOf(a.typeId); return (p && (patName(p).toLowerCase().includes(q) || p.id.toLowerCase() === q || P.fmtDate(p.birth).includes(q))) || (t && t.name.toLowerCase().includes(q)) || (a.title || '').toLowerCase().includes(q); }).sort((a, b) => { const T = TODAY(), fa = a.date >= T, fb = b.date >= T; if (fa !== fb) return fa ? -1 : 1; const k = x => x.date + String(x.start).padStart(4, '0'); return fa ? k(a).localeCompare(k(b)) : k(b).localeCompare(k(a)); }).slice(0, 200);
    dialog('Terminsuche: ' + q, `<table class="grid"><tr><th>Datum</th><th>Patient</th><th>Terminart</th><th>Status</th></tr>${hits.map(a => `<tr data-go="${a.id}" style="cursor:pointer"><td>${P.fmtDate(a.date, true)} ${P.fmtMin(a.start)}</td><td>${esc(patLabel(patOf(a.patientId)) || a.title)}</td><td>${esc((typeOf(a.typeId) || {}).name || '')}</td><td>${esc(a.status)}</td></tr>`).join('') || '<tr><td colspan=4 class="muted">keine Treffer</td></tr>'}</table>`, [{ label: 'Schließen' }]);
    $('#dlgBody').querySelectorAll('[data-go]').forEach(tr => tr.onclick = () => { const a = st().appts.find(x => x.id === tr.dataset.go); closeDlg(); ui.date = a.date; ui.mode = 'day'; go('kalender'); scrollToAppt(a); defer(() => openAppt(a.id), 30); });
  };

  function editViewCols(vi) {
    const v = st().views[vi]; const sel = new Set(v.resIds);
    const body = h(`<label>Name der Ansicht</label><input id="vName" value="${esc(v.name)}" style="width:100%"><label><input type="checkbox" id="vHidden"> auch ausgeblendete Ressourcen (zz…, frei…) zeigen</label><div class="list" id="vList" style="max-height:50vh"></div><p class="muted">Reihenfolge = Reihenfolge der Auswahl. Entspricht samedi „Gespeicherte Institutions-Ansichten“.</p>`);
    const order = v.resIds.slice();
    function fill() {
      const showH = body.querySelector('#vHidden').checked;
      body.querySelector('#vList').innerHTML = cfg().resources.filter(r => showH || !r.hidden || sel.has(r.id)).map(r => `<div class="it"><label style="margin:0"><input type="checkbox" data-r="${r.id}" ${sel.has(r.id) ? 'checked' : ''}> ${esc(r.name)} <span class="muted">${esc(r.caps.join(', '))}</span></label></div>`).join('');
      body.querySelectorAll('[data-r]').forEach(cb => cb.onchange = () => { if (cb.checked) { sel.add(cb.dataset.r); order.push(cb.dataset.r); } else { sel.delete(cb.dataset.r); order.splice(order.indexOf(cb.dataset.r), 1); } });
    }
    body.querySelector('#vHidden').onchange = fill; fill();
    dialog('Spalten der Ansicht', body, [
      { label: 'Als neue Ansicht speichern', onClick: () => { st().views.push({ name: body.querySelector('#vName').value + ' (Kopie)', resIds: order.filter(id => sel.has(id)) }); ui.view = st().views.length - 1; save(); renderCal(); } },
      { label: 'Abbrechen' },
      { label: 'Übernehmen', cls: 'primary', onClick: () => { v.name = body.querySelector('#vName').value; v.resIds = order.filter(id => sel.has(id)); save(); renderCal(); } },
    ]);
  }
  function openChainDialog() {
    const body = h(`<fieldset><legend>Patient</legend><div id="kPat"></div></fieldset><fieldset><legend>Terminkette</legend><select id="kSel" style="width:100%">${cfg().chains.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select><label>ab Datum</label><input type="date" id="kFrom" value="${ui.date}"> <button id="kPlan">Kette planen</button><div id="kOut"></div></fieldset>`);
    let pid = null; patientPicker(body.querySelector('#kPat'), pid, id => pid = id);
    body.querySelector('#kPlan').onclick = () => planChain(body.querySelector('#kOut'), body.querySelector('#kSel').value, () => pid, body.querySelector('#kFrom').value);
    dialog('Neue Terminkette', body, [{ label: 'Schließen', onClick: () => renderCal() }]);
  }

  // ---------- Termin anlegen ----------
  function typeMatchesRes(t, resId) {
    const r = resOf(resId); if (!r) return true;
    if (t.alts && t.alts.length) return t.alts.some(id => { const x = typeOf(id); return x && typeMatchesRes(x, resId); });
    return t.blocks.some(b => r.caps.includes(b.cap));
  }
  function patientPicker(container, initialId, onPick) {
    container.innerHTML = `<input class="pq" placeholder="Patient suchen (Name, ID, Geburtsdatum)" style="width:100%"><div class="list pl" style="max-height:150px"></div><div class="psel" style="margin-top:4px"></div>`;
    let selId = initialId;
    const q = container.querySelector('.pq'), list = container.querySelector('.pl'), ps = container.querySelector('.psel');
    function show() {
      ps.innerHTML = selId ? `Gewählt: <b>${esc(patLabel(patOf(selId)))}</b> · ${esc(patOf(selId).insurance)} <a href="#" class="pch">ändern</a>` : '<span class="muted">kein Patient gewählt</span>';
      // nach Auswahl Trefferliste einklappen, bis wieder gesucht wird
      const collapsed = selId && !q.value.trim(); list.style.display = collapsed ? 'none' : ''; q.style.display = collapsed ? 'none' : '';
      const ch = ps.querySelector('.pch'); if (ch) ch.onclick = e => { e.preventDefault(); list.style.display = ''; q.style.display = ''; q.focus(); };
    }
    function fill() {
      const s = q.value.trim().toLowerCase();
      const dob = parseDOB(s); const hits = st().patients.filter(p => !s || patName(p).toLowerCase().includes(s) || p.id.toLowerCase().includes(s) || P.fmtDate(p.birth).includes(s) || (dob && p.birth === dob) || (s.length > 4 && String(p.phone || '').replace(/\s/g, '').includes(s.replace(/\s/g, '')))).slice(0, 30);
      list.innerHTML = hits.map(p => `<div class="it ${p.id === selId ? 'sel' : ''}" data-p="${p.id}">${esc(patLabel(p))} <span class="muted">${esc(p.insurance)} · ${esc(p.city)}</span></div>`).join('') + `<div class="it" data-new="1">+ neuen Patienten anlegen …</div>`;
      list.querySelectorAll('[data-p]').forEach(d => d.onclick = () => { selId = d.dataset.p; q.value = ''; fill(); show(); onPick(selId); });
      list.querySelector('[data-new]').onclick = () => quickPatient(q.value, p => { selId = p.id; q.value = ''; fill(); show(); onPick(selId); });
    }
    q.oninput = () => { fill(); list.style.display = ''; }; fill(); show();
  }
  // ---------- Patientenmaske (Anlegen + Bearbeiten) ----------
  const KASSEN_LIST = ['AOK Bayern', 'Techniker Krankenkasse', 'BARMER', 'DAK-Gesundheit', 'BKK Mobil', 'IKK classic', 'SBK', 'KKH', 'hkk', 'Knappschaft', 'Allianz PKV', 'Debeka', 'Bayerische Beamtenkrankenkasse', 'AXA', 'Signal Iduna', 'HUK-Coburg', 'Beihilfe'];
  // Geburtsdatum tippen wie in der Praxis: 12.03.1985 · 12.3.85 · 12031985 · 120385 · 1985-03-12
  function parseDOB(str) {
    let s = String(str || '').trim(); if (!s) return null;
    let d, m, y, mm;
    if ((mm = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, m, d] = mm;
    else if ((mm = s.match(/^(\d{1,2})[.\/ -](\d{1,2})[.\/ -](\d{2}|\d{4})$/))) [, d, m, y] = mm;
    else if ((mm = s.match(/^(\d{2})(\d{2})(\d{4})$/))) [, d, m, y] = mm;
    else if ((mm = s.match(/^(\d{2})(\d{2})(\d{2})$/))) [, d, m, y] = mm;
    else return null;
    d = +d; m = +m; y = +y;
    if (y < 100) { const cy = +TODAY().slice(2, 4); y += y > cy ? 1900 : 2000; }
    const iso = y + '-' + P.pad(m) + '-' + P.pad(d);
    const chk = new Date(Date.UTC(y, m - 1, d));
    if (chk.getUTCMonth() !== m - 1 || chk.getUTCDate() !== d || iso > TODAY() || y < 1900) return null;
    return iso;
  }
  function patientFormHtml(p) {
    p = p || {};
    const v = k => esc(p[k] || '');
    const sel = (k, opts) => opts.map(o => `<option ${p[k] === o ? 'selected' : ''}>${o}</option>`).join('');
    return `<datalist id="kassenDL">${KASSEN_LIST.map(k => `<option value="${k}">`).join('')}</datalist>
      <fieldset><legend>Person</legend><div class="cols" style="gap:8px"><div style="flex:0 0 90px;min-width:90px"><label>Anrede</label><select data-k="salutation" style="width:100%"><option></option>${sel('salutation', ['Frau', 'Herr', 'divers'])}</select></div><div style="flex:0 0 90px;min-width:90px"><label>Titel</label><input data-k="title" value="${v('title')}" style="width:100%"></div><div><label>Nachname *</label><input data-k="last" value="${v('last')}" style="width:100%"></div><div><label>Vorname *</label><input data-k="first" value="${v('first')}" style="width:100%"></div></div>
      <div class="cols" style="gap:8px"><div><label>Geburtsdatum * <span class="muted">(TT.MM.JJJJ oder 12031985)</span></label><input data-k="birth" value="${p.birth ? P.fmtDate(p.birth) : ''}" placeholder="TT.MM.JJJJ" style="width:140px"> <span class="dobHint muted"></span></div></div></fieldset>
      <fieldset><legend>Versicherung</legend><div class="cols" style="gap:8px"><div style="flex:0 0 150px;min-width:150px"><label>Versicherungsart</label><select data-k="insurance" style="width:100%">${sel('insurance', ['GKV', 'PKV', 'Selbstzahler'])}</select></div><div><label>Kasse / Versicherung</label><input data-k="insurer" list="kassenDL" value="${v('insurer')}" style="width:100%"></div><div><label>Versichertennummer</label><input data-k="insNo" value="${v('insNo')}" style="width:100%"></div></div></fieldset>
      <fieldset><legend>Kontakt</legend><div class="cols" style="gap:8px"><div><label>Telefon</label><input data-k="phone" value="${v('phone')}" style="width:100%"></div><div><label>Mobil</label><input data-k="mobile" value="${v('mobile')}" style="width:100%"></div><div><label>E-Mail</label><input data-k="email" value="${v('email')}" style="width:100%"></div></div>
      <div class="cols" style="gap:8px"><div><label>Straße, Nr.</label><input data-k="street" value="${v('street')}" style="width:100%"></div><div style="flex:0 0 80px;min-width:80px"><label>PLZ</label><input data-k="zip" value="${v('zip')}" style="width:100%"></div><div><label>Ort</label><input data-k="city" value="${v('city')}" style="width:100%"></div></div>
      <label style="display:inline-block;margin-right:14px"><input type="checkbox" data-k="sms" ${p.sms !== false ? 'checked' : ''}> SMS-Erinnerung</label><label style="display:inline-block"><input type="checkbox" data-k="mailOk" ${p.mailOk ? 'checked' : ''}> E-Mail-Erinnerung</label>
      <label>Notiz</label><input data-k="note" value="${v('note')}" style="width:100%"></fieldset><div class="pfErr bad"></div>`;
  }
  function wirePatientForm(B) {
    const dob = B.querySelector('[data-k="birth"]'), hint = B.querySelector('.dobHint');
    const upd = () => { const iso = parseDOB(dob.value); hint.textContent = dob.value ? (iso ? '= ' + P.fmtDate(iso, true).replace(/^\w+\. /, '') + ' · ' + age({ birth: iso }) + ' J.' : 'ungültig') : ''; hint.className = 'dobHint ' + (dob.value && !iso ? 'bad' : 'muted'); };
    dob.oninput = upd; dob.onblur = () => { const iso = parseDOB(dob.value); if (iso) dob.value = P.fmtDate(iso); upd(); }; upd();
    const ins = B.querySelector('[data-k="insurance"]'), kk = B.querySelector('[data-k="insurer"]');
    ins.onchange = () => { if (ins.value === 'Selbstzahler') kk.value = ''; };
  }
  function readPatientForm(B) {
    const o = {}; B.querySelectorAll('[data-k]').forEach(i => o[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value.trim());
    const err = [];
    if (!o.last) err.push('Nachname fehlt'); if (!o.first) err.push('Vorname fehlt');
    const iso = parseDOB(o.birth); if (!iso) err.push('Geburtsdatum fehlt oder ungültig'); else o.birth = iso;
    o.sex = o.salutation === 'Frau' ? 'w' : o.salutation === 'Herr' ? 'm' : (o.salutation === 'divers' ? 'd' : '');
    B.querySelector('.pfErr').textContent = err.join(' · ');
    return err.length ? null : o;
  }
  function findDuplicates(o, exceptId) {
    const n = x => String(x || '').toLowerCase().replace(/\s+/g, ' ').trim();
    return st().patients.filter(p => p.id !== exceptId && ((n(p.last) === n(o.last) && n(p.first) === n(o.first)) || (n(p.last) === n(o.last) && p.birth === o.birth)));
  }
  function nextPatientId() { let n = 1001; const used = new Set(st().patients.map(p => p.id)); while (used.has('T' + n)) n++; return 'T' + n; }
  function quickPatient(prefill, onDone) {
    const [l0, f0] = String(prefill || '').split(',').map(x => (x || '').trim());
    const B = dialog2('Neuer Patient', patientFormHtml({ last: l0, first: f0 || '', insurance: 'GKV', sms: true }), [{ label: 'Abbrechen' }, { label: 'Anlegen', cls: 'primary', onClick: B => {
      const o = readPatientForm(B); if (!o) return false;
      const create = () => { const p = Object.assign({ id: nextPatientId(), test: true }, o); st().patients.push(p); save(); touchRecent(p.id); toast('Patient ' + p.id + ' angelegt: ' + patName(p)); onDone && onDone(p); };
      const dups = findDuplicates(o);
      if (!dups.length) { create(); return; }
      // Dublette: Rückfrage im selben Fenster
      B.querySelector('.pfErr').innerHTML = '<div class="reason bad"><b>Mögliche Dublette:</b><br>' + dups.map(d => `<a href="#" data-dup="${d.id}">${esc(patLabel(d))}</a> · ${esc(d.city || '')}`).join('<br>') + '<br><button class="small" id="dupForce">trotzdem neu anlegen</button></div>';
      B.querySelectorAll('[data-dup]').forEach(a => a.onclick = e => { e.preventDefault(); $('#dlg2').close(); touchRecent(a.dataset.dup); onDone && onDone(patOf(a.dataset.dup)); });
      B.querySelector('#dupForce').onclick = () => { $('#dlg2').close(); create(); };
      return false;
    } }]);
    $('#dlg2').style.width = '680px';
    wirePatientForm(B);
    const first = B.querySelector(l0 ? (f0 ? '[data-k="birth"]' : '[data-k="first"]') : '[data-k="last"]'); if (first) first.focus();
  }

  function typeSelectHtml(filterFn, selected) {
    const groups = {};
    for (const t of cfg().eventTypes) { if (!filterFn(t)) continue; (groups[t.category || '—'] = groups[t.category || '—'] || []).push(t); }
    return Object.keys(groups).sort().map(g => `<optgroup label="${esc(g)}">${groups[g].sort((a, b) => a.name.localeCompare(b.name)).map(t => `<option value="${t.id}" ${t.id === selected ? 'selected' : ''}>${esc(t.name)} (${P.fmtDur(t.dur)})</option>`).join('')}</optgroup>`).join('');
  }
  function commentFieldsHtml(t, values) {
    if (!t) return '';
    const sets = cfg().commentSets.filter(c => t.commentSets.includes(c.name));
    const fields = []; const seen = new Set();
    for (const s of sets) for (const f of s.fields) if (!seen.has(f.name)) { seen.add(f.name); fields.push(f); }
    return fields.map(f => {
      const v = (values || {})[f.name] || '';
      if (f.type === 'combo' && f.config) return `<label>${esc(f.name)}${f.required ? ' *' : ''}</label><select data-field="${esc(f.name)}"><option></option>${f.config.values.split('\n').map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      return `<label>${esc(f.name)}${f.required ? ' *' : ''}</label><input data-field="${esc(f.name)}" value="${esc(v)}" style="width:100%">`;
    }).join('');
  }
  // ---------- Buchungsprüfung in MFA-Sprache ----------
  const isTech = id => /^Zeit|^Zusatz/.test((resOf(id) || {}).name || '');
  function personOf(resId) {
    const r = resOf(resId); if (!r) return '?';
    let n = r.name; const kz = (n.match(/\(([^)]+)\)/) || [])[1];
    if (/^Zeit|^Zusatz/.test(n) && kz) { const main = cfg().resources.find(x => !/^Zeit|^Zusatz/.test(x.name) && x.name.includes('(' + kz + ')')); if (main) n = main.name; }
    return n.replace(/\s*\([^)]*\)\s*$/, '');
  }
  const WD_LONG = { Mo: 'montags', Di: 'dienstags', Mi: 'mittwochs', Do: 'donnerstags', Fr: 'freitags', Sa: 'samstags', So: 'sonntags' };
  function whenTxt(abs) { const x = P.splitAbs(abs); const d = x.date === TODAY() ? 'heute' : x.date === P.addDays(TODAY(), 1) ? 'morgen' : x.date === P.addDays(TODAY(), -1) ? 'gestern' : P.weekday(x.date) + '. ' + P.fmtDate(x.date).slice(0, 6); return d + ' ab ' + P.fmtMin(x.min); }
  function apptWho(id) { const a = st().appts.find(x => x.id === id); if (!a) return 'einen anderen Termin'; const p = patOf(a.patientId); return (p ? p.last + ', ' + p.first : '„' + a.title + '“') + ' (' + P.fmtMin(a.start) + ')'; }
  const hm = m => m === 1440 ? '24:00' : P.fmtMin(m);
  function explain(ev, ctx) {
    if (ev.ok) {
      const human = ev.parts.filter(p => !isTech(p.resId));
      const show = (human.length ? human : ev.parts.slice(0, 1)).map(p => personOf(p.resId) + ' ' + P.fmtMin(p.s % 1440) + '–' + P.fmtMin(p.e % 1440));
      return { ok: true, head: show.join(' · ') };
    }
    const lines = [];
    const date = ctx && ctx.date, wd = date ? P.weekday(date) : '';
    for (const c of ev.codes || []) {
      if (c.code === 'past') lines.push('Der Zeitpunkt liegt in der Vergangenheit.');
      else if (c.code === 'channel') lines.push('Diese Terminart ist für die Praxis nicht direkt buchbar.');
      else if (c.code === 'insurance') lines.push('Nur für ' + c.allowed.join(' / ') + ' – der Patient ist ' + c.has + '.');
      else if (c.code === 'typewindow') { const hs = (c.hours || []); lines.push(!hs.length ? 'Diese Terminart gibt es ' + (WD_LONG[wd] || 'an diesem Tag') + ' nicht.' : 'Diese Terminart gibt es nur ' + hs.map(([x, y]) => x === 0 ? 'bis ' + hm(y) : y === 1440 ? 'ab ' + hm(x) : hm(x) + '–' + hm(y)).join(', ') + ' Uhr.'); }
      else if (c.code === 'typeMin') lines.push('Diese Terminart braucht mindestens ' + Math.round(c.min / 60) + ' Std. Vorlauf.');
      else if (c.code === 'typeMax') lines.push('Diese Terminart ist höchstens ' + Math.round(c.max / 1440) + ' Tage im Voraus buchbar.');
      else if (c.code === 'quota') lines.push('Tageskontingent „' + c.quota + '“ ist schon voll (' + c.cap + ' pro Tag).');
      else if (c.code === 'alts') lines.push('Bei keinem der ' + c.n + ' Ärzte ist zu dieser Zeit etwas frei.');
      else if (c.code === 'column') lines.push('Diese Terminart passt nicht zur angeklickten Spalte.');
    }
    for (const b of ev.blockReasons || []) {
      const ws = b.whyS || []; const rid0 = (ix().capIdx.get(b.cap) || [])[0]; const who = rid0 ? personOf(rid0) : b.cap;
      const tm = P.fmtMin(((b.s % 1440) + 1440) % 1440);
      const st_ = ws.find(w => w.code === 'status'), pu = ws.find(w => w.code === 'puffer'), bu = ws.find(w => w.code === 'busy');
      if (st_) { const stt = (st_.text.match(/„([^“]+)“/) || [, 'abwesend'])[1]; lines.push(who + (stt === 'Krank' ? ' ist krank gemeldet.' : stt === 'Urlaub' ? ' ist im Urlaub.' : ' ist abwesend (' + stt + ').')); }
      else if (pu) lines.push('Das ist ein Notfall-Puffer von ' + who + ' – wird erst ' + whenTxt(pu.releaseAt) + ' freigegeben.');
      else if (bu) { const ba = st().appts.find(x => x.id === bu.by); lines.push(ba && !ba.patientId ? who + ' ist um ' + tm + ' blockiert: „' + ba.title + '“.' : who + ' hat um ' + tm + ' schon einen Termin: ' + apptWho(bu.by) + '.'); }
      else if (ws.length && ws.every(w => w.code === 'closed')) lines.push(ws.some(w => /ganztägig zu/.test(w.text)) ? who + ' ist ' + (WD_LONG[wd] || 'an diesem Tag') + ' nicht da.' : who + ' hat um ' + tm + ' keine Sprechzeit.');
      else if (!ws.length) lines.push('Für ' + who + ' ist keine Ressource eingerichtet.');
      else lines.push(who + ' ist um ' + tm + ' nicht verfügbar.');
    }
    return { ok: false, lines: [...new Set(lines)].slice(0, 4) };
  }
  function techHtml(ev) {
    if (ev.ok) return ev.parts.map(p => esc(resOf(p.resId)?.name) + (p.label ? ' (' + esc(p.label) + ')' : '') + ' ' + P.fmtMin(p.s % 1440) + '–' + P.fmtMin(p.e % 1440)).join('<br>') + (ev.viaType ? '<br>über ' + esc(typeOf(ev.viaType).name) : '');
    return ev.reasons.map(esc).join('<br>') + (ev.blockReasons || []).map(b => `<br><b>${esc(b.block)}</b><br>${b.why.map(esc).join('<br>')}`).join('');
  }
  // ctx: {typeId,date,start,patientId}; liefert HTML, Knöpfe mit data-nextfree werden vom Aufrufer verdrahtet
  function reasonsHtml(ev, ctx) {
    const x = explain(ev, ctx);
    let html = x.ok ? `<div class="reason ok">✓ <b>Frei</b> – ${esc(x.head)}</div>` : `<div class="reason bad">✗ <b>Buchung nicht möglich</b>${x.lines.map(l => '<div>• ' + esc(l) + '</div>').join('')}</div>`;
    if (!x.ok && ctx && ctx.typeId) {
      const nx = P.findSlots(ctx.typeId, ctx.date, { channel: 'intern', days: 30, max: 1, fromMin: (ctx.start || 0) + 5, patient: patOf(ctx.patientId), ignoreAppt: ctx.ignoreAppt })[0];
      if (nx) html += `<button class="small primary" data-nextfree="${nx.date}|${nx.start}|${nx.parts[0].resId}">Nächster freier Termin: ${P.weekday(nx.date)}. ${P.fmtDate(nx.date).slice(0, 6)} ${P.fmtMin(nx.start)} (${esc(personOf((nx.parts.find(p => !isTech(p.resId)) || nx.parts[0]).resId))})</button>`;
    }
    return html + `<details class="muted" style="font-size:10px;margin-top:3px"><summary>Technische Details</summary>${techHtml(ev)}</details>`;
  }


  // ---------- Buchungsfenster rechts unten (samedi: Kalender bleibt bedienbar) ----------
  function openNewAppt(o) {
    o = o || {};
    const prev = ui.bk || {};
    ui.bk = { patientId: o.patientId || null, typeId: o.typeId || '', date: o.date || ui.date, start: o.start != null ? o.start : null, resId: o.resId || null,
      fields: {}, note: '', blocker: false, title: 'Blocker', bdur: 30, bres: o.resId || null, typeQ: '', onlyCol: !!o.resId && !o.typeId, ev: null };
    closeDlg();
    if (ui.page !== 'kalender') go('kalender');
    ui.date = ui.bk.date;
    if (!ui.bk.typeId && ui.bk.resId) { const t = cfg().eventTypes.filter(t => !t.chainOnly && t.intern && typeMatchesRes(t, ui.bk.resId)).sort((a, b) => a.name.localeCompare(b.name))[0]; if (t) ui.bk.typeId = t.id; }
    bkEval(); renderCal();
    if (ui.bk.start != null) { const s = st().settings; $('#calScroll').scrollTop = Math.max(0, (ui.bk.start - s.dayStart - 45) * s.pxPerMin); }
    const q = $('#bkPanel .pq'); if (q && !ui.bk.patientId) q.focus();
  }
  function closeBooking(runAfter) { ui.bk = null; renderCal(); if (runAfter && ui.afterBook) { const f = ui.afterBook; ui.afterBook = null; defer(f, 50); } }
  function bkEval() {
    const bk = ui.bk; if (!bk) return;
    if (bk.blocker || !bk.typeId || bk.start == null) { bk.ev = null; return; }
    const t = typeOf(bk.typeId);
    bk.ev = P.evaluate(bk.typeId, bk.date, bk.start, { channel: 'intern', preferRes: bk.resId && t && typeMatchesRes(t, bk.resId) ? bk.resId : null, patient: patOf(bk.patientId) });
  }
  function bkSyncInputs() {
    const bk = ui.bk, B = $('#bkPanel'); if (!bk || !B) return;
    B.querySelector('#bkDate').value = bk.date; B.querySelector('#bkTime').value = bk.start != null ? P.fmtMin(bk.start) : '';
    B.querySelector('#bkCol').textContent = bk.resId ? resOf(bk.resId).name : '– (im Kalender klicken)';
    if (bk.blocker) B.querySelector('#bkBRes').value = bk.bres || bk.resId || '';
    bkShowEval();
  }
  function bkShowEval() {
    const bk = ui.bk, B = $('#bkPanel'); if (!bk || !B) return;
    const E = B.querySelector('#bkEval');
    if (bk.blocker) E.innerHTML = bk.start != null ? `<div class="reason">Blocker ${P.fmtDate(bk.date, true)} ${P.fmtMin(bk.start)} · ${bk.bdur} min · ${esc((resOf(bk.bres || bk.resId) || {}).name || 'Ressource wählen')}</div>` : '<div class="reason">Zeitpunkt im Kalender anklicken.</div>';
    else if (!bk.typeId) E.innerHTML = '<div class="reason">Terminart wählen.</div>';
    else if (bk.start == null) E.innerHTML = '<div class="reason">Grün markierte Zeit im Kalender anklicken oder „Nächste freie“ nutzen.</div>';
    else {
      E.innerHTML = `<div class="muted" style="margin-bottom:2px">${P.fmtDate(bk.date, true)} ${P.fmtMin(bk.start)}</div>` + reasonsHtml(bk.ev, { typeId: bk.typeId, date: bk.date, start: bk.start, patientId: bk.patientId });
      E.querySelectorAll('[data-nextfree]').forEach(b => b.onclick = () => { const [d, m, r] = b.dataset.nextfree.split('|'); bk.date = d; bk.start = +m; bk.resId = r; ui.date = d; bkEval(); renderCalGrid(); renderCalSideMonths(); bkSyncInputs(); const s2 = st().settings; $('#calScroll').scrollTop = Math.max(0, (bk.start - s2.dayStart - 45) * s2.pxPerMin); });
    }
    const ok = bk.blocker ? bk.start != null && (bk.bres || bk.resId) : (bk.ev && bk.ev.ok && bk.patientId);
    B.querySelector('#bkBook').disabled = !ok;
    B.querySelector('#bkOver').style.display = !bk.blocker && bk.ev && !bk.ev.ok && bk.patientId ? '' : 'none';
  }
  function renderBookingPanel() {
    const bk = ui.bk, B = $('#bkPanel'); if (!bk || !B) return;
    B.innerHTML = `<div class="bkHead"><span>Neuer Termin</span><button class="small" id="bkX" title="Buchung abbrechen">✕</button></div>
      <div class="bkBody">
        <fieldset><legend>Patient</legend><label style="display:inline"><input type="checkbox" id="bkBlockCb" ${bk.blocker ? 'checked' : ''}> ohne Patient (Blocker / Abwesenheit)</label>
          <div id="bkPat" style="margin-top:4px;${bk.blocker ? 'display:none' : ''}"></div>
          <div id="bkBlk" style="${bk.blocker ? '' : 'display:none'}"><label>Titel</label><input id="bkTitle" value="${esc(bk.title)}" style="width:100%"><div class="cols" style="gap:6px"><div><label>Dauer (min)</label><input id="bkBDur" type="number" value="${bk.bdur}" style="width:80px"></div><div><label>Ressource</label><select id="bkBRes" style="width:100%"><option value=""></option>${cfg().resources.filter(r => !r.hidden).map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div></div></div>
        </fieldset>
        <fieldset id="bkTypeFs" style="${bk.blocker ? 'display:none' : ''}"><legend>Terminart</legend><input id="bkTQ" placeholder="Terminart filtern" value="${esc(bk.typeQ)}" style="width:100%">
          <label style="display:inline"><input type="checkbox" id="bkOnly" ${bk.onlyCol && bk.resId ? 'checked' : ''} ${bk.resId ? '' : 'disabled'}> nur passend zur Spalte</label>
          <select id="bkType" size="7" style="width:100%;margin-top:3px"></select></fieldset>
        <fieldset><legend>Zeitpunkt</legend><div class="cols" style="gap:6px;align-items:end"><div style="flex:0 0 auto;min-width:0"><label>Datum</label><input type="date" id="bkDate"></div><div style="flex:0 0 auto;min-width:0"><label>Uhrzeit</label><input type="time" step="300" id="bkTime"></div><div><label>Spalte</label><div id="bkCol" style="padding:4px 0;font-weight:700"></div></div></div>
          <div id="bkEval" style="margin-top:4px"></div>
          <div style="margin-top:4px"><button class="small" id="bkNextBtn">Nächste freie Termine</button></div><div id="bkNext"></div></fieldset>
        <fieldset id="bkFieldsFs" style="${bk.blocker ? 'display:none' : ''}"><legend>Kommentar</legend><div id="bkFields"></div><label>Notiz</label><input id="bkNote" value="${esc(bk.note)}" style="width:100%"></fieldset>
      </div>
      <div class="bkFoot"><button id="bkCancel">Abbrechen</button><button class="danger" id="bkOver" style="display:none">Trotzdem eintragen</button><button class="primary" id="bkBook">Buchen</button></div>`;
    patientPicker(B.querySelector('#bkPat'), bk.patientId, id => { bk.patientId = id; bkEval(); bkShowEval(); renderCalGrid(); });
    const tSel = B.querySelector('#bkType');
    const fillTypes = () => {
      const q = bk.typeQ.toLowerCase();
      tSel.innerHTML = typeSelectHtml(t => !t.chainOnly && t.intern !== false && (!q || t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)) && (!bk.onlyCol || !bk.resId || typeMatchesRes(t, bk.resId)), bk.typeId);
      if (bk.typeId && ![...tSel.options].some(o => o.value === bk.typeId)) { /* gewählte Terminart bleibt gültig, ist nur ausgefiltert */ }
    };
    const fillFields = () => { B.querySelector('#bkFields').innerHTML = commentFieldsHtml(typeOf(bk.typeId), bk.fields); B.querySelectorAll('#bkFields [data-field]').forEach(i => i.oninput = i.onchange = () => { bk.fields[i.dataset.field] = i.value; }); };
    fillTypes(); fillFields(); bkSyncInputs();
    B.querySelector('#bkX').onclick = B.querySelector('#bkCancel').onclick = () => closeBooking(true);
    B.querySelector('#bkTQ').oninput = e => { bk.typeQ = e.target.value; fillTypes(); };
    B.querySelector('#bkOnly').onchange = e => { bk.onlyCol = e.target.checked; fillTypes(); };
    tSel.onchange = () => { bk.typeId = tSel.value; bk.fields = {}; fillFields(); bkEval(); bkShowEval(); renderCalGrid(); };
    B.querySelector('#bkDate').onchange = e => { bk.date = e.target.value; ui.date = bk.date; bkEval(); renderCalGrid(); renderCalSideMonths(); bkShowEval(); };
    B.querySelector('#bkTime').onchange = e => { bk.start = e.target.value ? P.parseHM(e.target.value) : null; bkEval(); renderCalGrid(); bkShowEval(); };
    B.querySelector('#bkNote').oninput = e => bk.note = e.target.value;
    B.querySelector('#bkBlockCb').onchange = e => { bk.blocker = e.target.checked; bkEval(); renderBookingPanel(); renderCalGrid(); };
    B.querySelector('#bkTitle').oninput = e => bk.title = e.target.value;
    B.querySelector('#bkBDur').oninput = e => { bk.bdur = +e.target.value || 10; bkShowEval(); };
    B.querySelector('#bkBRes').onchange = e => { bk.bres = e.target.value; bkShowEval(); };
    B.querySelector('#bkNextBtn').onclick = () => {
      if (!bk.typeId) return toast('erst Terminart wählen');
      const now = P.splitAbs(P.nowAbs());
      const from = bk.start != null ? bk.start : (bk.date === now.date ? now.min : 0);
      const slots = P.findSlots(bk.typeId, bk.date, { channel: 'intern', days: 21, max: 30, perDay: 5, fromMin: from, patient: patOf(bk.patientId) });
      const byDay = {}; slots.forEach(x => (byDay[x.date] = byDay[x.date] || []).push(x));
      B.querySelector('#bkNext').innerHTML = Object.keys(byDay).map(d => `<div style="margin-top:3px"><b style="display:inline-block;width:92px">${P.weekday(d)}. ${d.slice(8)}.${d.slice(5, 7)}.</b>${byDay[d].map(x => `<button class="slotbtn" data-d="${d}" data-m="${x.start}" data-r="${x.parts[0].resId}">${P.fmtMin(x.start)}${x.viaType ? ' ' + esc((typeOf(x.viaType).name.match(/\(([^)]+)\)\s*$/) || [])[1] || '') : ''}</button>`).join('')}</div>`).join('') || '<div class="reason bad">Keine freien Termine in 21 Tagen.</div>';
      B.querySelectorAll('#bkNext .slotbtn').forEach(b => b.onclick = () => { bk.date = b.dataset.d; bk.start = +b.dataset.m; bk.resId = b.dataset.r; ui.date = bk.date; bkEval(); renderCalGrid(); renderCalSideMonths(); bkSyncInputs(); const s = st().settings; $('#calScroll').scrollTop = Math.max(0, (bk.start - s.dayStart - 45) * s.pxPerMin); });
    };
    const done = a => { touchRecent(a.patientId); const msg = 'Termin gebucht: ' + P.fmtDate(a.date, true) + ' ' + P.fmtMin(a.start); ui.date = a.date; closeBooking(true); toast(msg); };
    B.querySelector('#bkBook').onclick = () => {
      if (bk.blocker) { if (bk.start == null) return; return done(P.blocker(bk.bres || bk.resId, bk.date, bk.start, bk.bdur, bk.title)); }
      if (!bk.patientId) return toast('Bitte Patient wählen');
      if (!bk.ev || !bk.ev.ok) return;
      const miss = [...B.querySelectorAll('#bkFields [data-field]')].filter(i => i.previousElementSibling && /\*$/.test(i.previousElementSibling.textContent) && !i.value);
      if (miss.length) { miss.forEach(i => i.style.borderColor = '#c00'); return toast('Pflichtfelder fehlen: ' + miss.map(i => i.dataset.field).join(', ')); }
      done(P.book({ typeId: bk.typeId, viaType: bk.ev.viaType || null, date: bk.date, start: bk.start, parts: bk.ev.parts }, { patientId: bk.patientId, fields: Object.assign({}, bk.fields), note: bk.note }));
    };
    B.querySelector('#bkOver').onclick = () => ask('Trotzdem eintragen?', 'Der Termin wird als Überbuchung eingetragen:<br>' + (bk.ev ? explain(bk.ev, bk).lines.map(l => '• ' + esc(l)).join('<br>') : ''), 'Trotzdem eintragen', () => done(P.book(P.forceParts(bk.typeId, bk.date, bk.start, bk.resId), { patientId: bk.patientId, fields: Object.assign({}, bk.fields), note: bk.note, overbooked: true })));
  }
  // nur Monatskalender neu zeichnen (Buchungsfenster bleibt stehen)
  function renderCalSideMonths() {
    const mc = $('#calSide .mcs'); if (!mc) return renderCalSide();
    const [y, m] = ui.date.split('-').map(Number); const n2 = m === 12 ? [y + 1, 1] : [y, m + 1];
    mc.innerHTML = miniMonth(y, m, ui.date) + '<div style="width:1px;background:var(--line)"></div>' + miniMonth(n2[0], n2[1], ui.date);
    mc.querySelectorAll('td[data-d]').forEach(td => td.onclick = () => { ui.date = td.dataset.d; if (ui.bk) { renderCalGrid(); renderCalSideMonths(); } else renderCal(); });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.bk && !$('#dlg').open && !$('#dlg2').open) closeBooking(true); });

  // ---------- Termin-Details ----------
  function openAppt(id) {
    const a = st().appts.find(x => x.id === id); if (!a) return;
    const t = typeOf(a.typeId), p = patOf(a.patientId);
    const body = h(`<div class="kv">
      <div>Patient</div><div>${p ? `<a href="#" id="dPat">${esc(patLabel(p))}</a> · ${esc(p.insurance)} · ${esc(p.phone)}` : esc(a.title)}</div>
      <div>Terminart</div><div>${t ? `<span class="dot" style="background:${col(t.color)}"></span>${esc(t.name)}` : 'Blocker'}</div>
      <div>Termin</div><div>${P.fmtDate(a.date, true)} ${P.fmtMin(a.start)} · Dauer ${P.fmtDur(a.dur)}</div>
      <div>Ressourcen</div><div>${a.parts.map(x => esc(resOf(x.resId)?.name || x.resId) + (x.label ? ' (' + esc(x.label) + ')' : '') + ' ' + P.fmtMin(x.s % 1440) + '–' + P.fmtMin(x.e % 1440) + (x.e - x.s >= 1440 ? ' (+' + Math.floor((x.e - x.s) / 1440) + ' Tag)' : '')).join('<br>')}</div>
      <div>Kanal</div><div>${esc(a.channel)}${a.overbooked ? ' · <span class="bad">Überbuchung</span>' : ''}</div>
      ${Object.entries(a.fields || {}).map(([k, v]) => `<div>${esc(k)}</div><div>${esc(v)}</div>`).join('')}
      <div>Notiz</div><div><input id="dNote" value="${esc(a.note)}" style="width:100%"></div>
      <div>Status</div><div><select id="dStatus">${STATUS.map(s => `<option ${s === a.status ? 'selected' : ''}>${s}</option>`).join('')}</select>${a.arrivedAt ? ' <span class="muted">angekommen ' + esc(a.arrivedAt.slice(11, 16)) + '</span>' : ''}</div>
      <div>Angelegt</div><div class="muted">${esc((a.createdAt || '').replace('T', ' ').slice(0, 16))}</div>
    </div>
    ${t ? `<h3>Verschieben</h3><div style="display:flex;gap:6px;align-items:end;flex-wrap:wrap"><div><label>Datum</label><input type="date" id="mDate" value="${a.date}"></div><div><label>Uhrzeit</label><input type="time" step="300" id="mTime" value="${P.fmtMin(a.start)}"></div><button id="mCheck">Prüfen</button><button id="mNext">Nächster freier</button></div><div id="mEval"></div>` : ''}`);
    const saveSimple = () => { a.note = body.querySelector('#dNote').value; const ns = body.querySelector('#dStatus').value; if (ns !== a.status) { if (ns === 'wartend' && !a.arrivedAt) a.arrivedAt = simIso(); a.status = ns; } };
    let mv = null;
    if (t) {
      const check = () => { const d = body.querySelector('#mDate').value, m = P.parseHM(body.querySelector('#mTime').value); mv = { d, m, ev: P.evaluate(a.typeId, d, m, { ignoreAppt: a.id, patient: p }) }; body.querySelector('#mEval').innerHTML = reasonsHtml(mv.ev, { typeId: a.typeId, date: d, start: m, patientId: a.patientId, ignoreAppt: a.id }) + (mv.ev.ok ? ' <button class="primary" id="mDo">Hierhin verschieben</button>' : ' <button class="danger" id="mForce">trotzdem verschieben</button>'); body.querySelectorAll('#mEval [data-nextfree]').forEach(b => b.onclick = () => { const [nd, nm] = b.dataset.nextfree.split('|'); body.querySelector('#mDate').value = nd; body.querySelector('#mTime').value = P.fmtMin(+nm); check(); }); const doMove = (parts, over) => { a.date = d; a.start = m; a.parts = parts; a.overbooked = !!over; a.log = (a.log || []).concat([{ at: new Date().toISOString(), what: 'verschoben' }]); save(); closeDlg(); ui.date = d; rerender(); toast('verschoben'); }; const b1 = body.querySelector('#mDo'); if (b1) b1.onclick = () => { a.viaType = mv.ev.viaType || a.viaType || null; doMove(mv.ev.parts); }; const b2 = body.querySelector('#mForce'); if (b2) b2.onclick = () => doMove(P.forceParts(a.typeId, d, m, a.parts[0].resId).parts, true); };
      body.querySelector('#mCheck').onclick = check;
      body.querySelector('#mNext').onclick = () => { const s = P.findSlots(a.typeId, body.querySelector('#mDate').value, { days: 30, max: 1, fromMin: P.parseHM(body.querySelector('#mTime').value) + 5, ignoreAppt: a.id, patient: p })[0]; if (!s) return toast('nichts frei in 30 Tagen'); body.querySelector('#mDate').value = s.date; body.querySelector('#mTime').value = P.fmtMin(s.start); check(); };
    }
    dialog(t ? 'Termin' : 'Blocker', body, [
      { label: 'Löschen', cls: 'danger', keep: true, onClick: () => ask('Termin löschen', 'Termin endgültig löschen? (Absagen behält ihn in der Absage-Liste.)', 'Löschen', () => { P.remove(a.id); closeDlg(); rerender(); }) },
      ...(a.patientId ? [{ label: 'Absagen', keep: true, onClick: () => { dialog2('Termin absagen', `<div class="kv"><div>Termin</div><div>${P.fmtDate(a.date, true)} ${P.fmtMin(a.start)} · ${esc(t ? t.name : '')}</div><div>Patient</div><div>${esc(patLabel(p))}</div></div><label>Grund</label><select id="cxR" style="width:100%"><option>Patient hat telefonisch abgesagt</option><option>Patient hat online abgesagt</option><option>Praxis sagt ab (Arzt verhindert)</option><option>Patient krank</option><option>Termin verschoben</option></select><label>Bemerkung</label><input id="cxN" style="width:100%"><label><input type="checkbox" id="cxF" checked> danach Folgetermin für den Patienten suchen</label>`, [{ label: 'Abbrechen' }, { label: 'Termin absagen', cls: 'primary', onClick: B => { a.status = 'abgesagt'; a.cancelReason = B.querySelector('#cxR').value + (B.querySelector('#cxN').value ? ' – ' + B.querySelector('#cxN').value : ''); a.cancelledAt = simIso(); const again = B.querySelector('#cxF').checked; save(); closeDlg(); rerender(); toast('abgesagt – Slot wieder frei'); if (again) defer(() => openNewAppt({ patientId: a.patientId, typeId: a.typeId, date: a.date, start: a.start }), 50); } }]); } },
        { label: 'Folgetermin', onClick: () => { defer(() => openNewAppt({ patientId: a.patientId, typeId: a.typeId, date: P.addDays(a.date, 7), start: a.start }), 50); } }] : []),
      { label: 'Schließen' },
      { label: 'Speichern', cls: 'primary', onClick: () => { saveSimple(); save(); rerender(); } },
    ]);
    const dp = body.querySelector('#dPat'); if (dp) dp.onclick = e => { e.preventDefault(); openPatient(p.id); };
  }

  // =====================================================================
  // CALL-CENTER
  // =====================================================================
  const cc = { patientId: null, cat: '', typeId: '', from: null, channel: 'intern', chainId: '' };
  function renderCallCenter() {
    const el = $('#p-callcenter');
    if (!cc.from) cc.from = TODAY();
    const cats = [...new Set(cfg().eventTypes.filter(t => !t.chainOnly).map(t => t.category || '—'))].sort();
    el.innerHTML = `<div class="pad"><h2>Call-Center</h2><p class="muted">Wie samedi: Patient → Kategorie/Behandler → Terminart → freie Termine. Kanal steuert, welche Regeln gelten (intern / online / Zuweiser).</p>
      <div class="cols"><div class="card"><h3>1 · Patient</h3><div id="ccPat"></div></div>
      <div class="card"><h3>2 · Kategorie / Behandler</h3><div class="list" id="ccCats" style="max-height:300px"><div class="it ${cc.cat === '' ? 'sel' : ''}" data-c="">Alle</div>${cats.map(c => `<div class="it ${cc.cat === c ? 'sel' : ''}" data-c="${esc(c)}">${esc(c)}</div>`).join('')}</div></div>
      <div class="card"><h3>3 · Terminart</h3><input id="ccTQ" placeholder="filtern" style="width:100%"><div class="list" id="ccTypes" style="max-height:270px;margin-top:4px"></div></div>
      <div class="card"><h3>4 · Freie Termine</h3><label>ab Datum</label><input type="date" id="ccFrom" value="${cc.from}"><label>Kanal</label><select id="ccCh"><option value="intern">intern (Praxis)</option><option value="online">online (Patient)</option><option value="zuweiser">Zuweiser</option></select><div id="ccInfo" class="muted" style="margin-top:6px"></div></div></div>
      <div class="card"><div id="ccSlots" class="muted">Terminart wählen …</div></div>
      <div class="card"><h3>Terminketten</h3><p class="muted">Mehrere Termine mit Abständen (z. B. Langzeit-EKG anlegen/abnehmen, Verödung in 1–2 Wochen-Abständen).</p><select id="ccChain"><option value="">– Kette wählen –</option>${cfg().chains.map(c => `<option value="${c.id}" ${c.id === cc.chainId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select> <button id="ccChainPlan">Kette planen</button><div id="ccChainOut"></div></div></div>`;
    patientPicker(el.querySelector('#ccPat'), cc.patientId, id => { cc.patientId = id; showSlots(); });
    el.querySelectorAll('#ccCats [data-c]').forEach(d => d.onclick = () => { cc.cat = d.dataset.c; el.querySelectorAll('#ccCats .it').forEach(x => x.classList.toggle('sel', x === d)); fillTypes(); });
    el.querySelector('#ccCh').value = cc.channel;
    el.querySelector('#ccCh').onchange = e => { cc.channel = e.target.value; fillTypes(); showSlots(); };
    el.querySelector('#ccFrom').onchange = e => { cc.from = e.target.value; showSlots(); };
    el.querySelector('#ccTQ').oninput = fillTypes;
    function fillTypes() {
      const q = el.querySelector('#ccTQ').value.toLowerCase();
      const ts = cfg().eventTypes.filter(t => !t.chainOnly && (!cc.cat || (t.category || '—') === cc.cat) && (!q || t.name.toLowerCase().includes(q)) && (cc.channel === 'intern' ? t.intern : cc.channel === 'online' ? t.online : t.zuweiser)).sort((a, b) => a.name.localeCompare(b.name));
      el.querySelector('#ccTypes').innerHTML = ts.map(t => `<div class="it ${t.id === cc.typeId ? 'sel' : ''}" data-t="${t.id}"><span class="dot" style="background:${col(t.color)}"></span>${esc(t.name)} <span class="muted">${P.fmtDur(t.dur)}</span></div>`).join('') || '<div class="it muted">keine Terminart für diesen Kanal</div>';
      el.querySelectorAll('#ccTypes [data-t]').forEach(d => d.onclick = () => { cc.typeId = d.dataset.t; el.querySelectorAll('#ccTypes .it').forEach(x => x.classList.toggle('sel', x === d)); showSlots(); });
    }
    function showSlots() {
      const out = el.querySelector('#ccSlots'); const t = typeOf(cc.typeId); if (!t) return;
      const p = patOf(cc.patientId);
      el.querySelector('#ccInfo').innerHTML = `${esc(t.name)} · ${P.fmtDur(t.dur)} · ${t.alts.length ? 'Sammel-Terminart (' + t.alts.length + ' Alternativen)' : t.blocks.map(b => esc(b.cap)).join(' + ')}<br>Versicherung: ${t.insurance.join('/')}${t.quotas.length ? '<br>Kontingente: ' + esc(t.quotas.join(', ')) : ''}`;
      const now = P.splitAbs(P.nowAbs());
      const slots = P.findSlots(cc.typeId, cc.from, { channel: cc.channel, days: 21, max: 120, perDay: 8, fromMin: cc.from === now.date ? now.min : 0, patient: p });
      const byDay = {}; slots.forEach(s => (byDay[s.date] = byDay[s.date] || []).push(s));
      out.classList.remove('muted');
      out.innerHTML = `<h3>Freie Termine ${esc(t.name)} (${cc.channel})</h3>` + (Object.keys(byDay).map(d => `<div style="margin:4px 0"><b style="display:inline-block;width:120px">${P.fmtDate(d, true)}</b>${byDay[d].map((s, i) => `<button class="slotbtn" data-i="${slots.indexOf(s)}" title="${esc(s.parts.map(x => resOf(x.resId).name).join(' + '))}">${P.fmtMin(s.start)}${s.viaType ? ' · ' + esc((typeOf(s.viaType).name.match(/\(([^)]+)\)\s*$/) || [])[1] || '') : ''}</button>`).join('')}</div>`).join('') || '<div class="reason bad">Keine freien Termine in den nächsten 21 Tagen. Tipp: Kanal auf „intern“ oder Diagnose im Kalender (Klick in Spalte) zeigt den Grund.</div>');
      out.querySelectorAll('.slotbtn').forEach(b => b.onclick = () => confirmSlot(slots[+b.dataset.i], cc.channel, cc.patientId, () => showSlots()));
    }
    fillTypes(); if (cc.typeId) showSlots();
    el.querySelector('#ccChain').onchange = e => cc.chainId = e.target.value;
    el.querySelector('#ccChainPlan').onclick = () => planChain(el.querySelector('#ccChainOut'));
  }
  function confirmSlot(slot, channel, patientId, after) {
    const t = typeOf(slot.typeId);
    const body = h(`<div id="csPat"></div><div class="kv" style="margin-top:8px"><div>Termin</div><div>${P.fmtDate(slot.date, true)} ${P.fmtMin(slot.start)}</div><div>Terminart</div><div>${esc(t.name)}</div><div>Ressourcen</div><div>${slot.parts.map(p => esc(resOf(p.resId).name)).join(' + ')}</div><div>Kanal</div><div>${esc(channel)}</div></div><div id="csF">${commentFieldsHtml(t, {})}</div>`);
    let pid = patientId; patientPicker(body.querySelector('#csPat'), pid, id => pid = id);
    dialog('Termin bestätigen', body, [{ label: 'Abbrechen' }, { label: 'Buchen', cls: 'primary', onClick: () => {
      if (!pid) { alert('Patient wählen'); return false; }
      const ev = P.evaluate(slot.typeId, slot.date, slot.start, { channel, patient: patOf(pid) });
      if (!ev.ok) { alert('Slot nicht mehr frei:\n' + ev.reasons.join('\n')); return false; }
      const f = {}; body.querySelectorAll('[data-field]').forEach(i => { if (i.value) f[i.dataset.field] = i.value; });
      P.book({ typeId: slot.typeId, viaType: ev.viaType || null, date: slot.date, start: slot.start, parts: ev.parts }, { patientId: pid, fields: f, channel }); touchRecent(pid);
      toast('gebucht'); after && after();
    } }]);
  }
  function fmtOff(m) { if (m % 43200 === 0 && m) return (m / 43200) + (m === 43200 ? ' Monat' : ' Monate'); if (m % 10080 === 0 && m) return (m / 10080) + (m === 10080 ? ' Woche' : ' Wochen'); if (m % 1440 === 0 && m) return (m / 1440) + (m === 1440 ? ' Tag' : ' Tage'); if (m % 60 === 0) return (m / 60) + ' h'; return m + ' min'; }
  function planChain(out, chainId, getPid, fromDate) {
    chainId = chainId || cc.chainId; getPid = getPid || (() => cc.patientId); fromDate = fromDate || cc.from;
    const ch = cfg().chains.find(c => c.id === chainId); if (!ch) return;
    const p = patOf(getPid());
    let prevEnd = null, from = fromDate, fromMin = 0; const plan = [];
    const now = P.splitAbs(P.nowAbs()); if (from === now.date) fromMin = now.min;
    for (const [i, l] of ch.links.entries()) {
      const t = typeOf(l.typeId); if (!t) continue;
      let s;
      if (prevEnd === null) s = P.findSlots(l.typeId, from, { days: 60, max: 1, fromMin, patient: p })[0];
      else {
        const lo = P.splitAbs(prevEnd + l.minOff), hiAbs = prevEnd + l.maxOff;
        s = P.findSlots(l.typeId, lo.date, { days: Math.ceil(l.maxOff / 1440) + 2, max: 1, fromMin: lo.min, patient: p })[0];
        if (s && P.absOf(s.date, s.start) > hiAbs) s = null;
      }
      if (!s) { plan.push({ link: l, t, slot: null }); if (!l.optional) break; continue; }
      plan.push({ link: l, t, slot: s }); prevEnd = P.absOf(s.date, s.start) + typeOf(s.typeId).dur;
    }
    out.innerHTML = `<table class="grid"><tr><th>#</th><th>Terminart</th><th>Vorschlag</th><th>Abstand-Regel</th></tr>${plan.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.t.name)}${x.link.optional ? ' <span class="muted">(optional)</span>' : ''}</td><td>${x.slot ? P.fmtDate(x.slot.date, true) + ' ' + P.fmtMin(x.slot.start) : '<span class="bad">kein Slot</span>'}</td><td class="muted">${i ? fmtOff(x.link.minOff) + ' bis ' + fmtOff(x.link.maxOff) + ' nach Ende des vorigen Termins' : 'Start'}</td></tr>`).join('')}</table><button class="primary" id="chainBook" style="margin-top:6px">Kette buchen</button>`;
    out.querySelector('#chainBook').onclick = () => {
      const pid = getPid(); if (!pid) return alert('Patient wählen');
      const cid = P.nextId('K'); let n = 0;
      for (const x of plan) if (x.slot) { P.book(x.slot, { patientId: pid, chainId: cid }); n++; }
      touchRecent(pid); toast(n + ' Termine der Kette gebucht');
      out.innerHTML = '<div class="reason ok">✓ Kette gebucht für ' + esc(patLabel(patOf(pid))) + ':<br>' + plan.filter(x => x.slot).map(x => P.fmtDate(x.slot.date, true) + ' ' + P.fmtMin(x.slot.start) + ' · ' + esc(x.t.name)).join('<br>') + '</div>';
    };
  }

  // =====================================================================
  // WARTELISTE
  // =====================================================================
  let wlDate = null;
  function renderWaitlist() {
    const el = $('#p-warteliste'); wlDate = wlDate || TODAY();
    const now = P.nowAbs();
    const appts = st().appts.filter(a => a.date === wlDate && a.patientId && a.status !== 'abgesagt').sort((a, b) => a.start - b.start);
    const groups = {}; for (const a of appts) { const t = typeOf(a.typeId); const w = (t && t.waitlist) || 'ohne Warteliste'; (groups[w] = groups[w] || []).push(a); }
    const wcfg = Object.fromEntries(cfg().waitlists.map(w => [w.name, w]));
    const waiting = appts.filter(a => a.status === 'wartend');
    el.innerHTML = `<div class="toolbar"><span class="title">Warteliste / Wartezimmer</span><input type="date" id="wlD" value="${wlDate}"><button id="wlT">Heute</button><span class="muted">Im Wartezimmer: <b>${waiting.length}</b> · Gelb/Rot ab Warn-/Alarmschwelle (Minuten nach geplantem Termin)</span></div><div class="pad">${Object.keys(groups).sort().map(g => {
      const w = wcfg[g] || { warn: 15, alert: 30 };
      return `<div class="card"><h3>${esc(g)} <span class="muted">· Warnung ${w.warn} min · Alarm ${w.alert} min · ${groups[g].length} Termine</span></h3><table class="grid">${groups[g].map(a => {
        const t = typeOf(a.typeId), p = patOf(a.patientId); const late = Math.round((now - P.absOf(a.date, a.start)));
        const cls = a.status === 'wartend' ? (late >= w.alert ? 'wl-alert' : late >= w.warn ? 'wl-warn' : '') : '';
        return `<tr class="wl-row ${cls}"><td style="width:60px">${P.fmtMin(a.start)}</td><td>${esc(patLabel(p))}</td><td>${esc(t ? t.name : '')}</td><td>${esc(Object.values(a.fields || {}).join(' '))}</td><td>${STICON[a.status] || ''} ${esc(a.status)}${a.status === 'wartend' ? ' · ' + Math.max(0, late) + ' min' : ''}</td><td style="white-space:nowrap"><button class="small" data-s="wartend" data-a="${a.id}">angekommen</button> <button class="small" data-s="in Behandlung" data-a="${a.id}">aufrufen</button> <button class="small" data-s="fertig" data-a="${a.id}">fertig</button> <button class="small" data-s="nicht erschienen" data-a="${a.id}">n. e.</button></td></tr>`;
      }).join('')}</table></div>`;
    }).join('') || '<p class="muted">Keine Termine.</p>'}</div>`;
    el.querySelector('#wlD').onchange = e => { wlDate = e.target.value; renderWaitlist(); };
    el.querySelector('#wlT').onclick = () => { wlDate = TODAY(); renderWaitlist(); };
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const a = st().appts.find(x => x.id === b.dataset.a); a.status = b.dataset.s; if (a.status === 'wartend') a.arrivedAt = simIso(); save(); renderWaitlist(); });
  }

  // =====================================================================
  // PATIENTEN
  // =====================================================================
  let patQ = '';
  function renderPatients() {
    const el = $('#p-patienten');
    const q = patQ.toLowerCase();
    const today = TODAY();
    const cnt = {}; for (const a of st().appts) if (a.patientId && a.status !== 'abgesagt') { const c = cnt[a.patientId] = cnt[a.patientId] || { f: 0, p: 0, next: null }; if (a.date >= today) { c.f++; if (!c.next || a.date + String(a.start).padStart(4, "0") < c.next) c.next = a.date + String(a.start).padStart(4, "0"); } else c.p++; }
    const list = st().patients.filter(p => !q || patName(p).toLowerCase().includes(q) || p.id.toLowerCase() === q || p.id.toLowerCase().includes(q) || P.fmtDate(p.birth).includes(q) || (p.city || '').toLowerCase().includes(q) || String(p.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) || String(p.mobile || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')));
    el.innerHTML = `<div class="toolbar"><span class="title">Patienten (${st().patients.length})</span><input id="pq" placeholder="Suche Name, ID, Geburtsdatum, Ort" value="${esc(patQ)}" style="min-width:260px"><button class="primary" id="pNew">+ Patient</button></div><div style="overflow:auto"><table class="grid"><tr><th>ID</th><th>Name</th><th>Geburtsdatum</th><th>Alter</th><th>Versicherung</th><th>Ort</th><th>Termine künftig / vergangen</th><th>nächster Termin</th></tr>${list.map(p => { const c = cnt[p.id] || { f: 0, p: 0 }; return `<tr data-p="${p.id}" style="cursor:pointer"><td>${p.id}</td><td>${esc(patName(p))}</td><td>${P.fmtDate(p.birth)}</td><td>${age(p)}</td><td>${esc(p.insurance)} <span class="muted">${esc(p.insurer)}</span></td><td>${esc(p.city)}</td><td>${c.f} / ${c.p}</td><td>${c.next ? P.fmtDate(c.next.slice(0, 10)) : ''}</td></tr>`; }).join('')}</table></div>`;
    const inp = el.querySelector('#pq'); inp.oninput = e => { patQ = e.target.value; renderPatients(); const n = $('#pq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    el.querySelector('#pNew').onclick = () => quickPatient(patQ, p => { patQ = p.id; renderPatients(); openPatient(p.id); });
    el.querySelectorAll('[data-p]').forEach(tr => tr.onclick = () => openPatient(tr.dataset.p));
  }
  function openPatient(id) {
    const p = patOf(id); if (!p) return; touchRecent(id);
    const ap = st().appts.filter(a => a.patientId === id).sort((a, b) => (b.date + String(b.start).padStart(4, "0")).localeCompare(a.date + String(a.start).padStart(4, "0")));
    const rc = st().recalls.filter(r => r.patientId === id);
    const fut = ap.filter(a => a.date >= TODAY() && a.status !== 'abgesagt').reverse();
    const body = h(`<div class="cols"><div style="flex:1.4">${patientFormHtml(p)}</div>
      <div><fieldset><legend>Nächste Termine (${fut.length})</legend><div class="list" style="max-height:170px">${fut.map(a => `<div class="it" data-a="${a.id}">${P.fmtDate(a.date, true)} ${P.fmtMin(a.start)} · ${esc((typeOf(a.typeId) || {}).name || a.title)}</div>`).join('') || '<div class="it muted">keine</div>'}</div></fieldset>
      <fieldset><legend>Alle Termine (${ap.length})</legend><div class="list" style="max-height:170px">${ap.map(a => `<div class="it" data-a="${a.id}">${P.fmtDate(a.date, true)} ${P.fmtMin(a.start)} · ${esc((typeOf(a.typeId) || {}).name || a.title)} · <span class="${a.status === 'abgesagt' || a.status === 'nicht erschienen' ? 'bad' : 'muted'}">${esc(a.status)}</span></div>`).join('') || '<div class="it muted">keine</div>'}</div></fieldset>
      <fieldset><legend>Recall</legend>${rc.map(r => `<div>${esc((st().recallTemplates.find(t => t.id === r.templateId) || {}).name)} · fällig ${P.fmtDate(r.due)} ${r.done ? '✓' : ''}</div>`).join('') || '<div class="muted">keiner</div>'}
      <div style="margin-top:6px"><select id="rcT">${st().recallTemplates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select> <button class="small" id="rcAdd">Recall anlegen</button></div></fieldset>
      <div class="muted">Patienten-ID ${p.id}</div></div></div>`);
    dialog('Patient ' + patLabel(p), body, [
      { label: 'Termin buchen', onClick: () => { defer(() => openNewAppt({ patientId: p.id, date: ui.date }), 50); } },
      { label: 'Schließen' },
      { label: 'Speichern', cls: 'primary', onClick: () => {
        const o = readPatientForm(body); if (!o) return false;
        const dups = findDuplicates(o, p.id); Object.assign(p, o); save(); rerender(); toast('gespeichert' + (dups.length ? ' – Achtung, ähnlicher Patient: ' + dups.map(patLabel).join(', ') : ''));
      } },
    ]);
    $('#dlg').style.width = '1000px';
    wirePatientForm(body);
    body.querySelector('#rcAdd').onclick = () => { const t = st().recallTemplates.find(x => x.id === body.querySelector('#rcT').value); st().recalls.push({ id: P.nextId('R'), patientId: p.id, templateId: t.id, due: P.addDays(TODAY(), t.months * 30), note: '', done: false }); save(); toast('Recall angelegt: ' + t.name); openPatient(id); };
    body.querySelectorAll('[data-a]').forEach(d => d.onclick = () => { const a = st().appts.find(x => x.id === d.dataset.a); closeDlg(); ui.date = a.date; ui.mode = 'day'; go('kalender'); scrollToAppt(a); defer(() => openAppt(a.id), 30); });
  }


  // =====================================================================
  // ONLINE-BUCHUNG (Patientensicht)
  // =====================================================================
  const ob = { cat: '', typeId: '', patientId: '', from: null, done: null };
  function renderOnline() {
    const el = $('#p-online'); ob.from = ob.from || TODAY();
    const onlineTypes = cfg().eventTypes.filter(t => t.online && !t.chainOnly);
    const cats = [...new Set(onlineTypes.map(t => t.category || '—'))].sort();
    const p = patOf(ob.patientId);
    el.innerHTML = `<div class="pad"><div class="widget"><div class="card"><h2>Online-Terminbuchung · Praxis Dr. Bonke</h2><p class="muted">Simulation des Patienten-Widgets: nur online freigegebene Terminarten, Vorlaufzeiten und Versicherungsregeln hart. Puffer-Zeiten erscheinen erst 10 h vorher.</p>
      <div class="step"><b>Wer bucht?</b> (Testpatient simuliert die Verifizierung) <select id="obP"><option value="">– Testpatient wählen –</option>${st().patients.map(x => `<option value="${x.id}" ${x.id === ob.patientId ? 'selected' : ''}>${esc(patLabel(x))} · ${x.insurance}</option>`).join('')}</select></div>
      <div class="step"><b>1 · Fachbereich / Behandler</b><div>${cats.map(c => `<button class="slotbtn ${c === ob.cat ? 'primary' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>
      ${ob.cat ? `<div class="step"><b>2 · Terminart</b><div>${onlineTypes.filter(t => (t.category || '—') === ob.cat).map(t => `<button class="slotbtn ${t.id === ob.typeId ? 'primary' : ''}" data-t="${t.id}">${esc(t.name)}</button>`).join('')}</div></div>` : ''}
      ${ob.typeId ? `<div class="step"><b>3 · Termin wählen</b> ab <input type="date" id="obF" value="${ob.from}"><div id="obS"></div></div>` : ''}
      ${ob.done ? `<div class="reason ok">✓ Gebucht: ${esc(ob.done)} – Bestätigung per E-Mail${p && p.sms ? ' und SMS' : ''} (simuliert)</div>` : ''}
      </div></div></div>`;
    el.querySelector('#obP').onchange = e => { ob.patientId = e.target.value; ob.done = null; renderOnline(); };
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { ob.cat = b.dataset.c; ob.typeId = ''; ob.done = null; renderOnline(); });
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ob.typeId = b.dataset.t; ob.done = null; renderOnline(); });
    if (ob.typeId) {
      el.querySelector('#obF').onchange = e => { ob.from = e.target.value; renderOnline(); };
      const now = P.splitAbs(P.nowAbs());
      const slots = P.findSlots(ob.typeId, ob.from, { channel: 'online', days: 21, max: 60, perDay: 6, fromMin: ob.from === now.date ? now.min : 0, patient: p });
      const byDay = {}; slots.forEach(s => (byDay[s.date] = byDay[s.date] || []).push(s));
      el.querySelector('#obS').innerHTML = Object.keys(byDay).map(d => `<div style="margin:4px 0"><b style="display:inline-block;width:120px">${P.fmtDate(d, true)}</b>${byDay[d].map(s => `<button class="slotbtn" data-i="${slots.indexOf(s)}">${P.fmtMin(s.start)}</button>`).join('')}</div>`).join('') || `<div class="reason bad">Keine Online-Termine verfügbar${p ? '' : ' (ggf. Versicherung: Testpatient wählen)'}.</div>`;
      el.querySelectorAll('#obS [data-i]').forEach(b => b.onclick = () => {
        if (!ob.patientId) return alert('Bitte zuerst Testpatient wählen');
        const s = slots[+b.dataset.i]; const t = typeOf(s.typeId);
        const needR = t.commentSets.some(c => /Grund/.test(c));
        dialog2('Termin bestätigen', `<div class="kv"><div>Termin</div><div>${P.fmtDate(s.date, true)} ${P.fmtMin(s.start)}</div><div>Terminart</div><div>${esc(t.name)}</div></div>${needR ? '<label>Beschwerden / Behandlungsgrund *</label><input id="obR" style="width:100%">' : ''}`, [{ label: 'Abbrechen' }, { label: 'Verbindlich buchen', cls: 'primary', onClick: B => {
          const reason = needR ? B.querySelector('#obR').value.trim() : ''; if (needR && !reason) { toast('Bitte Grund angeben'); return false; }
          touchRecent(ob.patientId); P.book(s, { patientId: ob.patientId, channel: 'online', fields: reason ? { 'Beschwerden / Behandlungsgrund': reason } : {} });
          ob.done = P.fmtDate(s.date, true) + ' ' + P.fmtMin(s.start) + ' · ' + t.name; renderOnline();
        } }]);
      });
    }
  }

  // =====================================================================
  // RECALL
  // =====================================================================
  let rcFilter = 'faellig';
  function renderRecall() {
    const el = $('#p-recall'); const today = TODAY();
    const tpl = id => st().recallTemplates.find(t => t.id === id) || {};
    const list = st().recalls.filter(r => rcFilter === 'alle' || (rcFilter === 'faellig' ? !r.done && r.due <= P.addDays(today, 30) : rcFilter === 'erledigt' ? r.done : !r.done)).sort((a, b) => a.due.localeCompare(b.due));
    el.innerHTML = `<div class="pad"><h2>Recall</h2><div class="card"><h3>Vorlagen</h3><table class="grid"><tr><th>Name</th><th>Terminart</th><th>Intervall</th></tr>${st().recallTemplates.map(t => `<tr><td>${esc(t.name)}</td><td>${esc((typeOf(t.typeId) || {}).name || '–')}</td><td>${t.months} Monate</td></tr>`).join('')}</table><button id="rcNewT" style="margin-top:6px">+ neue Vorlage</button> <button id="rcAuto">Recalls aus erledigten Terminen erzeugen</button></div>
      <div class="card"><div class="tabs">${[['faellig', 'fällig (≤30 Tage)'], ['offen', 'alle offenen'], ['erledigt', 'erledigt'], ['alle', 'alle']].map(([k, l]) => `<button data-f="${k}" class="${k === rcFilter ? 'active' : ''}">${l}</button>`).join('')}</div>
      <table class="grid"><tr><th>Fällig</th><th>Patient</th><th>Vorlage</th><th>Kontakt</th><th></th></tr>${list.map(r => { const p = patOf(r.patientId); return `<tr><td class="${r.due < today && !r.done ? 'bad' : ''}">${P.fmtDate(r.due)}</td><td>${esc(patLabel(p))}<br><span class="muted">${esc(p ? p.phone : '')}</span></td><td>${esc(tpl(r.templateId).name)}</td><td>${r.contacted ? '✓ kontaktiert' : ''}</td><td style="white-space:nowrap"><button class="small" data-k="${r.id}">kontaktiert</button> <button class="small" data-b="${r.id}">Termin buchen</button> <button class="small" data-d="${r.id}">${r.done ? 'wieder öffnen' : 'erledigt'}</button></td></tr>`; }).join('') || '<tr><td colspan=5 class="muted">keine</td></tr>'}</table></div></div>`;
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { rcFilter = b.dataset.f; renderRecall(); });
    const R = id => st().recalls.find(r => r.id === id);
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { R(b.dataset.k).contacted = true; save(); renderRecall(); });
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const r = R(b.dataset.d); r.done = !r.done; save(); renderRecall(); });
    el.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const r = R(b.dataset.b); openNewAppt({ patientId: r.patientId, typeId: tpl(r.templateId).typeId, date: r.due < today ? today : r.due }); });
    el.querySelector('#rcNewT').onclick = () => {
      const body = h(`<label>Name</label><input id="tN" style="width:100%"><label>Terminart</label><select id="tT" style="width:100%">${typeSelectHtml(() => true)}</select><label>Intervall (Monate)</label><input id="tM" type="number" value="12">`);
      dialog('Neue Recall-Vorlage', body, [{ label: 'Abbrechen' }, { label: 'Anlegen', cls: 'primary', onClick: () => { st().recallTemplates.push({ id: P.nextId('RT'), name: body.querySelector('#tN').value || 'Recall', typeId: body.querySelector('#tT').value, months: +body.querySelector('#tM').value || 12 }); save(); renderRecall(); } }]);
    };
    el.querySelector('#rcAuto').onclick = () => {
      let n = 0;
      for (const t of st().recallTemplates) {
        const done = st().appts.filter(a => a.typeId === t.typeId && a.status === 'fertig' && a.patientId);
        for (const a of done) { if (st().recalls.some(r => r.patientId === a.patientId && r.templateId === t.id && !r.done)) continue; st().recalls.push({ id: P.nextId('R'), patientId: a.patientId, templateId: t.id, due: P.addDays(a.date, t.months * 30), note: 'aus Termin ' + P.fmtDate(a.date), done: false }); n++; }
      }
      save(); renderRecall(); toast(n + ' Recalls erzeugt');
    };
  }

  // =====================================================================
  // STATISTIK
  // =====================================================================
  let statFrom = null, statTo = null;
  function renderStats() {
    const el = $('#p-statistik');
    if (!statFrom) { const di = P.dayIndex(TODAY()), wd = (new Date(di * 86400000).getUTCDay() + 6) % 7; statFrom = P.addDays(TODAY(), -wd); statTo = P.addDays(statFrom, 4); }
    const A = st().appts.filter(a => a.date >= statFrom && a.date <= statTo && a.patientId);
    const active = A.filter(a => a.status !== 'abgesagt');
    const by = (arr, f) => { const m = {}; for (const x of arr) { const k = f(x); m[k] = (m[k] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const bars = (rows, max) => `<table class="grid">${rows.map(([k, v]) => `<tr><td style="width:45%">${esc(k)}</td><td style="width:45%"><div class="bar" style="width:${(v / max * 100).toFixed(1)}%"></div></td><td style="text-align:right">${typeof v === 'number' && v % 1 ? v.toFixed(0) + ' %' : v}</td></tr>`).join('')}</table>`;
    const byType = by(active, a => (typeOf(a.typeId) || {}).name || '?').slice(0, 25);
    // Auslastung je sichtbarer Ressource
    const util = [];
    for (const r of cfg().resources) {
      if (r.hidden || /^Zeit|^Zusatz/.test(r.name)) continue;
      let open = 0, used = 0;
      for (let d = statFrom; d <= statTo; d = P.addDays(d, 1)) {
        if (ix().status.get(r.id + '|' + d)) continue;
        const hrs = P.hoursOn(r.oh, d).filter(([a, b]) => !(a === 0 && b === 1440)); open += hrs.reduce((s, [a, b]) => s + b - a, 0);
        const da = P.absOf(d, 0);
        for (const [s, e] of ix().busy.get(r.id + '|' + P.dayIndex(d)) || []) used += Math.max(0, Math.min(e, da + 1440) - Math.max(s, da));
      }
      if (open > 0) util.push([r.name, Math.min(100, used / open * 100)]);
    }
    util.sort((a, b) => b[1] - a[1]);
    const ch = by(active, a => a.channel), stt = by(A, a => a.status), wd = by(active, a => P.weekday(a.date));
    const online = active.filter(a => a.channel === 'online').length;
    el.innerHTML = `<div class="toolbar"><span class="title">Statistik</span>von <input type="date" id="sF" value="${statFrom}"> bis <input type="date" id="sT" value="${statTo}"></div><div class="pad">
      <div class="cols"><div class="card"><div class="muted">Termine</div><div style="font-size:26px;font-weight:700">${active.length}</div></div><div class="card"><div class="muted">Online-Anteil</div><div style="font-size:26px;font-weight:700">${active.length ? Math.round(online / active.length * 100) : 0} %</div></div><div class="card"><div class="muted">Absagen</div><div style="font-size:26px;font-weight:700">${A.length - active.length}</div></div><div class="card"><div class="muted">Nicht erschienen</div><div style="font-size:26px;font-weight:700">${A.filter(a => a.status === 'nicht erschienen').length}</div></div><div class="card"><div class="muted">Überbuchungen</div><div style="font-size:26px;font-weight:700">${active.filter(a => a.overbooked).length}</div></div></div>
      <div class="cols"><div class="card"><h3>Auslastung Ressourcen (belegte / offene Minuten)</h3>${bars(util, 100)}</div><div class="card"><h3>Top-Terminarten</h3>${bars(byType, byType[0] ? byType[0][1] : 1)}</div></div>
      <div class="cols"><div class="card"><h3>Kanal</h3>${bars(ch, Math.max(1, ...ch.map(x => x[1])))}</div><div class="card"><h3>Status</h3>${bars(stt, Math.max(1, ...stt.map(x => x[1])))}</div><div class="card"><h3>Wochentag</h3>${bars(wd, Math.max(1, ...wd.map(x => x[1])))}</div></div></div>`;
    el.querySelector('#sF').onchange = e => { statFrom = e.target.value; renderStats(); };
    el.querySelector('#sT').onchange = e => { statTo = e.target.value; renderStats(); };
  }

  // =====================================================================
  // TODOS
  // =====================================================================
  function renderTodos() {
    const el = $('#p-todos'); const L = st().todos.lists;
    el.innerHTML = `<div class="pad"><h2>Todo-Listen</h2><div class="cols">${L.map((l, li) => `<div class="card"><h3>${esc(l.name)}</h3>${l.items.map((it, ii) => `<div style="display:flex;gap:6px;align-items:center;margin:3px 0"><input type="checkbox" data-l="${li}" data-i="${ii}" ${it.done ? 'checked' : ''}><span style="flex:1;${it.done ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(it.text)}</span><span class="muted">${it.due ? P.fmtDate(it.due) : ''}</span><button class="small" data-del="${li}|${ii}">✕</button></div>`).join('') || '<div class="muted">leer</div>'}<div style="display:flex;gap:4px;margin-top:6px"><input data-new="${li}" placeholder="neue Aufgabe" style="flex:1"><input type="date" data-due="${li}"><button data-add="${li}">+</button></div></div>`).join('')}</div><button id="tdList">+ neue Liste</button></div>`;
    el.querySelectorAll('input[type=checkbox][data-l]').forEach(cb => cb.onchange = () => { L[cb.dataset.l].items[cb.dataset.i].done = cb.checked; save(); renderTodos(); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const [li, ii] = b.dataset.del.split('|'); L[li].items.splice(ii, 1); save(); renderTodos(); });
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const li = b.dataset.add; const t = el.querySelector(`[data-new="${li}"]`).value.trim(); if (!t) return; L[li].items.push({ id: P.nextId('TD'), text: t, done: false, due: el.querySelector(`[data-due="${li}"]`).value }); save(); renderTodos(); });
    el.querySelector('#tdList').onclick = () => { const n = prompt('Name der Liste'); if (n) { L.push({ name: n, items: [] }); save(); renderTodos(); } };
  }

  // =====================================================================
  // EINSTELLUNGEN
  // =====================================================================
  let setTab = 'Allgemein', etQ = '';
  const SETTABS = ['Allgemein', 'Ressourcen', 'Fähigkeiten', 'Terminarten', 'Terminketten', 'Verfügbarkeiten', 'Kontingente', 'Kommentar-Sets', 'Wartelisten', 'Abwesenheiten', 'Ansichten', 'Daten'];
  function renderSettings() {
    const el = $('#p-einstellungen');
    el.innerHTML = `<div class="pad"><h2>Einstellungen</h2><div class="tabs">${SETTABS.map(t => `<button data-t="${t}" class="${t === setTab ? 'active' : ''}">${t}</button>`).join('')}</div><div id="setBody"></div></div>`;
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { setTab = b.dataset.t; renderSettings(); });
    const B = el.querySelector('#setBody');
    ({ Allgemein: sAllg, Ressourcen: sRes, 'Fähigkeiten': sCaps, Terminarten: sTypes, Terminketten: sChains, 'Verfügbarkeiten': sAvail, Kontingente: sQuota, 'Kommentar-Sets': sComments, Wartelisten: sWl, Abwesenheiten: sAbs, Ansichten: sViews, Daten: sData })[setTab](B);
  }
  function sAllg(B) {
    const s = st().settings;
    B.innerHTML = `<div class="card" style="max-width:640px"><label>Simulierte „Jetzt“-Zeit (leer = echte Uhrzeit) – zum Testen der Puffer-Freigabe 10 h vorher</label><input type="datetime-local" id="aSim" value="${esc(s.simNow)}"> <button id="aSimClr" class="small">echte Zeit</button>
      <label>Kalender von / bis</label><input type="time" id="aD0" value="${P.fmtMin(s.dayStart)}"> – <input type="time" id="aD1" value="${P.fmtMin(s.dayEnd)}">
      <label>Zoom (Pixel pro Minute)</label><input type="number" step="0.1" id="aPpm" value="${s.pxPerMin}">
      <label><input type="checkbox" id="aIgn" ${s.ignoreInternBookahead ? 'checked' : ''}> Interne Vorlaufzeiten ignorieren (samedi: aus → Puffer sind auch intern erst 10 h vorher buchbar)</label>
      <label><input type="checkbox" id="aIns" ${s.hardInsurance ? 'checked' : ''}> „Harte“ Versicherungsbeschränkungen auch intern</label>
      <label>Darstellung</label><select id="aTheme"><option value="">System</option><option value="light">Hell</option><option value="dark">Dunkel</option></select>
      <div style="margin-top:10px"><button class="primary" id="aSave">Speichern</button></div></div>
      <div class="card" style="max-width:640px"><h3>Standort</h3>${cfg().locations.map(l => `<div>${esc(l.name)} · ${esc(l.street || '')} ${esc(l.zip || '')} ${esc(l.city || '')} ${esc(l.phone || '')}</div>`).join('')}<p class="muted">${esc(cfg().source)}</p></div>`;
    B.querySelector('#aTheme').value = document.documentElement.dataset.theme || '';
    B.querySelector('#aSimClr').onclick = () => { B.querySelector('#aSim').value = ''; };
    B.querySelector('#aSave').onclick = () => { s.simNow = B.querySelector('#aSim').value; s.dayStart = P.parseHM(B.querySelector('#aD0').value); s.dayEnd = P.parseHM(B.querySelector('#aD1').value); s.pxPerMin = +B.querySelector('#aPpm').value || 1.7; s.ignoreInternBookahead = B.querySelector('#aIgn').checked; s.hardInsurance = B.querySelector('#aIns').checked; const th = B.querySelector('#aTheme').value; if (th) document.documentElement.dataset.theme = th; else delete document.documentElement.dataset.theme; try { localStorage.setItem('pkp_theme', th); } catch (e) { } save(); tickClock(); ui.date = TODAY(); toast('gespeichert'); };
  }
  function sRes(B) {
    const showH = sRes._h || false;
    B.innerHTML = `<div class="toolbar" style="border-radius:8px;margin-bottom:8px"><button class="primary" id="rNew">+ Ressource</button><label style="margin:0;color:inherit"><input type="checkbox" id="rH" ${showH ? 'checked' : ''}> ausgeblendete zeigen</label><span class="muted">Wochenplan gültig am ${P.fmtDate(ui.date)} (Kalenderdatum)</span></div><div style="overflow:auto"><table class="grid"><tr><th>Ressource</th><th>Fähigkeiten</th><th>Wochenplan</th><th>Vorlauf min/max</th><th>Kap.</th><th></th></tr>${cfg().resources.filter(r => showH || !r.hidden).map(r => `<tr><td><b>${esc(r.name)}</b>${r.hidden ? ' <span class="chip">ausgeblendet</span>' : ''}</td><td>${r.caps.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</td><td style="font-size:12px">${esc(P.weekPlanText(r.oh, ui.date))}<div class="muted">Pläne: ${(r.oh?.parts || []).map(p => p[0] ? P.fmtDate(p[0]) : 'Basis').join(', ')} · Einzeltage: ${Object.keys(r.oh?.fixed || {}).length}</div></td><td>${r.minBook ? P.fmtDur(r.minBook) : '–'} / ${r.maxBook ? P.fmtDur(r.maxBook) + ' h' : 'unbegrenzt'}</td><td>${r.capacity}</td><td><button class="small" data-e="${r.id}">bearbeiten</button></td></tr>`).join('')}</table></div>`;
    B.querySelector('#rH').onchange = e => { sRes._h = e.target.checked; sRes(B); };
    B.querySelectorAll('[data-e]').forEach(b => b.onclick = () => editRes(b.dataset.e, () => sRes(B)));
    B.querySelector('#rNew').onclick = () => { const r = { id: P.nextId('R'), name: 'Neue Ressource', caps: [], capacity: 1, minBook: 0, maxBook: 0, oh: { parts: [[null, { Mo: [], Di: [], Mi: [], Do: [], Fr: [], Sa: [], So: [] }]], fixed: {} }, hidden: false, pos: 999 }; cfg().resources.push(r); save(); editRes(r.id, () => sRes(B)); };
  }
  function editRes(id, after) {
    const r = resOf(id);
    const body = h(`<div class="cols"><div><label>Name</label><input id="eN" value="${esc(r.name)}" style="width:100%"><label>Fähigkeiten (Komma-getrennt) – Terminarten suchen Ressourcen über diese Fähigkeiten</label><textarea id="eC">${esc(r.caps.join(', '))}</textarea><label>Kapazität (parallele Termine)</label><input id="eK" type="number" value="${r.capacity}"><label>Mindestvorlauf (Minuten)</label><input id="eMin" type="number" value="${r.minBook}"><label>Maximaler Vorlauf (Minuten, 0 = unbegrenzt; Puffer: 600 = 10 h)</label><input id="eMax" type="number" value="${r.maxBook}"><label><input type="checkbox" id="eH" ${r.hidden ? 'checked' : ''}> ausgeblendet</label></div>
      <div><label>Neuer Wochenplan gültig ab</label><input type="date" id="ePD" value="${ui.date}"><label>Wochenplan (Format: Mo=08:00-12:00,13:00-17:00; Di=…)</label><textarea id="eP" style="min-height:110px">${esc(P.weekPlanText(r.oh, ui.date))}</textarea><button id="ePAdd" class="small">Plan ab Datum übernehmen</button>
      <h3>Planversionen</h3>${(r.oh?.parts || []).map((p, i) => `<div>${p[0] ? P.fmtDate(p[0]) : 'Basis'} <button class="small" data-pd="${i}">entfernen</button></div>`).join('')}
      <h3>Einzeltag-Ausnahme</h3><input type="date" id="eFD" value="${ui.date}"> <input id="eFV" placeholder="08:00-12:00 (leer = geschlossen)"> <button class="small" id="eFAdd">setzen</button>
      <div class="muted" style="max-height:90px;overflow:auto">${Object.entries(r.oh?.fixed || {}).sort().reverse().slice(0, 20).map(([d, v]) => P.fmtDate(d) + ': ' + (v.map(([a, b]) => P.fmtMin(a) + '-' + P.fmtMin(b)).join(',') || 'zu')).join('<br>')}</div></div></div>`);
    r.oh = r.oh || { parts: [], fixed: {} };
    body.querySelector('#ePAdd').onclick = () => { const d = body.querySelector('#ePD').value; r.oh.parts = r.oh.parts.filter(p => p[0] !== d); r.oh.parts.push([d, P.parseWeekPlan(body.querySelector('#eP').value)]); save(); toast('Plan ab ' + P.fmtDate(d) + ' gesetzt'); editRes(id, after); };
    body.querySelectorAll('[data-pd]').forEach(b => b.onclick = () => { r.oh.parts.splice(+b.dataset.pd, 1); save(); editRes(id, after); });
    body.querySelector('#eFAdd').onclick = () => { const v = body.querySelector('#eFV').value.trim(); r.oh.fixed[body.querySelector('#eFD').value] = v ? v.split(',').map(x => x.split('-').map(P.parseHM)) : []; save(); editRes(id, after); };
    dialog('Ressource bearbeiten', body, [
      { label: 'Löschen', cls: 'danger', onClick: () => { if (!confirm('Ressource löschen? Termine darauf bleiben bestehen.')) return false; cfg().resources = cfg().resources.filter(x => x.id !== id); save(); after(); } },
      { label: 'Abbrechen' },
      { label: 'Speichern', cls: 'primary', onClick: () => { r.name = body.querySelector('#eN').value; r.caps = body.querySelector('#eC').value.split(',').map(s => s.trim()).filter(Boolean); r.capacity = +body.querySelector('#eK').value || 1; r.minBook = +body.querySelector('#eMin').value || 0; r.maxBook = +body.querySelector('#eMax').value || 0; r.hidden = body.querySelector('#eH').checked; save(); after(); } },
    ]);
  }
  function sCaps(B) {
    const caps = [...ix().capIdx.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const usedBy = {}; for (const t of cfg().eventTypes) for (const b of t.blocks) (usedBy[b.cap] = usedBy[b.cap] || []).push(t.name);
    B.innerHTML = `<p class="muted">Fähigkeiten sind das Bindeglied: Eine Terminart verlangt pro Teilblock eine Fähigkeit, jede Ressource mit dieser Fähigkeit kann den Block übernehmen. Zeit-/Puffer-Ressourcen steuern so Online-Kontingente und Notfall-Puffer.</p><table class="grid"><tr><th>Fähigkeit</th><th>Ressourcen</th><th>verwendet von</th></tr>${caps.map(([c, ids]) => `<tr><td><b>${esc(c)}</b></td><td>${ids.map(i => `<span class="chip">${esc(resOf(i).name)}</span>`).join('')}</td><td><details><summary>${(usedBy[c] || []).length} Terminarten</summary>${(usedBy[c] || []).map(esc).join('<br>')}</details></td></tr>`).join('')}</table>`;
  }
  function sTypes(B) {
    const q = etQ.toLowerCase();
    const list = cfg().eventTypes.filter(t => !q || t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
    B.innerHTML = `<div class="toolbar" style="border-radius:8px;margin-bottom:8px"><button class="primary" id="tNew">+ Terminart</button><input id="tQ" placeholder="filtern" value="${esc(etQ)}"><span class="muted">${list.length} von ${cfg().eventTypes.length} · O = online, I = intern, Z = Zuweiser, V = Video, K = nur in Kette</span></div><div style="overflow:auto"><table class="grid"><tr><th>Terminart</th><th>Dauer</th><th>Kategorie</th><th>Kanäle</th><th>Teilblöcke / Alternativen</th><th>Zeitfenster</th><th></th></tr>${list.map(t => `<tr><td><span class="dot" style="background:${col(t.color)}"></span>${esc(t.name)}</td><td>${P.fmtDur(t.dur)}</td><td>${esc(t.category)}</td><td>${(t.online ? 'O' : '') + (t.intern ? 'I' : '') + (t.zuweiser ? 'Z' : '') + (t.video ? 'V' : '') + (t.chainOnly ? 'K' : '')}</td><td style="font-size:12px">${t.alts.length ? 'Alternativen: ' + t.alts.map(a => esc((typeOf(a) || {}).name)).join(', ') : t.blocks.map(b => `${b.name ? esc(b.name) + ': ' : ''}${esc(b.cap)} <span class="muted">+${b.off}′ ${b.dur}′</span>`).join('<br>')}</td><td style="font-size:12px">${esc(P.weekPlanText(t.oh, ui.date) || 'nie')}</td><td><button class="small" data-e="${t.id}">bearbeiten</button></td></tr>`).join('')}</table></div>`;
    const qi = B.querySelector('#tQ'); qi.oninput = e => { etQ = e.target.value; sTypes(B); const n = B.querySelector('#tQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    B.querySelectorAll('[data-e]').forEach(b => b.onclick = () => editType(b.dataset.e, () => sTypes(B)));
    B.querySelector('#tNew').onclick = () => { const t = { id: P.nextId('ET'), name: 'Neue Terminart', dur: 10, color: 'blue3', category: 'MFA', location: 'Praxis Dr. Bonke', online: false, intern: true, zuweiser: false, video: false, chainOnly: false, asap: false, minBook: 0, maxBook: 0, insurance: ['GKV', 'PKV', 'Selbstzahler'], waitlist: '', commentSets: ['Kürzel'], quotas: [], blocks: [{ name: '', off: 0, dur: 10, cap: 'Labor' }], alts: [], oh: null }; cfg().eventTypes.push(t); save(); editType(t.id, () => sTypes(B)); };
  }
  function editType(id, after) {
    const t = typeOf(id);
    const caps = [...ix().capIdx.keys()].sort();
    const body = h(`<div class="cols"><div><label>Name</label><input id="tN" value="${esc(t.name)}" style="width:100%"><label>Dauer (Minuten)</label><input id="tD" type="number" value="${t.dur}"><label>Farbe</label><select id="tC">${Object.keys(COLORS).map(c => `<option ${c === t.color ? 'selected' : ''} style="background:${COLORS[c]}">${c}</option>`).join('')}</select><label>Kategorie (Behandler/Gruppe)</label><input id="tK" value="${esc(t.category)}" style="width:100%">
      <label>Freigabe</label>${[['online', 'online buchbar'], ['intern', 'intern buchbar'], ['zuweiser', 'für Zuweiser'], ['video', 'Videosprechstunde'], ['chainOnly', 'nur in Terminkette']].map(([k, l]) => `<label style="display:inline-block;margin-right:10px;color:inherit"><input type="checkbox" data-f="${k}" ${t[k] ? 'checked' : ''}> ${l}</label>`).join('')}
      <label>Vorlauf min / max (Minuten, 0 = keiner)</label><input id="tMin" type="number" value="${t.minBook}"> / <input id="tMax" type="number" value="${t.maxBook}">
      <label>Versicherung</label>${['GKV', 'PKV', 'Selbstzahler'].map(i => `<label style="display:inline-block;margin-right:10px;color:inherit"><input type="checkbox" data-i="${i}" ${t.insurance.includes(i) ? 'checked' : ''}> ${i}</label>`).join('')}
      <label>Warteliste</label><select id="tW"><option value=""></option>${cfg().waitlists.map(w => `<option ${w.name === t.waitlist ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select>
      <label>Kommentar-Sets</label>${cfg().commentSets.map(c => `<label style="display:inline-block;margin-right:10px;color:inherit"><input type="checkbox" data-cs="${esc(c.name)}" ${t.commentSets.includes(c.name) ? 'checked' : ''}> ${esc(c.name)}</label>`).join('')}
      <label>Kontingente</label>${cfg().quotas.map(q => `<label style="display:inline-block;margin-right:10px;color:inherit"><input type="checkbox" data-q="${esc(q.name)}" ${t.quotas.includes(q.name) ? 'checked' : ''}> ${esc(q.name)}</label>`).join('')}</div>
      <div><h3>Teilblöcke (jeder Block braucht eine Ressource mit der Fähigkeit)</h3><div id="tB"></div><button class="small" id="tBAdd">+ Block</button>
      <h3>oder Sammel-Terminart: Alternativen</h3><select id="tA" multiple size="6" style="width:100%">${cfg().eventTypes.filter(x => x.id !== t.id && !x.alts.length).sort((a, b) => a.name.localeCompare(b.name)).map(x => `<option value="${x.id}" ${t.alts.includes(x.id) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><div class="muted">Mehrfachauswahl mit ⌘/Strg. Sind Alternativen gesetzt, werden Blöcke ignoriert.</div>
      <h3>Zeitfenster der Terminart</h3><textarea id="tO" placeholder="leer = immer">${esc(t.oh ? P.weekPlanText(t.oh, ui.date) : '')}</textarea></div></div>`);
    const blocks = t.blocks.map(b => Object.assign({}, b));
    function fillB() {
      body.querySelector('#tB').innerHTML = blocks.map((b, i) => `<div style="display:flex;gap:4px;margin:3px 0;flex-wrap:wrap"><input data-bn="${i}" value="${esc(b.name)}" placeholder="Name" style="width:90px"><input data-bo="${i}" type="number" value="${b.off}" title="Offset (min)" style="width:60px"><input data-bd="${i}" type="number" value="${b.dur}" title="Dauer (min)" style="width:60px"><select data-bc="${i}" style="flex:1;min-width:150px">${caps.map(c => `<option ${c === b.cap ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><button class="small" data-bx="${i}">✕</button></div>`).join('') + '<div class="muted">Name · Offset · Dauer (Minuten) · Fähigkeit</div>';
      body.querySelectorAll('[data-bx]').forEach(x => x.onclick = () => { blocks.splice(+x.dataset.bx, 1); fillB(); });
    }
    fillB();
    body.querySelector('#tBAdd').onclick = () => { readB(); blocks.push({ name: '', off: 0, dur: t.dur, cap: caps[0] }); fillB(); };
    function readB() { blocks.forEach((b, i) => { b.name = body.querySelector(`[data-bn="${i}"]`).value; b.off = +body.querySelector(`[data-bo="${i}"]`).value || 0; b.dur = +body.querySelector(`[data-bd="${i}"]`).value || 0; b.cap = body.querySelector(`[data-bc="${i}"]`).value; }); }
    dialog('Terminart bearbeiten', body, [
      { label: 'Löschen', cls: 'danger', onClick: () => { if (!confirm('Terminart löschen?')) return false; cfg().eventTypes = cfg().eventTypes.filter(x => x.id !== id); save(); after(); } },
      { label: 'Klonen', onClick: () => { const c = JSON.parse(JSON.stringify(t)); c.id = P.nextId('ET'); c.name += ' (Kopie)'; cfg().eventTypes.push(c); save(); after(); } },
      { label: 'Abbrechen' },
      { label: 'Speichern', cls: 'primary', onClick: () => {
        readB(); t.name = body.querySelector('#tN').value; t.dur = +body.querySelector('#tD').value || 10; t.color = body.querySelector('#tC').value; t.category = body.querySelector('#tK').value;
        body.querySelectorAll('[data-f]').forEach(c => t[c.dataset.f] = c.checked);
        t.minBook = +body.querySelector('#tMin').value || 0; t.maxBook = +body.querySelector('#tMax').value || 0;
        t.insurance = [...body.querySelectorAll('[data-i]:checked')].map(c => c.dataset.i);
        t.waitlist = body.querySelector('#tW').value;
        t.commentSets = [...body.querySelectorAll('[data-cs]:checked')].map(c => c.dataset.cs);
        t.quotas = [...body.querySelectorAll('[data-q]:checked')].map(c => c.dataset.q);
        t.blocks = blocks; t.alts = [...body.querySelector('#tA').selectedOptions].map(o => o.value);
        const ot = body.querySelector('#tO').value.trim(); t.oh = ot ? { parts: [[null, P.parseWeekPlan(ot)]], fixed: {} } : null;
        save(); after();
      } },
    ]);
  }
  function sChains(B) {
    B.innerHTML = `<p class="muted">Terminketten verknüpfen mehrere Terminarten mit Mindest-/Höchstabstand (gemessen ab Ende des vorherigen Termins). Buchen über Call-Center.</p>${cfg().chains.map((c, ci) => `<div class="card"><h3>${esc(c.name)} <span class="muted">${c.intern ? 'intern' : ''} ${c.zuweiser ? '· Zuweiser' : ''} ${c.online ? '· online' : ''}</span></h3><table class="grid"><tr><th>#</th><th>Terminart</th><th>optional</th><th>Abstand min</th><th>Abstand max</th></tr>${c.links.map((l, i) => `<tr><td>${i + 1}</td><td>${esc((typeOf(l.typeId) || {}).name)}</td><td>${l.optional ? 'ja' : 'nein'}</td><td>${i ? `<input type="number" data-c="${ci}" data-l="${i}" data-k="minOff" value="${l.minOff}" style="width:90px"> min` : '–'}</td><td>${i ? `<input type="number" data-c="${ci}" data-l="${i}" data-k="maxOff" value="${l.maxOff}" style="width:90px"> min` : '–'}</td></tr>`).join('')}</table></div>`).join('')}<button class="primary" id="chSave">Abstände speichern</button>`;
    B.querySelector('#chSave').onclick = () => { B.querySelectorAll('[data-c]').forEach(i => cfg().chains[+i.dataset.c].links[+i.dataset.l][i.dataset.k] = +i.value); save(); toast('gespeichert'); };
  }
  function sAvail(B) {
    B.innerHTML = `<p class="muted">Verfügbarkeits-Vorlagen mit Label erscheinen im Kalender als farbige Bereiche (Puffer, Admin, Rückrufe, Blutentnahmen …). Die eigentliche Öffnungszeit steht an der Ressource.</p><table class="grid"><tr><th>Label</th><th>Farbe</th><th>angezeigt in</th><th>Wochenplan (${P.fmtDate(ui.date)})</th><th></th></tr>${cfg().displayTemplates.map((t, i) => `<tr><td>${esc(t.label)}</td><td><span class="dot" style="background:${col(t.color)}"></span>${esc(t.color)}</td><td>${t.resIds.map(r => `<span class="chip">${esc(resOf(r)?.name || r)}</span>`).join('')}</td><td style="font-size:12px">${esc(P.weekPlanText(t.oh, ui.date))}</td><td><button class="small" data-e="${i}">bearbeiten</button></td></tr>`).join('')}</table><button id="avNew" style="margin-top:6px">+ Vorlage</button>`;
    const edit = i => {
      const t = cfg().displayTemplates[i];
      const body = h(`<label>Label</label><input id="vL" value="${esc(t.label)}" style="width:100%"><label>Farbe</label><select id="vC">${Object.keys(COLORS).map(c => `<option ${c === t.color ? 'selected' : ''}>${c}</option>`).join('')}</select><label>Ressourcen</label><select id="vR" multiple size="8" style="width:100%">${cfg().resources.filter(r => !r.hidden).map(r => `<option value="${r.id}" ${t.resIds.includes(r.id) ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select><label>Wochenplan ab</label><input type="date" id="vD" value="${ui.date}"><textarea id="vP">${esc(P.weekPlanText(t.oh, ui.date))}</textarea>`);
      dialog('Verfügbarkeits-Vorlage', body, [{ label: 'Löschen', cls: 'danger', onClick: () => { cfg().displayTemplates.splice(i, 1); save(); sAvail(B); } }, { label: 'Abbrechen' }, { label: 'Speichern', cls: 'primary', onClick: () => { t.label = body.querySelector('#vL').value; t.color = body.querySelector('#vC').value; t.resIds = [...body.querySelector('#vR').selectedOptions].map(o => o.value); t.oh = t.oh || { parts: [], fixed: {} }; const d = body.querySelector('#vD').value; t.oh.parts = t.oh.parts.filter(p => p[0] !== d); t.oh.parts.push([d, P.parseWeekPlan(body.querySelector('#vP').value)]); save(); sAvail(B); } }]);
    };
    B.querySelectorAll('[data-e]').forEach(b => b.onclick = () => edit(+b.dataset.e));
    B.querySelector('#avNew').onclick = () => { cfg().displayTemplates.push({ label: 'Neu', color: 'magenta', resIds: [], oh: { parts: [], fixed: {} } }); save(); edit(cfg().displayTemplates.length - 1); };
  }
  function sQuota(B) {
    const linked = {}; for (const t of cfg().eventTypes) for (const q of t.quotas) (linked[q] = linked[q] || []).push(t.name);
    B.innerHTML = `<p class="muted">Kontingente begrenzen Termine pro Tag (Namen mit „Vormittag“ gelten bis 12:00, „Nachmittag“ ab 12:00 – Annahme, samedi zeigt nur den Namen).</p><table class="grid"><tr><th>Kontingent</th><th>Kapazität / Tag</th><th>verknüpfte Terminarten</th></tr>${cfg().quotas.map((q, i) => `<tr><td>${esc(q.name)}</td><td><input type="number" data-q="${i}" value="${q.capacity}" style="width:70px"></td><td style="font-size:12px">${(linked[q.name] || []).map(esc).join(', ') || '<span class="muted">keine</span>'}</td></tr>`).join('')}</table><button class="primary" id="qS" style="margin-top:6px">Speichern</button> <button id="qN">+ Kontingent</button>`;
    B.querySelector('#qS').onclick = () => { B.querySelectorAll('[data-q]').forEach(i => cfg().quotas[+i.dataset.q].capacity = +i.value); save(); toast('gespeichert'); };
    B.querySelector('#qN').onclick = () => { const n = prompt('Name'); if (n) { cfg().quotas.push({ name: n, capacity: 1 }); save(); sQuota(B); } };
  }
  function sComments(B) {
    B.innerHTML = `<p class="muted">Kommentar-Sets = Pflicht-/Zusatzfelder beim Buchen (z. B. Kürzel, Beschwerden/Grund, Impfstoff).</p>${cfg().commentSets.map((c, i) => `<div class="card"><h3>${esc(c.name)}</h3><textarea data-c="${i}" style="font-family:monospace;font-size:12px">${esc(JSON.stringify(c.fields, null, 1))}</textarea></div>`).join('')}<button class="primary" id="csS">Speichern</button>`;
    B.querySelector('#csS').onclick = () => { try { B.querySelectorAll('[data-c]').forEach(t => cfg().commentSets[+t.dataset.c].fields = JSON.parse(t.value)); save(); toast('gespeichert'); } catch (e) { alert('JSON-Fehler: ' + e.message); } };
  }
  function sWl(B) {
    B.innerHTML = `<table class="grid"><tr><th>Warteliste</th><th>Warnung (gelb) ab min</th><th>Alarm (rot) ab min</th></tr>${cfg().waitlists.map((w, i) => `<tr><td>${esc(w.name)}</td><td><input type="number" data-w="${i}" data-k="warn" value="${w.warn}" style="width:70px"></td><td><input type="number" data-w="${i}" data-k="alert" value="${w.alert}" style="width:70px"></td></tr>`).join('')}</table><button class="primary" id="wS" style="margin-top:6px">Speichern</button>`;
    B.querySelector('#wS').onclick = () => { B.querySelectorAll('[data-w]').forEach(i => cfg().waitlists[+i.dataset.w][i.dataset.k] = +i.value); save(); toast('gespeichert'); };
  }
  function sAbs(B) {
    const list = st().resStatus.slice().sort((a, b) => a.date.localeCompare(b.date));
    B.innerHTML = `<div class="card" style="max-width:720px"><h3>Abwesenheit eintragen (Ressourcenstatus wie samedi: Krank / Urlaub sperrt die Ressource)</h3><select id="abR">${cfg().resources.filter(r => !r.hidden).map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select> von <input type="date" id="abF" value="${ui.date}"> bis <input type="date" id="abT" value="${ui.date}"> <select id="abS">${cfg().statusTemplates.filter(s => s.busy).map(s => `<option>${esc(s.title)}</option>`).join('')}</select> <input id="abN" placeholder="Notiz"> <button class="primary" id="abAdd">eintragen</button>
      <label style="color:inherit"><input type="checkbox" id="abZ" checked> zugehörige Zeit-/Puffer-Ressourcen (gleiches Kürzel) mitsperren</label></div>
      <table class="grid"><tr><th>Datum</th><th>Ressource</th><th>Status</th><th>Notiz</th><th></th></tr>${list.map((s, i) => `<tr><td>${P.fmtDate(s.date, true)}</td><td>${esc(resOf(s.resId)?.name)}</td><td>${esc(s.status)}</td><td>${esc(s.note)}</td><td><button class="small" data-x="${st().resStatus.indexOf(s)}">entfernen</button></td></tr>`).join('') || '<tr><td colspan=5 class="muted">keine</td></tr>'}</table>`;
    B.querySelector('#abAdd').onclick = () => {
      const rid = B.querySelector('#abR').value; const r = resOf(rid); const kz = (r.name.match(/\(([^)]+)\)/) || [])[1];
      const ids = [rid]; if (kz && B.querySelector('#abZ').checked) cfg().resources.forEach(x => { if (x.id !== rid && /^Zeit/.test(x.name) && x.name.includes('(' + kz + ')')) ids.push(x.id); });
      for (let d = B.querySelector('#abF').value; d <= B.querySelector('#abT').value; d = P.addDays(d, 1)) for (const id of ids) st().resStatus.push({ resId: id, date: d, status: B.querySelector('#abS').value, note: B.querySelector('#abN').value, busy: true });
      save(); sAbs(B); toast('eingetragen (' + ids.length + ' Ressourcen)'); affectedDialog(rid, B.querySelector('#abF').value, B.querySelector('#abT').value, B.querySelector('#abS').value);
    };
    B.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { st().resStatus.splice(+b.dataset.x, 1); save(); sAbs(B); });
  }
  function sViews(B) {
    B.innerHTML = `<p class="muted">Ansichten = gespeicherte Spaltenauswahl im Kalender.</p><table class="grid"><tr><th>Ansicht</th><th>Spalten</th><th></th></tr>${st().views.map((v, i) => `<tr><td>${esc(v.name)}</td><td style="font-size:12px">${v.resIds.map(id => esc(resOf(id)?.name || '?')).join(', ')}</td><td style="white-space:nowrap"><button class="small" data-up="${i}">↑</button> <button class="small" data-e="${i}">bearbeiten</button> <button class="small danger" data-d="${i}">löschen</button></td></tr>`).join('')}</table>`;
    B.querySelectorAll('[data-e]').forEach(b => b.onclick = () => editViewCols(+b.dataset.e));
    B.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { if (st().views.length < 2) return; st().views.splice(+b.dataset.d, 1); ui.view = 0; save(); sViews(B); });
    B.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; if (!i) return; const v = st().views; [v[i - 1], v[i]] = [v[i], v[i - 1]]; save(); sViews(B); });
  }
  function sData(B) {
    B.innerHTML = `<div class="card" style="max-width:720px"><h3>Daten</h3><p>Alles liegt lokal im Browser (localStorage). ${st().patients.length} Patienten · ${st().appts.length} Termine · ${cfg().eventTypes.length} Terminarten · ${cfg().resources.length} Ressourcen.</p>
      <button id="dExp">Export (JSON)</button> <label style="display:inline;color:inherit"><button id="dImpB">Import (JSON)</button><input type="file" id="dImp" accept=".json" style="display:none"></label> <button id="dCfg">Nur Konfiguration exportieren</button>
      <h3>Zurücksetzen</h3><p class="muted">Erzeugt Konfiguration aus dem samedi-Export neu, 100 frische Testpatienten und Testtermine (rund um das heutige Datum).</p><button class="danger" id="dReset">Alles zurücksetzen</button></div>`;
    const dl = (name, obj) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' })); a.download = name; a.click(); };
    B.querySelector('#dExp').onclick = () => dl('praxiskalender-prototyp-' + TODAY() + '.json', st());
    B.querySelector('#dCfg').onclick = () => dl('praxiskalender-konfiguration-' + TODAY() + '.json', cfg());
    B.querySelector('#dImpB').onclick = () => B.querySelector('#dImp').click();
    B.querySelector('#dImp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const o = JSON.parse(t); if (!o.config || !o.appts) throw new Error('kein Prototyp-Export'); P.S.state = o; save(); toast('importiert'); renderSettings(); } catch (err) { alert(err.message); } }); };
    B.querySelector('#dReset').onclick = () => { if (!confirm('Wirklich alles zurücksetzen? Eigene Änderungen gehen verloren.')) return; $('#loading').style.display = 'flex'; setTimeout(() => { P.reset(); $('#loading').style.display = 'none'; ui.date = TODAY(); go('kalender'); toast('zurückgesetzt'); }, 30); };
  }

  // ---------- Fenster verschieben/größer ziehen, Spaltenbreite ziehen ----------
  function makeMovable(dlgEl) {
    const head = dlgEl.querySelector('.dh');
    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      const r = dlgEl.getBoundingClientRect(); const ox = e.clientX - r.left, oy = e.clientY - r.top;
      dlgEl.classList.add('moved'); dlgEl.style.left = r.left + 'px'; dlgEl.style.top = r.top + 'px'; dlgEl.style.width = r.width + 'px'; dlgEl.style.height = r.height + 'px';
      const mv = ev => { dlgEl.style.left = Math.max(0, Math.min(innerWidth - 80, ev.clientX - ox)) + 'px'; dlgEl.style.top = Math.max(0, Math.min(innerHeight - 30, ev.clientY - oy)) + 'px'; };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); e.preventDefault();
    });
    dlgEl.addEventListener('close', () => { dlgEl.classList.remove('moved'); ['left', 'top', 'height'].forEach(k => dlgEl.style[k] = ''); });
  }
  function makeSplitter(bar, getW, setW, axis) {
    bar.addEventListener('mousedown', e => {
      const start = axis === 'x' ? e.clientX : e.clientY, w0 = getW(); bar.classList.add('drag');
      const mv = ev => setW(w0 + (start - (axis === 'x' ? ev.clientX : ev.clientY)));
      const up = () => { bar.classList.remove('drag'); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); try { localStorage.setItem('pkp_layout', JSON.stringify(ui.layout)); } catch (x) { } };
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up); e.preventDefault();
    });
  }
  function initLayout() {
    try { ui.layout = JSON.parse(localStorage.getItem('pkp_layout') || '{}'); } catch (x) { ui.layout = {}; }
    const side = $('#calSide');
    const applyW = w => { w = Math.max(300, Math.min(innerWidth * 0.75, w)); ui.layout.sideW = w; side.style.width = w + 'px'; side.style.maxWidth = 'none'; };
    if (ui.layout.sideW) applyW(ui.layout.sideW);
    makeSplitter($('#splitter'), () => side.getBoundingClientRect().width, applyW, 'x');
    makeMovable($('#dlg')); makeMovable($('#dlg2'));
  }
  // Höhe des Buchungsfensters rechts unten ziehen (Monatskalender oben bleibt)
  function initBkSplit() {
    const pn = $('#bkPanel'); if (!pn || $('#bkSplit')) return;
    const bar = document.createElement('div'); bar.id = 'bkSplit'; bar.title = 'Höhe ziehen'; pn.parentNode.insertBefore(bar, pn);
    const applyH = hgt => { hgt = Math.max(220, Math.min($('#calSide').clientHeight - 40, hgt)); ui.layout.bkH = hgt; pn.style.flex = '0 0 ' + hgt + 'px'; };
    if (ui.layout && ui.layout.bkH) applyH(ui.layout.bkH);
    makeSplitter(bar, () => pn.getBoundingClientRect().height, applyH, 'y');
  }

  // Test-Schnittstelle für die MFA-Szenarien (tests/mfa-szenarien.js)
  window.PKPUI = { ui, go, openNewAppt, openAppt, openPatient, renderCal, renderCalGrid, closeBooking, closeDlg, quickPatient, affectedDialog, setResStatus, TODAY };

  // ---------- Start ----------
  try { const th = localStorage.getItem('pkp_theme'); if (th) document.documentElement.dataset.theme = th; } catch (e) { }
  document.querySelectorAll('[data-ico]').forEach(el => { const n = el.dataset.ico; el.insertAdjacentHTML('afterbegin', icon(n)); });
  setTimeout(() => {
    P.load();
    ui.date = TODAY();
    const se = st().settings; if (!se.v2) { se.v2 = true; se.pxPerMin = 3; se.dayStart = 6 * 60; se.dayEnd = 21 * 60; P.save(); }
    $('#loading').style.display = 'none';
    tickClock(); setInterval(() => { tickClock(); if (ui.page === 'warteliste') renderWaitlist(); }, 30000);
    $('#dlgX').onclick = closeDlg; initLayout();
    renderCal();
  }, 20);
})();
