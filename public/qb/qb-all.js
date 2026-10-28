/* Runs the question bank's own code (written for a dashboard page) inside this page. */
(function () {
  var D = {}, calcs = [], fns = [];
  var mk = function (status, data) { data = data || []; return { status: status, data: data, columns: data[0] ? Object.keys(data[0]) : [], meta: [], message: '', refreshing: false }; };
  window.dash = {
    data: function (id) { return D[id] || mk('loading'); },
    calc: function (id, c) { calcs.push([id, c]); },
    onData: function (f) { fns.push(f); },
    colors: null, params: function () { return {}; }, setParams: function () {}, resetParams: function () {}, setLink: function () {}, refresh: function () {}, loader: function () {}
  };
  window.d3 = window.d3 || { format: function () { return function (n) { return Number(n).toLocaleString('en-US'); }; } };
  window.__qbStart = async function () {
    var names = ['pyq', 'nonpyq', 'topics', 'chapters'];
    var res = await Promise.all(names.map(function (n) { return (window.__qbPre && window.__qbPre.data && window.__qbPre.data[n]) || window.__vfsJson('qb/data/' + n + '.json'); }));
    names.forEach(function (n, i) { D[n] = mk('ok', res[i]); });
    calcs.forEach(function (c) { D[c[0]] = mk('ok', c[1].fn.apply(null, c[1].inputs.map(function (i) { return D[i].data; }))); });
    fns.forEach(function (f) { f(); });
  };
})();

