/* Avanti Fellows · LaTeX -> Office equations (OMML) and plain linear text.
   Used by the Word and PowerPoint export so the questions stay editable. */
(function (root) {
'use strict';
const GREEK = { alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ', rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω' };
const SYM = { cdot: '⋅', times: '×', pm: '±', mp: '∓', le: '≤', leq: '≤', leqslant: '⩽', ge: '≥', geq: '≥', geqslant: '⩾', ne: '≠', neq: '≠', lt: '<', gt: '>', approx: '≈', equiv: '≡', sim: '∼', simeq: '≃', cong: '≅', infty: '∞', to: '→', rightarrow: '→', leftarrow: '←', longrightarrow: '⟶', longleftarrow: '⟵', Rightarrow: '⇒', Leftarrow: '⇐', Longrightarrow: '⟹', Longleftarrow: '⟸', Leftrightarrow: '⇔', leftrightarrow: '↔', Longleftrightarrow: '⟺', implies: '⇒', impliedby: '⇐', iff: '⇔', uparrow: '↑', downarrow: '↓', mapsto: '↦', longmapsto: '⟼', in: '∈', ni: '∋', notin: '∉', subset: '⊂', subseteq: '⊆', nsubset: '⊄', nsubseteq: '⊈', supset: '⊃', supseteq: '⊇', nsupset: '⊅', nsupseteq: '⊉', cup: '∪', cap: '∩', forall: '∀', exists: '∃', nexists: '∄', ldots: '…', dots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱', circ: '∘', degree: '°', triangle: '△', bigtriangleup: '△', bigtriangledown: '▽', vartriangle: '△', blacktriangle: '▲', angle: '∠', measuredangle: '∡', sphericalangle: '∢', mid: '∣', nmid: '∤', vert: '|', Vert: '‖', lbrack: '[', rbrack: ']', partial: '∂', nabla: '∇', ell: 'ℓ', perp: '⊥', bot: '⊥', top: '⊤', parallel: '∥', nparallel: '∦', propto: '∝', emptyset: '∅', varnothing: '∅', complement: '∁', therefore: '∴', because: '∵', langle: '⟨', rangle: '⟩', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉', prime: '′', backprime: '‵', setminus: '∖', backslash: '∖', div: '÷', ast: '∗', star: '⋆', oplus: '⊕', ominus: '⊖', otimes: '⊗', oslash: '⊘', odot: '⊙', circledast: '⊛', circledcirc: '⊚', lbrace: '{', rbrace: '}', aleph: 'ℵ', hbar: 'ℏ', Re: 'ℜ', Im: 'ℑ', wp: '℘', neg: '¬', lnot: '¬', land: '∧', lor: '∨', wedge: '∧', vee: '∨', bullet: '•', square: '□', Box: '□', diamond: '⋄', Diamond: '◇', checkmark: '✓', dagger: '†', ddagger: '‡', '|': '‖', '{': '{', '}': '}', '%': '%', '$': '$', '&': '&', '#': '#', '_': '_', '\\': ' ' };
const NOT_MAP = { '=': '≠', '<': '≮', '>': '≯', lt: '≮', gt: '≯', in: '∉', equiv: '≢', subset: '⊄', subseteq: '⊈', supset: '⊅', supseteq: '⊉', sim: '≁', simeq: '≄', cong: '≇', approx: '≉', parallel: '∦', mid: '∤', vert: '∤', le: '≰', leq: '≰', leqslant: '≰', ge: '≱', geq: '≱', geqslant: '≱', Rightarrow: '⇏', implies: '⇏', Leftarrow: '⇍', Leftrightarrow: '⇎', iff: '⇎', exists: '∄' };
const FN = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'exp', 'arg', 'det', 'gcd', 'lcm', 'lim', 'limsup', 'liminf', 'max', 'min', 'inf', 'sup', 'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch', 'arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc', 'deg', 'dim', 'ker', 'hom', 'mod', 'Pr', 'cosec', 'adj', 'tr', 'rank', 'sgn', 'Re', 'Im'];
const FN_LIM = { lim: 1, limsup: 1, liminf: 1, max: 1, min: 1, inf: 1, sup: 1 };
const BB = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ', P: 'ℙ', H: 'ℍ', E: '𝔼', F: '𝔽', I: '𝕀', K: '𝕂' };
const SPACES = { ',': ' ', ';': ' ', ':': ' ', ' ': ' ', quad: ' ', qquad: '  ', '>': ' ', space: ' ', thinspace: ' ', medspace: ' ', thickspace: ' ', ensip: ' ', enspace: ' ' };
const ACC = { hat: '̂', widehat: '̂', vec: '⃗', tilde: '̃', widetilde: '̃', dot: '̇', ddot: '̈', check: '̌', acute: '́', grave: '̀', breve: '̆', overrightarrow: '⃗', overleftarrow: '⃖', bar: '̄', mathring: '̊' };
const TEXTY = { text: 'nor', mbox: 'nor', textrm: 'nor', textit: 'nor', textbf: 'nor', textsf: 'nor', texttt: 'nor', mathrm: 'p', operatorname: 'p', mathit: 'i', mathbf: 'b', boldsymbol: 'b', bm: 'b', mathsf: 'p', mathtt: 'p', mathcal: 'scr', mathscr: 'scr', mathbb: 'bb', mathfrak: 'p', rm: 'p', bf: 'b', it: 'i', cal: 'scr' };
const ENV_DELIM = { pmatrix: ['(', ')'], bmatrix: ['[', ']'], Bmatrix: ['{', '}'], vmatrix: ['|', '|'], Vmatrix: ['‖', '‖'], cases: ['{', ''], dcases: ['{', ''] };
const UNKNOWN = {};
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- tokenizer ---------- */
function tokenize(src) {
  const t = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+)\s*/.exec(src.slice(i));
      if (m) { t.push({ k: 'cmd', v: m[1], p: i, e: i + m[0].length }); i += m[0].length; }
      else if (src[i + 1] === '\\') { t.push({ k: 'row', p: i, e: i + 2 }); i += 2; }
      else { t.push({ k: 'cmd', v: src[i + 1] || '', p: i, e: i + 2 }); i += 2; }
    } else if (c === '{' || c === '}' || c === '^' || c === '_' || c === '&') { t.push({ k: c, p: i, e: i + 1 }); i++; }
    else if (/\s/.test(c)) { t.push({ k: 'sp', p: i, e: i + 1 }); i++; }
    else { t.push({ k: 'ch', v: c, p: i, e: i + 1 }); i++; }
  }
  return t;
}

