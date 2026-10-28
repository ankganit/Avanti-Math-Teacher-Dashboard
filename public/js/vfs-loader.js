(function() {
  'use strict';
  let vfsPromise = null;
  const VFS_CACHE = {};

  function unpackTable(t) {
    if (!t || !t.keys || !t.cols) return [];
    const keys = t.keys, dicts = t.dicts || {}, cols = t.cols, n = t.n || 0;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      const row = {};
      for (let j = 0; j < keys.length; j++) {
        const k = keys[j];
        const v = cols[k][i];
        if (dicts[k]) {
          if (v !== -1 && v != null) row[k] = dicts[k][v];
        } else if (v !== null && v !== undefined) {
          row[k] = v;
        }
      }
      out[i] = row;
    }
    return out;
  }

  async function initVfs() {
    if (vfsPromise) return vfsPromise;
    vfsPromise = (async () => {
      const el = document.getElementById('avanti-vfs-gz');
      const b64 = window.__AVANTI_VFS_GZ || (el ? el.textContent.trim() : '');
      if (!b64) throw new Error('Missing VFS bundle');
      const binStr = atob(b64);
      const len = binStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
      const ds = new DecompressionStream('gzip');
      const stream = new Blob([bytes]).stream().pipeThrough(ds);
      const bundle = await new Response(stream).json();
      VFS_CACHE['qb/data/pyq.json'] = unpackTable(bundle.pyq);
      VFS_CACHE['qb/data/nonpyq.json'] = unpackTable(bundle.nonpyq);
      VFS_CACHE['qb/data/topics.json'] = bundle.topics;
      VFS_CACHE['qb/data/chapters.json'] = bundle.chapters;
      VFS_CACHE['bank-meta.json'] = bundle['bank-meta'];
      VFS_CACHE['must.json'] = bundle.must;
      VFS_CACHE['syllabus.json'] = bundle.syllabus;
      VFS_CACHE['handouts/index.json'] = bundle.handouts;
      VFS_CACHE['qb/qb.html'] = bundle.qb_html;
      VFS_CACHE['qb/qb-all.js'] = bundle.qb_js;
      VFS_CACHE['katex.css'] = '';
      return VFS_CACHE;
    })();
    return vfsPromise;
  }

  window.__vfsJson = async function(path) {
    const vfs = await initVfs();
    if (path in vfs) return vfs[path];
    throw new Error('VFS file not found: ' + path);
  };

  window.vfsFetch = async function(url) {
    const cleanUrl = String(url).replace(/^\.\//, '');
    if (cleanUrl === 'img/avanti-logo.png') {
      const bin = atob(window.QB_LOGO_B64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const blob = new Blob([u8], { type: 'image/png' });
      return new Response(blob, { status: 200, headers: { 'Content-Type': 'image/png' } });
    }
    // Prefer standalone editable files in public/qb/ when available
    if (cleanUrl === 'qb/qb.html' || cleanUrl === 'qb/qb-all.js') {
      try {
        const res = await window.fetch('./' + cleanUrl);
        if (res && res.ok) return res;
      } catch (e) {}
    }
    const vfs = await initVfs();
    if (cleanUrl in vfs) {
      const val = vfs[cleanUrl];
      if (typeof val === 'string') {
        return {
          ok: true,
          status: 200,
          text: async () => val,
          json: async () => JSON.parse(val),
          blob: async () => new Blob([val], { type: 'text/plain' })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => val,
        text: async () => JSON.stringify(val),
        blob: async () => new Blob([JSON.stringify(val)], { type: 'application/json' })
      };
    }
    return window.fetch(url);
  };

  const browserDb = {
    collection: function(colName) {
      const prefix = 'avanti_db_' + colName + '_';
      return {
        get: async function() {
          const docs = [];
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith(prefix)) {
                const id = k.slice(prefix.length);
                const val = JSON.parse(localStorage.getItem(k));
                docs.push({ id, exists: true, data: () => val });
              }
            }
          } catch (e) {}
          return { docs };
        },
        doc: function(docId) {
          const key = prefix + String(docId);
          return {
            get: async function() {
              try {
                const raw = localStorage.getItem(key);
                if (raw != null) {
                  const parsed = JSON.parse(raw);
                  return { exists: true, data: () => parsed };
                }
              } catch (e) {}
              return { exists: false, data: () => null };
            },
            set: async function(val) {
              try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
              return true;
            },
            delete: async function() {
              try { localStorage.removeItem(key); } catch (e) {}
              return true;
            }
          };
        }
      };
    }
  };

  if (!window.claude) window.claude = {};
  const origUse = window.claude.use ? window.claude.use.bind(window.claude) : null;
  window.claude.use = async function(cap) {
    if (origUse) {
      try {
        const res = await origUse(cap);
        if (res) return res;
      } catch (e) {}
    }
    if (cap === 'downloads') return window.__browserDownloads;
    if (cap === 'db') return browserDb;
    if (cap === 'user') return { name: 'Teacher', role: 'teacher' };
    return null;
  };

  function bootApp() {
    const data = {};
    ['pyq', 'nonpyq', 'topics', 'chapters'].forEach(n => {
      data[n] = window.vfsFetch('qb/data/' + n + '.json').then(r => r.json());
    });
    window.__qbPre = {
      html: window.vfsFetch('qb/qb.html').then(r => r.text()),
      js: window.vfsFetch('qb/qb-all.js').then(r => r.text()),
      data
    };
    window.AvantiTeacher.start({
      user: { name: 'Teacher', role: 'teacher' }
    });
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootApp);
  } else {
    bootApp();
  }
})();