;
/* temml, QB_TEMML_CSS, QB_PPT_TPL, QB_LOGO_B64 hoisted to top-level boot */
;
/* Exports for the PYQ bank: Word (.docx), PowerPoint (.pptx) with native equations, and PDF. */
(function () {
  var MATH_RE = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
  var LET = ['A', 'B', 'C', 'D', 'E', 'F'];

  function segments(s) {
    var out = [], last = 0, m;
    MATH_RE.lastIndex = 0;
    while ((m = MATH_RE.exec(s))) {
      if (m.index > last) out.push({ t: 'text', v: s.slice(last, m.index) });
      out.push({ t: 'math', v: m[1] != null ? m[1] : m[2], display: m[2] != null });
      last = MATH_RE.lastIndex;
    }
    if (last < s.length) out.push({ t: 'text', v: s.slice(last) });
    return out;
  }
  var FIG_RE = /\s*\{\{figure\}\}\s*/;
  function figLines(s) { return String(s).replace(FIG_RE, '\n{{figure}}\n').replace(/^\n+|\n+$/g, ''); }
  /* draw a question's SVG figure to PNG bytes (for Word / PowerPoint) */
  function svgPng(svg, w, h) {
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        try {
          var k = 3, c = document.createElement('canvas'); c.width = w * k; c.height = h * k;
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(function (b) { if (!b) return rej(new Error('figure')); b.arrayBuffer().then(function (a) { res(new Uint8Array(a)); }, rej); }, 'image/png');
        } catch (e) { rej(e); }
      };
      img.onerror = function () { rej(new Error('figure')); };
      setTimeout(function () { rej(new Error('figure timeout')); }, 8000);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  async function figuresFor(qs) {
    var m = {}, n = 0;
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      if (q.figure && q.figure.svg && !m[q.id]) {
        try { m[q.id] = { png: await svgPng(q.figure.svg, q.figure.w, q.figure.h), w: q.figure.w, h: q.figure.h, n: ++n }; } catch (e) { /* figure left out */ }
      }
    }
    return m;
  }
  var FIG = null;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* rough visible length of a LaTeX-bearing string */
  function vlen(s) {
    return String(s).replace(FIG_RE, ' ').replace(/\\[()\[\]]/g, '').replace(/\\(begin|end)\{[a-z*]*\}/g, '').replace(/\\(left|right|displaystyle|,|;|!|quad)/g, '')
      .replace(/\\frac/g, 'xxx').replace(/\\[a-zA-Z]+/g, 'xx').replace(/[{}^_\\]/g, '').length;
  }
  /* how many options fit on one line: 4, 2 or 1 */
  function optCols(opts) {
    if (!opts || !opts.length) return 0;
    if (opts.some(function (o) { return /\\\[|\n|\\begin\{(b|p|v|V)?matrix|\\begin\{array/.test(o); })) return 1;
    var m = Math.max.apply(null, opts.map(function (o) { return vlen(o) + 6 * ((String(o).match(/\\frac/g) || []).length); }));
    return m <= 20 ? 4 : m <= 48 ? 2 : 1;
  }

  /* ---------- MathML -> OMML ---------- */
  var NARY = '∫∬∭∮∯∰∑∏∐⋃⋂⋁⋀⨁⨂⨀';
  var LIMS = { lim: 1, max: 1, min: 1, sup: 1, inf: 1 };
  var ACC = { '→': '⃗', '⃗': '⃗', '^': '̂', 'ˆ': '̂', '~': '̃', '˜': '̃', '.': '̇', '˙': '̇', '¨': '̈', '¯': '̅', '‾': '̅', '―': '̅', 'ˇ': '̌', '´': '́', '`': '̀', '˘': '̆' };
  var MODE = 'w', PSZ = 2000; /* 'w' = Word, 'p' = PowerPoint (needs a:rPr in each run) */

  function kids(n) { var a = []; for (var i = 0; i < n.childNodes.length; i++) if (n.childNodes[i].nodeType === 1) a.push(n.childNodes[i]); return a; }
  function txt(n) { return (n.textContent || '').replace(/⁡|⁢|⁣/g, ''); }
  function mathItalic(t) {
    if (t.length !== 1) return t;
    var c = t.charCodeAt(0);
    if (t === 'h') return 'ℎ';
    if (c >= 97 && c <= 122) return String.fromCodePoint(0x1D44E + c - 97);
    if (c >= 65 && c <= 90) return String.fromCodePoint(0x1D434 + c - 65);
    return t;
  }
  function run(text, sty) {
    if (!text) return '';
    var rpr = sty === 'nor' ? '<m:rPr><m:nor/></m:rPr>' : sty ? '<m:rPr><m:sty m:val="' + sty + '"/></m:rPr>' : '';
    if (MODE === 'p') {
      var ital = !sty;
      if (ital) text = mathItalic(text);
      rpr += '<a:rPr lang="en-US" sz="' + PSZ + '" i="' + (ital ? 1 : 0) + '" dirty="0"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:latin typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/></a:rPr>';
    }
    return '<m:r>' + rpr + '<m:t xml:space="preserve">' + esc(text) + '</m:t></m:r>';
  }
  function all(list) { return list.map(conv).join(''); }
  function arg(n) { return n ? conv(n) : ''; }
  function isNaryBase(n) { var t = n ? txt(n).trim() : ''; return n && (n.localName === 'mo' || n.localName === 'mi') && t.length === 1 && NARY.indexOf(t) >= 0; }
  function nary(base, sub, sup, under) {
    var ch = txt(base).trim();
    var pr = '<m:naryPr><m:chr m:val="' + esc(ch) + '"/><m:limLoc m:val="' + (under && ch !== '∫' ? 'undOvr' : 'subSup') + '"/>' + (sub ? '' : '<m:subHide m:val="1"/>') + (sup ? '' : '<m:supHide m:val="1"/>') + '</m:naryPr>';
    return '<m:nary>' + pr + '<m:sub>' + arg(sub) + '</m:sub><m:sup>' + arg(sup) + '</m:sup><m:e></m:e></m:nary>';
  }
  function limLow(base, lim) { return '<m:func><m:fName><m:limLow><m:e>' + run(txt(base).trim(), 'p') + '</m:e><m:lim>' + arg(lim) + '</m:lim></m:limLow></m:fName><m:e></m:e></m:func>'; }
  function fenced(k) {
    if (k.length < 2) return null;
    var a = k[0], b = k[k.length - 1];
    if (a.localName === 'mo' && b.localName === 'mo' && a.getAttribute('fence') === 'true' && b.getAttribute('fence') === 'true')
      return '<m:d><m:dPr><m:begChr m:val="' + esc(txt(a)) + '"/><m:endChr m:val="' + esc(txt(b)) + '"/></m:dPr><m:e>' + all(k.slice(1, -1)) + '</m:e></m:d>';
    return null;
  }
  function conv(n) {
    var name = n.localName, k = kids(n), t;
    switch (name) {
      case 'math': case 'mrow': case 'mstyle': case 'mpadded': case 'semantics': case 'mtd': case 'merror':
        if (name === 'mrow') { var f = fenced(k); if (f) return f; }
        return all(k.filter(function (c) { return c.localName !== 'annotation' && c.localName !== 'annotation-xml'; }));
      case 'mphantom': case 'mspace': case 'annotation': case 'annotation-xml': return '';
      case 'mi': t = txt(n); if (!t) return ''; return run(t, t.length > 1 || n.getAttribute('mathvariant') === 'normal' ? 'p' : '');
      case 'mn': case 'mo': return run(txt(n), 'p');
      case 'mtext': case 'ms': return run(txt(n).replace(/ /g, ' '), 'nor');
      case 'mfrac':
        var nobar = /^0(\.0*)?(px|em|pt)?$/.test(n.getAttribute('linethickness') || '');
        return '<m:f>' + (nobar ? '<m:fPr><m:type m:val="noBar"/></m:fPr>' : '') + '<m:num>' + arg(k[0]) + '</m:num><m:den>' + arg(k[1]) + '</m:den></m:f>';
      case 'msqrt': return '<m:rad><m:radPr><m:degHide m:val="1"/></m:radPr><m:deg></m:deg><m:e>' + all(k) + '</m:e></m:rad>';
      case 'mroot': return '<m:rad><m:deg>' + arg(k[1]) + '</m:deg><m:e>' + arg(k[0]) + '</m:e></m:rad>';
      case 'msup':
        if (isNaryBase(k[0])) return nary(k[0], null, k[1]);
        return '<m:sSup><m:e>' + arg(k[0]) + '</m:e><m:sup>' + arg(k[1]) + '</m:sup></m:sSup>';
      case 'msub':
        if (isNaryBase(k[0])) return nary(k[0], k[1], null);
        if (k[0] && LIMS[txt(k[0]).trim()]) return limLow(k[0], k[1]);
        return '<m:sSub><m:e>' + arg(k[0]) + '</m:e><m:sub>' + arg(k[1]) + '</m:sub></m:sSub>';
      case 'msubsup':
        if (isNaryBase(k[0])) return nary(k[0], k[1], k[2]);
        return '<m:sSubSup><m:e>' + arg(k[0]) + '</m:e><m:sub>' + arg(k[1]) + '</m:sub><m:sup>' + arg(k[2]) + '</m:sup></m:sSubSup>';
      case 'munder':
        if (isNaryBase(k[0])) return nary(k[0], k[1], null, true);
        if (k[0] && LIMS[txt(k[0]).trim()]) return limLow(k[0], k[1]);
        if (k[1] && /^[_‾¯―]$/.test(txt(k[1]).trim())) return '<m:bar><m:barPr><m:pos m:val="bot"/></m:barPr><m:e>' + arg(k[0]) + '</m:e></m:bar>';
        return '<m:limLow><m:e>' + arg(k[0]) + '</m:e><m:lim>' + arg(k[1]) + '</m:lim></m:limLow>';
      case 'mover':
        if (isNaryBase(k[0])) return nary(k[0], null, k[1], true);
        var a = k[1] ? txt(k[1]).trim() : '';
        if (k[1] && k[1].localName === 'mo' && ACC[a]) {
          if (ACC[a] === '̅') return '<m:bar><m:barPr><m:pos m:val="top"/></m:barPr><m:e>' + arg(k[0]) + '</m:e></m:bar>';
          return '<m:acc><m:accPr><m:chr m:val="' + ACC[a] + '"/></m:accPr><m:e>' + arg(k[0]) + '</m:e></m:acc>';
        }
        return '<m:limUpp><m:e>' + arg(k[0]) + '</m:e><m:lim>' + arg(k[1]) + '</m:lim></m:limUpp>';
      case 'munderover':
        if (isNaryBase(k[0])) return nary(k[0], k[1], k[2], true);
        return '<m:limUpp><m:e><m:limLow><m:e>' + arg(k[0]) + '</m:e><m:lim>' + arg(k[1]) + '</m:lim></m:limLow></m:e><m:lim>' + arg(k[2]) + '</m:lim></m:limUpp>';
      case 'menclose':
        var note = n.getAttribute('notation') || '';
        if (/top/.test(note)) return '<m:bar><m:barPr><m:pos m:val="top"/></m:barPr><m:e>' + all(k) + '</m:e></m:bar>';
        if (/bottom/.test(note)) return '<m:bar><m:barPr><m:pos m:val="bot"/></m:barPr><m:e>' + all(k) + '</m:e></m:bar>';
        if (/box/.test(note)) return '<m:borderBox><m:e>' + all(k) + '</m:e></m:borderBox>';
        return all(k);
      case 'mtable':
        var rows = k.filter(function (r) { return r.localName === 'mtr' || r.localName === 'mlabeledtr'; });
        var cols = Math.max.apply(null, rows.map(function (r) { return kids(r).length; }).concat([1]));
        return '<m:m><m:mPr><m:mcs><m:mc><m:mcPr><m:count m:val="' + cols + '"/><m:mcJc m:val="center"/></m:mcPr></m:mc></m:mcs></m:mPr>' +
          rows.map(function (r) {
            var cells = kids(r); if (r.localName === 'mlabeledtr') cells = cells.slice(1);
            while (cells.length < cols) cells.push(null);
            return '<m:mr>' + cells.map(function (c) { var inner = c ? conv(c) : ''; return '<m:e>' + (c && /border/.test(c.getAttribute('style') || '') ? '<m:borderBox><m:e>' + (inner || run('\u2003', 'p')) + '</m:e></m:borderBox>' : inner) + '</m:e>'; }).join('') + '</m:mr>';
          }).join('') + '</m:m>';
      default: return k.length ? all(k) : run(txt(n), 'p');
    }
  }
  function texToOmml(tex) {
    var holder = document.createElement('template');
    try { holder.innerHTML = window.temml.renderToString(tex, { throwOnError: true }); } catch (e) { return run(tex, 'p'); }
    var math = holder.content.querySelector('math');
    return math ? conv(math) : run(tex, 'p');
  }

  function metaLine(q) {
    if (!q) return '';
    var rawExam = q.exam || '';
    var exam = rawExam.trim().toUpperCase();
    if (!exam) {
      if (q.id && q.id.startsWith('KCET')) exam = 'KCET';
      else if (q.id && q.id.startsWith('JA')) exam = 'JEE ADVANCED';
      else if (q.id && q.id.startsWith('AIEEE')) exam = 'AIEEE';
      else exam = 'JEE MAIN';
    }
    if (exam === 'JEE ADV') exam = 'JEE ADVANCED';

    var paper = (q.paper || '').replace(/Shift\s*(\d+)/gi, 'S$1').replace(/Paper\s*(\d+)/gi, 'P$1').trim();
    var dateStr = paper;
    if (q.year && !dateStr.includes(String(q.year))) {
      dateStr = (q.year + ' ' + dateStr).trim();
    }
    var firstPart = (exam + (dateStr ? ' ' + dateStr : '')).replace(/\s+/g, ' ').trim();
    var parts = [firstPart];
    if (q.chapter_code) parts.push(q.chapter_code);
    else if (q.ch) parts.push(q.ch);
    if (q.difficulty) parts.push(q.difficulty);
    return parts.join(' . ');
  }

  /* ================= WORD ================= */
  var W_PAGE = 10204; /* A4 width minus 15 mm margins, in twips */
  function wRun(text, o) {
    o = o || {};
    var pr = (o.b ? '<w:b/>' : '') + (o.color ? '<w:color w:val="' + o.color + '"/>' : '') + (o.sz ? '<w:sz w:val="' + o.sz + '"/>' : '');
    return '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + esc(text) + '</w:t></w:r>';
  }
  function para(inner, o) {
    o = o || {};
    return '<w:p><w:pPr>' + (o.keepNext ? '<w:keepNext/>' : '') + '<w:spacing w:before="0" w:after="' + (o.after != null ? o.after : 40) + '"/>' + (o.ind ? '<w:ind w:left="' + o.ind + '"/>' : '') + '</w:pPr>' + inner + '</w:p>';
  }
  function pageBreak() { return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'; }
  function wDrawing(f) {
    var cx = f.w * 9525, cy = f.h * 9525;
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + (1000 + f.n) + '" name="Figure ' + f.n + '"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + (1000 + f.n) + '" name="fig' + f.n + '.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdF' + f.n + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }
  function richParas(s, prefix, o) {
    var out = [];
    String(s).split('\n').forEach(function (line, li) {
      var cur = li === 0 && prefix ? prefix : '';
      if (line.trim() === '{{figure}}') { if (cur) out.push(para(cur, o)); if (FIG) out.push(para(wDrawing(FIG), { after: 60 })); return; }
      segments(line).forEach(function (sg) {
        if (sg.t === 'text') cur += wRun(sg.v);
        else if (sg.display) {
          if (cur) out.push(para(cur, o));
          out.push('<w:p><w:pPr><w:spacing w:before="0" w:after="40"/></w:pPr><m:oMathPara><m:oMath>' + texToOmml(sg.v) + '</m:oMath></m:oMathPara></w:p>');
          cur = '';
        } else cur += '<m:oMath>' + texToOmml(sg.v) + '</m:oMath>';
      });
      if (cur) out.push(para(cur, o));
    });
    return out.join('') || para('', o);
  }
  var NOB = '<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/>';
  function optionsWord(opts) {
    var cols = optCols(opts);
    if (!cols) return '';
    if (cols === 1) return opts.map(function (op, j) { return richParas(op, wRun('(' + LET[j] + ') ', { b: true }), { ind: 284, after: 30 }); }).join('');
    var w = Math.floor((W_PAGE - 284) / cols), rows = [];
    for (var i = 0; i < opts.length; i += cols) rows.push(opts.slice(i, i + cols).map(function (op, j) { return { op: op, j: i + j }; }));
    return '<w:tbl><w:tblPr><w:tblW w:w="' + (w * cols) + '" w:type="dxa"/><w:tblInd w:w="284" w:type="dxa"/><w:tblBorders>' + NOB + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="113" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>' +
      new Array(cols + 1).join('<w:gridCol w:w="' + w + '"/>') + '</w:tblGrid>' +
      rows.map(function (r) {
        var cells = r.map(function (c) { return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/></w:tcPr>' + richParas(c.op, wRun('(' + LET[c.j] + ') ', { b: true }), { after: 30 }) + '</w:tc>'; });
        while (cells.length < cols) cells.push('<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/></w:tcPr><w:p/></w:tc>');
        return '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cells.join('') + '</w:tr>';
      }).join('') + '</w:tbl>' + para('', { after: 0 });
  }
  function answerKeyWord(qs) {
    var cols = 6, w = Math.floor(W_PAGE / cols), rows = [];
    for (var i = 0; i < qs.length; i += cols) rows.push(qs.slice(i, i + cols).map(function (q, j) { return { q: q, n: i + j + 1 }; }));
    return para(wRun('Answer key', { b: true, sz: 26 }), { after: 100 }) +
      '<w:tbl><w:tblPr><w:tblW w:w="' + (w * cols) + '" w:type="dxa"/><w:tblBorders>' + NOB + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>' + new Array(cols + 1).join('<w:gridCol w:w="' + w + '"/>') + '</w:tblGrid>' +
      rows.map(function (r) {
        var cells = r.map(function (c) { return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/></w:tcPr>' + para(wRun(c.n + '. ', { b: true }) + wRun(c.q.answer || '—'), { after: 20 }) + '</w:tc>'; });
        while (cells.length < cols) cells.push('<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/></w:tcPr><w:p/></w:tc>');
        return '<w:tr>' + cells.join('') + '</w:tr>';
      }).join('') + '</w:tbl>' + para('');
  }
  function docxBody(qs, o) {
    MODE = 'w';
    var b = o.title ? para(wRun(o.title, { b: true, sz: 28 }), { after: 120 }) : '';
    qs.forEach(function (q, i) {
      FIG = (o._figs || {})[q.id] || null;
      b += para(wRun(metaLine(q), { color: '808080', sz: 16 }), { keepNext: true, after: 0 });
      b += richParas(figLines(q.question), wRun('Q' + (i + 1) + '. ', { b: true }), { after: 40 });
      b += optionsWord(q.options || []);
      if (o.answers && !o.answerKey) b += para(wRun('Answer: ', { b: true }) + wRun(q.answer || '—'), { after: 40 });
      if (o.pptLayout) b += pageBreak() + para('') + pageBreak();
      else b += para('', { after: 100 });
    });
    FIG = null;
    if (o.answers && o.answerKey) b += pageBreak() + answerKeyWord(qs);
    return b;
  }
  var DOC_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  function documentXml(body) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + DOC_NS + '><w:body>' + body +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="851" w:right="851" w:bottom="851" w:left="851" w:header="425" w:footer="425" w:gutter="0"/></w:sectPr></w:body></w:document>';
  }
  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
  var REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships', OD = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  function rels(list) { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + REL_NS + '">' + list.map(function (r) { return '<Relationship Id="' + r[0] + '" Type="' + OD + r[1] + '" Target="' + r[2] + '"/>'; }).join('') + '</Relationships>'; }
  async function buildDocx(qs, o) {
    o = o || {};
    var figs = await figuresFor(qs);
    var mappedQs = qs.map(function (q) {
      return {
        i: String(q.id),
        t: q.type || 'MCQ',
        q: q.figure && q.figure.card && q.figure.card.text ? q.figure.card.text : (q.question || ''),
        o: q.options || [],
        a: q.answer == null ? '—' : String(q.answer),
        metaLine: metaLine(q)
      };
    });
    var page = {
      mode: 'dpp',
      kind: 'qb',
      cols: o.pptLayout ? 1 : 2,
      title: o.title || 'JEE Mathematics Question Bank',
      sub: qs.length + (qs.length === 1 ? ' Question' : ' Questions') + ' · Selected from Question Bank',
      badge: 'Question Bank',
      qs: mappedQs,
      start: 0,
      total: mappedQs.length,
      key: !!(o.answers && o.answerKey),
      inlineAns: !!(o.answers && !o.answerKey)
    };
    return window.OfficeDoc.buildDocx(null, null, [page], {
      figs: figs,
      matchParts: window.OfficeDoc.matchParts
    });
  }

  /* ================= POWERPOINT ================= */
  var EMU_W = 12192000, EMU_H = 6858000, MX = 457200, BODY_W = EMU_W - 2 * MX;
  var NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main', NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main', NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', NS_M = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
  function aRun(text, sz, o) {
    o = o || {};
    return '<a:r><a:rPr lang="en-US" sz="' + sz + '"' + (o.b ? ' b="1"' : '') + ' dirty="0">' + (o.color ? '<a:solidFill><a:srgbClr val="' + o.color + '"/></a:solidFill>' : '<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>') + '</a:rPr><a:t>' + esc(text) + '</a:t></a:r>';
  }
  function aPara(inner, sz, o) {
    o = o || {};
    var tabs = o.tabs ? '<a:tabLst>' + o.tabs.map(function (p) { return '<a:tab pos="' + p + '" algn="l"/>'; }).join('') + '</a:tabLst>' : '';
    return '<a:p><a:pPr' + (o.marL ? ' marL="' + o.marL + '"' : '') + '><a:spcAft><a:spcPts val="' + (o.after != null ? o.after : 600) + '"/></a:spcAft>' + tabs + '</a:pPr>' + inner + '<a:endParaRPr lang="en-US" sz="' + sz + '" dirty="0"/></a:p>';
  }
  /* inline content of one line: runs and inline math; display math returned separately */
  function pptInline(line, sz, mathOn) {
    var parts = [], cur = '';
    segments(line).forEach(function (sg) {
      if (sg.t === 'text') cur += aRun(sg.v, sz);
      else if (!mathOn) cur += aRun(sg.display ? '\\[' + sg.v + '\\]' : '\\(' + sg.v + '\\)', sz);
      else if (sg.display) { parts.push({ inline: cur }); parts.push({ display: sg.v }); cur = ''; }
      else cur += '<a14:m><m:oMath xmlns:m="' + NS_M + '">' + texToOmml(sg.v) + '</m:oMath></a14:m>';
    });
    parts.push({ inline: cur });
    return parts;
  }
  function pptRich(s, prefix, sz, mathOn, o) {
    var out = '';
    String(s).split('\n').forEach(function (line, li) {
      if (line.trim() === '{{figure}}') return;
      var pre = li === 0 && prefix ? prefix : '';
      pptInline(line, sz, mathOn).forEach(function (p, pi) {
        if (p.display != null) out += '<a:p><a:pPr><a:spcAft><a:spcPts val="400"/></a:spcAft></a:pPr><a14:m><m:oMathPara xmlns:m="' + NS_M + '"><m:oMathParaPr><m:jc m:val="left"/></m:oMathParaPr><m:oMath>' + texToOmml(p.display) + '</m:oMath></m:oMathPara></a14:m><a:endParaRPr lang="en-US" sz="' + sz + '" dirty="0"/></a:p>';
        else if (p.inline || (pi === 0 && pre)) { out += aPara((pi === 0 ? pre : '') + p.inline, sz, o); }
      });
    });
    return out;
  }
  function pptOptions(opts, sz, mathOn) {
    var cols = optCols(opts);
    if (!cols) return '';
    if (cols === 1) return opts.map(function (op, j) { return pptRich(op, aRun('(' + LET[j] + ')  ', sz, { b: true }), sz, mathOn, { after: 300, marL: 228600 }); }).join('');
    var step = Math.floor(BODY_W / cols), tabs = [], out = '';
    for (var t = 1; t < cols; t++) tabs.push(step * t);
    for (var i = 0; i < opts.length; i += cols) {
      var inner = '';
      opts.slice(i, i + cols).forEach(function (op, j) {
        if (j) inner += aRun('\t', sz);
        inner += aRun('(' + LET[i + j] + ')  ', sz, { b: true });
        pptInline(op.replace(/\n/g, ' '), sz, mathOn).forEach(function (p) { inner += p.inline != null ? p.inline : (mathOn ? '<a14:m><m:oMath xmlns:m="' + NS_M + '">' + texToOmml(p.display) + '</m:oMath></a14:m>' : ''); });
      });
      out += aPara(inner, sz, { tabs: tabs, after: 300 });
    }
    return out;
  }
  function spXml(id, name, x, y, cx, cy, paras, autofit) {
    return '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + name + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>' +
      '<p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="t">' + (autofit ? '<a:normAutofit/>' : '<a:noAutofit/>') + '</a:bodyPr><a:lstStyle/>' + paras + '</p:txBody></p:sp>';
  }
  var SP_HEAD = '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="000000"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  var SP_TAIL = '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>';
  var LOGO_H = 457200, LOGO_TOP = 120000;
  function logoXml() {
    if (!window.QB_LOGO_B64) return '';
    var cy = LOGO_H, cx = Math.round(cy * (window.QB_LOGO_W || 480) / (window.QB_LOGO_H || 165));
    return '<p:pic><p:nvPicPr><p:cNvPr id="6" name="Avanti Fellows logo"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId3"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="' + (EMU_W - 300000 - cx) + '" y="' + LOGO_TOP + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
  }
  function logoWidth() { return window.QB_LOGO_B64 ? Math.round(LOGO_H * (window.QB_LOGO_W || 480) / (window.QB_LOGO_H || 165)) + 400000 : 0; }
  function slideXml(inner) { return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '">' + SP_HEAD + inner + logoXml() + SP_TAIL + '</p:sld>'; }
  function fontFor(q) {
    var n = vlen(q.question) + (q.options || []).reduce(function (s, o) { return s + vlen(o); }, 0) + (/\\begin|\\\[/.test(q.question) ? 120 : 0);
    return n < 220 ? 2400 : n < 380 ? 2200 : n < 560 ? 2000 : n < 800 ? 1800 : n < 1100 ? 1600 : 1400;
  }
  function picXml(f) {
    var maxH = 2286000, cx = f.w * 9525, cy = f.h * 9525, k = cy > maxH ? maxH / cy : 1.4;
    if (cy * k > maxH) k = maxH / cy;
    cx = Math.round(cx * k); cy = Math.round(cy * k);
    return '<p:pic><p:nvPicPr><p:cNvPr id="5" name="Figure"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="' + (EMU_W - MX - cx) + '" y="' + (EMU_H - 300000 - cy) + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
  }
  function questionSlide(q, i, o) {
    var sz = fontFor(q); PSZ = sz; MODE = 'p';
    var f = (o._figs || {})[q.id];
    var meta = spXml(2, 'Source', MX, 170000, BODY_W - logoWidth(), 380000, aPara(aRun(metaLine(q), 1200, { color: 'BFBFBF' }), 1200, { after: 0 }), false);
    var make = function (mathOn) {
      var paras = pptRich(figLines(q.question), aRun('Q' + (i + 1) + '.  ', sz, { b: true }), sz, mathOn, { after: 600 }) + pptOptions(q.options || [], sz, mathOn);
      if (o.answers && !o.answerKey) paras += aPara(aRun('Answer: ', sz, { b: true }) + aRun(q.answer || '—', sz), sz);
      return spXml(3, 'Question', MX, 700000, BODY_W, EMU_H - 700000 - 300000, paras, true);
    };
    var body = '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" Requires="a14">' + make(true) + '</mc:Choice><mc:Fallback>' + make(false) + '</mc:Fallback></mc:AlternateContent>';
    MODE = 'w';
    return { xml: slideXml(meta + body + (f ? picXml(f) : '')), fig: f };
  }
  function keySlides(qs) {
    var out = [], per = 40;
    for (var s = 0; s < qs.length; s += per) {
      var chunk = qs.slice(s, s + per), cols = 4, step = Math.floor(BODY_W / cols), tabs = [step, step * 2, step * 3], paras = aPara(aRun('Answer key', 2400, { b: true }), 2400, { after: 600 });
      for (var r = 0; r < chunk.length; r += cols) {
        paras += aPara(chunk.slice(r, r + cols).map(function (q, j) { return (j ? aRun('\t', 1600) : '') + aRun((s + r + j + 1) + '.  ', 1600, { b: true }) + aRun(q.answer || '—', 1600); }).join(''), 1600, { tabs: tabs, after: 200 });
      }
      out.push(slideXml(spXml(2, 'Answers', MX, 300000, BODY_W, EMU_H - 600000, paras, true)));
    }
    return out;
  }
  async function buildPptx(qs, o) {
    o = o || {};
    o._figs = await figuresFor(qs);
    var T = window.QB_PPT_TPL, slides = [];
    if (o.title) slides.push(slideXml(spXml(2, 'Title', MX, 2400000, BODY_W, 1400000, aPara(aRun(o.title, 3600, { b: true }), 3600) + aPara(aRun(qs.length + ' questions', 2000, { color: 'BFBFBF' }), 2000), false)));
    qs.forEach(function (q, i) { slides.push(questionSlide(q, i, o)); slides.push(slideXml('')); });
    if (o.answers && o.answerKey) slides = slides.concat(keySlides(qs));
    var files = [], ct = '', sldIds = '', presRels = [['rId1', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rId2', 'presProps', 'presProps.xml'], ['rId3', 'viewProps', 'viewProps.xml'], ['rId4', 'theme', 'theme/theme1.xml'], ['rId5', 'tableStyles', 'tableStyles.xml']];
    slides.forEach(function (x, i) {
      var n = i + 1, sr = [['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml']];
      if (window.QB_LOGO_B64) sr.push(['rId3', 'image', '../media/logo.png']);
      if (typeof x !== 'string') {
        if (x.fig) { sr.push(['rId2', 'image', '../media/fig' + x.fig.n + '.png']); if (!x.fig.added) { x.fig.added = true; files.push({ name: 'ppt/media/fig' + x.fig.n + '.png', data: x.fig.png }); } }
        x = x.xml;
      }
      files.push({ name: 'ppt/slides/slide' + n + '.xml', data: x });
      files.push({ name: 'ppt/slides/_rels/slide' + n + '.xml.rels', data: rels(sr) });
      ct += '<Override PartName="/ppt/slides/slide' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
      sldIds += '<p:sldId id="' + (256 + i) + '" r:id="rId' + (100 + n) + '"/>';
      presRels.push(['rId' + (100 + n), 'slide', 'slides/slide' + n + '.xml']);
    });
    var pres = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '" saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>' + sldIds + '</p:sldIdLst><p:sldSz cx="' + EMU_W + '" cy="' + EMU_H + '"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:defaultTextStyle></p:presentation>';
    var types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>' + ct + '</Types>';
    return zip([
      { name: '[Content_Types].xml', data: types },
      { name: '_rels/.rels', data: rels([['rId1', 'officeDocument', 'ppt/presentation.xml']]) },
      { name: 'ppt/presentation.xml', data: pres },
      { name: 'ppt/_rels/presentation.xml.rels', data: rels(presRels) },
      { name: 'ppt/slideMasters/slideMaster1.xml', data: T.master },
      { name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: rels([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId2', 'theme', '../theme/theme1.xml']]) },
      { name: 'ppt/slideLayouts/slideLayout1.xml', data: T.layout },
      { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: rels([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]) },
      { name: 'ppt/theme/theme1.xml', data: T.theme },
      { name: 'ppt/presProps.xml', data: T.presProps },
      { name: 'ppt/viewProps.xml', data: T.viewProps },
      { name: 'ppt/tableStyles.xml', data: T.tableStyles }
    ].concat(window.QB_LOGO_B64 ? [{ name: 'ppt/media/logo.png', data: Uint8Array.from(atob(window.QB_LOGO_B64), function (c) { return c.charCodeAt(0); }) }] : [], files));
  }

  /* ================= ZIP (stored) ================= */
  var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var head = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      offset += head.length + name.length + data.length;
    });
    var csize = central.reduce(function (s, p) { return s + p.length; }, 0);
    var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(csize), u32(offset), u16(0)));
    var list = parts.concat(central, [end]), len = list.reduce(function (s, p) { return s + p.length; }, 0), out = new Uint8Array(len), pos = 0;
    list.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  /* ================= PRINT HTML + PDF ================= */
  function richLineHtml(line, fig) {
    var CI = fig && fig.card && fig.card.imgs;
    var cm = CI && /^(.*?)\{\{f([1-9])\}\}\s*$/.exec(line);
    if (cm) {
      var im2 = CI[Number(cm[2]) - 1];
      return '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0">' +
        (cm[1].trim() ? '<span>' + richLineHtml(cm[1], null) + '</span>' : '') +
        (im2 && im2.svg ? String(im2.svg).replace(/<svg /, '<svg style="width:' + im2.w + 'px;height:' + im2.h + 'px" ') : '') +
        '</div>';
    }
    if (line.trim() === '{{figure}}') {
      return fig && fig.svg ? '<div class="fig" style="margin:6px 0">' + String(fig.svg).replace(/<svg /, '<svg style="width:' + fig.w + 'px;height:' + fig.h + 'px" ') + '</div>' : '';
    }
    return segments(line).map(function (sg) {
      if (sg.t === 'text') return esc(sg.v);
      try { return window.__mh(sg.v, sg.display); } catch (e) { return esc(sg.v); }
    }).join('');
  }
  function richHtml(s, fig) {
    var raw = String(fig ? figLines(s) : s);
    var mt = window.OfficeDoc && window.OfficeDoc.matchParts ? window.OfficeDoc.matchParts(raw) : null;
    if (mt) {
      var nRows = Math.max(mt.left.length, mt.right.length), trs = '';
      for (var r = 0; r < nRows; r++) {
        trs += '<tr><td>' + richLineHtml(mt.left[r] || '', null) + '</td><td>' + richLineHtml(mt.right[r] || '', null) + '</td></tr>';
      }
      return (mt.pre ? richHtml(mt.pre, fig) + '<br/>' : '') +
        '<table class="qbp-mtab"><thead><tr><th>' + esc(mt.head[0]) + '</th><th>' + esc(mt.head[1]) + '</th></tr></thead><tbody>' + trs + '</tbody></table>';
    }
    return raw.split('\n').map(function (line) { return richLineHtml(line, fig); }).join('<br/>');
  }
  function optionsHtml(opts, fig) {
    var cols = optCols(opts);
    if (!cols) return '';
    var hasOI = fig && fig.card && fig.card.opts && fig.card.opts.length;
    if (hasOI) cols = 2;
    return '<div class="ops c' + cols + '">' + opts.map(function (op, j) {
      var oi = hasOI && fig.card.opts[j];
      var inner = oi && oi.svg ? String(oi.svg).replace(/<svg /, '<svg style="width:' + oi.w + 'px;height:' + oi.h + 'px;vertical-align:top" ') : richHtml(op);
      return '<div class="op"><b>(' + LET[j] + ')</b> ' + inner + '</div>';
    }).join('') + '</div>';
  }
  function qHtml(q, i, o) {
    var qTxt = q.figure && q.figure.card && q.figure.card.text ? q.figure.card.text : q.question;
    return '<div class="meta">' + esc(metaLine(q)) + '</div><div class="qt"><b>Q' + (i + 1) + '.</b> ' + richHtml(qTxt, q.figure) + '</div>' + optionsHtml(q.options || [], q.figure) +
      (o.answers && !o.answerKey ? '<div class="ans"><b>Answer:</b> ' + richHtml(q.answer || '—') + '</div>' : '');
  }
  function keyHtml(qs, from, to) {
    return '<div class="key">' + qs.slice(from, to).map(function (q, k) { return '<div><b>' + (from + k + 1) + '.</b> ' + richHtml(q.answer || '—') + '</div>'; }).join('') + '</div>';
  }
  /* CSS scoped to .qbp (PDF pages) */
  var PCSS = '.qbp{font-family:Arial,Helvetica,"Segoe UI",sans-serif;font-size:13.5px;line-height:1.52;color:#111827;background:#fff}' +
    '.qbp .h1{font-size:20px;font-weight:700;color:#1E3A8A;border-bottom:2px solid #1E3A8A;padding-bottom:6px;margin:0 0 10px 0}.qbp .meta{font-size:10.5px;color:#64748B;font-weight:600;margin-bottom:2px}' +
    '.qbp .qt{margin-bottom:5px}.qbp .ops{display:grid;gap:4px 14px;margin-left:16px}.qbp .ops.c4{grid-template-columns:repeat(4,1fr)}.qbp .ops.c2{grid-template-columns:repeat(2,1fr)}.qbp .ops.c1{grid-template-columns:1fr}' +
    '.qbp .op{min-width:0}.qbp .op b{color:#1E3A8A}.qbp .ans{margin-top:4px;color:#0F766E}.qbp .keyh{font-size:17px;font-weight:700;color:#1E3A8A;border-bottom:1.5px solid #1E3A8A;padding-bottom:4px;margin-bottom:8px}.qbp .key{display:grid;grid-template-columns:repeat(5,1fr);gap:6px 12px}' +
    '.qbp .qbp-mtab{border-collapse:collapse;width:100%;margin:6px 0;font-size:12.5px}.qbp .qbp-mtab th,.qbp .qbp-mtab td{border:1px solid #94A3B8;padding:4px 8px;text-align:left;vertical-align:top}.qbp .qbp-mtab th{background:#EEF2FF;color:#1E3A8A;font-weight:700}' +
    '.qbp math{font-size:1.05em}.qbp math[display=block]{margin:.25em 0}';
  var PAGE_W = 794, PAGE_H = 1123, PAD = 42, GAP = 14, CONTENT_W = PAGE_W - 2 * PAD, CONTENT_H = PAGE_H - 2 * PAD;

  function blocksFor(qs, o) {
    var b = [];
    if (o.title) b.push({ html: '<div class="h1">Avanti Fellows · ' + esc(o.title) + '</div>' });
    qs.forEach(function (q, i) { b.push({ html: qHtml(q, i, o), q: true }); });
    if (o.answers && o.answerKey) {
      b.push({ html: '<div class="keyh">Answer Key</div>', breakBefore: !o.pptLayout });
      for (var s = 0; s < qs.length; s += 50) b.push({ html: keyHtml(qs, s, Math.min(qs.length, s + 50)) });
    }
    return b;
  }
  function loadImage(src) {
    return new Promise(function (res, rej) { var img = new Image(); img.onload = function () { res(img); }; img.onerror = function () { rej(new Error('Page image failed to load')); }; img.src = src; });
  }
  async function renderPage(nodes, scale) {
    var ser = new XMLSerializer(), inner = '';
    nodes.forEach(function (n) { inner += ser.serializeToString(n); });
    var safeCss = (PCSS + (window.QB_TEMML_CSS || '')).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    var xhtml = '<div xmlns="http://www.w3.org/1999/xhtml" class="qbp" style="width:' + PAGE_W + 'px;height:' + PAGE_H + 'px;box-sizing:border-box;padding:' + PAD + 'px;background:#fff;overflow:hidden">' +
      '<style>' + safeCss + '</style>' + inner + '</div>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + PAGE_W * scale + '" height="' + PAGE_H * scale + '" viewBox="0 0 ' + PAGE_W + ' ' + PAGE_H + '"><foreignObject x="0" y="0" width="' + PAGE_W + '" height="' + PAGE_H + '">' + xhtml + '</foreignObject></svg>';
    var img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    var c = document.createElement('canvas'); c.width = PAGE_W * scale; c.height = PAGE_H * scale;
    var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    var blob = await new Promise(function (res, rej) { try { c.toBlob(function (b) { b ? res(b) : rej(new Error('Could not draw the page')); }, 'image/jpeg', 0.92); } catch (e) { rej(e); } });
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height };
  }
  /* Build a real PDF: lay the questions out on A4 pages, draw each page to an image, wrap the images in a PDF. */
  async function buildPdf(qs, o, progress) {
    o = o || {};
    var host = document.createElement('div');
    host.className = 'qbp';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;left:-40000px;top:0;width:' + CONTENT_W + 'px;';
    var st = document.createElement('style'); st.textContent = PCSS; host.appendChild(st);
    (document.querySelector('#dash-root') || document.body).appendChild(host);
    try {
      var blocks = blocksFor(qs, o).map(function (b) {
        var d = document.createElement('div'); d.innerHTML = b.html; d.style.cssText = 'margin:0 0 ' + GAP + 'px 0;break-inside:avoid'; host.appendChild(d);
        b.node = d; return b;
      });
      await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
      blocks.forEach(function (b) { b.h = Math.ceil(b.node.getBoundingClientRect().height); });
      /* paginate */
      var pages = [], cur = [], y = 0;
      var flush = function () { if (cur.length) pages.push(cur); cur = []; y = 0; };
      blocks.forEach(function (b) {
        if (o.pptLayout && b.q) { flush(); pages.push([b]); pages.push([]); return; }
        if (b.breakBefore) flush();
        if (y > 0 && y + b.h > CONTENT_H) flush();
        cur.push(b); y += b.h + GAP;
      });
      flush();
      var out = [], blank = null;
      for (var i = 0; i < pages.length; i++) {
        if (progress) progress(i + 1, pages.length);
        var pg = pages[i];
        if (!pg.length) { out.push(null); continue; }
        var tall = pg.length === 1 && pg[0].h > CONTENT_H;
        var nodes = pg.map(function (b) {
          var c = b.node.cloneNode(true);
          if (tall) { var s = CONTENT_H / b.h; c.style.cssText += ';transform:scale(' + s.toFixed(4) + ');transform-origin:0 0;width:' + CONTENT_W + 'px'; }
          return c;
        });
        out.push(await renderPage(nodes, 2));
      }
      return pdfFromImages(out);
    } finally { host.remove(); }
  }
  function pdfFromImages(pages) {
    var enc = new TextEncoder(), chunks = [], offs = [], pos = 0, W = 595.28, H = 841.89;
    var push = function (x) { var u = typeof x === 'string' ? enc.encode(x) : x; chunks.push(u); pos += u.length; };
    var obj = function (n, body) { offs[n] = pos; push(n + ' 0 obj\n'); body.forEach(push); push('\nendobj\n'); };
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[\u0080-ÿ]/g, 'A'));
    var n = pages.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2, ['<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>']);
    pages.forEach(function (p, i) {
      var po = 3 + i * 3, co = po + 1, io = po + 2;
      var content = p ? 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q' : '';
      obj(po, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << ' + (p ? '/XObject << /Im0 ' + io + ' 0 R >> ' : '') + '>> /Contents ' + co + ' 0 R >>']);
      obj(co, ['<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream']);
      if (p) obj(io, ['<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.bytes.length + ' >>\nstream\n', p.bytes, '\nendstream']);
      else obj(io, ['null']);
    });
    var total = 3 + n * 3, xref = pos;
    var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var k = 1; k < total; k++) x += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    var out = new Uint8Array(pos), q = 0; chunks.forEach(function (c) { out.set(c, q); q += c.length; });
    return out;
  }
  function printDocument(qs, o) {
    o = o || {};
    var body = blocksFor(qs, o).map(function (b) { return '<section class="' + (o.pptLayout && b.q ? 'brk' : 'blk') + '">' + b.html + '</section>' + (o.pptLayout && b.q ? '<section class="brk"></section>' : ''); }).join('');
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(o.title || 'JEE Maths PYQs') + '</title><style>' + PCSS + (window.QB_TEMML_CSS || '') + '.blk{margin-bottom:16px;break-inside:avoid}.brk{break-after:page;min-height:1px}@page{size:A4;margin:12mm}</style></head><body class="qbp">' + body +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},400)})<\/script></body></html>';
  }
  function plainText(q) { return q.question.replace(FIG_RE, ' [figure] ') + '\n' + (q.options || []).map(function (op, j) { return '(' + LET[j] + ') ' + op; }).join('\n'); }

  window.QBX = { segments: segments, optCols: optCols, buildDocx: buildDocx, buildPptx: buildPptx, buildPdf: buildPdf, pdfFromImages: pdfFromImages, printDocument: printDocument, plainText: plainText, richHtml: richHtml, texToOmml: texToOmml };
})();

;
(function () {
  var root = document.querySelector('.qb');
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };

  /* ---------- calculations (readers see these in Sources) ---------- */
  dash.calc('counts', {
    inputs: ['pyq', 'nonpyq'],
    title: 'Questions by exam and year',
    description: 'Number of questions in the bank: all, PYQs per exam and year, and practice (non-PYQ) questions.',
    fn: function (pyq, nonpyq) {
      var n = function (exam, year) { return pyq.filter(function (q) { return q.exam === exam && Number(q.year) === year; }).length; };
      return [
        { group: 'all', n: pyq.length + nonpyq.length },
        { group: 'pyq', n: pyq.length },
        { group: 'nonpyq', n: nonpyq.length },
        { group: 'exam_main', n: pyq.filter(function (q) { return q.exam === 'JEE Main'; }).length },
        { group: 'exam_adv', n: pyq.filter(function (q) { return q.exam === 'JEE Advanced'; }).length },
        { group: 'exam_aieee', n: pyq.filter(function (q) { return q.exam === 'AIEEE'; }).length },
        { group: 'exam_iit', n: pyq.filter(function (q) { return q.exam === 'IIT'; }).length },
        { group: 'exam_kcet', n: pyq.filter(function (q) { return q.exam === 'KCET'; }).length },
        { group: 'src_VMC', n: nonpyq.filter(function (q) { return (q.publisher || 'VMC') === 'VMC'; }).length },
        { group: 'src_Cengage', n: nonpyq.filter(function (q) { return q.publisher === 'Cengage'; }).length },
        { group: 'src_PPTs', n: nonpyq.filter(function (q) { return q.publisher === 'PPTs'; }).length },
        { group: 'src_Avanti', n: nonpyq.filter(function (q) { return q.publisher === 'Avanti'; }).length },
        { group: 'src_BlackBook', n: nonpyq.filter(function (q) { return q.publisher === 'Black Book'; }).length }
      ];
    }
  });
  dash.calc('by_chapter', {
    inputs: ['chapters', 'pyq', 'nonpyq'],
    title: 'Questions per chapter',
    description: 'For every chapter, PYQs per exam and year, practice (non-PYQ) questions, and the total.',
    fn: function (chapters, pyq, nonpyq) {
      return chapters.map(function (c) {
        var mine = pyq.filter(function (q) { return q.chapter_code === c.chapter_code; });
        var np = nonpyq.filter(function (q) { return q.chapter_code === c.chapter_code; }).length;
        var n = function (exam, year) { return mine.filter(function (q) { return q.exam === exam && Number(q.year) === year; }).length; };
        var ex = function (exam) { return mine.filter(function (q) { return q.exam === exam; }).length; };
        var sc = function (pb) { return nonpyq.filter(function (q) { return q.chapter_code === c.chapter_code && q.publisher === pb; }).length; };
        return { chapter_code: c.chapter_code, chapter: c.chapter, main_2025: n('JEE Main', 2025), main_2026: n('JEE Main', 2026), adv_2025: n('JEE Advanced', 2025), adv_2026: n('JEE Advanced', 2026), main_all: ex('JEE Main') + ex('AIEEE'), adv_all: ex('JEE Advanced') + ex('IIT'), kcet_all: ex('KCET'), src_VMC: sc('VMC'), src_Cengage: sc('Cengage'), src_PPTs: sc('PPTs'), src_BlackBook: sc('Black Book'), nonpyq: np, total: mine.length + np };
      });
    }
  });

  /* ---------- state ---------- */
  var PER_PAGE = 20, page = 0, lastKey = null;
  var S = { exam: new Set(), year: new Set(), cls: new Set(), diff: new Set(), type: new Set(), ch: new Set(), tp: new Set(), src: new Set(), q: '', onlySel: false, flag: false, attn: false, oos: false, oosx: false, sel: new Set() };
  try { S.oosx = localStorage.getItem('oosEx') === '1'; } catch (e) { /* ignore */ }
  function VR() { return S.oosx ? ROWS.filter(function (q) { return !q.oos; }) : ROWS; }
  var ROWS = [], BYID = {}, CHAPTERS = [], CHMAP = {}, TOPICS = [], tpBuiltFrom = null, CARDS = {}, builtFrom = null, npFrom = null, chBuiltFrom = null;
  var SESSION = { 2025: 'JEE 2025', 2026: 'JEE 2026' };
  var DIFF_ORDER = ['L1', 'L2', 'L3'];
  var TYPE_ORDER = ['MCQ', 'MSQ', 'Numerical', 'Matching', 'Comprehension', 'Subjective'];
  var LET = ['A', 'B', 'C', 'D', 'E', 'F'];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* render text with \( \) and \[ \] math and \n line breaks */
  function renderRich(target, s, fig) {
    if (fig) s = String(s).replace(/\s*\{\{figure\}\}\s*/, '\n{{figure}}\n');
    /* matching questions: Column I and Column II side by side, row by row */
    var ls = String(s).split('\n'), c1 = -1, c2 = -1;
    ls.forEach(function (l, k) { if (c1 < 0 && /^\s*(?:List|Column)[\s-]*(?:I|1)\s*:?\s*$/i.test(l)) c1 = k; else if (c1 >= 0 && c2 < 0 && /^\s*(?:List|Column)[\s-]*(?:II|2)\s*:?\s*$/i.test(l)) c2 = k; });
    if (c1 >= 0 && c2 > c1) {
      if (c1 > 0) renderRich(target, ls.slice(0, c1).join('\n'), fig);
      var colA = ls.slice(c1 + 1, c2).filter(function (l) { return l.trim(); }), colB = ls.slice(c2 + 1).filter(function (l) { return l.trim(); });
      var grid = el('div', 'qb-match'); grid.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:32px;row-gap:8px;margin:8px 0;align-items:center';
      var h1 = el('div', 'qb-mh', 'Column I'), h2 = el('div', 'qb-mh', 'Column II'); h1.style.fontWeight = h2.style.fontWeight = '700'; grid.appendChild(h1); grid.appendChild(h2);
      for (var r = 0; r < Math.max(colA.length, colB.length); r++) {
        [colA[r], colB[r]].forEach(function (ln) { var cell = el('div', 'qb-mc'); if (ln != null) renderRich(cell, ln, fig); grid.appendChild(cell); });
      }
      target.appendChild(grid); return;
    }
    var CI = fig && fig.card && fig.card.imgs, prevRow = false;
    String(s).split('\n').forEach(function (line, i) {
      var cm = CI && /^(.*?)\{\{f([1-9])\}\}\s*$/.exec(line);
      if (cm) {
        var im2 = CI[Number(cm[2]) - 1], row = el('div', 'qb-figrow');
        row.style.cssText = 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:4px 0';
        if (cm[1].trim()) { var tx = el('span', 'qb-figtxt'); renderRich(tx, cm[1], null); row.appendChild(tx); }
        if (im2 && im2.svg) { var ii = el('img', 'qb-fig'); ii.alt = 'Figure'; ii.width = im2.w; ii.height = im2.h; ii.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(im2.svg); row.appendChild(ii); }
        target.appendChild(row); prevRow = true; return;
      }
      if (line.trim() === '{{figure}}') {
        if (fig && fig.svg) { var im = el('img', 'qb-fig'); im.alt = 'Figure'; im.width = fig.w; im.height = fig.h; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fig.svg); target.appendChild(im); }
        return;
      }
      if (i && !prevRow) target.appendChild(document.createElement('br'));
      prevRow = false;
      QBX.segments(line).forEach(function (sg) {
        if (sg.t === 'text') { target.appendChild(document.createTextNode(sg.v)); return; }
        var span = el('span', 'mx');
        try { span.innerHTML = window.__mh(sg.v, sg.display); }
        catch (e) { span.textContent = sg.v; }
        target.appendChild(span);
      });
    });
  }

  /* chapter order; PYQs newest first (year, month, day, shift), then practice questions in sheet order */
  function cmp(a, b) {
    var ca = CHMAP[a.chapter_code], cb = CHMAP[b.chapter_code];
    var oa = ca ? ca.order : 99, ob = cb ? cb.order : 99;
    if (oa !== ob) return oa - ob;
    var pa = a.source === 'PYQ' ? 0 : 1, pb = b.source === 'PYQ' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    var da = a.sort_date || '', db = b.sort_date || '';
    if (da !== db) return pa === 0 ? (da < db ? 1 : -1) : (da < db ? -1 : 1);
    var ea = a.exam === 'JEE Main' ? 0 : 1, eb = b.exam === 'JEE Main' ? 0 : 1;
    if (ea !== eb) return ea - eb;
    return (Number(a.qno) || 0) - (Number(b.qno) || 0);
  }


  /* ---------- teacher flags: what to correct, saved in this page's shared database ---------- */
  var FDB = null, FLAGS = {}, FKEY = 'avanti_qb_flags';
  function flagOf(q) { return FLAGS[q.id] ? FLAGS[q.id].note : ''; }
  function isFlagged(q) { return !!(q.note || flagOf(q)); }
  function flagCount() { return ROWS.filter(isFlagged).length; }
  function attnCount() { return ROWS.filter(function (q) { return !!q.attention; }).length; }
  function oosCount() { return ROWS.filter(function (q) { return q.oos; }).length; }
  function fdoc(id) { return FDB.collection('flags').doc(String(id)); }
  function loadFlags() {
    try { var o = JSON.parse(localStorage.getItem(FKEY) || '{}'); Object.keys(o).forEach(function (k) { FLAGS[k] = o[k]; }); } catch (e) { /* no storage */ }
    if (!(window.claude && window.claude.use)) return;
    window.claude.use('db').then(function (db) {
      if (!db) return; FDB = db;
      return db.collection('flags').get().then(function (snap) {
        FLAGS = {}; try { localStorage.removeItem(FKEY); } catch (e) { /* ignore */ }
        snap.docs.forEach(function (d) { var v = d.data(); if (v && v.note && v.status !== 'done') FLAGS[d.id] = { note: String(v.note), at: v.at || 0 }; else delete FLAGS[d.id]; });
        Object.keys(CARDS).forEach(function (id) { if (CARDS[id] && CARDS[id].paintFlag) CARDS[id].paintFlag(); });
        apply();
      });
    }).catch(function () { /* flags stay on this browser only */ });
  }
  function saveFlag(q, text) {
    text = text.trim();
    if (text) FLAGS[q.id] = { note: text, at: Date.now() }; else delete FLAGS[q.id];
    try { localStorage.setItem(FKEY, JSON.stringify(FLAGS)); } catch (e) { /* ignore */ }
    if (!FDB) return Promise.resolve('browser');
    var d = fdoc(q.id);
    var w = text ? d.set({ id: q.id, note: text, status: 'open', at: Date.now(), source: q.source, exam: q.exam, year: q.year || null, paper: q.paper || '', qno: q.qno || null, chapter_code: q.chapter_code, topic: q.topic || '', question: String(q.question || '').slice(0, 300) }) : d.delete();
    return w.then(function () { return 'shared'; });
  }

  /* ---------- question cards ---------- */
  function buildCard(q) {
    var card = el('article', 'qb-q d-' + q.difficulty);
    card.dataset.id = q.id;
    var side = el('div', 'qb-side');
    side.appendChild(el('span', 'qb-num', ''));
    var cb = el('input'); cb.type = 'checkbox'; cb.setAttribute('aria-label', 'Select question'); cb.title = 'Select for export';
    cb.addEventListener('change', function () { toggleSel(q.id, cb.checked); });
    side.appendChild(cb);
    card.appendChild(side);
    var main = el('div'); main.style.minWidth = '0';
    var meta = el('div', 'qb-meta');
    if (q.source === 'Non-PYQ') {
      meta.appendChild(el('span', 'qb-tag np', 'Practice'));
      meta.appendChild(el('span', 'qb-tag ' + (q.exam === 'JEE Main' ? 'ex-main' : 'ex-adv'), q.exam + ' level'));
      meta.appendChild(el('span', 'qb-tag', q.publisher || 'VMC'));
      if (q.pyq) { var pt = el('span', 'qb-tag ex-main', 'PYQ'); pt.title = 'This question is also a previous-year question' + (q.pyq_ref ? ' (' + q.pyq_ref + ')' : ''); meta.appendChild(pt); meta.appendChild(el('span', 'qb-date', q.pyq_paper + (q.pyq_exam === 'JEE Main' || !q.pyq_year ? '' : ' · ' + q.pyq_year))); }
      if (q.ref_year) meta.appendChild(el('span', 'qb-tag', '[' + q.ref_year + ']'));
    } else {
      meta.appendChild(el('span', 'qb-tag ' + (q.exam === 'JEE Main' ? 'ex-main' : 'ex-adv'), q.exam));
      meta.appendChild(el('span', 'qb-date', q.exam === 'JEE Main' || !q.year ? q.paper : q.paper + ' · ' + q.year));
    }
    if (q.topic) meta.appendChild(el('span', 'qb-tag topic', q.topic));
    meta.appendChild(el('span', 'qb-tag', q.type));
    var idTag = el('span', 'qb-tag', q.id); idTag.title = 'Question ID'; idTag.style.fontFamily = 'monospace'; idTag.style.userSelect = 'all';
    meta.appendChild(idTag);
    if (q.oos) meta.appendChild(el('span', 'qb-tag oos', 'Out of syllabus'));
    if (q.attention) meta.appendChild(el('span', 'qb-tag attn', 'Attention'));
    if (q.note) meta.appendChild(el('span', 'qb-tag rev', 'Review'));
    meta.appendChild(el('span', 'qb-tag diff', q.difficulty));
    main.appendChild(meta);
    if (q.attention) main.appendChild(el('div', 'qb-attn', q.attention));
    if (q.note) main.appendChild(el('div', 'qb-note', q.note));
    var body = el('div', 'qb-body');
    var qt = el('div', 'qb-qt'); renderRich(qt, q.figure && q.figure.card ? q.figure.card.text : q.question, q.figure); body.appendChild(qt);
    var opts = q.options || [];
    var okSet = String(q.answer || '').toUpperCase().split(/[^A-F]+/).filter(Boolean);
    if (opts.length) {
      var hasOI = q.figure && q.figure.card && q.figure.card.opts && q.figure.card.opts.length; var og = el('div', 'qb-opts c' + (hasOI ? 2 : QBX.optCols(opts)));
      opts.forEach(function (o, j) {
        var d = el('div', 'qb-opt' + (okSet.indexOf(LET[j]) >= 0 && /^[A-F](\s*,\s*[A-F])*$/i.test(String(q.answer).trim()) ? ' ok' : ''));
        d.appendChild(el('b', null, LET[j])); var sp = el('span'); var oi = q.figure && q.figure.card && q.figure.card.opts && q.figure.card.opts[j]; if (oi && oi.svg) { var oim = el('img', 'qb-fig'); oim.alt = 'Option ' + LET[j]; oim.width = oi.w; oim.height = oi.h; oim.style.maxWidth = '100%'; oim.style.height = 'auto'; oim.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(oi.svg); sp.appendChild(oim); d.style.alignItems = 'flex-start'; } else renderRich(sp, o); d.appendChild(sp); og.appendChild(d);
      });
      body.appendChild(og);
      /* long maths (stacked fractions, braces) can be wider than its cell: drop to one option per row when anything overflows */
      var fitOpts = function () { if (og.classList.contains('c1')) return true; var bad = Array.prototype.some.call(og.querySelectorAll('.qb-opt>span'), function (sp) { return sp.scrollWidth > sp.clientWidth + 1; }); if (bad) { og.className = 'qb-opts c1'; return true; } return false; };
      if (window.ResizeObserver) { var ro = new ResizeObserver(function () { if (!og.isConnected) return; if (og.offsetWidth && fitOpts()) ro.disconnect(); }); ro.observe(og); }
    }
    main.appendChild(body);
    var foot = el('div', 'qb-foot');
    var bAns = el('button', 'qb-lnk reveal', 'Reveal answer'); bAns.type = 'button';
    var ans = el('span', 'qb-ans'); renderRich(ans, 'Answer: ' + (q.answer || 'not available'));
    bAns.addEventListener('click', function () { var on = card.classList.toggle('rev'); bAns.textContent = on ? 'Hide answer' : 'Reveal answer'; });
    var bCopy = el('button', 'qb-lnk', 'Copy'); bCopy.type = 'button'; bCopy.title = 'Copy the question with its equations';
    bCopy.addEventListener('click', function () { copyRich(q, body, bCopy); });
    var bTex = el('button', 'qb-lnk', 'Copy LaTeX'); bTex.type = 'button';
    bTex.addEventListener('click', function () { copyPlain(QBX.plainText(q), bTex); });
    foot.appendChild(bAns); foot.appendChild(ans);
    var bSol = el('button', 'qb-lnk reveal', 'Full explanation'); bSol.type = 'button';
    var solBox = el('div', 'qb-sol'); solBox.hidden = true;
    solBox.appendChild(el('div', 'qb-sol-h', 'Full explanation')); var sb = el('div', 'qb-sol-b');
    if (q.solution) renderRich(sb, q.solution); else { sb.className = 'qb-sol-b qb-sol-none'; sb.textContent = 'Full explanation not added yet.'; }
    solBox.appendChild(sb);
    bSol.addEventListener('click', function () {
      solBox.hidden = !solBox.hidden; bSol.textContent = solBox.hidden ? 'Full explanation' : 'Hide explanation';
    });
    foot.appendChild(bSol);
    foot.appendChild(bCopy); foot.appendChild(bTex);
    if (/^https?:\/\//.test(q.source_url)) { var a = el('a', null, 'Source ↗'); a.href = q.source_url; a.target = '_blank'; a.rel = 'noopener noreferrer'; foot.appendChild(a); }
    var bFlag = el('button', 'qb-lnk flagbtn', '⚑ Flag'); bFlag.type = 'button'; bFlag.title = 'Write what to correct in this question';
    foot.insertBefore(bFlag, foot.firstChild);
    main.appendChild(foot);
    if (solBox) main.appendChild(solBox);
    var fbox = el('div', 'qb-fbox'); fbox.hidden = true;
    var ta = el('textarea', 'qb-ftext'); ta.rows = 3; ta.placeholder = 'What is wrong, and what should be done? (for example: option C should be 2π/3; answer key is B; figure missing)'; ta.setAttribute('aria-label', 'Flag note for this question');
    var frow = el('div', 'qb-frow2'); var bSave = el('button', 'qb-btn primary', 'Save flag'); bSave.type = 'button'; var bDel = el('button', 'qb-btn', 'Remove flag'); bDel.type = 'button'; var bX = el('button', 'qb-lnk', 'Close'); bX.type = 'button'; var fmsg = el('span', 'qb-fmsg');
    frow.appendChild(bSave); frow.appendChild(bDel); frow.appendChild(bX); frow.appendChild(fmsg);
    fbox.appendChild(ta); fbox.appendChild(frow); main.appendChild(fbox);
    var mine = el('div', 'qb-note mine'); mine.hidden = true; main.insertBefore(mine, body);
    var tag = el('span', 'qb-tag rev mine', 'Review'); tag.hidden = true; meta.insertBefore(tag, meta.querySelector('.qb-tag.diff'));
    function paint() { var t = flagOf(q); mine.textContent = t; mine.hidden = !t; tag.hidden = !t; bFlag.textContent = t ? '⚑ Edit flag' : '⚑ Flag'; bDel.hidden = !t; if (document.activeElement !== ta) ta.value = t; }
    card.appendChild(main);
    card.paintFlag = paint; paint();
    bFlag.addEventListener('click', function () { fbox.hidden = !fbox.hidden; if (!fbox.hidden) { ta.value = flagOf(q); ta.focus(); } });
    bX.addEventListener('click', function () { fbox.hidden = true; });
    function commit(text, done) {
      bSave.disabled = bDel.disabled = true; fmsg.textContent = 'Saving…';
      saveFlag(q, text).then(function (where) { paint(); apply(); fmsg.textContent = ''; bSave.disabled = bDel.disabled = false; fbox.hidden = true; if (where === 'browser') flash(bFlag, 'Saved on this browser only'); else flash(bFlag, done); })
        .catch(function () { bSave.disabled = bDel.disabled = false; fmsg.textContent = 'Could not save to the shared list. It is kept on this browser.'; paint(); apply(); });
    }
    bSave.addEventListener('click', function () { if (!ta.value.trim()) { fmsg.textContent = 'Type what to correct first.'; return; } commit(ta.value, 'Flag saved'); });
    bDel.addEventListener('click', function () { commit('', 'Flag removed'); });
    return card;
  }


  function flash(btn, text) { var old = btn.dataset.label || btn.textContent; btn.dataset.label = old; btn.textContent = text; setTimeout(function () { btn.textContent = old; }, 1400); }
  function execCopyNode(node) {
    var sel = window.getSelection(), r = document.createRange();
    r.selectNodeContents(node); sel.removeAllRanges(); sel.addRange(r);
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    sel.removeAllRanges(); return ok;
  }
  function copyRich(q, body, btn) {
    var html = body.innerHTML, plain = QBX.plainText(q);
    var done = function () { flash(btn, 'Copied'); };
    var fallback = function () { flash(btn, execCopyNode(body) ? 'Copied' : 'Copy blocked'); };
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain], { type: 'text/plain' }) })]).then(done, fallback);
      } else fallback();
    } catch (e) { fallback(); }
  }
  function copyPlain(text, btn) {
    var fallback = function () {
      var ta = el('textarea'); ta.value = text; ta.style.position = 'absolute'; ta.style.left = '-9999px'; root.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove(); flash(btn, ok ? 'Copied' : 'Copy blocked');
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { flash(btn, 'Copied'); }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }

  /* ---------- filters ---------- */
  function matches(q, skip) {
    var cp = comboPubs();
    if (skip !== 'exam' && S.exam.size && !S.exam.has(effExam(q, cp))) return false;
    if (skip !== 'year' && S.year.size && !S.year.has(String(effYear(q, cp)))) return false;
    if (skip !== 'cls' && S.cls.size && !S.cls.has(String(q.class))) return false;
    if (skip !== 'diff' && S.diff.size && !S.diff.has(q.difficulty)) return false;
    if (skip !== 'type' && S.type.size && !S.type.has(q.type)) return false;
    if (skip !== 'ch' && S.ch.size && !S.ch.has(q.chapter_code)) return false;
    if (skip !== 'tp' && S.tp.size && !S.tp.has(q.topic_code)) return false;
    if (skip !== 'src' && S.src.size) {
      var sv = srcOf(q);
      if (cp.length) { if (!((q.pyq && cp.indexOf(sv) >= 0) || (sv !== 'PYQs' && cp.indexOf(sv) < 0 && S.src.has(sv)))) return false; }
      else if (!S.src.has(sv)) return false;
    }
    if (S.onlySel && !S.sel.has(q.id)) return false;
    if (S.flag && !isFlagged(q)) return false;
    if (S.attn && !q.attention) return false;
    if (S.oosx && q.oos) return false;
    if (S.oos && !q.oos) return false;
    if (S.q) {
      var hay = (q.id + ' ' + q.question + ' ' + (q.options || []).join(' ') + ' ' + q.chapter + ' ' + q.paper).toLowerCase();
      if (hay.indexOf(S.q) < 0) return false;
    }
    return true;
  }

  /* ---------- everything about one year (opens when a year tile is clicked) ---------- */
  var YM = null, YM_FROM = null;
  function closeYear() { if (!YM) return; YM.remove(); YM = null; document.removeEventListener('keydown', ymKey, true); if (YM_FROM && YM_FROM.focus) { try { YM_FROM.focus(); } catch (e) { /* ignore */ } } }
  function ymKey(e) { if (e.key === 'Escape') { e.stopPropagation(); closeYear(); } }
  function makeYearBtn(t, y, exam, oos) {
    t.setAttribute('role', 'button'); t.tabIndex = 0; t.title = 'Open the summary' + (y ? ' of ' + (exam || '') + ' ' + y : ' of ' + (oos ? 'out-of-syllabus ' : '') + (exam || 'all') + ' questions');
    t.addEventListener('click', function () { openYear(y, t, exam, oos); });
    t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openYear(y, t, exam, oos); } });
  }
  function openYear(y, from, exam, oos) {
    closeYear(); YM_FROM = from || null;
    var rows = VR().filter(function (q) { return q.source === 'PYQ' && (exam ? q.exam === exam : q.exam !== 'KCET') && (y == null || Number(q.year) === y) && (!oos || q.oos); });
    var exams = ['JEE Main', 'JEE Advanced', 'AIEEE', 'IIT', 'KCET'].filter(function (e) { return rows.some(function (q) { return q.exam === e; }); });
    var ov = el('div', 'qb-ymodal'); ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeYear(); });
    var box = el('div', 'qb-ybox'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Summary ' + y);
    var head = el('div', 'qb-yhead');
    var ttl = (oos ? 'Out of syllabus' : (exam || 'All exams')) + (oos && exam ? ' · ' + exam : '') + (y != null ? ' · ' + y : ''); head.appendChild(el('h2', null, ttl + ' · all questions'));
    var x = el('button', 'qb-btn', 'Close'); x.type = 'button'; x.addEventListener('click', closeYear); head.appendChild(x);
    box.appendChild(head);
    var sum = el('div', 'qb-ysum');
    sum.appendChild(el('span', 'qb-tag', rows.length + ' PYQs'));
    if (exams.length > 1) exams.forEach(function (e) { sum.appendChild(el('span', 'qb-tag ' + (e === 'JEE Main' ? 'ex-main' : 'ex-adv'), e + ' ' + rows.filter(function (q) { return q.exam === e; }).length)); });
    ['L1', 'L2', 'L3'].forEach(function (d) { sum.appendChild(el('span', 'qb-tag', d + ' ' + rows.filter(function (q) { return q.difficulty === d; }).length)); });
    var at = rows.filter(function (q) { return !!q.attention; }).length; if (at) sum.appendChild(el('span', 'qb-tag attn', at + ' attention'));
    var fl = rows.filter(isFlagged).length; if (fl) sum.appendChild(el('span', 'qb-tag rev', fl + ' review'));
    var oy = oos ? 0 : rows.filter(function (q) { return q.oos; }).length; if (oy) sum.appendChild(el('span', 'qb-tag oos', oy + ' out of syllabus'));
    box.appendChild(sum);
    var act = el('div', 'qb-yact');
    var all = el('button', 'qb-btn primary', 'Show all these questions in the list'); all.type = 'button';
    all.addEventListener('click', function () { goYear(y, null, exam, oos); }); act.appendChild(all); box.appendChild(act);
    var cwh = el('h3', null, 'Chapter-wise'); box.appendChild(cwh); var selP = null;
    var wrap = el('div', 'qb-tablewrap qb-ytable'); var tbl = el('table'); var th = el('thead'); var hr = el('tr');
    var showEx = exams.length > 1; ['Code', 'Chapter'].concat(showEx ? exams : [], ['Total', 'L1', 'L2', 'L3', '']).forEach(function (h) { hr.appendChild(el('th', null, h)); });
    th.appendChild(hr); tbl.appendChild(th); var tb = el('tbody');
    function fill() {
    tb.innerHTML = ''; var rs = selP ? rows.filter(function (q) { return q.exam + '|' + q.paper === selP.k; }) : rows;
    cwh.textContent = 'Chapter-wise' + (selP ? ' · ' + selP.paper + ' (' + rs.length + ' questions)' : '');
    var tot = { e: {}, all: 0, L1: 0, L2: 0, L3: 0 };
    CHAPTERS.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (c) {
      var mine = rs.filter(function (q) { return q.chapter_code === c.chapter_code; }); if (!mine.length) return;
      var tr = el('tr'); tr.appendChild(el('td', null, c.chapter_code)); tr.appendChild(el('td', null, c.chapter));
      exams.forEach(function (e) { var n = mine.filter(function (q) { return q.exam === e; }).length; tot.e[e] = (tot.e[e] || 0) + n; if (showEx) tr.appendChild(el('td', n ? null : 'z', String(n))); });
      tot.all += mine.length; tr.appendChild(el('td', null, String(mine.length)));
      ['L1', 'L2', 'L3'].forEach(function (d) { var n = mine.filter(function (q) { return q.difficulty === d; }).length; tot[d] += n; tr.appendChild(el('td', n ? null : 'z', String(n))); });
      var td = el('td'); var b = el('button', 'qb-lnk', 'Show'); b.type = 'button'; b.addEventListener('click', function () { goYear(y, c.chapter_code, exam, oos, selP && selP.paper); }); td.appendChild(b); tr.appendChild(td);
      tb.appendChild(tr);
    });
    var tr = el('tr', 'qb-ytot'); tr.appendChild(el('td', null, '')); tr.appendChild(el('td', null, 'Total'));
    if (showEx) exams.forEach(function (e) { tr.appendChild(el('td', null, String(tot.e[e] || 0))); });
    tr.appendChild(el('td', null, String(tot.all))); ['L1', 'L2', 'L3'].forEach(function (d) { tr.appendChild(el('td', null, String(tot[d]))); }); tr.appendChild(el('td', null, ''));
    tb.appendChild(tr);
    }
    fill(); tbl.appendChild(tb); wrap.appendChild(tbl); box.appendChild(wrap);
    // papers / shifts
    var pm = {}; rows.forEach(function (q) { var k = q.exam + '|' + q.paper; if (!pm[k]) pm[k] = { k: k, exam: q.exam, paper: q.paper, sd: q.sort_date || '', n: 0, ch: {}, L1: 0, L2: 0, L3: 0 }; pm[k].n++; if (pm[k][q.difficulty] != null) pm[k][q.difficulty]++; pm[k].ch[q.chapter_code] = 1; });
    var plist = Object.keys(pm).map(function (k) { return pm[k]; }).sort(function (a, b) { return a.exam === b.exam ? (a.sd < b.sd ? 1 : a.sd > b.sd ? -1 : 0) : (a.exam < b.exam ? -1 : 1); });
    var nMain = plist.filter(function (p) { return p.exam === 'JEE Main'; }).length;
    var kind = nMain === plist.length ? 'Shift' : (nMain === 0 ? 'Paper' : 'Paper / shift');
    var kindPl = nMain === plist.length ? 'Shifts' : (nMain === 0 ? 'Papers' : 'Papers and shifts');
    box.appendChild(el('h3', null, kindPl + ' (' + plist.length + ')'));
    var hint = el('div', 'qb-ysum', 'Click a ' + kind.toLowerCase() + ' to see only its questions in the chapter-wise table above. Click it again to see all.'); hint.style.fontSize = '12px'; hint.style.opacity = '.7'; box.appendChild(hint);
    var pw = el('div', 'qb-tablewrap qb-ytable'); var pt = el('table'); var pth = el('thead'); var phr = el('tr');
    [kind, 'Questions', 'Chapters', 'L1', 'L2', 'L3'].forEach(function (h) { phr.appendChild(el('th', null, h)); }); pth.appendChild(phr); pt.appendChild(pth);
    var ptb = el('tbody'); plist.forEach(function (p) { var r = el('tr'); r.style.cursor = 'pointer'; r.tabIndex = 0; r.title = 'Show only this ' + kind.toLowerCase() + ' in the chapter-wise table'; r.appendChild(el('td', null, (showEx ? p.exam + ' · ' : '') + p.paper)); r.appendChild(el('td', null, String(p.n))); r.appendChild(el('td', null, String(Object.keys(p.ch).length))); ['L1', 'L2', 'L3'].forEach(function (d) { r.appendChild(el('td', p[d] ? null : 'z', String(p[d]))); });
      function pick() { var on = !(selP && selP.k === p.k); selP = on ? p : null; Array.prototype.forEach.call(ptb.children, function (t) { t.style.background = ''; t.style.outline = ''; }); if (on) { r.style.background = 'rgba(80,140,255,.18)'; r.style.outline = '1px solid rgba(80,140,255,.6)'; } fill(); }
      r.addEventListener('click', pick); r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }); ptb.appendChild(r); });
    pt.appendChild(ptb); pw.appendChild(pt); box.appendChild(pw);
    ov.appendChild(box); root.appendChild(ov); YM = ov;
    document.addEventListener('keydown', ymKey, true); x.focus();
  }
  function goYear(y, ch, ex, oos, pp) {
    S.exam.clear(); S.ch.clear(); S.tp.clear(); S.year.clear(); S.src.clear(); if (y != null) S.year.add(String(y)); if (ch) S.ch.add(ch); if (ex) S.exam.add(ex);
    S.flag = false; S.attn = false; S.oos = !!oos; if (oos) { S.oosx = false; try { localStorage.setItem('oosEx', '0'); } catch (e) { /* ignore */ } buildChips(); } S.q = pp ? String(pp).toLowerCase() : ''; var se = $('.qb-search'); if (se) se.value = pp || '';
    closeYear(); apply();
    var r = $('.qb-results'); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'start' });
  }
  function goOos(exam) {
    S.exam.clear(); S.ch.clear(); S.tp.clear(); S.year.clear(); S.src.clear(); S.diff.clear(); S.type.clear(); S.cls.clear();
    if (exam) S.exam.add(exam);
    S.flag = false; S.attn = false; S.oos = true; S.oosx = false; try { localStorage.setItem('oosEx', '0'); } catch (e) { /* ignore */ } buildChips(); S.q = ''; var se = $('.qb-search'); if (se) se.value = '';
    apply();
    var r = $('.qb-results'); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'start' });
  }
  function makeSrcBtn(t, v) {
    t.setAttribute('role', 'button'); t.tabIndex = 0; t.title = 'Open the summary of ' + v + ' questions';
    t.addEventListener('click', function () { openSource(v, t); });
    t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSource(v, t); } });
  }
  function exOf(q) { var m = /Exercise-(\d)/.exec(q.paper || q.section || ''); var n = m ? Number(m[1]) : 0; if (q.type === 'Matching') n = 4; else if (q.type === 'Numerical' || q.type === 'Subjective') n = 5; return n; }
  function goSrc(v, ch) {
    S.exam.clear(); S.ch.clear(); S.tp.clear(); S.year.clear(); S.src.clear(); S.diff.clear(); S.type.clear(); S.cls.clear(); S.src.add(v); if (ch) S.ch.add(ch);
    S.flag = false; S.attn = false; S.oos = false; S.q = ''; var se = $('.qb-search'); if (se) se.value = '';
    closeYear(); apply();
    var r = $('.qb-results'); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'start' });
  }
  function openSource(v, from) {
    closeYear(); YM_FROM = from || null;
    var rows = VR().filter(function (q) { return q.source !== 'PYQ' && srcOf(q) === v; });
    var isBB = v === 'Black Book', EX = [1, 2, 3, 4, 5];
    var EXN = { 1: 'Ex-1 Single', 2: 'Ex-2 Multi', 3: 'Ex-3 Compr.', 4: 'Ex-4 Match', 5: 'Ex-5 Subj.' };
    var ov = el('div', 'qb-ymodal'); ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeYear(); });
    var box = el('div', 'qb-ybox'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', v + ' summary');
    var head = el('div', 'qb-yhead');
    head.appendChild(el('h2', null, v + ' · all questions'));
    var x = el('button', 'qb-btn', 'Close'); x.type = 'button'; x.addEventListener('click', closeYear); head.appendChild(x);
    box.appendChild(head);
    var sum = el('div', 'qb-ysum');
    sum.appendChild(el('span', 'qb-tag', rows.length + ' questions'));
    if (isBB) EX.forEach(function (e) { sum.appendChild(el('span', 'qb-tag', 'Exercise-' + e + ' ' + rows.filter(function (q) { return exOf(q) === e; }).length)); });
    ['L1', 'L2', 'L3'].forEach(function (d) { sum.appendChild(el('span', 'qb-tag', d + ' ' + rows.filter(function (q) { return q.difficulty === d; }).length)); });
    var at = rows.filter(function (q) { return !!q.attention; }).length; if (at) sum.appendChild(el('span', 'qb-tag attn', at + ' attention'));
    var fl = rows.filter(isFlagged).length; if (fl) sum.appendChild(el('span', 'qb-tag rev', fl + ' review'));
    box.appendChild(sum);
    var act = el('div', 'qb-yact');
    var all = el('button', 'qb-btn primary', 'Show all ' + v + ' questions in the list'); all.type = 'button';
    all.addEventListener('click', function () { goSrc(v, null); }); act.appendChild(all); box.appendChild(act);
    box.appendChild(el('h3', null, 'Chapter-wise'));
    var wrap = el('div', 'qb-tablewrap qb-ytable'); var tbl = el('table'); var th = el('thead'); var hr = el('tr');
    var cols = ['Code', 'Chapter'].concat(isBB ? EX.map(function (e) { return EXN[e]; }) : [], ['Total', 'L1', 'L2', 'L3', '']);
    cols.forEach(function (h) { hr.appendChild(el('th', null, h)); });
    th.appendChild(hr); tbl.appendChild(th); var tb = el('tbody');
    var tot = { ex: {}, all: 0, L1: 0, L2: 0, L3: 0 };
    CHAPTERS.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (c) {
      var mine = rows.filter(function (q) { return q.chapter_code === c.chapter_code; }); if (!mine.length) return;
      var tr = el('tr'); tr.appendChild(el('td', null, c.chapter_code)); tr.appendChild(el('td', null, c.chapter));
      if (isBB) EX.forEach(function (e) { var n = mine.filter(function (q) { return exOf(q) === e; }).length; tot.ex[e] = (tot.ex[e] || 0) + n; tr.appendChild(el('td', n ? null : 'z', String(n))); });
      tot.all += mine.length; tr.appendChild(el('td', null, String(mine.length)));
      ['L1', 'L2', 'L3'].forEach(function (d) { var n = mine.filter(function (q) { return q.difficulty === d; }).length; tot[d] += n; tr.appendChild(el('td', n ? null : 'z', String(n))); });
      var td = el('td'); var b = el('button', 'qb-lnk', 'Show'); b.type = 'button'; b.addEventListener('click', function () { goSrc(v, c.chapter_code); }); td.appendChild(b); tr.appendChild(td);
      tb.appendChild(tr);
    });
    var tr = el('tr', 'qb-ytot'); tr.appendChild(el('td', null, '')); tr.appendChild(el('td', null, 'Total'));
    if (isBB) EX.forEach(function (e) { tr.appendChild(el('td', null, String(tot.ex[e] || 0))); });
    tr.appendChild(el('td', null, String(tot.all))); ['L1', 'L2', 'L3'].forEach(function (d) { tr.appendChild(el('td', null, String(tot[d]))); }); tr.appendChild(el('td', null, ''));
    tb.appendChild(tr); tbl.appendChild(tb); wrap.appendChild(tbl); box.appendChild(wrap);
    if (!rows.length) box.appendChild(el('p', null, 'No ' + v + ' questions in the bank yet.'));
    ov.appendChild(box); root.appendChild(ov); YM = ov;
    document.addEventListener('keydown', ymKey, true); x.focus();
  }
  function buildYearTiles() {
    var host = document.getElementById('tiles'); if (!host) return;
    host.replaceChildren();
    function box(cls, lbl, n) {
      var t = document.createElement('div'); t.className = cls;
      var l = document.createElement('div'); l.className = 'lbl'; l.textContent = lbl;
      var v = document.createElement('div'); v.className = 'num'; v.textContent = Number(n).toLocaleString('en-US');
      t.appendChild(l); t.appendChild(v); return t;
    }
    function row(hue, head, subs) {
      var r = document.createElement('div'); r.className = 'qb-trow ' + hue;
      r.appendChild(head); subs.forEach(function (s) { r.appendChild(s); }); host.appendChild(r);
    }
    var pyq = VR().filter(function (q) { return q.source === 'PYQ'; });
    var np = VR().filter(function (q) { return q.source !== 'PYQ'; });
    row('h-all', box('qb-tile all', 'All questions', pyq.length + np.length), [box('qb-tile', 'PYQs', pyq.length)]);
    [['JEE Main', 'h-main'], ['JEE Advanced', 'h-adv'], ['AIEEE', 'h-old'], ['IIT', 'h-old'], ['KCET', 'h-kcet']].forEach(function (e) {
      var mine = pyq.filter(function (q) { return q.exam === e[0]; }), cnt = {};
      mine.forEach(function (q) { if (q.year) cnt[q.year] = (cnt[q.year] || 0) + 1; });
      var eh = box('qb-tile', e[0], mine.length); makeYearBtn(eh, null, e[0]);
      row(e[1], eh, Object.keys(cnt).sort(function (x, y) { return Number(y) - Number(x); }).map(function (y) { var t = box('qb-ytile', y, cnt[y]); makeYearBtn(t, Number(y), e[0]); return t; }));
    });
    var oosRows = pyq.filter(function (q) { return q.oos; });
    if (oosRows.length) {
      var oh = box('qb-tile', 'Out of syllabus', oosRows.length); makeYearBtn(oh, null, null, true);
      row('h-oos', oh, ['JEE Main', 'JEE Advanced', 'AIEEE', 'IIT'].filter(function (e) { return oosRows.some(function (q) { return q.exam === e; }); }).map(function (e) { var t = box('qb-ytile', e === 'JEE Advanced' ? 'Advanced' : e, oosRows.filter(function (q) { return q.exam === e; }).length); makeYearBtn(t, null, e, true); return t; }));
    }
    var sc = {}; np.forEach(function (q) { var k = srcOf(q); sc[k] = (sc[k] || 0) + 1; });
    row('h-np', box('qb-tile', 'Non-PYQ', np.length), SRC_VALS.filter(function (v) { return v !== 'PYQs'; }).map(function (v) { var t = box('qb-ytile', v, sc[v] || 0); makeSrcBtn(t, v); return t; }));
  }
  function buildChips() {
    buildYearTiles();
    var defs = {
      src: { vals: SRC_VALS, label: function (v) { return v; } },
      exam: { vals: EXAM_VALS, label: function (v) { return v; } },
      year: { vals: uniq(ROWS.filter(function (q) { return q.year; }).map(function (q) { return String(q.year); })).sort(), label: function (v) { return SESSION[v] || v; } },
      cls: { vals: uniq(ROWS.map(function (q) { return String(q.class); })).sort(), label: function (v) { return 'Class ' + v; } },
      diff: { vals: DIFF_ORDER.filter(function (d) { return ROWS.some(function (q) { return q.difficulty === d; }); }), label: function (v) { return v; } },
      type: { vals: TYPE_ORDER.filter(function (d) { return ROWS.some(function (q) { return q.type === d; }); }), label: function (v) { return v; } }
    };
    defs.year.vals = defs.year.vals.slice().sort(function (a, b) { return Number(b) - Number(a); });
    defs.year.label = function (v) { return v; };
    var DD = { src: 'All sources', exam: 'All exams', year: 'All years', type: 'All question types' };
    DDS = [];
    $$('.qb-chips[data-f]').forEach(function (box) {
      var f = box.dataset.f, d = defs[f];
      if (DD[f]) { buildDropdown(box, f, d, DD[f]); return; }
      box.replaceChildren();
      d.vals.forEach(function (v) {
        var b = el('button', 'qb-chip', d.label(v)); b.type = 'button'; b.dataset.v = v;
        b.addEventListener('click', function () { if (S[f].has(v)) S[f].delete(v); else S[f].add(v); apply(); });
        box.appendChild(b);
      });
    });
  }
  var SRC_VALS = ['PYQs', 'VMC', 'Cengage', 'Avanti', 'PPTs', 'Black Book'], EXAM_VALS = ['JEE Main', 'JEE Advanced', 'AIEEE', 'IIT', 'KCET'];
  function srcOf(q) { return q.source === 'PYQ' ? 'PYQs' : (q.publisher || 'VMC'); }
  /* "PYQs" ticked together with a source that has PYQ-tagged questions (Black Book) = the PYQs of that source only */
  var PYQ_PUBS = {};
  function comboPubs() { if (!S.src.has('PYQs')) return []; var r = []; Object.keys(PYQ_PUBS).forEach(function (p) { if (S.src.has(p)) r.push(p); }); return r; }
  function effExam(q, cp) { return cp.length && q.pyq && q.pyq_exam ? q.pyq_exam : q.exam; }
  function effYear(q, cp) { return cp.length && q.pyq && q.pyq_year ? q.pyq_year : q.year; }
  var DDS = [];
  function buildDropdown(box, f, d, allLabel) {
    box.classList.remove('qb-chips'); box.classList.add('qb-ms', 'qb-dd'); box.replaceChildren();
    var btn = el('button', 'qb-ms-btn', allLabel); btn.type = 'button'; btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    var panel = el('div', 'qb-ms-panel'); panel.hidden = true;
    var tools = el('div', 'qb-ms-tools');
    var bAll = el('button', 'qb-btn', 'All'); bAll.type = 'button'; var bNone = el('button', 'qb-btn', 'Clear'); bNone.type = 'button';
    tools.appendChild(bAll); tools.appendChild(bNone); panel.appendChild(tools);
    var list = el('div', 'qb-ms-list'); panel.appendChild(list); box.appendChild(btn); box.appendChild(panel);
    function open(o) { panel.hidden = !o; btn.setAttribute('aria-expanded', String(o)); }
    btn.addEventListener('click', function () { open(panel.hidden); });
    document.addEventListener('click', function (e) { if (!panel.hidden && e.target.isConnected && !box.contains(e.target)) open(false); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape') { open(false); btn.focus(); } });
    bAll.addEventListener('click', function () { d.vals.forEach(function (v) { S[f].add(v); }); apply(); });
    bNone.addEventListener('click', function () { S[f].clear(); apply(); });
    var boxes = {};
    d.vals.forEach(function (v) {
      var lab = el('label', 'qb-ms-item'); var cb = el('input'); cb.type = 'checkbox';
      cb.addEventListener('change', function () { if (cb.checked) S[f].add(v); else S[f].delete(v); apply(); });
      var n = el('span', 'n', '0'); lab.appendChild(cb); lab.appendChild(el('span', null, d.label(v))); lab.appendChild(n); list.appendChild(lab);
      boxes[v] = { cb: cb, n: n, lab: lab };
    });
    DDS.push(function () {
      var counts = {};
      ROWS.forEach(function (q) { if (matches(q, f)) { var k = f === 'src' ? srcOf(q) : f === 'exam' ? effExam(q, comboPubs()) : f === 'year' ? String(effYear(q, comboPubs())) : q.type; counts[k] = (counts[k] || 0) + 1; } });
      d.vals.forEach(function (v) { var b = boxes[v]; b.cb.checked = S[f].has(v); b.n.textContent = String(counts[v] || 0); b.lab.classList.toggle('zero', !counts[v]); });
      var sel = d.vals.filter(function (v) { return S[f].has(v); });
      btn.textContent = sel.length === 0 ? allLabel : sel.length <= 2 ? sel.map(d.label).join(', ') : sel.length + ' selected';
    });
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }

  /* chapter multi-select */
  var ms = $('#chapter-filter'), msBtn = $('.qb-ms-btn', ms), msPanel = $('.qb-ms-panel', ms), msList = $('.qb-ms-list', ms), msSearch = $('.qb-ms-search', ms);
  var chBefore = '';
  function openMs(open) {
    if (open === msPanel.hidden) {
      if (open) chBefore = Array.from(S.ch).sort().join(',');
      else if (S.ch.size && Array.from(S.ch).sort().join(',') !== chBefore) setTimeout(function () { openTp(true); }, 0);
    }
    msPanel.hidden = !open; msBtn.setAttribute('aria-expanded', String(open)); if (open) { msSearch.value = ''; drawMsList(); msSearch.focus(); }
  }
  msBtn.addEventListener('click', function () { openMs(msPanel.hidden); });
  document.addEventListener('click', function (e) { if (!msPanel.hidden && e.target.isConnected && !ms.contains(e.target)) openMs(false); });
  ms.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openMs(false); msBtn.focus(); } });
  msSearch.addEventListener('input', drawMsList);
  $('.qb-ms-all', ms).addEventListener('click', function () { visibleChapters().forEach(function (c) { S.ch.add(c.chapter_code); }); apply(); });
  $('.qb-ms-none', ms).addEventListener('click', function () { S.ch.clear(); apply(); });
  function visibleChapters() {
    var s = msSearch.value.trim().toLowerCase();
    return CHAPTERS.filter(function (c) { return !s || (c.chapter_code + ' ' + c.chapter).toLowerCase().indexOf(s) >= 0; });
  }
  function drawMsList() {
    if (msPanel.hidden) return;
    var counts = {};
    ROWS.forEach(function (q) { if (matches(q, 'ch')) counts[q.chapter_code] = (counts[q.chapter_code] || 0) + 1; });
    msList.replaceChildren();
    [11, 12].forEach(function (cls) {
      var list = visibleChapters().filter(function (c) { return Number(c.class) === cls; });
      if (!list.length) return;
      msList.appendChild(el('div', 'qb-ms-grp', 'Class ' + cls));
      list.forEach(function (c) {
        var lab = el('label', 'qb-ms-item' + (counts[c.chapter_code] ? '' : ' zero'));
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = S.ch.has(c.chapter_code);
        cb.addEventListener('change', function () { if (cb.checked) S.ch.add(c.chapter_code); else S.ch.delete(c.chapter_code); apply(); });
        lab.appendChild(cb); lab.appendChild(el('span', 'code', c.chapter_code)); lab.appendChild(el('span', null, c.chapter)); lab.appendChild(el('span', 'n', String(counts[c.chapter_code] || 0)));
        msList.appendChild(lab);
      });
    });
  }

  /* topic multi-select (shows once chapters are chosen) */
  var tf = $('#topic-filter'), tpBtn = $('.qb-ms-btn', tf), tpPanel = $('.qb-ms-panel', tf), tpList = $('.qb-ms-list', tf), tpSearch = $('.qb-ms-search', tf);
  function openTp(open) { if (open && !S.ch.size) return; tpPanel.hidden = !open; tpBtn.setAttribute('aria-expanded', String(open)); if (open) { tpSearch.value = ''; drawTpList(); tpSearch.focus(); tf.classList.remove('ask'); } }
  tpBtn.addEventListener('click', function () { openTp(tpPanel.hidden); });
  document.addEventListener('click', function (e) { if (!tpPanel.hidden && e.target.isConnected && !tf.contains(e.target) && !ms.contains(e.target)) openTp(false); });
  tf.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openTp(false); tpBtn.focus(); } });
  tpSearch.addEventListener('input', drawTpList);
  $('.qb-ms-all', tf).addEventListener('click', function () { visibleTopics().forEach(function (t) { S.tp.add(t.topic_code); }); apply(); });
  $('.qb-ms-none', tf).addEventListener('click', function () { S.tp.clear(); apply(); });
  function visibleTopics() {
    var s = tpSearch.value.trim().toLowerCase();
    return TOPICS.filter(function (t) { return S.ch.has(t.chapter_code) && (!s || t.topic.toLowerCase().indexOf(s) >= 0); });
  }
  function drawTpList() {
    if (tpPanel.hidden) return;
    var counts = {};
    ROWS.forEach(function (q) { if (matches(q, 'tp')) counts[q.topic_code] = (counts[q.topic_code] || 0) + 1; });
    tpList.replaceChildren();
    CHAPTERS.filter(function (c) { return S.ch.has(c.chapter_code); }).forEach(function (c) {
      var list = visibleTopics().filter(function (t) { return t.chapter_code === c.chapter_code; });
      if (!list.length) return;
      tpList.appendChild(el('div', 'qb-ms-grp', c.chapter_code + ' · ' + c.chapter));
      list.forEach(function (t) {
        var lab = el('label', 'qb-ms-item' + (counts[t.topic_code] ? '' : ' zero'));
        var cb = el('input'); cb.type = 'checkbox'; cb.checked = S.tp.has(t.topic_code);
        cb.addEventListener('change', function () { if (cb.checked) S.tp.add(t.topic_code); else S.tp.delete(t.topic_code); apply(); });
        lab.appendChild(cb); lab.appendChild(el('span', null, t.topic)); lab.appendChild(el('span', 'n', String(counts[t.topic_code] || 0)));
        tpList.appendChild(lab);
      });
    });
    if (!tpList.children.length) tpList.appendChild(el('div', 'qb-ms-grp', 'No topics match.'));
  }

  $('.qb-search').addEventListener('input', function (e) { S.q = e.target.value.trim().toLowerCase(); apply(); });
  $('.qb-onlysel').addEventListener('click', function () { S.onlySel = !S.onlySel; apply(); });
  $('.qb-flagf').addEventListener('click', function () { S.flag = !S.flag; apply(); });
  $('.qb-attnf').addEventListener('click', function () { S.attn = !S.attn; apply(); });
  $('.qb-oosonly').addEventListener('click', function () { var on = !S.oos; S.oos = on; if (on && S.oosx) { setOosx(false); } apply(); });
  function setOosx(on) {
    S.oosx = on; if (on) S.oos = false;
    try { localStorage.setItem('oosEx', on ? '1' : '0'); } catch (e) { /* ignore */ }
    buildChips(); drawWeight();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.qb-oosx button'), function (b) { b.addEventListener('click', function () { var ex = b.dataset.v === 'ex'; if (ex !== S.oosx) { setOosx(ex); apply(); } }); });
  $('.qb-revall').addEventListener('click', function () { var b = $('.qb-revall'), on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); $('#questions').classList.toggle('rev-all', on); });
  $('.qb-reset').addEventListener('click', function () {
    ['exam', 'year', 'cls', 'diff', 'type', 'ch', 'tp', 'src'].forEach(function (k) { S[k].clear(); });
    S.q = ''; S.onlySel = false; S.flag = false; S.attn = false; S.oos = false; $('.qb-search').value = ''; apply();
  });

  /* ---------- selection ---------- */
  function toggleSel(id, on) { if (on) S.sel.add(id); else S.sel.delete(id); updateSelUI(); }
  $('.qb-selall').addEventListener('click', function () { shown().forEach(function (q) { S.sel.add(q.id); }); updateSelUI(); });
  $('.qb-clear').addEventListener('click', function () { S.sel.clear(); if (S.onlySel) apply(); else updateSelUI(); });
  function shown() { return ROWS.filter(function (q) { return matches(q); }); }
  function selected() { return ROWS.filter(function (q) { return S.sel.has(q.id); }); }

  function exportName(qs) {
    var chs = uniq(qs.map(function (q) { return q.chapter_code; }));
    var exams = uniq(qs.map(function (q) { return q.exam; }));
    var years = uniq(qs.filter(function (q) { return q.year; }).map(function (q) { return String(q.year); })).sort();
    var parts = [];
    if (chs.length === 1) { var c = CHMAP[chs[0]]; parts.push('c' + chs[0] + ' ' + (c ? c.chapter : qs[0].chapter)); }
    else parts.push('Maths');
    if (years.length === 1) parts.push(years[0]); else if (years.length > 1) parts.push(years[0] + '-' + years[years.length - 1]);
    if (exams.length === 1) parts.push(exams[0] === 'JEE Main' ? 'JEE Mains' : exams[0]);
    var srcs = uniq(qs.map(function (q) { return q.source; }));
    parts.push(srcs.length === 1 ? (srcs[0] === 'PYQ' ? 'PYQs' : 'Practice Qs') : 'PYQs + Practice Qs');
    if (chs.length > 1) parts.push('(' + chs.length + ' chapters)');
    return parts.join(' ').replace(/[\\/:*?"<>|]+/g, '-');
  }

  function updateSelUI() {
    var n = S.sel.size;
    $('.qb-nsel').textContent = String(n);
    ['.qb-docx', '.qb-pdf', '.qb-ppt'].forEach(function (k) { $(k).disabled = busy || !n; });
    $('.qb-fname').textContent = n ? 'File name: ' + exportName(selected()) : 'Tick questions to export them.';
    Object.keys(CARDS).forEach(function (id) {
      var c = CARDS[id], on = S.sel.has(id);
      c.classList.toggle('sel', on); c.querySelector('.qb-side input').checked = on;
    });
    $$('.qb-ghead input').forEach(function (g) {
      var ids = g.dataset.ids.split(',');
      var k = ids.filter(function (i) { return S.sel.has(i); }).length;
      g.checked = k === ids.length; g.indeterminate = k > 0 && k < ids.length;
    });
  }

  /* ---------- draw list ---------- */
  /* used by the Must Solve tab: the same cards as the question bank, built from a question id */
  window.QBX = window.QBX || {};
  window.QBX.cardFor = function (id) { var q = BYID[id]; if (!q) return null; var c = buildCard(q); c.querySelector('.qb-num').textContent = ''; return c; };
  window.QBX.hasRows = function () { return ROWS.length > 0; };
  function apply() {
    $$('.qb-chips[data-f] .qb-chip').forEach(function (b) { var f = b.parentNode.dataset.f; b.setAttribute('aria-pressed', String(S[f].has(b.dataset.v))); });
    DDS.forEach(function (fn) { fn(); });
    $('.qb-onlysel').setAttribute('aria-pressed', String(S.onlySel));
    $('.qb-flagf').setAttribute('aria-pressed', String(S.flag));
    $('.qb-flagf').textContent = 'Review (' + flagCount() + ')';
    $('.qb-attnf').setAttribute('aria-pressed', String(S.attn));
    $('.qb-attnf').textContent = 'Attention (' + attnCount() + ')';
    $('.qb-oosonly').setAttribute('aria-pressed', String(S.oos));
    Array.prototype.forEach.call(document.querySelectorAll('.qb-oosx button'), function (b) { b.setAttribute('aria-pressed', String((b.dataset.v === 'ex') === S.oosx)); if (b.dataset.v === 'in') b.textContent = 'Include (' + oosCount() + ')'; });
    msBtn.textContent = S.ch.size === 0 ? 'All chapters' : S.ch.size === 1 ? (function () { var c = CHMAP[Array.from(S.ch)[0]]; return c ? c.chapter_code + ' ' + c.chapter : '1 chapter'; })() : S.ch.size + ' chapters';
    var tpCh = {}; TOPICS.forEach(function (t) { tpCh[t.topic_code] = t.chapter_code; }); Array.from(S.tp).forEach(function (t) { if (!S.ch.has(tpCh[t])) S.tp.delete(t); });
    var wasHidden = tf.hidden;
    tf.hidden = !S.ch.size;
    if (wasHidden && !tf.hidden) tf.classList.add('ask');
    if (tf.hidden) { tpPanel.hidden = true; tf.classList.remove('ask'); }
    tpBtn.textContent = S.tp.size === 0 ? 'All topics' : S.tp.size === 1 ? (TOPICS.filter(function (t) { return S.tp.has(t.topic_code); })[0] || { topic: '1 topic' }).topic : S.tp.size + ' topics';
    drawTpList();
    updateFlagCol();
    var pills = $('.qb-pills'); pills.replaceChildren();
    CHAPTERS.filter(function (c) { return S.ch.has(c.chapter_code); }).forEach(function (c) {
      var p = el('button', 'qb-pill', c.chapter_code + ' ' + c.chapter + ' ×'); p.type = 'button'; p.setAttribute('aria-label', 'Remove ' + c.chapter);
      p.addEventListener('click', function () { S.ch.delete(c.chapter_code); apply(); });
      pills.appendChild(p);
    });
    TOPICS.filter(function (t) { return S.tp.has(t.topic_code); }).forEach(function (t) {
      var p = el('button', 'qb-pill tp', t.topic + ' ×'); p.type = 'button'; p.setAttribute('aria-label', 'Remove topic ' + t.topic);
      p.addEventListener('click', function () { S.tp.delete(t.topic_code); apply(); });
      pills.appendChild(p);
    });
    $$('#overview tbody tr').forEach(function (tr) { tr.classList.toggle('on', S.ch.has(tr.dataset.key)); });
    drawMsList();

    var list = $('#questions');
    var rows = shown();
    $('.qb-nshow').textContent = String(rows.length);
    var key = filterKey();
    if (key !== lastKey) { lastKey = key; page = 0; }
    var pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    if (page >= pages) page = pages - 1;
    list.replaceChildren();
    if (!rows.length) { list.appendChild(el('div', 'qb-empty', ROWS.length ? 'No questions match these filters.' : '')); updateSelUI(); return; }
    var byChapter = {};
    rows.forEach(function (q) { (byChapter[q.chapter_code] = byChapter[q.chapter_code] || []).push(q); });
    var start = page * PER_PAGE, slice = rows.slice(start, start + PER_PAGE);
    if (pages > 1) list.appendChild(pager(pages, start, slice.length, rows.length));
    var cur = null;
    slice.forEach(function (q, k) {
      if (cur !== q.chapter_code) {
        cur = q.chapter_code;
        var c = CHMAP[cur], all = byChapter[cur];
        var head = el('div', 'qb-ghead');
        head.id = 'ch-' + cur;
        head.appendChild(el('span', 'code', 'c' + cur));
        head.appendChild(el('h2', null, c ? c.chapter : q.chapter));
        head.appendChild(el('span', 'n', all.length + (all.length === 1 ? ' question' : ' questions')));
        var lab = el('label'), cb = el('input'); cb.type = 'checkbox'; cb.dataset.ids = all.map(function (x) { return x.id; }).join(',');
        cb.addEventListener('change', function () { all.forEach(function (x) { if (cb.checked) S.sel.add(x.id); else S.sel.delete(x.id); }); updateSelUI(); });
        lab.appendChild(cb); lab.appendChild(document.createTextNode('Select whole chapter'));
        head.appendChild(lab);
        list.appendChild(head);
      }
      if (!CARDS[q.id]) CARDS[q.id] = buildCard(q);
      CARDS[q.id].querySelector('.qb-num').textContent = String(start + k + 1);
      list.appendChild(CARDS[q.id]);
    });
    if (pages > 1) list.appendChild(pager(pages, start, slice.length, rows.length));
    updateSelUI();
  }
  function filterKey() {
    return ['exam', 'year', 'cls', 'diff', 'type', 'ch', 'tp', 'src'].map(function (k) { return Array.from(S[k]).sort().join(','); }).join('|') + '|' + S.q + '|' + S.onlySel + '|' + S.flag + '|' + S.attn + '|' + S.oos + '|' + S.oosx;
  }
  function pager(pages, start, n, total) {
    var nav = el('nav', 'qb-pager'); nav.setAttribute('aria-label', 'Pages');
    nav.appendChild(el('span', 'qb-pinfo', (start + 1) + '–' + (start + n) + ' of ' + total));
    var go = function (p) { page = p; apply(); var top = $('#selection'); if (top) top.scrollIntoView({ block: 'start' }); };
    var btn = function (label, p, on, disabled) { var b = el('button', 'qb-pbtn' + (on ? ' on' : ''), label); b.type = 'button'; b.disabled = !!disabled; if (on) b.setAttribute('aria-current', 'page'); b.addEventListener('click', function () { go(p); }); nav.appendChild(b); };
    btn('‹ Prev', page - 1, false, page === 0);
    var shownPages = [];
    for (var p = 0; p < pages; p++) if (p === 0 || p === pages - 1 || Math.abs(p - page) <= 2) shownPages.push(p);
    shownPages.forEach(function (p, i) {
      if (i && p - shownPages[i - 1] > 1) nav.appendChild(el('span', 'qb-pgap', '…'));
      btn(String(p + 1), p, p === page);
    });
    btn('Next ›', page + 1, false, page === pages - 1);
    return nav;
  }

  /* ---------- overview table ---------- */
  function chapterFlagCounts() {
    var m = {}; ROWS.forEach(function (q) { if (isFlagged(q)) m[q.chapter_code] = (m[q.chapter_code] || 0) + 1; }); return m;
  }
  function chapterAttnCounts() {
    var m = {}; ROWS.forEach(function (q) { if (q.attention) m[q.chapter_code] = (m[q.chapter_code] || 0) + 1; }); return m;
  }
  function updateFlagCol() {
    var m = chapterFlagCounts(), a = chapterAttnCounts();
    $$('#overview tbody tr').forEach(function (tr) {
      var td = tr.lastChild; if (!td) return; var n = m[tr.dataset.key] || 0;
      td.textContent = String(n); td.className = n === 0 ? 'z' : '';
      var ta = td.previousSibling; if (!ta) return; var k = a[tr.dataset.key] || 0;
      ta.textContent = String(k); ta.className = k === 0 ? 'z' : '';
    });
  }
  /* ---------- chapter weightage graph ---------- */
  var WC = { exam: 'all', yrs: 'all', sort: 'count', pct: false };
  function drawWeight() {
    var body = $('#wchartBody'); if (!body) return;
    var pyq = VR().filter(function (q) { return q.source === 'PYQ' && q.year && q.exam !== 'KCET'; });
    var maxY = pyq.reduce(function (m, q) { return Math.max(m, q.year); }, 0);
    var from = WC.yrs === 'all' ? 0 : maxY - Number(WC.yrs) + 1;
    var rows = pyq.filter(function (q) {
      if (q.year < from) return false;
      if (WC.exam === 'main') return q.exam === 'JEE Main' || q.exam === 'AIEEE';
      if (WC.exam === 'adv') return q.exam === 'JEE Advanced' || q.exam === 'IIT';
      return true;
    });
    var m = {}; CHAPTERS.forEach(function (c) { m[c.chapter_code] = { c: c, main: 0, adv: 0 }; });
    rows.forEach(function (q) { var r = m[q.chapter_code]; if (!r) return; if (q.exam === 'JEE Main' || q.exam === 'AIEEE') r.main++; else r.adv++; });
    var list = Object.keys(m).map(function (k) { return m[k]; });
    list.forEach(function (r) { r.n = r.main + r.adv; });
    if (WC.sort === 'count') list.sort(function (a, b) { return b.n - a.n; });
    var total = rows.length, top = list.reduce(function (t, r) { return Math.max(t, r.n); }, 0) || 1;
    body.replaceChildren();
    var yl = WC.yrs === 'all' ? 'all years' : (from + '–' + maxY);
    body.appendChild(el('div', 'qb-wc-sub', total.toLocaleString('en-US') + ' previous-year questions in the bank · ' + yl + '. Click a bar to list that chapter\u2019s questions. Chapters whose PYQ PDFs are not uploaded yet show fewer questions.'));
    list.forEach(function (r) {
      var row = el('button', 'qb-wc-row'); row.type = 'button'; row.title = r.c.chapter_code + ' ' + r.c.chapter + ': ' + r.n + ' questions';
      row.appendChild(el('span', 'qb-wc-lbl', r.c.chapter_code + ' ' + r.c.chapter));
      var tr = el('span', 'qb-wc-track'), w = r.n / top * 100;
      var a = el('span', 'qb-wc-seg main'); a.style.width = (r.main / top * 100) + '%'; tr.appendChild(a);
      var b = el('span', 'qb-wc-seg adv'); b.style.width = (r.adv / top * 100) + '%'; tr.appendChild(b);
      row.appendChild(tr);
      row.appendChild(el('span', 'qb-wc-val', WC.pct ? (total ? (r.n / total * 100).toFixed(1) : '0.0') + '%' : String(r.n)));
      row.addEventListener('click', function () {
        S.ch.clear(); S.ch.add(r.c.chapter_code); S.oos = false;
        if (WC.exam === 'main') { S.exam.clear(); S.exam.add('JEE Main'); S.exam.add('AIEEE'); } else if (WC.exam === 'adv') { S.exam.clear(); S.exam.add('JEE Advanced'); S.exam.add('IIT'); }
        apply(); var rs = $('.qb-results .qb-bar'); var t = $('#selection'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'start' });
      });
      body.appendChild(row);
    });
    var lg = el('div', 'qb-wc-leg');
    if (WC.exam !== 'adv') lg.appendChild(el('span', 'qb-wc-key main', 'JEE Main + AIEEE'));
    if (WC.exam !== 'main') lg.appendChild(el('span', 'qb-wc-key adv', 'JEE Advanced + IIT'));
    body.appendChild(lg);
  }
  function wireWeight() {
    $$('#wchart [data-wc]').forEach(function (g) {
      var k = g.dataset.wc;
      $$('button', g).forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.dataset.v; if (k === 'pct') WC.pct = v === '1'; else WC[k] = v;
          $$('button', g).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          drawWeight();
        });
      });
    });
  }
  function drawOverview(rows) {
    var tb = $('#overview tbody');
    tb.replaceChildren();
    var chFl = chapterFlagCounts(), chAt = chapterAttnCounts(), chOos = {};
    ROWS.forEach(function (q) { if (q.oos) chOos[q.chapter_code] = (chOos[q.chapter_code] || 0) + 1; });
    rows.forEach(function (r) {
      r.flagged = chFl[r.chapter_code] || 0; r.attn = chAt[r.chapter_code] || 0; r.oos = chOos[r.chapter_code] || 0;
      var tr = el('tr'); tr.dataset.key = r.chapter_code;
      ['chapter_code', 'chapter', 'main_all', 'adv_all', 'kcet_all', 'src_VMC', 'src_Cengage', 'src_PPTs', 'src_BlackBook', 'nonpyq', 'total', 'oos', 'attn', 'flagged'].forEach(function (k) {
        var td = el('td', typeof r[k] === 'number' && r[k] === 0 ? 'z' : null, String(r[k]));
        tr.appendChild(td);
      });
      tr.addEventListener('click', function () { if (S.ch.has(r.chapter_code)) S.ch.delete(r.chapter_code); else S.ch.add(r.chapter_code); apply(); });
      tb.appendChild(tr);
    });
    $$('#overview tbody tr').forEach(function (tr) { tr.classList.toggle('on', S.ch.has(tr.dataset.key)); });
  }

  /* ---------- export ---------- */
  var dl = window.__browserDownloads || null;
  try { if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then(function (d) { if (d) dl = d; }); } catch (e) {}
  function msg(t, bad) { var m = $('.qb-msg'); m.textContent = t || ''; m.classList.toggle('bad', !!bad); }
  function opts() {
    var ans = $('.qb-o-ans').checked;
    return { answers: ans || $('.qb-o-key').checked, answerKey: $('.qb-o-key').checked, pptLayout: $('.qb-o-ppt').checked };
  }
  function save(filename, data) {
    if (!dl) { msg('Downloads are not available in this view. Open the dashboard on claude.ai to export.', true); return Promise.resolve(false); }
    return dl.save({ filename: filename, data: data }).then(function () { msg('Saved ' + filename); return true; }, function (e) {
      var code = e && e.code;
      if (code === 'declined') msg('Download cancelled.');
      else if (code === 'rate_limited') msg('A download prompt is already open.', true);
      else msg('Could not save the file (' + (code || 'error') + ').', true);
      return false;
    });
  }
  var busy = false;
  function setBusy(on) { busy = on; ['.qb-docx', '.qb-pdf', '.qb-ppt'].forEach(function (k) { $(k).disabled = on || !S.sel.size; }); }
  function exportWith(ext, build) {
    var qs = selected(); if (!qs.length || busy) return;
    var name = exportName(qs), o = opts(); o.title = name;
    setBusy(true); msg('Building ' + ext.toUpperCase() + ' (' + qs.length + ' questions)…');
    setTimeout(function () {
      Promise.resolve().then(function () { return build(qs, o); })
        .then(function (bytes) { return save(name + '.' + ext, bytes instanceof Blob ? bytes : new Blob([bytes])); })
        .catch(function (e) { msg('Could not build the ' + ext.toUpperCase() + ' file: ' + (e && e.message || e), true); })
        .then(function () { setBusy(false); });
    }, 30);
  }
  $('.qb-docx').addEventListener('click', function () { exportWith('docx', function (qs, o) { return QBX.buildDocx(qs, o); }); });
  $('.qb-ppt').addEventListener('click', function () { exportWith('pptx', function (qs, o) { return window.__qbCwPptx ? window.__qbCwPptx(qs.map(function (x) { return x.id; }), qs, o) : QBX.buildPptx(qs, o); }); });
  $('.qb-pdf').addEventListener('click', function () {
    var qs = selected(); if (!qs.length || busy) return;
    var name = exportName(qs), o = opts(); o.title = name;
    setBusy(true); msg('Building PDF…');
    QBX.buildPdf(qs, o, function (i, n) { msg('Building PDF: page ' + i + ' of ' + n + '…'); })
      .then(function (bytes) { return save(name + '.pdf', new Blob([bytes])); })
      .catch(function (e) {
        msg('This browser would not draw the PDF pages (' + (e && e.message || 'blocked') + '), so a print-ready page is being saved instead: open it and choose "Save as PDF".', true);
        return save(name + ' (print to PDF).html', QBX.printDocument(qs, o));
      })
      .then(function () { setBusy(false); });
  });

  /* ---------- data ---------- */
  function showState(d, c) {
    var list = $('#questions');
    if (d.status === 'error' || c.status === 'error') {
      list.replaceChildren(el('div', 'qb-failed', 'Failed to load'));
      return true;
    }
    if (d.status !== 'ok' || c.status !== 'ok') {
      if (!ROWS.length) list.replaceChildren(el('div', 'qb-empty dash-skeleton'));
      return true;
    }
    return false;
  }

  dash.onData(function () {
    try { if (dash.colors && dash.colors.length > 1) { root.style.setProperty('--qb-c1', dash.colors[0]); root.style.setProperty('--qb-c2', dash.colors[dash.colors.length > 4 ? 4 : 1]); } } catch (e) { /* default accents */ }
    var d = dash.data('pyq'), c = dash.data('chapters');
    var counts = dash.data('counts'), byc = dash.data('by_chapter');
    if (counts.status === 'ok') {
      $$('#tiles .num').forEach(function (n) {
        var g = n.dataset.where.split('=')[1];
        var r = (counts.data || []).filter(function (x) { return x.group === g; })[0];
        n.textContent = r ? d3.format(',')(r.n) : '—';
        n.classList.remove('dash-skeleton');
      });
    } else if (counts.status === 'error') {
      $$('#tiles .num').forEach(function (n) { n.textContent = '—'; n.classList.remove('dash-skeleton'); });
    }
    if (showState(d, c)) return;
    var tps = dash.data('topics');
    if (tps.status === 'ok' && tpBuiltFrom !== tps.data) {
      tpBuiltFrom = tps.data;
      TOPICS = tps.data.map(function (r) { return { chapter_code: r.chapter_code, topic_code: r.topic_code, topic: r.topic }; });
      if (ROWS.length) apply();
    }
    if (chBuiltFrom !== c.data) {
      chBuiltFrom = c.data;
      CHAPTERS = c.data.map(function (r) { return { chapter_code: r.chapter_code, chapter: r.chapter, class: Number(r.class), order: Number(r.order) }; });
      CHMAP = {}; CHAPTERS.forEach(function (r) { CHMAP[r.chapter_code] = r; });
    }
    var np = dash.data('nonpyq'), npData = np.status === 'ok' ? np.data : [];
    if (builtFrom !== d.data || npFrom !== npData) {
      builtFrom = d.data; npFrom = npData;
      ROWS = d.data.map(function (q) { return Object.assign({ source: 'PYQ' }, q); }).concat(npData.map(function (q) { return Object.assign({}, q, { source: 'Non-PYQ' }); })).map(function (q) {
        var o = q.options; if (typeof o === 'string') { try { o = JSON.parse(o); } catch (e) { o = []; } }
        return { id: String(q.id), pyq: !!q.pyq, pyq_ref: q.pyq_ref ? String(q.pyq_ref) : '', pyq_exam: q.pyq_exam ? String(q.pyq_exam) : '', pyq_year: q.pyq_year ? Number(q.pyq_year) : null, pyq_paper: q.pyq_paper ? String(q.pyq_paper) : '', source: q.source, publisher: q.publisher ? String(q.publisher) : '', part: q.part ? String(q.part) : '', ref_year: q.ref_year ? Number(q.ref_year) : null, note: q.note ? String(q.note) : '', oos: !!q.oos, exam: q.exam, year: q.year ? Number(q.year) : null, session: q.session, paper: q.paper, qno: Number(q.qno) || 0, type: q.type, class: Number(q.class), chapter_code: q.chapter_code, chapter: q.chapter, topic_code: q.topic_code || '', topic: q.topic || '', sort_date: q.sort_date || '', difficulty: q.difficulty, attention: q.attention ? String(q.attention) : '', figure: (function (f) { if (typeof f === 'string') { try { f = JSON.parse(f); } catch (e) { f = null; } } return f && f.svg ? { svg: String(f.svg), w: Number(f.w) || 160, h: Number(f.h) || 120, card: f.card && (f.card.imgs || f.card.opts) ? f.card : null } : null; })(q.figure), question: q.question || '', options: o || [], answer: q.answer == null ? '' : String(q.answer), source_url: q.source_url || '', solution: q.solution ? String(q.solution) : '' };
      }).sort(cmp);
      BYID = {}; CARDS = {};
      PYQ_PUBS = {}; ROWS.forEach(function (q) { BYID[q.id] = q; if (q.pyq && q.publisher) PYQ_PUBS[q.publisher] = 1; });
      Array.from(S.sel).forEach(function (id) { if (!BYID[id]) S.sel.delete(id); });
      buildChips();
      apply();
      if (!loadFlags.done) { loadFlags.done = true; loadFlags(); }
    }
    if (byc.status === 'ok') drawOverview(byc.data);
    wireWeight(); drawWeight();
  });
})();