/* ---------- parser: LaTeX -> tree ---------- */
function parse(src) {
  const T = tokenize(src); let i = 0;
  const peek = () => { while (i < T.length && T[i].k === 'sp') i++; return T[i]; };
  const next = () => { const t = peek(); if (t) i++; return t; };
  const isStop = t => !t || t.k === '}' || t.k === '&' || t.k === 'row' || (t.k === 'cmd' && (t.v === 'right' || t.v === 'end' || t.v === 'middle'));
  function seq() {
    const out = [];
    for (;;) {
      const t = peek(); if (isStop(t)) break;
      let a = atom(); if (!a) continue;
      for (;;) {
        const s = peek();
        if (s && s.k === 'cmd' && (s.v === 'limits' || s.v === 'nolimits')) { i++; continue; }
        if (s && s.k === '^') { i++; const x = arg(); a = script(a, null, x); }
        else if (s && s.k === '_') { i++; const x = arg(); a = script(a, x, null); }
        else if (s && s.k === 'ch' && s.v === "'") { i++; a = script(a, null, [run('′')]); }
        else break;
      }
      out.push(a);
    }
    return naryWrap(merge(pairBars(out)));
  }
  function script(base, sub, sup) {
    if (base.k === 'script') { base = Object.assign({}, base); if (sub) base.sub = sub; if (sup) base.sup = sup; return base; }
    return { k: 'script', e: [base], sub, sup };
  }
  function arg() {
    const t = peek(); if (!t) return [];
    if (t.k === '{') { i++; const s = seq(); if (peek() && peek().k === '}') i++; return s; }
    const a = atom(); return a ? [a] : [];
  }
  function rawGroup() {
    const t = peek(); if (!t) return '';
    if (t.k !== '{') { i++; return t.v || ''; }
    let depth = 0, j = i;
    for (; j < T.length; j++) { if (T[j].k === '{') depth++; else if (T[j].k === '}') { depth--; if (!depth) break; } }
    const s = src.slice(T[i].e, T[j] ? T[j].p : src.length); i = j + 1; return s;
  }
  function delimTok() {
    const t = next(); if (!t) return '';
    if (t.k === 'ch') return t.v === '.' ? '' : t.v;
    if (t.k === 'cmd') return t.v === '|' || t.v === 'Vert' ? '‖' : t.v === 'vert' ? '|' : (SYM[t.v] || t.v);
    return '';
  }
  function matrixRows(end) {
    const rows = []; let row = [], cell = [];
    for (;;) {
      const t = peek();
      if (!t) break;
      if (t.k === 'cmd' && t.v === 'end') { i++; rawGroup(); break; }
      if (t.k === '&') { i++; row.push(cell); cell = []; continue; }
      if (t.k === 'row') { i++; row.push(cell); rows.push(row); row = []; cell = []; continue; }
      if (t.k === '}') { i++; continue; }
      if (t.k === 'cmd' && (t.v === 'hline' || t.v === 'cline')) { i++; if (t.v === 'cline') rawGroup(); continue; }
      cell = cell.concat(seq());
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.length));
  }
  function atom() {
    const t = next(); if (!t) return null;
    if (t.k === '{') { i--; const g = arg(); return { k: 'grp', e: g }; }
    if (t.k === 'ch') return run(t.v, /[A-Za-z]/.test(t.v) ? null : (/\d/.test(t.v) ? null : 'p'));
    if (t.k === '^' || t.k === '_') { return null; }
    if (t.k === '&' || t.k === 'row') return run(' ', 'nor');
    if (t.k !== 'cmd') return null;
    const v = t.v;
    if (v === 'def') { next(); rawGroup(); return null; }
    if (v === 'arraystretch') { rawGroup(); return null; }
    if (v === 'not') {
      const nx = peek();
      if (nx && (nx.k === 'ch' || nx.k === 'cmd') && NOT_MAP[nx.v]) { next(); return run(NOT_MAP[nx.v], 'p'); }
      return run('¬', 'p');
    }
    if (v === 'overset') {
      const top = arg(), base = arg(), topTxt = lin(top).trim();
      if (/^(→|⟶|⃗|\\rightarrow|\\to|\\vec|\\overrightarrow)$/.test(topTxt)) return { k: 'acc', chr: '⃗', e: base };
      if (/^(←|⟵|⃖|\\leftarrow|\\overleftarrow)$/.test(topTxt)) return { k: 'acc', chr: '⃖', e: base };
      if (/^(̂|\^|\\hat|\\widehat)$/.test(topTxt)) return { k: 'acc', chr: '̂', e: base };
      if (/^(̃|~|\\tilde|\\widetilde)$/.test(topTxt)) return { k: 'acc', chr: '̃', e: base };
      if (/^(̄|-|¯|\\bar|\\overline)$/.test(topTxt)) return { k: 'bar', e: base };
      return { k: 'limUpp', e: base, lim: top };
    }
    if (v === 'underset') {
      const bot = arg(), base = arg();
      return { k: 'limLow', e: base, lim: bot };
    }
    if (v === 'substack') {
      const g = rawGroup();
      const rows = g.split(/\\\\/).map(r => [parse(r.trim())]).filter(r => r[0].length);
      return rows.length > 1 ? { k: 'mat', rows, left: false } : { k: 'grp', e: rows[0] ? rows[0][0] : [] };
    }
    if (v === 'frac' || v === 'dfrac' || v === 'tfrac' || v === 'cfrac') { const n = arg(), d = arg(); return { k: 'frac', n, d }; }
    if (v === 'binom' || v === 'dbinom' || v === 'tbinom') { const n = arg(), d = arg(); return { k: 'delim', beg: '(', end: ')', e: [{ k: 'frac', n, d, noBar: true }] }; }
    if (v === 'sqrt') { let deg = null; const p = peek(); if (p && p.k === 'ch' && p.v === '[') { i++; const s = []; while (peek() && !(peek().k === 'ch' && peek().v === ']')) { const a = atom(); if (a) s.push(a); else break; } i++; deg = s; } return { k: 'rad', deg, e: arg() }; }
    if (v === 'left') { const beg = delimTok(); const body = seq(); let end = ''; const p = peek(); if (p && p.k === 'cmd' && p.v === 'right') { i++; end = delimTok(); } return { k: 'delim', beg, end, e: body }; }
    if (v === 'middle') { return run(delimTok(), 'p'); }
    if (/^(big|Big|bigg|Bigg|bigl|bigr|Bigl|Bigr|biggl|biggr|Biggl|Biggr|bigm|Bigm|biggm|Biggm)$/.test(v)) { const d = delimTok(); return d ? run(d, 'p') : null; }
    if (ACC[v]) { const e = arg(); return { k: 'acc', chr: ACC[v], e }; }
    if (v === 'overline') return { k: 'bar', e: arg() };
    if (v === 'underline') return { k: 'bar', e: arg(), pos: 'bot' };
    if (v === 'underbrace' || v === 'overbrace' || v === 'boxed') return { k: 'grp', e: arg() };
    if (TEXTY[v]) {
      const sty = TEXTY[v];
      if (sty === 'nor' || v === 'operatorname' || v === 'mathrm') {
        const raw = rawGroup();
        if (sty === 'nor' && raw.indexOf('$') >= 0) {
          const segs = raw.split(/\$([^$]+)\$/), kids = [];
          segs.forEach((seg, idx) => { if (!seg) return; if (idx % 2 === 0) kids.push(run(seg, 'nor')); else kids.push(...parse(seg)); });
          return { k: 'grp', e: kids };
        }
        return run(raw, sty === 'nor' ? 'nor' : 'p', v === 'operatorname');
      }
      if (sty === 'bb') { const s = rawGroup(); return run(s.split('').map(ch => BB[ch] || ch).join(''), 'p'); }
      const s = rawGroup(); return run(s, sty);
    }
    if (FN.includes(v)) return Object.assign(run(v === 'cosec' ? 'cosec' : v, 'p'), { fn: true, lim: !!FN_LIM[v] });
    if (v === 'int' || v === 'oint' || v === 'iint' || v === 'iiint') return run({ int: '∫', oint: '∮', iint: '∬', iiint: '∭' }[v], 'p');
    if (v === 'sum' || v === 'prod' || v === 'bigcup' || v === 'bigcap') return Object.assign(run({ sum: '∑', prod: '∏', bigcup: '⋃', bigcap: '⋂' }[v], 'p'), { big: true });
    if (GREEK[v]) return run(GREEK[v], /^[A-Z]/.test(v) ? 'p' : null);
    if (SPACES[v] !== undefined) return run(SPACES[v], 'nor');
    if (v === '!') return null;
    if (v === 'displaystyle' || v === 'textstyle' || v === 'scriptstyle' || v === 'scriptscriptstyle' || v === 'limits' || v === 'nolimits' || v === 'hline' || v === 'mathop' || v === 'mathrel' || v === 'mathbin' || v === 'mathord' || v === 'relax' || v === 'strut') return null;
    if (v === 'begin') {
      const name = rawGroup().trim();
      if (name === 'array' || name === 'tabular') rawGroup();
      const rows = matrixRows(name), d = ENV_DELIM[name];
      const m = { k: 'mat', rows, left: name === 'cases' || name === 'dcases' };
      return d ? { k: 'delim', beg: d[0], end: d[1], e: [m] } : m;
    }
    if (SYM[v] !== undefined) return run(SYM[v], 'p');
    UNKNOWN[v] = (UNKNOWN[v] || 0) + 1;
    return run(v, 'nor');
  }
  const out = seq();
  while (i < T.length) { i++; }
  return out;
}
const INTS = { '∫': 1, '∮': 1, '∬': 1, '∭': 1 };
const isIntNode = n => (n.k === 'r' && (INTS[n.s] || n.big) && !n.fn) || (n.k === 'script' && n.e[0].k === 'r' && (INTS[n.e[0].s] || n.e[0].big));
const isLimNode = n => (n.k === 'script' && n.e[0].k === 'r' && n.e[0].lim);
const stopsOperand = n => n.k === 'r' && ((/^[=≤⩽≥⩾≠≈≡⇒⇔→<>,;]/.test(n.s)) || (n.sty === 'nor' && /[A-Za-z]{2,}/.test(n.s)));
function naryWrap(nodes) {
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (isIntNode(n)) {
      let j = i + 1; while (j < nodes.length && !stopsOperand(nodes[j])) j++;
      const base = n.k === 'script' ? n.e[0] : n;
      const op = naryWrap(nodes.slice(i + 1, j));
      if (op.length) {
        out.push({ k: 'nary', chr: base.s, undOvr: !!base.big, sub: n.k === 'script' ? n.sub : null, sup: n.k === 'script' ? n.sup : null, e: op });
        i = j - 1;
      } else out.push(n);
    } else if (isLimNode(n)) {
      let j = i + 1; while (j < nodes.length && !stopsOperand(nodes[j])) j++;
      const op = naryWrap(nodes.slice(i + 1, j));
      if (op.length) {
        out.push({ k: 'func', fn: n, e: op });
        i = j - 1;
      } else out.push(n);
    } else out.push(n);
  }
  return out;
}
function pairBars(a) {
  const out = []; let open = -1;
  a.forEach(n => {
    const bar = n.k === 'r' && n.s === '|' && !n.fn, barS = n.k === 'script' && n.e[0].k === 'r' && n.e[0].s === '|';
    if (bar && open < 0) { open = out.length; out.push(n); }
    else if ((bar || barS) && open >= 0) { const inner = out.splice(open + 1); out.pop(); const d = { k: 'delim', beg: '|', end: '|', e: merge(inner) }; out.push(barS ? Object.assign({}, n, { e: [d] }) : d); open = -1; }
    else out.push(n);
  });
  return out;
}
function run(s, sty, fn) { return { k: 'r', s, sty: sty || null, fn: !!fn }; }
function merge(a) {
  const out = [];
  a.forEach(n => {
    const l = out[out.length - 1];
    if (n && n.k === 'r' && l && l.k === 'r' && l.sty === n.sty && !l.fn && !n.fn && !l.big && !n.big) l.s += n.s;
    else if (n) out.push(Object.assign({}, n));
  });
  return out;
}

