// Praxis-Kalender-Prototyp – Buchungs-Engine nach samedi-Logik
// Terminart -> Teilblöcke (Offset, Dauer, Fähigkeit) -> Ressourcen mit dieser Fähigkeit
// -> Öffnungszeiten (versionierte Wochenpläne + Einzeltage) -> Vorlaufzeiten -> Belegung -> Kontingente.
(function () {
  'use strict';
  const DAYKEYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const STORE_KEY = 'pkp_state_v2'; // v2: Sammel-Terminarten mit viaType

  // ---------- Datum / Zeit ----------
  const pad = n => String(n).padStart(2, '0');
  function dayIndex(date) { const [y, m, d] = date.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); }
  function dateOf(idx) { const d = new Date(idx * 86400000); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function addDays(date, n) { return dateOf(dayIndex(date) + n); }
  function weekday(date) { return DAYKEYS[new Date(dayIndex(date) * 86400000).getUTCDay()]; }
  function fmtMin(m) { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function fmtDur(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function parseHM(s) { const [h, m] = String(s).trim().split(':'); return (+h) * 60 + (+(m || 0)); }
  function fmtDate(date, long) {
    const [y, m, d] = date.split('-');
    return (long ? weekday(date) + '. ' : '') + d + '.' + m + '.' + y;
  }
  function absOf(date, min) { return dayIndex(date) * 1440 + min; }
  function splitAbs(abs) { const di = Math.floor(abs / 1440); return { date: dateOf(di), min: abs - di * 1440 }; }
  function todayLocal() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // ---------- Zufall (deterministisch) ----------
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- Öffnungszeiten ----------
  // oh = {parts:[[startDate|null,{Mo:[[s,e]]}]], fixed:{date:[[s,e]]}}; jüngster Plan mit Start <= Datum gilt, Einzeltage überschreiben.
  function hoursOn(oh, date) {
    if (!oh) return [[0, 1440]];
    if (oh.fixed && oh.fixed[date]) return oh.fixed[date];
    let best = null;
    for (const p of oh.parts || []) {
      if (p[0] === null || p[0] <= date) { if (!best || (best[0] || '') <= (p[0] || '')) best = p; }
    }
    if (!best) return [];
    return mergeIv((best[1][weekday(date)] || []).slice());
  }
  function mergeIv(iv) {
    iv.sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const [s, e] of iv) { if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e); else out.push([s, e]); }
    return out;
  }
  function weekPlanText(oh, date) {
    // aktueller Wochenplan als Text "Mo=08:00-12:00,13:00-17:00; Di=…"
    if (!oh) return 'immer';
    let best = null;
    for (const p of oh.parts || []) if (p[0] === null || p[0] <= date) { if (!best || (best[0] || '') <= (p[0] || '')) best = p; }
    if (!best) return '';
    return ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].filter(d => (best[1][d] || []).length)
      .map(d => d + '=' + best[1][d].map(([s, e]) => fmtMin(s) + '-' + (e === 1440 ? '24:00' : fmtMin(e))).join(',')).join('; ');
  }
  function parseWeekPlan(text) {
    const days = { Mo: [], Di: [], Mi: [], Do: [], Fr: [], Sa: [], So: [] };
    for (const chunk of String(text).split(/[;\n]+/)) {
      const m = chunk.trim().match(/^(Mo|Di|Mi|Do|Fr|Sa|So)\s*=\s*(.*)$/);
      if (!m) continue;
      for (const iv of m[2].split(',')) { const [a, b] = iv.split('-'); if (a && b) days[m[1]].push([parseHM(a), parseHM(b)]); }
    }
    return days;
  }

  // ---------- Zustand ----------
  const S = { state: null, idx: null };

  function freshState() {
    const cfg = JSON.parse(JSON.stringify(window.SAMEDI_CONFIG));
    const st = {
      version: 1, seq: 1, config: cfg, patients: [], appts: [], resStatus: [], recallTemplates: [], recalls: [],
      todos: { lists: [{ name: 'Felix', items: [] }, { name: 'Florian', items: [] }] },
      views: defaultViews(cfg),
      settings: { v2: true, simNow: '', dayStart: 6 * 60, dayEnd: 21 * 60, pxPerMin: 3, ignoreInternBookahead: false, hardInsurance: false },
    };
    S.state = st; reindex();
    seedPatients(st);
    seedRecall(st);
    seedAppointments(st);
    seedTodos(st);
    return st;
  }

  function defaultViews(cfg) {
    const byName = n => (cfg.resources.find(r => r.name === n) || {}).id;
    const ids = names => names.map(byName).filter(Boolean);
    const praxis = ['Labor', 'EKG', 'Akut-Zimmer', 'UG', 'Chirurgie / Labor 1. OG', 'Hausbesuche MFA', 'Florian (FCB)', 'Felix (FB)', 'Jeannette (JK)', 'Martin (MMS)', 'Selina (SR)', 'Natalja (NO)', 'Jan (JI)', 'Daniel (DH)', 'Johanna (JTV)', 'Peter (PF)', 'Peter Manstein (PM)', 'Mariana (MBF)', 'OP', 'Vertretung'];
    const aerzte = ['Florian (FCB)', 'Felix (FB)', 'Jeannette (JK)', 'Martin (MMS)', 'Selina (SR)', 'Natalja (NO)', 'Jan (JI)', 'Daniel (DH)', 'Johanna (JTV)', 'Peter (PF)'];
    const mfa = ['Labor', 'EKG', 'Akut-Zimmer', 'UG', 'Chirurgie / Labor 1. OG', 'Hausbesuche MFA', 'Schlafapnoe - Somno', 'Zusatz- EKG - Fa. Zimmer', 'Zusatz- EKG- Somno 1', 'Zusatz- EKG- Somno 2'];
    const derma = ['Peter Manstein (PM)', 'Zeit- Sprechstd. (PM)', 'Mariana (MBF)', 'Zeit- Sprechstd. (MBF)', 'OP'];
    const technik = cfg.resources.filter(r => /^Zeit/.test(r.name)).map(r => r.id);
    return [
      { name: 'Praxis (wie samedi)', resIds: ids(praxis) },
      { name: 'Ärzte Hausarzt', resIds: ids(aerzte) },
      { name: 'MFA / Räume / Geräte', resIds: ids(mfa) },
      { name: 'Dermatologie', resIds: ids(derma) },
      { name: 'Zeit-Ressourcen (Technik)', resIds: technik },
    ];
  }

  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) { S.state = JSON.parse(raw); reindex(); return S.state; } } catch (e) { console.warn(e); }
    const st = freshState(); save(); return st;
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S.state)); } catch (e) { console.warn('Speichern fehlgeschlagen', e); } }
  function reset() { try { localStorage.removeItem(STORE_KEY); } catch (e) { } const st = freshState(); save(); return st; }
  function nextId(prefix) { return prefix + (S.state.seq++); }

  // ---------- Indizes ----------
  function reindex() {
    const st = S.state, cfg = st.config;
    const res = new Map(cfg.resources.map(r => [r.id, r]));
    const types = new Map(cfg.eventTypes.map(t => [t.id, t]));
    const capIdx = new Map();
    for (const r of cfg.resources) for (const c of r.caps) { if (!capIdx.has(c)) capIdx.set(c, []); capIdx.get(c).push(r.id); }
    const busy = new Map(); // resId|day -> [[s,e,apptId]]
    const quotaUse = new Map(); // quota|date|half -> count
    for (const a of st.appts) {
      if (a.status === 'abgesagt') continue;
      for (const p of a.parts) addBusy(busy, p.resId, p.s, p.e, a.id);
      const qs = new Set([...((types.get(a.typeId) || {}).quotas || []), ...((types.get(a.viaType) || {}).quotas || [])]);
      for (const q of qs) { const k = quotaKey(q, a.date, a.start); if (k) quotaUse.set(k, (quotaUse.get(k) || 0) + 1); }
    }
    const status = new Map(); for (const s of st.resStatus) status.set(s.resId + '|' + s.date, s);
    const quotas = new Map(cfg.quotas.map(q => [q.name, q]));
    const patients = new Map(st.patients.map(p => [p.id, p]));
    S.idx = { res, types, capIdx, busy, quotaUse, status, quotas, patients };
  }
  function addBusy(busy, resId, s, e, id) {
    for (let d = Math.floor(s / 1440); d <= Math.floor((e - 1) / 1440); d++) {
      const k = resId + '|' + d; if (!busy.has(k)) busy.set(k, []); busy.get(k).push([s, e, id]);
    }
  }
  function quotaKey(q, date, start) {
    if (/vormittag/i.test(q) && start >= 720) return null;
    if (/nachmittag/i.test(q) && start < 720) return null;
    return q + '|' + date;
  }

  function nowAbs() {
    const sim = S.state.settings.simNow;
    if (sim) { const [d, t] = sim.split('T'); return absOf(d, parseHM(t)); }
    const n = new Date(); return absOf(todayLocal(), n.getHours() * 60 + n.getMinutes());
  }

  // ---------- Prüfung eines Ressourcen-Intervalls ----------
  function resOpen(r, s, e) {
    for (let d = Math.floor(s / 1440); d <= Math.floor((e - 1) / 1440); d++) {
      const date = dateOf(d);
      const st = S.idx.status.get(r.id + '|' + date);
      if (st && st.busy !== false) return 'Status „' + st.status + '“';
      const ds = d * 1440, a = Math.max(s, ds) - ds, b = Math.min(e, ds + 1440) - ds;
      const hrs = hoursOn(r.oh, date);
      if (!hrs.some(([x, y]) => x <= a && b <= y)) return 'geschlossen (' + weekday(date) + ' ' + (hrs.map(([x, y]) => fmtMin(x) + '–' + (y === 1440 ? '24:00' : fmtMin(y))).join(', ') || 'ganztägig zu') + ')';
    }
    return null;
  }
  function busyBy(resId, s, e, ignoreId) {
    for (let d = Math.floor(s / 1440); d <= Math.floor((e - 1) / 1440); d++)
      for (const [x, y, id] of S.idx.busy.get(resId + '|' + d) || []) if (x < e && s < y && id !== ignoreId) return id;
    return null;
  }
  function resBusyCount(resId, s, e, ignoreId) {
    let n = 0;
    for (let d = Math.floor(s / 1440); d <= Math.floor((e - 1) / 1440); d++) {
      for (const [x, y, id] of S.idx.busy.get(resId + '|' + d) || []) if (x < e && s < y && id !== ignoreId) { n++; break; }
    }
    return n;
  }

  // ---------- Kern: Terminart zu Zeitpunkt prüfen ----------
  // opts: {channel:'intern'|'online'|'zuweiser', preferRes, ignoreAppt, ignoreBookahead, ignoreNow, patient}
  function evaluate(typeId, date, start, opts) {
    opts = opts || {};
    const t = S.idx.types.get(typeId);
    const reasons = [], codes = [];
    const addR = (code, text, info) => { reasons.push(text); codes.push(Object.assign({ code, text }, info || {})); };
    if (!t) return { ok: false, reasons: ['Terminart unbekannt'] };
    if (t.alts && t.alts.length) {
      // Sammel-Terminart: Alternativen gelten mit den Freigaben der Sammel-Terminart (samedi-Verhalten)
      for (const alt of t.alts) { const r = evaluate(alt, date, start, Object.assign({}, opts, { viaParent: true })); if (r.ok) return Object.assign(r, { typeId, viaType: alt }); }
      return { ok: false, reasons: ['Keine der ' + t.alts.length + ' Alternativ-Terminarten frei'], codes: [{ code: 'alts', text: 'keine Alternative frei', n: t.alts.length }] };
    }
    const abs = absOf(date, start), now = nowAbs();
    const ch = opts.channel || 'intern';
    const applyBookahead = !opts.ignoreBookahead && !(ch === 'intern' && S.state.settings.ignoreInternBookahead);
    if (!opts.ignoreNow && abs < now) addR('past', 'liegt in der Vergangenheit');
    if (!opts.viaParent) {
      if (ch === 'online' && !t.online) addR('channel', 'Terminart nicht online buchbar');
      if (ch === 'intern' && !t.intern) addR('channel', 'Terminart intern nicht freigegeben');
      if (ch === 'zuweiser' && !t.zuweiser) addR('channel', 'Terminart nicht für Zuweiser');
    }
    if (opts.patient && !t.insurance.includes(opts.patient.insurance) && (ch !== 'intern' || S.state.settings.hardInsurance))
      addR('insurance', 'Versicherung ' + opts.patient.insurance + ' nicht zugelassen (' + t.insurance.join('/') + ')', { allowed: t.insurance, has: opts.patient.insurance });
    const thr = hoursOn(t.oh, date);
    if (!thr.some(([x, y]) => x <= start && start < y)) addR('typewindow', 'außerhalb Zeitfenster der Terminart', { hours: thr });
    if (applyBookahead) {
      if (t.minBook && abs - now < t.minBook) addR('typeMin', 'Mindestvorlauf Terminart ' + fmtDur(t.minBook) + ' h', { min: t.minBook });
      if (t.maxBook && abs - now > t.maxBook) addR('typeMax', 'max. Vorlauf Terminart ' + fmtDur(t.maxBook) + ' h', { max: t.maxBook });
    }
    for (const q of t.quotas) {
      const k = quotaKey(q, date, start); if (!k) continue;
      const cap = (S.idx.quotas.get(q) || {}).capacity; if (cap === undefined) continue;
      if ((S.idx.quotaUse.get(k) || 0) >= cap) addR('quota', 'Kontingent „' + q + '“ erschöpft (' + cap + '/Tag)', { quota: q, cap });
    }
    if (reasons.length) return { ok: false, reasons, codes };

    // Blöcke Ressourcen zuordnen (Backtracking)
    const blocks = t.blocks.map(b => ({ b, s: abs + b.off, e: abs + b.off + b.dur }));
    const used = [];
    const blockReasons = [];
    function candidates(bk) {
      let ids = (S.idx.capIdx.get(bk.b.cap) || []).slice();
      if (opts.preferRes && ids.includes(opts.preferRes)) ids = [opts.preferRes].concat(ids.filter(i => i !== opts.preferRes));
      return ids;
    }
    function tryRes(rid, bk) {
      const r = S.idx.res.get(rid);
      if (used.some(u => u.resId === rid && u.s < bk.e && bk.s < u.e)) return { code: 'self', text: 'schon für anderen Block dieses Termins belegt' };
      const c = resOpen(r, bk.s, bk.e); if (c) return { code: /^Status/.test(c) ? 'status' : 'closed', text: c };
      if (applyBookahead) {
        if (r.maxBook && bk.s - now > r.maxBook) return { code: 'puffer', text: 'erst ' + fmtDur(r.maxBook) + ' h vorher freigegeben (Puffer)', releaseAt: bk.s - r.maxBook };
        if (r.minBook && bk.s - now < r.minBook) return { code: 'minbook', text: 'Mindestvorlauf ' + fmtDur(r.minBook) + ' h' };
      }
      if (resBusyCount(rid, bk.s, bk.e, opts.ignoreAppt) >= (r.capacity || 1)) return { code: 'busy', text: 'belegt', by: busyBy(rid, bk.s, bk.e, opts.ignoreAppt) };
      return null;
    }
    function assign(i) {
      if (i === blocks.length) return true;
      const bk = blocks[i]; const why = [], whyS = []; let anyFree = false;
      for (const rid of candidates(bk)) {
        const fail = tryRes(rid, bk);
        if (fail) { why.push(S.idx.res.get(rid).name + ': ' + fail.text); whyS.push(Object.assign({ resId: rid }, fail)); continue; }
        anyFree = true;
        used.push({ resId: rid, s: bk.s, e: bk.e, label: bk.b.name });
        if (assign(i + 1)) return true;
        used.pop();
      }
      if (!anyFree && !blockReasons[i]) blockReasons[i] ={ block: (bk.b.name || 'Block ' + (i + 1)) + ' [' + bk.b.cap + '] ' + fmtMin(bk.s - Math.floor(bk.s / 1440) * 1440) + ' +' + bk.b.dur + 'min', why: why.length ? why : ['keine Ressource mit dieser Fähigkeit'], whyS, cap: bk.b.cap, s: bk.s, e: bk.e };
      return false;
    }
    if (assign(0)) {
      if (opts.preferRes && !used.some(u => u.resId === opts.preferRes))
        return { ok: false, reasons: ['Gewählte Spalte hat keine passende Fähigkeit für diese Terminart'], codes: [{ code: 'column' }], parts: used.slice() };
      return { ok: true, parts: used.slice(), typeId };
    }
    return { ok: false, reasons: ['Keine Ressourcenkombination frei'], codes: [{ code: 'blocks' }], blockReasons: blockReasons.filter(Boolean) };
  }

  // ---------- Freie Termine suchen ----------
  function findSlots(typeId, fromDate, opts) {
    opts = opts || {};
    const days = opts.days || 14, max = opts.max || 30, perDay = opts.perDay || 999, step = opts.step || 5;
    const t = S.idx.types.get(typeId); if (!t) return [];
    const out = [];
    const fromMin = opts.fromMin || 0;
    for (let i = 0; i < days && out.length < max; i++) {
      const date = addDays(fromDate, i); let n = 0;
      for (let m = i === 0 ? Math.ceil(fromMin / step) * step : 0; m < 1440 && n < perDay && out.length < max; m += step) {
        const r = evaluate(typeId, date, m, opts);
        if (r.ok) { out.push({ typeId, viaType: r.viaType || null, date, start: m, parts: r.parts }); n++; if (opts.gap) m += opts.gap - step; }
      }
    }
    return out;
  }

  // ---------- Termine anlegen / ändern ----------
  function book(slot, data) {
    const t = S.idx.types.get(slot.viaType || slot.typeId);
    const a = {
      id: nextId('A'), typeId: slot.typeId, viaType: slot.viaType || null, patientId: data.patientId || null, title: data.title || '',
      date: slot.date, start: slot.start, dur: t ? t.dur : (data.dur || 10), parts: slot.parts.map(p => ({ resId: p.resId, s: p.s, e: p.e, label: p.label || '' })),
      fields: data.fields || {}, note: data.note || '', channel: data.channel || 'intern', status: data.status || 'geplant',
      overbooked: !!data.overbooked, chainId: data.chainId || null, createdAt: new Date().toISOString(), log: [],
    };
    S.state.appts.push(a); reindex(); save(); return a;
  }
  function blocker(resId, date, start, dur, title) {
    const s = absOf(date, start);
    const a = { id: nextId('B'), typeId: null, patientId: null, title: title || 'Blocker', date, start, dur, parts: [{ resId, s, e: s + dur, label: '' }], fields: {}, note: '', channel: 'intern', status: 'geplant', createdAt: new Date().toISOString(), log: [] };
    S.state.appts.push(a); reindex(); save(); return a;
  }
  function forceParts(typeId, date, start, preferRes) {
    // Überbuchung: jede Teil-Ressource nach Fähigkeit, bevorzugt gewählte Spalte, ohne Prüfung
    const t = S.idx.types.get(typeId); const abs = absOf(date, start);
    const tt = t.alts && t.alts.length ? S.idx.types.get(t.alts[0]) : t;
    return { typeId: t.id, viaType: tt.id !== t.id ? tt.id : null, date, start, parts: tt.blocks.map((b, i) => { const ids = S.idx.capIdx.get(b.cap) || []; const rid = (preferRes && ids.includes(preferRes) && i === 0) ? preferRes : (ids.includes(preferRes) ? preferRes : ids[0]); return { resId: rid, s: abs + b.off, e: abs + b.off + b.dur, label: b.name }; }) };
  }
  function update(a) { reindex(); save(); return a; }
  function remove(id) { S.state.appts = S.state.appts.filter(a => a.id !== id); reindex(); save(); }

  // ---------- Testdaten ----------
  const FIRST_F = ['Anna', 'Maria', 'Theresa', 'Johanna', 'Elisabeth', 'Monika', 'Sabine', 'Christine', 'Andrea', 'Katharina', 'Veronika', 'Franziska', 'Lena', 'Sophie', 'Laura', 'Julia', 'Barbara', 'Rosa', 'Hildegard', 'Ursula', 'Petra', 'Claudia', 'Stefanie', 'Magdalena', 'Leonie'];
  const FIRST_M = ['Josef', 'Johann', 'Georg', 'Franz', 'Michael', 'Andreas', 'Thomas', 'Stefan', 'Markus', 'Martin', 'Alois', 'Sebastian', 'Florian', 'Lukas', 'Maximilian', 'Anton', 'Ludwig', 'Simon', 'Matthias', 'Wolfgang', 'Klaus', 'Peter', 'Tobias', 'Jonas', 'Leonhard'];
  const LAST = ['Huber', 'Bauer', 'Wimmer', 'Gruber', 'Maier', 'Stadler', 'Hofer', 'Schmid', 'Moser', 'Reiter', 'Brandl', 'Kronast', 'Aigner', 'Fuchs', 'Lechner', 'Steiner', 'Pichler', 'Sappl', 'Hinterberger', 'Obermaier', 'Kerschbaumer', 'Dandl', 'Gasteiger', 'Hölzl', 'Mayrhofer', 'Riedl', 'Strasser', 'Wallner', 'Zehetmair', 'Plank'];
  const STREETS = ['Kirchstraße', 'Bahnhofstraße', 'Dorfstraße', 'Inntalstraße', 'Am Bach', 'Lindenweg', 'Wendelsteinstraße', 'Rosenheimer Straße', 'Bergweg', 'Kufsteiner Straße'];
  const TOWNS = [['83126', 'Flintsbach a. Inn'], ['83098', 'Brannenburg'], ['83080', 'Oberaudorf'], ['83088', 'Kiefersfelden'], ['83131', 'Nußdorf a. Inn'], ['83101', 'Rohrdorf']];
  const KASSEN = ['AOK Bayern', 'Techniker Krankenkasse', 'BARMER', 'DAK-Gesundheit', 'BKK Mobil', 'IKK classic', 'SBK'];
  const PKV = ['Allianz PKV', 'Debeka', 'Bayerische Beamtenkrankenkasse', 'AXA', 'Signal Iduna'];

  function seedPatients(st) {
    const r = rng(4711);
    const pick = a => a[Math.floor(r() * a.length)];
    for (let i = 0; i < 100; i++) {
      const female = r() < 0.53;
      const y = 1935 + Math.floor(r() * 85), m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
      const ins = r() < 0.86 ? 'GKV' : (r() < 0.85 ? 'PKV' : 'Selbstzahler');
      const town = pick(TOWNS);
      st.patients.push({
        id: 'T' + (1001 + i), first: pick(female ? FIRST_F : FIRST_M), last: pick(LAST), sex: female ? 'w' : 'm',
        birth: y + '-' + pad(m) + '-' + pad(d), insurance: ins, insurer: ins === 'GKV' ? pick(KASSEN) : ins === 'PKV' ? pick(PKV) : '—',
        phone: '0151 ' + String(1000000 + Math.floor(r() * 8999999)), email: 'testpatient' + (1001 + i) + '@example.org',
        street: pick(STREETS) + ' ' + (1 + Math.floor(r() * 40)), zip: town[0], city: town[1],
        sms: r() < 0.7, note: '', test: true,
      });
    }
  }

  function seedRecall(st) {
    const byName = n => (st.config.eventTypes.find(t => t.name === n) || {}).id;
    st.recallTemplates = [
      { id: 'RT1', name: 'Gesundheitsuntersuchung (alle 3 Jahre)', typeId: byName('BE / EKG / Lufu bei 1. GU'), months: 36 },
      { id: 'RT2', name: 'DMP Diabetes Quartalskontrolle', typeId: byName('BE DMP DM'), months: 3 },
      { id: 'RT3', name: 'Hautkrebsscreening (alle 2 Jahre)', typeId: byName('Hautkrebsscreening (Arzt egal)'), months: 24 },
      { id: 'RT4', name: 'Grippeimpfung jährlich', typeId: byName('Grippe (Influenza) Impfung'), months: 12 },
    ];
    const r = rng(99);
    const today = todayLocal();
    for (let i = 0; i < 25; i++) {
      const p = st.patients[Math.floor(r() * st.patients.length)], tpl = st.recallTemplates[Math.floor(r() * 4)];
      st.recalls.push({ id: 'R' + (i + 1), patientId: p.id, templateId: tpl.id, due: addDays(today, Math.floor(r() * 90) - 30), note: '', done: false, contacted: r() < 0.3 });
    }
  }

  function seedTodos(st) {
    st.todos.lists[0].items.push({ id: 'TD1', text: 'Rückruf Labor Testpatient T1004', done: false, due: todayLocal() });
    st.todos.lists[1].items.push({ id: 'TD2', text: 'Puffer-Logik mit Team besprechen', done: false, due: addDays(todayLocal(), 2) });
  }

  function seedAppointments(st) {
    const r = rng(2026);
    const cfg = st.config;
    const byName = n => (cfg.eventTypes.find(t => t.name === n) || {}).id;
    const pool = [
      ['BE 10 Min. normal', 14], ['BE / EKG', 8], ['BE / EKG / Lufu', 4], ['BE 10 Min. NÜCHTERN', 4], ['EKG', 3], ['Lufu', 1], ['Injektion', 2], ['Impfung', 3], ['Grippe (Influenza) Impfung', 3], ['Urinkontrolle', 2], ['Infusion', 1], ['VW - MFA - Fadenzug / Kontrolle kl. Wunde', 2],
      ['Arztgespräch Kurz (FB)', 4], ['Arztgespräch Lang (FB)', 3], ['Arztgespräch Kurz (FCB)', 3], ['Arztgespräch Lang (FCB)', 2], ['Arztgespräch Kurz (MMS)', 4], ['Arztgespräch Lang (MMS)', 4], ['Arztgespräch Kurz (SR)', 2], ['Arztgespräch Lang (SR)', 2],
      ['Arztgespräch Kurz (NO)', 3], ['Arztgespräch Lang (NO)', 2], ['Arztgespräch Kurz (JTV)', 3], ['Arztgespräch Lang (JTV)', 3], ['Arztgespräch Kurz (JK)', 2], ['Arztgespräch Lang (JK)', 2], ['Arztgespräch Kurz (JI)', 1], ['Arztgespräch Kurz (DH)', 1], ['Arztgespräch Kurz (PF)', 1],
      ['Infektsprechstunde (Arzt egal)', 5], ['Nächstmöglicher Arzttermin (Arzt egal)', 3], ['Krankschreibung über Videosprechstunde (Arzt egal)', 2], ['GU (MMS)', 1], ['GU (JTV)', 1], ['GU (NO)', 1], ['GU (SR)', 1], ['GU (FB)', 1], ['Sono (MMS)', 1], ['Sono (FB)', 1],
      ['Rückruf (FB)', 3], ['Rückruf (MMS)', 3], ['Rückruf (JTV)', 2], ['Rückruf (SR)', 2], ['Rückruf (NO)', 1], ['Rückruf (JK)', 1], ['Hausbesuch MFA', 1], ['LZ EKG - SOMNO 1', 1], ['Schlafapnoe - SOMNO', 1],
      ['Haut-Sprechstunde / Laser (PM)', 1], ['HKS intern (PM)', 1], ['Ergometrie', 1],
    ].map(([n, w]) => [byName(n), w]).filter(x => x[0]);
    const total = pool.reduce((s, x) => s + x[1], 0);
    const pickType = () => { let x = r() * total; for (const [id, w] of pool) { if ((x -= w) < 0) return id; } return pool[0][0]; };
    const grund = ['Kontrolle', 'Labor besprechen', 'Infekt', 'Rückenschmerzen', 'DMP', 'Befund besprechen', 'WV', 'Husten', 'Blutdruck', 'Schwindel', 'Impfberatung', 'AU', 'Bauchschmerzen'];
    const kuerzel = ['mo', 'bo', 'em', 'ap', 'lt', 'sk'];
    const labor = ['PG1', 'PG1 + Vit D', 'PG3', 'DMP', 'CRP schnell', 'TSH, fT3, fT4', 'HbA1c + UACR', 'Lp(a)'];
    const today = todayLocal(), now = nowAbs();
    const labNames = ['Labor'];
    for (let off = -5; off <= 21; off++) {
      const date = addDays(today, off), wd = weekday(date);
      if (wd === 'Sa' || wd === 'So') continue;
      const past = absOf(date, 1440) < now;
      const target = 75 + Math.floor(r() * 25);
      let made = 0, tries = 0;
      while (made < target && tries < target * 3) {
        tries++;
        const typeId = pickType(); const t = S.idx.types.get(typeId);
        const from = 7 * 60 + Math.floor(r() * 9.5 * 12) * 5;
        const opts = { channel: 'intern', days: 1, max: 1, fromMin: from, ignoreNow: past || off === 0, ignoreBookahead: past };
        const slot = findSlots(typeId, date, opts)[0];
        if (!slot) continue;
        const p = st.patients[Math.floor(r() * st.patients.length)];
        const fields = {};
        const sets = (S.idx.types.get(slot.viaType) || t).commentSets.concat(t.commentSets);
        if (sets.some(s => /Grund/.test(s))) fields['Beschwerden / Grund'] = grund[Math.floor(r() * grund.length)];
        if (/^BE/.test(t.name)) fields['Kürzel'] = labor[Math.floor(r() * labor.length)];
        else fields['Kürzel'] = kuerzel[Math.floor(r() * kuerzel.length)];
        let status = 'geplant';
        if (past) status = r() < 0.04 ? 'nicht erschienen' : 'fertig';
        else if (off === 0 && absOf(date, slot.start) < now) status = r() < 0.7 ? 'fertig' : 'in Behandlung';
        const channel = t.online && r() < 0.25 ? 'online' : 'intern';
        book(slot, { patientId: p.id, fields, channel, status });
        made++;
      }
      // Blocker wie im echten Kalender
      const lab = cfg.resources.find(x => labNames.includes(x.name));
      if (lab) blocker(lab.id, date, 11 * 60, 10, 'Laborfahrer kommt');
      if (r() < 0.25) { const ab = cfg.resources.find(x => x.name === 'Natalja (NO)'); if (ab) blocker(ab.id, date, 8 * 60, 600, 'Urlaub'); }
    }
    // ein paar Absagen
    const fut = st.appts.filter(a => a.patientId && a.status === 'geplant');
    for (let i = 0; i < 12 && fut.length; i++) { const a = fut[Math.floor(r() * fut.length)]; a.status = 'abgesagt'; a.cancelledAt = new Date().toISOString(); a.cancelReason = 'Patient hat abgesagt (Testdaten)'; }
    reindex();
  }

  window.PKP = {
    S, load, save, reset, reindex, evaluate, findSlots, book, blocker, forceParts, update, remove, nextId,
    hoursOn, weekPlanText, parseWeekPlan, nowAbs, absOf, splitAbs, dayIndex, dateOf, addDays, weekday, fmtMin, fmtDur, parseHM, fmtDate, todayLocal, pad,
  };
})();
