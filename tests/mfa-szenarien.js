// MFA-Alltag: 35 Szenarien, die über die Oberfläche klicken und das Ergebnis prüfen.
// Start im Browser (Konsole oder per Werkzeug):  runMfaSzenarien()
// Achtung: setzt die Testdaten zurück (frische 100 Testpatienten).
(function () {
  'use strict';
  // nicht gedrosselt im Hintergrund-Tab
  const sleep = () => undefined; // synchroner Lauf
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const click = el => { if (!el) throw new Error('Element fehlt'); el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); };
  const setVal = (el, v) => { if (!el) throw new Error('Feld fehlt'); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const btn = (root, label) => [...(root || document).querySelectorAll('button')].find(b => b.textContent.trim() === label);
  const assert = (c, msg) => { if (!c) throw new Error(msg); };

  window.runMfaSzenarien = function () {
    if (window.PKPSync && PKPSync.remote) throw new Error('Testreihe setzt Daten zurück – nur im Demo-Modus (?demo) ausführen');
    window.__syncDefer = true;
    const P = window.PKP, U = window.PKPUI;
    const S = () => P.S.state, X = () => P.S.idx;
    const T = n => { const t = S().config.eventTypes.find(t => t.name === n); assert(t, 'Terminart fehlt: ' + n); return t.id; };
    const R = n => { const r = S().config.resources.find(r => r.name === n); assert(r, 'Ressource fehlt: ' + n); return r.id; };
    const closeAll = () => { ['#dlg2', '#dlg'].forEach(s => { if ($(s).open) $(s).close(); }); if (U.ui.bk) U.closeBooking(false); U.ui.afterBook = null; };
    // simulierter Praxistag: nächster Werktag nach heute, 07:45
    const nextWd = d => { do { d = P.addDays(d, 1); } while (['Sa', 'So'].includes(P.weekday(d))); return d; };
    
    P.reset();
    const D0 = nextWd(P.todayLocal()), D1 = nextWd(D0), NEXTWEEK = P.addDays(D0, 7);
    S().settings.simNow = D0 + 'T07:45'; P.save();
    $('#loading').style.display = 'none';
    U.ui.date = D0; U.ui.view = 0; U.ui.mode = 'day'; U.go('kalender');
    const pat = i => S().patients[i];
    const results = []; window.__prog = 0;
    function run(nr, name, fn) {
      closeAll(); U.ui.date = D0; U.ui.mode = 'day'; U.go('kalender'); sleep(5);
      window.__prog = nr;
      try { const d = fn(); results.push({ nr, name, ok: true, info: d || '' }); }
      catch (e) { results.push({ nr, name, ok: false, info: e.message }); }
    }
    // --- Buchungsfenster-Helfer (echte Oberfläche) ---
    function panel(o) { U.openNewAppt(o); sleep(5); assert($('#bkPanel'), 'Buchungsfenster rechts unten fehlt'); return $('#bkPanel'); }
    function pickPatient(B, p) { const q = B.querySelector('.pq'); setVal(q, p.last + ', ' + p.first); const it = B.querySelector(`.list [data-p="${p.id}"]`); assert(it, 'Patient nicht in Trefferliste'); click(it); }
    function pickType(B, id) { const sel = B.querySelector('#bkType'); if (![...sel.options].some(o => o.value === id)) { setVal(B.querySelector('#bkTQ'), ''); const only = B.querySelector('#bkOnly'); if (only.checked) { only.checked = false; only.dispatchEvent(new Event('change', { bubbles: true })); } } setVal(B.querySelector('#bkType'), id); }
    function fillFields(B) { B.querySelectorAll('#bkFields [data-field]').forEach(i => { if (!i.value) setVal(i, i.tagName === 'SELECT' ? (i.options[1] || {}).value || '' : 'Test'); }); }
    function clickCal(resId, date, min) {
      U.ui.date = date; U.renderCalGrid();
      const el = $(`.rbody[data-res="${resId}"][data-date="${date}"]`); assert(el, 'Spalte nicht sichtbar');
      const se = S().settings, r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 5, clientY: r.top + (min - se.dayStart) * se.pxPerMin + 2 }));
    }
    const evalTxt = () => ($('#bkEval') || {}).innerText || '';
    const book = B => { const b = B.querySelector('#bkBook'); assert(!b.disabled, 'Buchen gesperrt: ' + evalTxt().slice(0, 160)); click(b); };
    const apptAt = (pid, date, start) => S().appts.find(a => a.patientId === pid && a.date === date && a.start === start && a.status !== 'abgesagt');
    const firstFree = (typeId, date, opts) => P.findSlots(typeId, date, Object.assign({ days: 14, max: 1, channel: 'intern' }, opts || {}))[0];

    // 1
    run(1, 'Akut-Anruf: Infekt heute, Arzt egal, „Nächste freie“', () => {
      const p = pat(10); const B = panel({ date: D0 }); pickPatient(B, p); pickType(B, T('Infektsprechstunde (Arzt egal)'));
      click(B.querySelector('#bkNextBtn')); const sb = B.querySelector('#bkNext .slotbtn'); assert(sb, 'keine Vorschläge'); click(sb); fillFields(B);
      const d = U.ui.bk.date, m = U.ui.bk.start; book(B); const a = apptAt(p.id, d, m); assert(a, 'Termin nicht gespeichert'); assert(a.viaType, 'Arzt nicht zugeordnet');
      return P.fmtDate(d) + ' ' + P.fmtMin(m) + ' bei ' + X().types.get(a.viaType).name;
    });
    // 2
    run(2, 'Klick in Kalender-Spalte (grüne Markierung) und buchen', () => {
      const t = T('Arztgespräch Kurz (MMS)'); const s = firstFree(t, D0, { fromMin: 8 * 60 }); assert(s, 'kein freier Slot bei Martin');
      const p = pat(11); const B = panel({ date: s.date, typeId: t }); pickPatient(B, p);
      assert($$('.bt').length > 0, 'keine grünen Markierungen im Kalender');
      clickCal(R('Martin (MMS)'), s.date, s.start); fillFields(B); assert(/Frei/.test(evalTxt()), 'Slot nicht frei: ' + evalTxt());
      book(B); assert(apptAt(p.id, s.date, s.start), 'nicht gespeichert'); return P.fmtDate(s.date) + ' ' + P.fmtMin(s.start);
    });
    // 3 Puffer heute
    const pufRes = S().config.resources.find(r => r.name === 'Zeit- Puffer/ Notfälle- Zeiten freigeben (FB)');
    const pufSlot = (date) => { for (const [a] of P.hoursOn(pufRes.oh, date)) if (P.absOf(date, a) > P.nowAbs()) return a; return null; };
    run(3, 'Notfall-Puffer am selben Tag buchbar (innerhalb 10 h)', () => {
      const m = pufSlot(D0); assert(m != null, 'kein Puffer heute bei Felix');
      const ev = P.evaluate(T('Arztgespräch Kurz (FB)'), D0, m, {}); assert(ev.ok, 'Puffer heute nicht buchbar'); assert(ev.parts.some(p => p.resId === pufRes.id), 'nicht über Puffer gebucht');
      const B = panel({ date: D0, typeId: T('Arztgespräch Kurz (FB)') }); pickPatient(B, pat(12)); clickCal(R('Felix (FB)'), D0, m); fillFields(B); book(B);
      return 'Puffer ' + P.fmtMin(m) + ' gebucht';
    });
    // 4 Puffer nächste Woche gesperrt + verständliche Meldung + Ausweichknopf
    run(4, 'Puffer nächste Woche gesperrt – Meldung in MFA-Sprache + Ausweichtermin', () => {
      const m = pufSlot(NEXTWEEK); assert(m != null, 'kein Puffer in KW+1');
      const B = panel({ date: NEXTWEEK, typeId: T('Arztgespräch Kurz (FB)') }); pickPatient(B, pat(13)); clickCal(R('Felix (FB)'), NEXTWEEK, m);
      const txt = evalTxt(); assert(/Notfall-Puffer von Felix/.test(txt), 'Meldung unklar: ' + txt); assert(!/Zeit- Puffer/.test(txt.split('Technische')[0]), 'Ressourcen-Jargon in der Meldung');
      const nf = B.querySelector('[data-nextfree]'); assert(nf, 'kein Ausweichknopf'); click(nf); fillFields(B); assert(/Frei/.test(evalTxt()), 'Ausweichtermin nicht frei');
      book(B); return txt.split('\n').find(l => /Puffer/.test(l)).trim();
    });
    // 5 Überbuchung
    run(5, 'Belegten Slot bewusst überbuchen („Trotzdem eintragen“)', () => {
      const visible = new Set(S().views[0].resIds); const busy = S().appts.find(a => a.date === D1 && a.patientId && a.status === 'geplant' && /^Arztgespräch/.test((X().types.get(a.typeId) || {}).name || '') && visible.has(a.parts[0].resId));
      assert(busy, 'kein belegter Termin gefunden');
      const B = panel({ date: D1, typeId: busy.typeId }); pickPatient(B, pat(14)); clickCal(busy.parts[0].resId, D1, busy.start);
      const msg5 = evalTxt().split('\n').find(l => /schon einen Termin/.test(l)); assert(msg5, 'keine „schon belegt“-Meldung: ' + evalTxt());
      click(B.querySelector('#bkOver')); sleep(5); click(btn($('#dlg2'), 'Trotzdem eintragen'));
      const a = S().appts.find(x => x.patientId === pat(14).id && x.date === D1 && x.start === busy.start); assert(a && a.overbooked, 'Überbuchung nicht gespeichert');
      return 'Meldung: ' + msg5.trim() + ' → trotzdem eingetragen';
    });
    // 6 nüchtern nach 10 Uhr
    run(6, 'BE nüchtern nach 10:00 → verständliche Ablehnung', () => {
      const ev = P.evaluate(T('BE 10 Min. NÜCHTERN'), D1, 10 * 60 + 30, {});
      const B = panel({ date: D1, typeId: T('BE 10 Min. NÜCHTERN') }); clickCal(R('Labor'), D1, 10 * 60 + 30);
      assert(!ev.ok && /nur bis 10:00/.test(evalTxt()), 'Meldung: ' + evalTxt()); return 'Meldung: „nur bis 10:00 Uhr“';
    });
    // 7 mehrteilig
    run(7, 'BE/EKG/Lufu: drei Teilblöcke Labor → EKG versetzt', () => {
      const s = firstFree(T('BE / EKG / Lufu'), D1); assert(s, 'kein Slot');
      assert(s.parts.length === 3, 'Teile: ' + s.parts.length); assert(s.parts[1].s - s.parts[0].s === 10, 'EKG nicht +10 min');
      P.book(s, { patientId: pat(15).id }); return P.fmtMin(s.start) + ': ' + s.parts.map(p => X().res.get(p.resId).name).join(' → ');
    });
    // 8 Langzeit-EKG Gerät
    run(8, 'Langzeit-EKG: Gerät 24 h belegt, zweiter Patient bekommt anderen Tag', () => {
      const t = T('LZ EKG - SOMNO 1'); const a = firstFree(t, D1); assert(a, 'kein Slot'); P.book(a, { patientId: pat(16).id });
      const b = firstFree(t, a.date); assert(b, 'kein zweiter Slot'); assert(b.date !== a.date || P.absOf(b.date, b.start) >= Math.max(...a.parts.map(p => p.e)) - 1440, 'Gerät doppelt vergeben');
      return '1.: ' + P.fmtDate(a.date) + ' · 2.: ' + P.fmtDate(b.date);
    });
    // 9 Kontingent
    run(9, 'Kontingent GU Privat (FCB) Vormittag: 1 pro Tag', () => {
      const t = T('GU Privat (FCB)'); const a = P.findSlots(t, D0, { days: 14, max: 50 }).find(s => s.start < 720); assert(a, 'kein Vormittag frei');
      P.book(a, { patientId: pat(17).id });
      const b = P.findSlots(t, a.date, { days: 1, max: 50 }).find(s => s.start < 720); assert(!b, 'zweiter Vormittagstermin möglich');
      const ev = P.evaluate(t, a.date, a.start + 60, {}); return 'zweite Buchung: ' + (ev.ok ? 'frei?!' : (ev.codes || []).map(c => c.code).join(','));
    });
    // 10 Versicherung online
    run(10, 'GKV-Patient will Privatleistung online buchen → gesperrt', () => {
      const gkv = S().patients.find(p => p.insurance === 'GKV'); const t = T('HKS (MBF)');
      const ev = P.evaluate(t, D1, 13 * 60, { channel: 'online', patient: gkv }); assert(!ev.ok && (ev.codes || []).some(c => c.code === 'insurance'), 'Versicherung nicht geprüft');
      return 'gesperrt: nur PKV/Selbstzahler';
    });
    // 11 Neupatient im Buchungsfenster
    run(11, 'Neupatient direkt beim Buchen anlegen', () => {
      const B = panel({ date: D1 }); setVal(B.querySelector('.pq'), 'Neumann, Lisa'); click(B.querySelector('.list [data-new]')); sleep(5);
      const F = $('#dlg2Body'); assert($('#dlg2').open, 'Neupatient-Fenster fehlt');
      setVal(F.querySelector('[data-k="birth"]'), '0703 1991'.replace(' ', '')); setVal(F.querySelector('[data-k="phone"]'), '0151 222333');
      click(btn($('#dlg2'), 'Anlegen')); sleep(5);
      const p = S().patients.find(x => x.last === 'Neumann' && x.first === 'Lisa'); assert(p, 'nicht angelegt'); assert(p.birth === '1991-03-07', 'Geburtsdatum ' + p.birth);
      assert(U.ui.bk && U.ui.bk.patientId === p.id, 'nicht im Buchungsfenster übernommen'); return p.id + ' angelegt und gewählt';
    });
    // 12 Dublette
    run(12, 'Dublette wird erkannt', () => {
      const p = pat(20); U.quickPatient(p.last + ', ' + p.first, () => {}); sleep(5);
      setVal($('#dlg2Body [data-k="birth"]'), P.fmtDate(p.birth)); click(btn($('#dlg2'), 'Anlegen')); sleep(5);
      assert(/Dublette/.test($('#dlg2Body').innerText), 'keine Dublettenwarnung'); const n = S().patients.filter(x => x.last === p.last && x.first === p.first).length; assert(n === 1, 'doppelt angelegt');
      return 'Warnung für ' + p.last + ', ' + p.first;
    });
    // 13 Geburtsdatum-Formate
    run(13, 'Geburtsdatum tippen: 120385 / 12.3.85 / 12.03.1985 / 31.02.1990', () => {
      U.quickPatient('Test, Format', () => {}); sleep(5); const f = $('#dlg2Body [data-k="birth"]'), hint = () => $('#dlg2Body .dobHint').textContent;
      const out = []; for (const v of ['120385', '12.3.85', '12.03.1985']) { setVal(f, v); assert(/12\.03\.1985/.test(hint()), v + ' → ' + hint()); out.push(v + '✓'); }
      setVal(f, '31.02.1990'); assert(/ungültig/.test(hint()), '31.02. nicht abgelehnt'); out.push('31.02.✗'); return out.join(' ');
    });
    // 14 Ankunft + Ampel
    run(14, 'Patient kommt an → Warteliste, Ampel nach Wartezeit', () => {
      const a = S().appts.filter(x => x.date === D0 && x.patientId && x.status === 'geplant').sort((x, y) => x.start - y.start)[0]; assert(a, 'kein Termin heute');
      U.go('warteliste'); click($(`#p-warteliste [data-s="wartend"][data-a="${a.id}"]`)); assert(a.status === 'wartend', 'Status nicht wartend');
      S().settings.simNow = D0 + 'T' + P.fmtMin(a.start + 40); U.go('warteliste'); const row = $(`#p-warteliste [data-a="${a.id}"]`).closest('tr');
      const red = row.classList.contains('wl-alert'); S().settings.simNow = D0 + 'T07:45'; assert(red, 'nach 40 min nicht rot'); return 'nach 40 min rot markiert';
    });
    // 15 Aufrufen/Fertig
    run(15, 'Aufrufen → in Behandlung → fertig (Kalender durchgestrichen)', () => {
      const a = S().appts.find(x => x.date === D0 && x.status === 'wartend'); assert(a, 'niemand wartet');
      U.go('warteliste'); click($(`#p-warteliste [data-s="in Behandlung"][data-a="${a.id}"]`)); click($(`#p-warteliste [data-s="fertig"][data-a="${a.id}"]`));
      U.go('kalender'); U.renderCalGrid(); assert(a.status === 'fertig', 'nicht fertig'); const ev = $(`.ev[data-id="${a.id}"]`); assert(!ev || ev.classList.contains('done'), 'nicht durchgestrichen'); return 'ok';
    });
    // 16 nicht erschienen
    run(16, 'Nicht erschienen markieren', () => {
      const a = S().appts.find(x => x.date === D0 && x.patientId && x.status === 'geplant'); U.go('warteliste'); click($(`#p-warteliste [data-s="nicht erschienen"][data-a="${a.id}"]`));
      assert(a.status === 'nicht erschienen', 'Status falsch'); return 'ok';
    });
    // 17 Absage
    let cancelled = null;
    run(17, 'Telefonische Absage über Termin-Fenster → Slot wieder frei', () => {
      const a = S().appts.find(x => x.date === D1 && x.patientId && x.status === 'geplant' && x.typeId === T('Arztgespräch Lang (MMS)')) || S().appts.find(x => x.date === D1 && x.patientId && x.status === 'geplant');
      U.openAppt(a.id); sleep(5); click(btn($('#dlgFoot'), 'Absagen')); sleep(5); assert($('#dlg2').open, 'Absage-Fenster öffnet nicht');
      const cb = $('#dlg2Body #cxF'); cb.checked = false; click(btn($('#dlg2'), 'Termin absagen')); sleep(5);
      assert(a.status === 'abgesagt', 'Status ' + a.status); const ev = P.evaluate(a.viaType ? a.typeId : a.typeId, a.date, a.start, {}); cancelled = a;
      return 'abgesagt · Slot ' + (ev.ok ? 'wieder frei' : 'noch belegt (' + (ev.codes || []).map(c => c.code) + ')');
    });
    // 18 Absage + Folgetermin
    run(18, 'Absage mit Folgetermin → Buchungsfenster vorbelegt', () => {
      const a = S().appts.find(x => x.date === D1 && x.patientId && x.status === 'geplant');
      U.openAppt(a.id); sleep(5); click(btn($('#dlgFoot'), 'Absagen')); sleep(5); click(btn($('#dlg2'), 'Termin absagen')); sleep(80);
      assert(U.ui.bk && U.ui.bk.patientId === a.patientId && U.ui.bk.typeId === a.typeId, 'Buchungsfenster nicht vorbelegt'); return 'Patient + Terminart übernommen';
    });
    // 19 Reaktivieren
    run(19, 'Abgesagten Termin reaktivieren', () => {
      assert(cancelled, 'keine Absage aus 17'); click($('#calCancelled')); sleep(5); const b = $(`#dlgBody [data-re="${cancelled.id}"]`); assert(b, 'nicht in Absage-Liste'); click(b); sleep(5);
      if ($('#dlg2').open) click(btn($('#dlg2'), 'Überbuchen'));
      assert(cancelled.status === 'geplant', 'nicht reaktiviert'); return 'ok';
    });
    // 20 Verschieben
    run(20, 'Termin auf nächsten freien verschieben', () => {
      const a = S().appts.find(x => x.date === D1 && x.patientId && x.status === 'geplant' && X().types.get(x.typeId) && !X().types.get(x.typeId).alts.length);
      const old = a.date + ' ' + a.start; U.openAppt(a.id); sleep(5); click(btn($('#dlgBody'), 'Nächster freier')); sleep(5);
      const go = $('#dlgBody #mDo'); assert(go, 'kein freier Ausweichtermin'); click(go); sleep(5);
      assert(a.date + ' ' + a.start !== old, 'nicht verschoben'); return P.fmtDate(a.date) + ' ' + P.fmtMin(a.start);
    });
    // 21 Arzt krank
    run(21, 'Arzt krank → betroffene Termine → absagen & neu buchen', () => {
      U.setResStatus(R('Felix (FB)'), D1, D1, 'Krank'); sleep(5); assert($('#dlg').open && /Betroffene/.test($('#dlgTitle').textContent), 'keine Betroffenen-Liste');
      const n = $$('#dlgBody [data-u]').length; assert(n > 0, 'keine Termine gelistet');
      click($('#dlgBody [data-u]')); sleep(80); assert(U.ui.bk && U.ui.bk.patientId, 'Buchungsfenster nicht offen');
      pickType($('#bkPanel'), T('Nächstmöglicher Arzttermin (Arzt egal)')); click($('#bkPanel #bkNextBtn')); click($('#bkPanel #bkNext .slotbtn')); fillFields($('#bkPanel')); book($('#bkPanel')); sleep(400);
      assert($('#dlg').open && /Betroffene/.test($('#dlgTitle').textContent), 'nach Umbuchung nicht zurück zur Liste'); return n + ' Termine betroffen, 1 umgebucht';
    });
    // 22 Urlaub
    run(22, 'Urlaub für Zeitraum → Arzt nicht buchbar, Meldung verständlich', () => {
      const from = P.addDays(D0, 14), to = P.addDays(D0, 18);
      U.setResStatus(R('Martin (MMS)'), from, null, 'Urlaub'); sleep(5); setVal($('#dlg2Body #sT'), to); click(btn($('#dlg2'), 'Eintragen')); sleep(5);
      const ev = P.evaluate(T('Arztgespräch Kurz (MMS)'), P.addDays(from, 1), 9 * 60, {}); assert(!ev.ok, 'trotz Urlaub buchbar');
      U.closeDlg(); const B = panel({ date: P.addDays(from, 1), typeId: T('Arztgespräch Kurz (MMS)') }); clickCal(R('Martin (MMS)'), P.addDays(from, 1), 9 * 60);
      assert(/urlaub/i.test(evalTxt()), 'Meldung: ' + evalTxt()); return evalTxt().split('\n').find(l => /urlaub/i.test(l)).trim();
    });
    // 23 Terminkette
    run(23, 'Terminkette GU: Labor + GU im Abstand ≥ 3 Tage', () => {
      const before = S().appts.length; const p = pat(30); U.go('callcenter');
      const ch = S().config.chains.find(c => c.name === 'GU online (Arzt egal)'); const out = document.createElement('div');
      // Kette über die Call-Center-Logik planen und buchen
      document.body.appendChild(out); const cc = $('#ccChain'); setVal(cc, ch.id);
      const pq = $('#p-callcenter .pq'); setVal(pq, p.last + ', ' + p.first); click($(`#p-callcenter .list [data-p="${p.id}"]`));
      click($('#ccChainPlan')); sleep(5); click($('#chainBook')); sleep(5); out.remove();
      const mine = S().appts.slice(before).filter(a => a.patientId === p.id).sort((a, b) => P.absOf(a.date, a.start) - P.absOf(b.date, b.start));
      assert(mine.length === 2, 'Termine: ' + mine.length); const gap = (P.absOf(mine[1].date, mine[1].start) - P.absOf(mine[0].date, mine[0].start)) / 1440; assert(gap >= 3, 'Abstand ' + gap.toFixed(1) + ' Tage');
      return mine.map(a => P.fmtDate(a.date)).join(' → ');
    });
    // 24 Terminsuche Geburtsdatum
    run(24, 'Terminsuche per Geburtsdatum öffnet Termin', () => {
      const a = S().appts.find(x => x.date >= D0 && x.patientId && x.status === 'geplant'); const p = X().patients.get(a.patientId);
      setVal($('#calSearch'), P.fmtDate(p.birth)); $('#calSearchWrap').dispatchEvent(new Event('submit', { cancelable: true })); sleep(5);
      const tr = $('#dlgBody [data-go]'); assert(tr, 'keine Treffer'); click(tr); sleep(60); assert($('#dlg').open && /Termin/.test($('#dlgTitle').textContent), 'Termin nicht geöffnet'); return 'gefunden: ' + p.last;
    });
    // 25 Online-Buchung
    run(25, 'Patient bucht online (Infekt) → erscheint im Kalender mit Online-Kennung', () => {
      const t = T('Infektsprechstunde (Arzt egal)'); const s = P.findSlots(t, D0, { channel: 'online', days: 7, max: 1, patient: pat(40) })[0]; assert(s, 'online nichts frei');
      const a = P.book(s, { patientId: pat(40).id, channel: 'online' }); U.ui.date = s.date; U.renderCalGrid();
      const el = $(`.ev[data-id="${a.id}"] .corner.web`) || $(`.ev[data-id="${a.id}"]`); assert(el, 'nicht im Kalender'); return P.fmtDate(s.date) + ' ' + P.fmtMin(s.start);
    });
    // 26 Puffer online unsichtbar
    run(26, 'Online sieht Patient keine Puffer der nächsten Woche', () => {
      const t = T('Arztgespräch Kurz (FB)'); const m = pufSlot(NEXTWEEK); const ev = P.evaluate(t, NEXTWEEK, m, { channel: 'online' });
      assert(!ev.ok, 'Puffer online buchbar'); return 'gesperrt';
    });
    // 27 Blocker
    run(27, 'Blocker „Teambesprechung“ sperrt die Zeit', () => {
      const t = T('Arztgespräch Kurz (MMS)'); const s = firstFree(t, D1); assert(s, 'kein Slot');
      const B = panel({ date: s.date }); const cb = B.querySelector('#bkBlockCb'); cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true }));
      const B2 = $('#bkPanel'); setVal(B2.querySelector('#bkTitle'), 'Teambesprechung'); setVal(B2.querySelector('#bkBDur'), '30'); clickCal(R('Martin (MMS)'), s.date, s.start); book(B2);
      const ev = P.evaluate(t, s.date, s.start, {}); assert(!ev.ok, 'Zeit trotz Blocker frei'); U.closeBooking(false);
      const B3 = panel({ date: s.date, typeId: t }); clickCal(R('Martin (MMS)'), s.date, s.start); assert(/Teambesprechung/.test(evalTxt()), 'Meldung nennt Blocker nicht: ' + evalTxt()); return 'Meldung: ' + evalTxt().split('\n').find(l => /Team/.test(l)).trim();
    });
    // 28 Rückruf
    run(28, 'Rückruf-Termin (5 min) beim Arzt eintragen', () => {
      const t = T('Rückruf (MMS)'); const s = firstFree(t, D0); assert(s, 'kein Rückrufslot'); const B = panel({ date: s.date, typeId: t }); pickPatient(B, pat(41)); clickCal(R('Martin (MMS)'), s.date, s.start); fillFields(B); book(B);
      return P.fmtDate(s.date) + ' ' + P.fmtMin(s.start);
    });
    // 29 Recall
    run(29, 'Fälligen Recall anrufen und Termin buchen', () => {
      U.go('recall'); const b = $('#p-recall [data-b]'); assert(b, 'kein fälliger Recall'); click(b); sleep(5);
      assert(U.ui.bk && U.ui.bk.patientId && U.ui.bk.typeId, 'Buchungsfenster nicht vorbelegt'); return 'Terminart: ' + X().types.get(U.ui.bk.typeId).name;
    });
    // 30 Wochenansicht
    run(30, 'Spaltenkopf → Wochenansicht des Arztes', () => {
      U.renderCal(); const hd = $$('.rcol .colhead').find(h => /Martin/.test(h.textContent)); click(hd); sleep(5); const it = [...document.querySelectorAll('.menu div')].find(d => /Wochenansicht/.test(d.textContent)); click(it);
      assert(U.ui.mode === 'week' && $$('.rcol').length === 7, 'keine Wochenansicht'); U.ui.mode = 'day'; return '7 Tage';
    });
    // 31 Rechtsklick → Blocker
    run(31, 'Rechtsklick in freie Fläche → Blocker „Pause“ 30 min', () => {
      const t = T('Arztgespräch Kurz (SR)'); const s = firstFree(t, D1); assert(s, 'kein freier Slot bei Selina');
      U.ui.date = s.date; U.renderCalGrid(); const el = $(`.rbody[data-res="${R('Selina (SR)')}"][data-date="${s.date}"]`); const se = S().settings, r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 5, clientY: r.top + (s.start - se.dayStart) * se.pxPerMin + 2 }));
      const it = $$('.menu div').find(d => /Blocker hier/.test(d.textContent)); assert(it, 'kein Kontextmenü'); click(it);
      assert($('#dlg2').open, 'Blocker-Fenster fehlt'); click(btn($('#dlg2'), 'Eintragen')); let warned = false;
      if ($('#dlg2').open && /Achtung/.test($('#dlg2Body').innerText)) { warned = true; click(btn($('#dlg2'), 'Eintragen')); }
      const blk = S().appts.find(a => !a.patientId && a.title === 'Pause' && a.date === s.date && a.start === s.start); assert(blk, 'Blocker nicht gespeichert');
      const ev = P.evaluate(t, s.date, s.start, {}); assert(!ev.ok, 'Zeit trotz Blocker buchbar');
      const on = P.evaluate(t, s.date, s.start, { channel: 'online' }); assert(!on.ok, 'online trotz Blocker buchbar');
      return 'Pause ' + P.fmtMin(s.start) + ' · intern + online gesperrt' + (warned ? ' · Warnung vor Patiententermin kam' : '');
    });
    // 32 Rechtsklick auf Termin → angekommen
    run(32, 'Rechtsklick auf Termin → „Angekommen“', () => {
      const a = S().appts.find(x => x.date === D0 && x.patientId && x.status === 'geplant' && new Set(S().views[0].resIds).has(x.parts[0].resId)); U.ui.date = D0; U.renderCalGrid();
      const ev = $(`.ev[data-id="${a.id}"]`); assert(ev, 'Termin nicht sichtbar'); const r = ev.getBoundingClientRect();
      ev.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 3, clientY: r.top + 3 }));
      const it = $$('.menu div').find(d => /Angekommen/.test(d.textContent)); assert(it, 'kein Termin-Kontextmenü'); click(it);
      assert(a.status === 'wartend', 'Status ' + a.status); return 'wartend';
    });
    // 33 Rechtsklick auf Blocker → löschen
    run(33, 'Rechtsklick auf Blocker → löschen', () => {
      const blk = S().appts.find(a => !a.patientId && a.title === 'Pause'); assert(blk, 'kein Blocker'); U.ui.date = blk.date; U.renderCalGrid();
      const ev = $(`.ev[data-id="${blk.id}"]`); const r = ev.getBoundingClientRect(); ev.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 3, clientY: r.top + 3 }));
      click($$('.menu div').find(d => /Blocker löschen/.test(d.textContent))); click(btn($('#dlg2'), 'Löschen'));
      assert(!S().appts.includes(blk), 'Blocker noch da'); return 'gelöscht';
    });
    // 34 Status-Eckchen
    run(34, 'Klick aufs Status-Eckchen: geplant → wartet → in Behandlung → fertig → geplant, ohne Fenster', () => {
      const a = S().appts.find(x => x.date === D1 && x.patientId && x.status === 'geplant' && new Set(S().views[0].resIds).has(x.parts[0].resId)); U.ui.date = D1; U.renderCalGrid();
      const seq = [];
      for (let i = 0; i < 4; i++) { const ic = $(`.ev[data-id="${a.id}"] .stx.act`); assert(ic, 'kein Status-Eckchen'); click(ic); seq.push(a.status); assert(!$('#dlg').open, 'Fenster ging auf'); }
      assert(seq.join(',') === 'wartend,in Behandlung,fertig,geplant', 'Reihenfolge: ' + seq.join(',')); return seq.join(' → ');
    });
    // 35 Arztwechsel per Spaltenklick
    run(35, 'Suche für Florian, Klick in Martins Spalte → Terminart wechselt automatisch auf (MMS)', () => {
      const tF = T('Arztgespräch Kurz (FCB)'), tM = T('Arztgespräch Kurz (MMS)');
      const s = firstFree(tM, D1); assert(s, 'Martin hat nichts frei');
      U.ui.view = 0; const B = panel({ date: s.date, typeId: tF }); pickPatient(B, pat(50));
      const alt = $(`.rbody[data-res="${R('Martin (MMS)')}"] .bt.alt`); assert(alt, 'keine hellgrünen Zeiten bei Martin');
      clickCal(R('Martin (MMS)'), s.date, s.start);
      assert(U.ui.bk.typeId === tM, 'Terminart nicht gewechselt: ' + X().types.get(U.ui.bk.typeId).name);
      fillFields($('#bkPanel')); assert(/Frei/.test(evalTxt()), 'nicht frei: ' + evalTxt()); book($('#bkPanel'));
      assert(apptAt(pat(50).id, s.date, s.start), 'nicht gebucht'); return 'gewechselt auf ' + X().types.get(tM).name + ', ' + P.fmtMin(s.start);
    });
    closeAll(); $('#calSearch').value = ''; U.ui.date = D0; U.go('kalender');
    const ok = results.filter(r => r.ok).length;
    window.__syncDefer = false;
    console.table(results);
    return { bestanden: ok + '/' + results.length, tag: D0, results };
  };
})();