/* ---------- OMML ---------- */
function rpr(fl, sty) {
  if (fl && fl.indexOf('pptx') === 0) return '<a:rPr lang="en-US"' + (fl.indexOf('@') > 0 ? ' sz="' + fl.split('@')[1] + '"' : '') + ' i="' + (sty ? '0' : '1') + '"><a:latin typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/><a:ea typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/></a:rPr>';
  return '';
}
function mrun(s, sty, fl) {
  if (s === '') return '';
  const p = sty ? '<m:rPr>' + (sty === 'nor' ? '<m:nor/>' : sty === 'scr' ? '<m:scr m:val="script"/>' : sty === 'bb' ? '' : '<m:sty m:val="' + sty + '"/>') + '</m:rPr>' : '';
  const wp = fl === 'docx' ? (sty === 'nor' ? '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/></w:rPr>' : '<w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math" w:cs="Cambria Math"/></w:rPr>') : rpr(fl, sty);
  return '<m:r>' + p + wp + '<m:t xml:space="preserve">' + esc(s) + '</m:t></m:r>';
}
function body(nodes, fl) { const s = nodes.map(n => nd(n, fl)).join(''); return s || mrun(' ', 'nor', fl); }
function nd(n, fl) {
  switch (n.k) {
    case 'r': return mrun(n.s, n.sty, fl);
    case 'grp': return body(n.e, fl);
    case 'frac': return '<m:f>' + (n.noBar ? '<m:fPr><m:type m:val="noBar"/></m:fPr>' : '') + '<m:num>' + body(n.n, fl) + '</m:num><m:den>' + body(n.d, fl) + '</m:den></m:f>';
    case 'rad': return '<m:rad><m:radPr>' + (n.deg ? '' : '<m:degHide m:val="1"/>') + '</m:radPr><m:deg>' + (n.deg ? body(n.deg, fl) : '') + '</m:deg><m:e>' + body(n.e, fl) + '</m:e></m:rad>';
    case 'delim': return '<m:d><m:dPr><m:begChr m:val="' + esc(n.beg) + '"/><m:endChr m:val="' + esc(n.end) + '"/></m:dPr><m:e>' + body(n.e, fl) + '</m:e></m:d>';
    case 'acc': return '<m:acc><m:accPr><m:chr m:val="' + n.chr + '"/></m:accPr><m:e>' + body(n.e, fl) + '</m:e></m:acc>';
    case 'bar': return '<m:bar><m:barPr><m:pos m:val="' + (n.pos || 'top') + '"/></m:barPr><m:e>' + body(n.e, fl) + '</m:e></m:bar>';
    case 'limUpp': return '<m:limUpp><m:e>' + body(n.e, fl) + '</m:e><m:lim>' + body(n.lim, fl) + '</m:lim></m:limUpp>';
    case 'limLow': return '<m:limLow><m:e>' + body(n.e, fl) + '</m:e><m:lim>' + body(n.lim, fl) + '</m:lim></m:limLow>';
    case 'func': return '<m:func><m:fName>' + nd(n.fn, fl) + '</m:fName><m:e>' + body(n.e, fl) + '</m:e></m:func>';
    case 'nary': return '<m:nary><m:naryPr><m:chr m:val="' + esc(n.chr) + '"/><m:limLoc m:val="' + (n.undOvr ? 'undOvr' : 'subSup') + '"/>' + (n.sub ? '' : '<m:subHide m:val="1"/>') + (n.sup ? '' : '<m:supHide m:val="1"/>') + ((fl || '').indexOf('pptx') === 0 ? '<m:ctrlPr>' + rpr(fl, 'p') + '</m:ctrlPr>' : '') + '</m:naryPr><m:sub>' + (n.sub ? body(n.sub, fl) : '') + '</m:sub><m:sup>' + (n.sup ? body(n.sup, fl) : '') + '</m:sup><m:e>' + body(n.e, fl) + '</m:e></m:nary>';
    case 'mat': {
      const w = Math.max(1, ...n.rows.map(r => r.length));
      const rows = n.rows.map(r => '<m:mr>' + Array.from({ length: w }, (_, j) => '<m:e>' + body(r[j] || [], fl) + '</m:e>').join('') + '</m:mr>').join('');
      return '<m:m><m:mPr><m:mcs><m:mc><m:mcPr><m:count m:val="' + w + '"/><m:mcJc m:val="' + (n.left ? 'left' : 'center') + '"/></m:mcPr></m:mc></m:mcs></m:mPr>' + rows + '</m:m>';
    }
    case 'script': {
      const b = n.e[0], base = body(n.e, fl), sub = n.sub && body(n.sub, fl), sup = n.sup && body(n.sup, fl);
      if (b && b.k === 'r' && (b.big || b.lim)) {
        let x = base;
        if (sub) x = '<m:limLow><m:e>' + x + '</m:e><m:lim>' + sub + '</m:lim></m:limLow>';
        if (sup) x = '<m:limUpp><m:e>' + x + '</m:e><m:lim>' + sup + '</m:lim></m:limUpp>';
        return x;
      }
      if (sub && sup) return '<m:sSubSup><m:e>' + base + '</m:e><m:sub>' + sub + '</m:sub><m:sup>' + sup + '</m:sup></m:sSubSup>';
      if (sub) return '<m:sSub><m:e>' + base + '</m:e><m:sub>' + sub + '</m:sub></m:sSub>';
      return '<m:sSup><m:e>' + base + '</m:e><m:sup>' + sup + '</m:sup></m:sSup>';
    }
  }
  return '';
}
/* flavor: 'docx' | 'pptx' | '' */
function omml(tex, display, fl) {
  const inner = body(parse(tex), fl || '');
  return display ? '<m:oMathPara><m:oMath>' + inner + '</m:oMath></m:oMathPara>' : '<m:oMath>' + inner + '</m:oMath>';
}

