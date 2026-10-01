// Praxiskalender – Synchronisierung mit dem Server (Mehrbenutzerbetrieb)
//
// Ohne Server (z. B. GitHub-Seite, ?demo) bleibt alles im eigenen Browser (Demo-Modus).
// Mit Server:
//  1. Anmeldung: Microsoft-Konto (Entra/MSAL) – im lokalen Testbetrieb ein frei wählbarer Name.
//  2. Laden: kompletter Stand vom Server (/api/state).
//  3. Speichern: nach jeder Aktion werden nur die geänderten Dokumente geschickt (/api/ops),
//     jeweils mit der Version, auf der die Änderung beruht. Hat ein anderer Rechner inzwischen
//     geändert oder den Slot belegt, lehnt der Server ab → Meldung + frischer Stand.
//  4. Live: offener Kanal (/api/events) – Änderungen anderer Rechner kommen sofort an.
(function () {
  'use strict';
  const ARR = ['appts', 'patients', 'resStatus', 'recalls'];
  const SINGLE = ['config', 'views', 'todos', 'recallTemplates'];
  const idOf = (col, x) => col === 'resStatus' ? (x.id || (x.id = x.resId + '|' + x.date)) : String(x.id);
  const q = new URLSearchParams(location.search);

  const Sync = {
    remote: false, authEnabled: false, me: null, env: '', presence: { online: [] }, status: 'offline', rev: 0,
    clientId: Math.random().toString(36).slice(2, 10),
    meta: {}, // col → id → {createdBy, createdAt, updatedBy, updatedAt, version}
    snap: {}, _chain: Promise.resolve(), _listeners: { remote: [], presence: [], status: [], message: [], resync: [] },
    on(ev, fn) { this._listeners[ev].push(fn); },
    _emit(ev, d) { for (const f of this._listeners[ev]) try { f(d); } catch (e) { console.error(e); } },

    // ---------- Start: Betriebsart, Anmeldung, Laden ----------
    async start() {
      if (q.has('demo') || q.has('local') || location.protocol === 'file:') return false;
      let cfg;
      try {
        const ctl = new AbortController(); setTimeout(() => ctl.abort(), 4000);
        const r = await fetch('api/auth-config', { signal: ctl.signal, cache: 'no-store' });
        if (!r.ok) return false;
        cfg = await r.json();
      } catch (e) { return false; } // kein Server erreichbar → Demo-Modus
      this.authEnabled = !!cfg.authEnabled; this.env = cfg.environment || '';
      if (this.authEnabled) await this._msalLogin(cfg); else this._devLogin();
      if (this._needsLogin) return 'login';
      await this.reload(true);
      this.remote = true;
      if (this._empty) {
        if (!this.me.admin) throw new Error('Der Kalender ist noch leer – ein Admin muss ihn einmal einrichten.');
        window.PKP.reset(); // erzeugt Testdaten und lädt sie per uploadAll hoch
        await this._uploading; await this.reload(true);
      }
      this._listen();
      return true;
    },
    _devLogin() {
      // Testbetrieb ohne Microsoft-Login: Name wählbar (?user=Anna), damit sich mehrere Rechner simulieren lassen
      let name = q.get('user') || sessionStorage.getItem('pkp_dev_user') || localStorage.getItem('pkp_dev_user');
      if (!name) name = 'Testbenutzer';
      sessionStorage.setItem('pkp_dev_user', name);
      this._devUser = name;
    },
    async _msalLogin(cfg) {
      this._scope = cfg.scope;
      this._msal = new msal.PublicClientApplication({
        auth: { clientId: cfg.clientId, authority: 'https://login.microsoftonline.com/' + cfg.tenantId, redirectUri: location.origin + location.pathname },
        cache: { cacheLocation: 'localStorage' },
      });
      await this._msal.initialize();
      const res = await this._msal.handleRedirectPromise();
      const acc = (res && res.account) || this._msal.getAllAccounts()[0];
      if (!acc) { this._needsLogin = true; return; }
      this._msal.setActiveAccount(acc);
    },
    login() { return this._msal.loginRedirect({ scopes: [this._scope] }); },
    logout() { if (this._msal) return this._msal.logoutRedirect(); sessionStorage.removeItem('pkp_dev_user'); location.reload(); },
    async _headers() {
      const h = { 'Content-Type': 'application/json' };
      if (this.authEnabled) {
        try { h.Authorization = 'Bearer ' + (await this._msal.acquireTokenSilent({ scopes: [this._scope] })).accessToken; }
        catch (e) { await this._msal.acquireTokenRedirect({ scopes: [this._scope] }); throw e; }
      } else h['X-Dev-User'] = this._devUser;
      return h;
    },
    async api(path, opts) {
      opts = opts || {};
      const r = await fetch('api/' + path, Object.assign({}, opts, { headers: Object.assign(await this._headers(), opts.headers || {}), cache: 'no-store' }));
      if (r.status === 401 || r.status === 403) { const t = await r.json().catch(() => ({})); throw Object.assign(new Error(t.detail || 'Keine Berechtigung'), { status: r.status }); }
      return r;
    },

    // ---------- Stand laden ----------
    async reload(initial) {
      const r = await this.api('state'); const d = await r.json();
      this.me = d.me; this.rev = d.rev; this._empty = d.empty; this._docs = d.docs;
      this.snap = {}; this.meta = {};
      for (const col of ARR.concat(SINGLE)) {
        this.snap[col] = new Map(); this.meta[col] = {};
        for (const x of d.docs[col] || []) { this.snap[col].set(x.id, JSON.stringify(x.data)); this.meta[col][x.id] = { version: x.version, createdBy: x.createdBy, createdAt: x.createdAt, updatedBy: x.updatedBy, updatedAt: x.updatedAt }; }
      }
      if (!initial) this._emit('resync', {});
    },
    buildState() {
      const d = this._docs || {}; const one = col => ((d[col] || [])[0] || {}).data;
      return {
        version: 1, seq: 1, config: one('config') || JSON.parse(JSON.stringify(window.SAMEDI_CONFIG)),
        patients: (d.patients || []).map(x => x.data), appts: (d.appts || []).map(x => x.data), resStatus: (d.resStatus || []).map(x => x.data),
        recalls: (d.recalls || []).map(x => x.data), recallTemplates: one('recallTemplates') || [], todos: one('todos') || { lists: [] }, views: one('views') || [],
      };
    },

    // ---------- Speichern: nur Geändertes, mit Basis-Version ----------
    diff(state) {
      const ops = [];
      for (const col of ARR) {
        const cur = new Map((state[col] || []).map(x => [idOf(col, x), x])), sn = this.snap[col];
        for (const [id, x] of cur) { const j = JSON.stringify(x); if (sn.get(id) !== j) { ops.push({ op: 'put', col, id, data: x, baseVersion: (this.meta[col][id] || {}).version || 0 }); sn.set(id, j); } }
        for (const id of [...sn.keys()]) if (!cur.has(id)) { ops.push({ op: 'del', col, id, baseVersion: (this.meta[col][id] || {}).version || 0 }); sn.delete(id); }
      }
      for (const col of SINGLE) {
        const j = JSON.stringify(state[col]);
        if (this.snap[col].get('_') !== j) { ops.push({ op: 'put', col, id: '_', data: state[col], baseVersion: (this.meta[col]._ || {}).version || 0 }); this.snap[col].set('_', j); }
      }
      return ops;
    },
    push(state) {
      const ops = this.diff(state);
      if (!ops.length) return this._chain;
      this._setStatus('speichert');
      this._chain = this._chain.then(() => this._send(ops)).catch(e => { console.error(e); this._setStatus('fehler'); this._emit('message', 'Speichern fehlgeschlagen: ' + e.message + ' – Stand wird neu geladen.'); return this._resync(); });
      return this._chain;
    },
    async _send(ops) {
      const r = await this.api('ops', { method: 'POST', body: JSON.stringify({ ops, client: this.clientId }) });
      if (r.status === 409) {
        const d = await r.json();
        this._emit('message', this._conflictText(d.conflicts || []));
        return this._resync();
      }
      if (!r.ok) throw new Error('Server ' + r.status);
      const d = await r.json();
      for (const x of d.results || []) { if (x.version) this.meta[x.col][x.id] = Object.assign(this.meta[x.col][x.id] || {}, { version: x.version, updatedBy: this.me.email, updatedAt: new Date().toISOString() }); else delete this.meta[x.col][x.id]; }
      if (d.rev > this.rev) this.rev = d.rev;
      this._setStatus('ok');
    },
    _conflictText(cs) {
      const c = cs[0] || {}; const who = c.by ? ' (' + String(c.by).split('@')[0] + ')' : '';
      if (c.reason === 'slot_taken') return 'Dieser Termin ist gerade an einem anderen Rechner vergeben worden' + who + '. Nicht gespeichert – bitte anderen Termin wählen.';
      if (c.reason === 'changed') return 'Das wurde gerade an einem anderen Rechner geändert' + who + '. Nicht gespeichert – aktueller Stand ist geladen.';
      if (c.reason === 'deleted') return 'Das wurde inzwischen an einem anderen Rechner gelöscht. Nicht gespeichert.';
      return 'Nicht gespeichert (Konflikt mit einem anderen Rechner).';
    },
    async _resync() { await this.reload(false); this._setStatus('ok'); },
    async uploadAll(state) {
      const docs = {};
      for (const col of ARR) docs[col] = (state[col] || []).map(x => ({ id: idOf(col, x), data: x }));
      for (const col of SINGLE) docs[col] = [{ id: '_', data: state[col] }];
      this._uploading = this.api('reset', { method: 'POST', body: JSON.stringify({ docs, force: true }) }).then(r => { if (!r.ok) return r.json().then(j => { throw new Error(j.detail || 'Zurücksetzen abgelehnt'); }); return this.reload(false); });
      return this._uploading;
    },

    // ---------- Live-Kanal: Änderungen anderer Rechner ----------
    async _listen() {
      let delay = 1000;
      for (;;) {
        try {
          const r = await this.api('events?since=' + this.rev + '&client=' + this.clientId);
          this._setStatus('ok'); delay = 1000;
          const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
          for (;;) {
            const { value, done } = await rd.read(); if (done) break;
            buf += dec.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf('\n\n')) >= 0) { const chunk = buf.slice(0, i); buf = buf.slice(i + 2); this._onEvent(chunk); }
          }
        } catch (e) { if (e.status === 401 || e.status === 403) { this._emit('message', e.message); return; } }
        this._setStatus('offline');
        await new Promise(res => setTimeout(res, delay)); delay = Math.min(delay * 2, 15000);
      }
    },
    _onEvent(chunk) {
      let ev = 'message', data = '';
      for (const line of chunk.split('\n')) { if (line.startsWith('event:')) ev = line.slice(6).trim(); else if (line.startsWith('data:')) data += line.slice(5).trim(); }
      if (!data) return;
      const d = JSON.parse(data);
      if (ev === 'presence' || ev === 'hello') { if (d.online) { this.presence = d; this._emit('presence', d); } return; }
      if (ev === 'resync') { this._chain = this._chain.then(() => this._resync()); return; }
      if (ev !== 'ops') return;
      if (d.rev <= this.rev && d.client === this.clientId) return;
      this._chain = this._chain.then(() => this._applyRemote(d));
    },
    _applyRemote(d) {
      const st = window.PKP.S.state; const mine = d.client === this.clientId;
      for (const o of d.ops) {
        const col = o.col;
        if (!mine) {
          if (ARR.includes(col)) {
            const arr = st[col]; const idx = arr.findIndex(x => idOf(col, x) === o.id);
            if (o.op === 'del') { if (idx >= 0) arr.splice(idx, 1); this.snap[col].delete(o.id); }
            else { if (idx >= 0) arr[idx] = o.data; else arr.push(o.data); this.snap[col].set(o.id, JSON.stringify(o.data)); }
          } else if (o.op === 'put') { st[col] = o.data; this.snap[col].set('_', JSON.stringify(o.data)); }
        }
        if (o.op === 'del') delete this.meta[col][o.id];
        else this.meta[col][o.id] = { version: o.version, createdBy: o.createdBy, createdAt: o.createdAt, updatedBy: o.updatedBy, updatedAt: o.updatedAt };
      }
      if (d.rev > this.rev) this.rev = d.rev;
      if (!mine) { window.PKP.reindex(); this._emit('remote', d); }
    },
    _setStatus(s) { if (this.status !== s) { this.status = s; this._emit('status', s); } },
  };
  window.PKPSync = Sync;
})();