/* ---------- plain linear text (fallback, and for anything that can't hold equations) ---------- */
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ', x: 'ˣ', y: 'ʸ', a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', k: 'ᵏ', m: 'ᵐ', p: 'ᵖ', t: 'ᵗ', '′': '′', '∘': '°' };
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎', a: 'ₐ', e: 'ₑ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', n: 'ₙ', m: 'ₘ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', t: 'ₜ', x: 'ₓ' };
function uni(s, map) { let o = ''; for (const c of s) { if (!map[c]) return null; o += map[c]; } return o; }
function lin(nodes) {
  let o = '';
  nodes.forEach((n, idx) => {
    const l = (x) => lin(x);
    switch (n.k) {
      case 'r': o += n.s + (n.fn && idx < nodes.length - 1 && nodes[idx + 1].k !== 'delim' && nodes[idx + 1].k !== 'script' ? ' ' : ''); break;
      case 'grp': o += l(n.e); break;
      case 'frac': { const a = l(n.n), b = l(n.d), w = s => /^[\w.′]+$/.test(s) ? s : '(' + s + ')'; o += n.noBar ? '(' + a + ' over ' + b + ')' : w(a) + '/' + w(b); break; }
      case 'rad': o += (n.deg ? '(' + l(n.deg) + ')' : '') + '√(' + l(n.e) + ')'; break;
      case 'delim': o += n.beg + l(n.e) + n.end; break;
      case 'acc': { const e = l(n.e); o += e + n.chr; break; }
      case 'bar': o += l(n.e) + '̄'; break;
      case 'limUpp': o += l(n.e) + '^(' + l(n.lim) + ')'; break;
      case 'limLow': o += l(n.e) + '_(' + l(n.lim) + ')'; break;
      case 'mat': o += n.rows.map(r => r.map(c => l(c)).join(', ')).join(n.left ? '; ' : ' | '); break;
      case 'func': o += l([n.fn]) + ' ' + l(n.e); break;
      case 'nary': o += n.chr + (n.sub ? '_(' + l(n.sub) + ')' : '') + (n.sup ? '^(' + l(n.sup) + ')' : '') + ' ' + l(n.e); break;
      case 'script': {
        const b = l(n.e);
        const sub = n.sub ? l(n.sub) : '', sup = n.sup ? l(n.sup) : '';
        const f = (s, m, ch) => { const u = uni(s, m); return u !== null ? u : ch + '(' + s + ')'; };
        o += b + (sub ? f(sub, SUB, '_') : '') + (sup ? f(sup, SUP, '^') : '');
        break;
      }
    }
  });
  return o;
}
const toText = tex => lin(parse(tex));

/* rough width in em, used to decide how options are laid out */
function wd(nodes) {
  let w = 0;
  nodes.forEach(n => {
    switch (n.k) {
      case 'r': w += n.s.length * (n.sty === 'nor' ? 0.5 : 0.55); break;
      case 'grp': w += wd(n.e); break;
      case 'frac': w += Math.max(wd(n.n), wd(n.d)) + 0.3; break;
      case 'rad': w += wd(n.e) + 0.9 + (n.deg ? 0.4 : 0); break;
      case 'delim': w += wd(n.e) + 0.7; break;
      case 'acc': case 'bar': w += wd(n.e); break;
      case 'limUpp': case 'limLow': w += Math.max(wd(n.e), wd(n.lim) * 0.75); break;
      case 'mat': { const c = Math.max(1, ...n.rows.map(r => r.length)); let t = 0; for (let j = 0; j < c; j++) t += Math.max(0, ...n.rows.map(r => wd(r[j] || []))); w += t + 0.6 * (c - 1) + 0.8; break; }
      case 'func': w += wd([n.fn]) + 0.3 + wd(n.e); break;
      case 'nary': w += 1 + 0.5 * Math.max(n.sub ? wd(n.sub) : 0, n.sup ? wd(n.sup) : 0) + wd(n.e); break;
      case 'script': w += wd(n.e) + 0.7 * Math.max(n.sub ? wd(n.sub) : 0, n.sup ? wd(n.sup) : 0); break;
    }
  });
  return w;
}
const width = s => split(s).reduce((a, p) => a + (p.t === 'text' ? p.s.length * 0.5 : wd(parse(p.s))), 0);

/* split "text \( maths \) text \[ display \]" or "$...$" or "$$...$$" into parts */
function split(s) {
  const out = []; let i = 0, buf = '';
  s = String(s == null ? '' : s);
  while (i < s.length) {
    if (s[i] === '\\' && (s[i + 1] === '(' || s[i + 1] === '[')) {
      const close = s[i + 1] === '(' ? '\\)' : '\\]', j = s.indexOf(close, i + 2);
      if (j > 0) { if (buf) out.push({ t: 'text', s: buf }); buf = ''; out.push({ t: 'math', s: s.slice(i + 2, j).trim(), display: s[i + 1] === '[' }); i = j + 2; continue; }
    } else if (s[i] === '$' && s[i + 1] === '$') {
      const j = s.indexOf('$$', i + 2);
      if (j > 0) { if (buf) out.push({ t: 'text', s: buf }); buf = ''; out.push({ t: 'math', s: s.slice(i + 2, j).trim(), display: true }); i = j + 2; continue; }
    } else if (s[i] === '$') {
      const j = s.indexOf('$', i + 1);
      if (j > 0 && !/\n/.test(s.slice(i + 1, j))) {
        if (buf) out.push({ t: 'text', s: buf }); buf = ''; out.push({ t: 'math', s: s.slice(i + 1, j).trim(), display: false }); i = j + 1; continue;
      }
    }
    buf += s[i]; i++;
  }
  if (buf) out.push({ t: 'text', s: buf });
  return out;
}
/* a whole string as plain text with maths in linear form */
const plainText = s => split(s).map(p => p.t === 'text' ? p.s : toText(p.s)).join('');

root.MathDoc = { width, UNKNOWN, omml, toText, split, plainText, parse, esc };
if (typeof module !== 'undefined') module.exports = root.MathDoc;
})(typeof window !== 'undefined' ? window : globalThis);
