/* Avanti Fellows · editable Word and PowerPoint export (Zero External CDN Dependencies).
   Text stays text and every formula is a native Office equation (<m:oMath>). */
(function (root) {
'use strict';
const M = () => root.MathDoc;
const NAVY = '1E3A8A', GREY = '6B7280';
const LET = 'ABCDEF';
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cleanFigTag = s => String(s == null ? '' : s).replace(/\s*\{\{figure\}\}\s*/g, ' ').replace(/\s*\{\{f[1-9]\}\}\s*/g, ' ').trim();

/* ---------- Built-in Stored ZIP Packager (Zero JSZip Dependency) ---------- */
const CRC = (function () {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(u8) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function zipBytes(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255];
  const u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  files.forEach(f => {
    const name = enc.encode(f.name);
    const data = typeof f.data === 'string' ? enc.encode(f.data) : (f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data));
    const crc = crc32(data);
    const head = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0)));
    parts.push(head, name, data);
    central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
    offset += head.length + name.length + data.length;
  });
  const csize = central.reduce((s, p) => s + p.length, 0);
  const end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(csize), u32(offset), u16(0)));
  const list = parts.concat(central, [end]);
  const len = list.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len);
  let pos = 0;
  list.forEach(p => { out.set(p, pos); pos += p.length; });
  return out;
}
function zipBlob(files, mimeType) {
  return new Blob([zipBytes(files)], { type: mimeType });
}

const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OD_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
function relsXml(list) {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + REL_NS + '">' +
    list.map(r => '<Relationship Id="' + r[0] + '" Type="' + OD_REL + r[1] + '" Target="' + r[2] + '"/>').join('') +
    '</Relationships>';
}

/* ---------- Shared Layout Helpers ---------- */
function optPerLine(q, W) {
  const opts = q.o || q.options || [];
  if (!opts.length) return 1;
  if (opts.some(o => /\\\[|\n|\\begin\{(b|p|v|V)?matrix|\\begin\{array/.test(o))) return 1;
  const mx = Math.max(...opts.map(o => M().width(o)));
  for (const n of [4, 2]) if (mx <= (W / n / 210 - 2.1) * 0.92) return n;
  return 1;
}
function chapterName(H, q) {
  if (H && H.CHMAP && H.CHMAP.get) { const c = H.CHMAP.get(q.cc); return c ? c.n : (q.chapter || ''); }
  return q.chapter || '';
}
function matchParts(text) {
  const ls = String(text || '').split('\n');
  const re1 = /^\s*(?:List|Column)[\s-]*(?:I|1)\s*:?\s*$/i;
  const re2 = /^\s*(?:List|Column)[\s-]*(?:II|2)\s*:?\s*$/i;
  const a = ls.findIndex(l => re1.test(l)), b = ls.findIndex(l => re2.test(l));
  if (a < 0 || b <= a + 1) return null;
  const left = ls.slice(a + 1, b).filter(x => x.trim()), right = ls.slice(b + 1).filter(x => x.trim());
  if (!left.length || !right.length) return null;
  return {
    pre: ls.slice(0, a).join('\n').trim(),
    head: [ls[a].replace(/:\s*$/, '').trim(), ls[b].replace(/:\s*$/, '').trim()],
    left,
    right
  };
}

/* ---------- Native Word (.docx) Generator (Pure OpenXML + MathDoc OMML) ---------- */
const DOC_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

const DOCX_STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults>' +
  '<w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault>' +
  '<w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="252" w:lineRule="auto"/></w:pPr></w:pPrDefault>' +
  '</w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>' +
  '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="20" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="20" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>' +
  '</w:styles>';

function wRun(text, o) {
  if (!text) return '';
  o = o || {};
  const font = o.font || 'Calibri';
  let pr = '<w:rFonts w:ascii="' + font + '" w:hAnsi="' + font + '" w:cs="' + font + '"/>';
  if (o.b) pr += '<w:b/><w:bCs/>';
  if (o.i) pr += '<w:i/><w:iCs/>';
  if (o.color) pr += '<w:color w:val="' + o.color + '"/>';
  const sz = o.sz || 21;
  pr += '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/>';
  if (o.spc) pr += '<w:spacing w:val="' + o.spc + '"/>';
  const lines = String(text).split('\n');
  let inner = '';
  lines.forEach((ln, idx) => {
    if (idx > 0) inner += '<w:br/>';
    if (ln) inner += '<w:t xml:space="preserve">' + esc(ln) + '</w:t>';
  });
  return inner ? '<w:r><w:rPr>' + pr + '</w:rPr>' + inner + '</w:r>' : '';
}

function wPara(inner, o) {
  o = o || {};
  let ppr = '';
  if (o.keepNext) ppr += '<w:keepNext/>';
  if (o.keepLines) ppr += '<w:keepLines/>';
  if (o.pageBreakBefore) ppr += '<w:pageBreakBefore/>';
  if (o.borderBottom) ppr += '<w:pBdr><w:bottom w:val="single" w:sz="' + (o.borderBottom.sz || 6) + '" w:space="' + (o.borderBottom.space || 2) + '" w:color="' + (o.borderBottom.color || NAVY) + '"/></w:pBdr>';
  if (o.borderTop) ppr += '<w:pBdr><w:top w:val="single" w:sz="' + (o.borderTop.sz || 4) + '" w:space="' + (o.borderTop.space || 4) + '" w:color="' + (o.borderTop.color || 'CBD2E0') + '"/></w:pBdr>';
  if (o.tabs && o.tabs.length) {
    ppr += '<w:tabs>' + o.tabs.map(t => '<w:tab w:val="' + (t.val || 'left') + '" w:pos="' + t.pos + '"/>').join('') + '</w:tabs>';
  }
  const bef = o.before != null ? o.before : 0;
  const aft = o.after != null ? o.after : 40;
  ppr += '<w:spacing w:before="' + bef + '" w:after="' + aft + '"/>';
  if (o.left != null || o.hanging != null) {
    ppr += '<w:ind' + (o.left != null ? ' w:left="' + o.left + '"' : '') + (o.hanging != null ? ' w:hanging="' + o.hanging + '"' : '') + '/>';
  }
  if (o.align) ppr += '<w:jc w:val="' + o.align + '"/>';
  if (o.sectPr) ppr += o.sectPr;
  return '<w:p><w:pPr>' + ppr + '</w:pPr>' + (inner || '') + '</w:p>';
}

function wDrawing(figObj, maxW) {
  maxW = maxW || 220;
  const wPx = Math.min(figObj.w || 200, maxW);
  const hPx = Math.round((figObj.h || 140) * wPx / (figObj.w || 200));
  const cx = wPx * 9525, cy = hPx * 9525, id = 1000 + figObj.n;
  return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">' +
    '<wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
    '<wp:docPr id="' + id + '" name="Figure ' + figObj.n + '"/>' +
    '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    '<pic:pic><pic:nvPicPr><pic:cNvPr id="' + id + '" name="fig' + figObj.n + '.png"/><pic:cNvPicPr/></pic:nvPicPr>' +
    '<pic:blipFill><a:blip r:embed="rIdF' + figObj.n + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
    '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
    '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
}

function wRichRuns(text, runOpt) {
  let out = '';
  M().split(cleanFigTag(text)).forEach(p => {
    if (p.t === 'text') out += wRun(p.s, runOpt);
    else {
      const t = p.s.replace(/\s+$/, '');
      if (/[^=<>]=$/.test(t)) {
        out += M().omml(t.slice(0, -1), false, 'docx');
        out += wRun(' =', runOpt);
      } else {
        out += M().omml(p.s, false, 'docx');
      }
    }
  });
  return out;
}

function wBlocks(text, firstRuns, popt, runOpt) {
  const out = [];
  let cur = firstRuns || '';
  const flush = () => {
    if (cur) { out.push(wPara(cur, popt)); cur = ''; }
  };
  M().split(cleanFigTag(text)).forEach(p => {
    if (p.t === 'text') {
      const lines = p.s.split('\n');
      lines.forEach((ln, idx) => {
        if (idx > 0) flush();
        if (ln) cur += wRun(ln, runOpt);
      });
    } else if (p.display) {
      flush();
      out.push(wPara(M().omml(p.s, true, 'docx'), {
        before: 40,
        after: 60,
        left: popt && popt.left ? popt.left : undefined,
        keepNext: popt && popt.keepNext
      }));
    } else {
      const t = p.s.replace(/\s+$/, '');
      if (/[^=<>]=$/.test(t)) {
        cur += M().omml(t.slice(0, -1), false, 'docx') + wRun(' =', runOpt);
      } else {
        cur += M().omml(p.s, false, 'docx');
      }
    }
  });
  flush();
  return out.length ? out : [wPara('', popt)];
}

const W_NOBDR = '<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>';
const W_GRIDBDR = '<w:top w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/><w:left w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/><w:right w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="94A3B8"/>';

function wMatchTable(mt, colW, indentLeft) {
  const tw = colW - (indentLeft || 340), cw = Math.floor(tw / 2);
  const cell = (txt, isHead) => '<w:tc><w:tcPr><w:tcW w:w="' + cw + '" w:type="dxa"/>' +
    (isHead ? '<w:shd w:val="clear" w:color="auto" w:fill="EEF2FF"/>' : '') +
    '<w:tcMar><w:top w:w="40" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tcMar></w:tcPr>' +
    wBlocks(txt || '', '', { before: 0, after: 0 }, isHead ? { b: true, color: NAVY } : null).join('') + '</w:tc>';
  const rows = ['<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' + cell(mt.head[0], true) + cell(mt.head[1], true) + '</w:tr>'];
  const n = Math.max(mt.left.length, mt.right.length);
  for (let r = 0; r < n; r++) {
    rows.push('<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cell(mt.left[r] || '', false) + cell(mt.right[r] || '', false) + '</w:tr>');
  }
  return '<w:tbl><w:tblPr><w:tblW w:w="' + (cw * 2) + '" w:type="dxa"/><w:tblInd w:w="' + (indentLeft || 340) + '" w:type="dxa"/><w:tblBorders>' + W_GRIDBDR + '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>' +
    '<w:tblGrid><w:gridCol w:w="' + cw + '"/><w:gridCol w:w="' + cw + '"/></w:tblGrid>' + rows.join('') + '</w:tbl>';
}

function wOptionsBlock(q, colW) {
  const opts = q.o || q.options || [];
  if (!opts.length) {
    if (q.t === 'Numerical' || q.type === 'Numerical') return wPara(wRun('Ans: ________________', { color: '475569', b: true }), { left: 340, before: 30, after: 60 });
    return wPara('', { after: 60 });
  }
  const availW = colW - 340;
  const per = optPerLine({ o: opts }, availW);
  const labelRun = k => wRun('(' + LET[k] + ') ', { b: true, color: NAVY });
  if (per > 1) {
    const cw = Math.floor(availW / per), rows = [];
    for (let r = 0; r < opts.length; r += per) {
      let cells = '';
      for (let c = 0; c < per; c++) {
        const k = r + c;
        const inner = k < opts.length ? wBlocks(opts[k], labelRun(k), { before: 0, after: 20 }, null).join('') : wPara('', { before: 0, after: 0 });
        cells += '<w:tc><w:tcPr><w:tcW w:w="' + cw + '" w:type="dxa"/><w:tcMar><w:top w:w="10" w:type="dxa"/><w:bottom w:w="10" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar></w:tcPr>' + inner + '</w:tc>';
      }
      rows.push('<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cells + '</w:tr>');
    }
    return '<w:tbl><w:tblPr><w:tblW w:w="' + (cw * per) + '" w:type="dxa"/><w:tblInd w:w="340" w:type="dxa"/><w:tblBorders>' + W_NOBDR + '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>' +
      '<w:tblGrid>' + Array(per).fill('<w:gridCol w:w="' + cw + '"/>').join('') + '</w:tblGrid>' + rows.join('') + '</w:tbl>' +
      wPara('', { before: 0, after: 30 });
  }
  return opts.map((op, k) => wBlocks(op, labelRun(k), { left: 700, hanging: 360, before: 0, after: 24, keepNext: k < opts.length - 1 }, null).join('')).join('');
}

function wHeaderBlock(p, W) {
  const dt = p.date ? new Date(p.date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const c1 = '<w:tc><w:tcPr><w:tcW w:w="2700" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>' +
    wPara(wRun('Avanti Fellows', { font: 'Cambria', b: true, sz: 28, color: NAVY }), { after: 0 }) +
    wPara(wRun('JEE MATHEMATICS', { font: 'Calibri', b: true, sz: 15, color: GREY, spc: 24 }), { after: 20 }) + '</w:tc>';
  const c2 = '<w:tc><w:tcPr><w:tcW w:w="5106" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>' +
    wPara(wRun(p.title || 'JEE Mathematics', { font: 'Cambria', b: true, sz: 34, color: '111827' }), { align: 'center', after: 20 }) +
    (p.sub ? wPara(wRun(p.sub, { font: 'Calibri', sz: 18, color: GREY }), { align: 'center', after: 20 }) : '') + '</w:tc>';
  const rightTop = (p.badge && p.kind === 'dpp') ? p.badge : (dt || p.badge || '');
  const c3 = '<w:tc><w:tcPr><w:tcW w:w="2700" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>' +
    wPara(wRun(rightTop, { font: 'Calibri', b: true, sz: 19, color: NAVY }), { align: 'right', after: 0 }) +
    (p.batch ? wPara(wRun(p.batch, { font: 'Calibri', sz: 18, color: GREY }), { align: 'right', after: 20 }) : '') + '</w:tc>';
  const tbl = '<w:tbl><w:tblPr><w:tblW w:w="' + W + '" w:type="dxa"/><w:tblBorders>' + W_NOBDR + '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>' +
    '<w:tblGrid><w:gridCol w:w="2700"/><w:gridCol w:w="5106"/><w:gridCol w:w="2700"/></w:tblGrid>' +
    '<w:tr>' + c1 + c2 + c3 + '</w:tr></w:tbl>';
  const rule = wPara('', { before: 0, after: 0, borderBottom: { sz: 18, color: NAVY, space: 1 } });
  const totalQs = p.total || (p.qs ? p.qs.length : 0);
  const infoItems = ['Name: ______________________', 'Date: ______________', totalQs + ' questions', 'Marks: ____ / ' + (totalQs * 4)];
  const infoRuns = infoItems.map((t, k) => wRun((k ? '\t' : '') + t, { sz: 18, color: '334155' })).join('');
  const info = wPara(infoRuns, {
    before: 80,
    after: 100,
    tabs: [{ pos: 3600 }, { pos: 6200 }, { pos: 8400 }],
    borderBottom: { sz: 4, color: 'CBD2E0', space: 6 }
  });
  return tbl + rule + info;
}

function wAnswerKeySection(keys, W) {
  const allItems = [];
  keys.forEach(p => {
    (p.qs || []).forEach((q, i) => {
      allItems.push({ n: i + 1 + (p.start || 0), a: q.a || q.answer || '—' });
    });
  });
  if (!allItems.length) return '';
  // Deduplicate by question number
  const seen = new Set(), items = [];
  allItems.forEach(it => { if (!seen.has(it.n)) { seen.add(it.n); items.push(it); } });
  const cols = 5, cw = Math.floor(W / cols), rows = [];
  for (let i = 0; i < items.length; i += cols) {
    let cells = '';
    for (let c = 0; c < cols; c++) {
      const it = items[i + c];
      const inner = it
        ? wPara(wRun(it.n + '. ', { b: true, color: NAVY, sz: 20 }) + wRichRuns(String(it.a), { sz: 20, color: '111827' }), { before: 20, after: 20 })
        : wPara('', { before: 0, after: 0 });
      cells += '<w:tc><w:tcPr><w:tcW w:w="' + cw + '" w:type="dxa"/><w:tcMar><w:top w:w="30" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar></w:tcPr>' + inner + '</w:tc>';
    }
    rows.push('<w:tr><w:trPr><w:cantSplit/></w:trPr>' + cells + '</w:tr>');
  }
  return wPara(wRun('Answer Key', { font: 'Cambria', b: true, sz: 28, color: NAVY }), { before: 160, after: 100, keepNext: true, borderBottom: { sz: 8, color: NAVY, space: 2 } }) +
    '<w:tbl><w:tblPr><w:tblW w:w="' + (cw * cols) + '" w:type="dxa"/><w:tblBorders>' + W_GRIDBDR + '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr>' +
    '<w:tblGrid>' + Array(cols).fill('<w:gridCol w:w="' + cw + '"/>').join('') + '</w:tblGrid>' + rows.join('') + '</w:tbl>';
}

async function buildDocx(D, JSZip, pages, H) {
  H = H || {};
  const W = 10506;
  const media = [], drel = [['rId1', 'styles', 'styles.xml'], ['rIdFtr1', 'footer', 'footer1.xml']];
  const figMap = {};
  let figSeq = 0;
  if (H.figs) {
    Object.keys(H.figs).forEach(qid => {
      const f = H.figs[qid];
      if (f && (f.data || f.png)) {
        const n = ++figSeq;
        figMap[qid] = { n, w: f.w || 220, h: f.h || 150 };
        media.push({ name: 'word/media/fig' + n + '.png', data: f.data || f.png });
        drel.push(['rIdF' + n, 'image', 'media/fig' + n + '.png']);
      }
    });
  }

  const sectProps = (cols, continuous) =>
    '<w:sectPr>' +
    '<w:footerReference w:type="default" r:id="rIdFtr1"/>' +
    (continuous ? '<w:type w:val="continuous"/>' : '') +
    '<w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="640" w:right="700" w:bottom="720" w:left="700" w:header="360" w:footer="360" w:gutter="0"/>' +
    (cols === 2 ? '<w:cols w:num="2" w:space="420" w:sep="1"/>' : '<w:cols w:space="720"/>') +
    '</w:sectPr>';

  let bodyXml = '';
  const mergedPages = [];
  // Merge consecutive pages of the same document/sheet into unified continuous sections so questions flow naturally without awkward half-empty column breaks
  pages.forEach(p => {
    const prev = mergedPages[mergedPages.length - 1];
    if (prev && prev.title === p.title && prev.cols === p.cols && prev.kind === p.kind) {
      prev.qs = prev.qs.concat(p.qs);
    } else {
      mergedPages.push(Object.assign({}, p, { qs: (p.qs || []).slice() }));
    }
  });

  mergedPages.forEach((p, pIdx) => {
    if (pIdx > 0) bodyXml += wPara('', { pageBreakBefore: true, after: 0 });
    bodyXml += wHeaderBlock(p, W);
    // End of 1-column header section
    bodyXml += wPara('', { before: 0, after: 40, sectPr: sectProps(1, pIdx > 0) });

    let lastHead = '';
    const colW = p.cols === 2 ? 5040 : W;
    for (let i = 0; i < p.qs.length; i++) {
      const q = p.qs[i], n = i + 1 + (p.start || 0);
      if (q.head && q.head !== lastHead) {
        lastHead = q.head;
        bodyXml += wPara(wRun(q.head, { b: true, sz: 22, color: NAVY }), {
          before: 120,
          after: 50,
          keepNext: true,
          borderBottom: { sz: 6, color: NAVY, space: 2 }
        });
      }
      if (q.metaLine) {
        var _mStr = String(q.metaLine);
        var _exam = '';
        if (/\bKCET\b/i.test(_mStr)) {
          _exam = 'KCET';
        } else if (/\b(JEE\s*Advanced|JEE\s*Adv|IIT)\b/i.test(_mStr)) {
          _exam = 'JEE ADVANCED';
        } else if (/\bAIEEE\b/i.test(_mStr)) {
          _exam = 'AIEEE';
        } else if (/\bJEE\s*Main\b/i.test(_mStr)) {
          _exam = 'JEE MAIN';
        } else {
          var _m = _mStr.match(/^([A-Za-z0-9\s]+?)(?=\s+\d{1,2}\s+[A-Za-z]+|\s+\d{4}|\s*·|\s*\.)/);
          _exam = _m ? _m[1].trim().toUpperCase() : 'JEE MAIN';
        }

        var _cleanStr = _mStr.replace(/Shift\s*(\d+)/gi, 'S$1');
        var _mPaper = _cleanStr.match(/\d{1,2}\s+[A-Za-z]+\s+\d{4}\s+S\d+/i) ||
                     _cleanStr.match(/\d{1,2}\s+[A-Za-z]+\s+\d{4}/i) ||
                     _cleanStr.match(/\d{4}\s+P\d+/i) ||
                     _cleanStr.match(/\d{4}\s+Paper\s*\d+/i) ||
                     _cleanStr.match(/Paper\s*\d+/i) ||
                     _cleanStr.match(/S\d+/i);
        var _paper = _mPaper ? _mPaper[0].replace(/Paper\s*(\d+)/gi, 'P$1').trim() : '';

        var _mCh = _cleanStr.match(/\b(\d{1,2}M\d+)\b/);
        var _ch = _mCh ? _mCh[1] : '';

        var _mDiff = _cleanStr.match(/\b(L[123]|Level\s*[123])\b/i);
        var _diff = _mDiff ? _mDiff[1].toUpperCase().replace('EVEL', '') : '';

        var _shortMeta = (_exam + (_paper ? ' ' + _paper : '')).replace(/\s+/g, ' ').trim() + (_ch ? ' . ' + _ch : '') + (_diff ? ' . ' + _diff : '');
        if (!_ch && !_paper) _shortMeta = q.metaLine;
        bodyXml += wPara(wRun(_shortMeta, { sz: 17, color: '64748B', b: true }), {
          left: 340,
          before: 80,
          after: 20,
          keepNext: true
        });
      }
      const hint = (q.t === 'MSQ' || q.type === 'MSQ') ? '(one or more options correct)' : '';
      const tag = (p.tag && H.tagText) ? H.tagText(q) : '';
      const qText = cleanFigTag(q.q != null ? q.q : q.question);
      const mt = (H.matchParts || matchParts)(qText);
      const numRun = wRun(n + '.\t', { b: true, color: NAVY });
      const stemParas = wBlocks(mt ? mt.pre : qText, numRun, {
        before: q.metaLine ? 10 : 90,
        after: 36,
        left: 340,
        hanging: 340,
        keepNext: !!((q.o || q.options || []).length || figMap[q.i || q.id] || mt)
      }, null);
      bodyXml += stemParas.join('');
      const tail = [hint, tag].filter(Boolean).join('  ');
      if (tail) {
        bodyXml += wPara(wRun(tail, { i: true, sz: 17, color: GREY }), {
          left: 340,
          before: 0,
          after: 24,
          keepNext: !!((q.o || q.options || []).length || figMap[q.i || q.id] || mt)
        });
      }
      if (mt) {
        bodyXml += wMatchTable(mt, colW, 340);
        bodyXml += wPara('', { before: 0, after: 30, keepNext: !!(q.o || q.options || []).length });
      }
      const fObj = figMap[q.i || q.id];
      if (fObj) {
        bodyXml += wPara(wDrawing(fObj, p.cols === 2 ? 210 : 280), {
          left: 340,
          before: 20,
          after: 40,
          keepNext: !!(q.o || q.options || []).length
        });
      }
      bodyXml += wOptionsBlock(q, colW);
      if (p.inlineAns) {
        bodyXml += wPara(wRun('Answer: ', { b: true, color: NAVY, sz: 19 }) + wRichRuns(String(q.a || q.answer || '—'), { sz: 19, color: '111827' }), {
          left: 340,
          before: 10,
          after: 60
        });
      }
    }
    const isLastSection = pIdx === mergedPages.length - 1 && !pages.some(x => x.key);
    if (!isLastSection) {
      bodyXml += wPara('', { before: 0, after: 0, sectPr: sectProps(p.cols === 2 ? 2 : 1, true) });
    }
  });

  const keys = pages.filter(p => p.key);
  if (keys.length) {
    bodyXml += wPara('', { pageBreakBefore: true, after: 0 });
    bodyXml += wAnswerKeySection(keys, W);
    bodyXml += sectProps(1, true);
  } else {
    const lastCols = mergedPages.length && mergedPages[mergedPages.length - 1].cols === 2 ? 2 : 1;
    bodyXml += sectProps(lastCols, true);
  }

  const docTitle = (pages[0] && pages[0].title) || 'JEE Mathematics';
  const footerXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    wPara(
      wRun('Avanti Fellows · ' + docTitle, { sz: 16, color: GREY }) +
      wRun('\tPage ', { sz: 16, color: GREY }) +
      '<w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="' + GREY + '"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>',
      { before: 0, after: 0, tabs: [{ val: 'right', pos: W }], borderTop: { sz: 4, color: 'CBD2E0', space: 4 } }
    ) + '</w:ftr>';

  const docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ' + DOC_NS + '><w:body>' + bodyXml + '</w:body></w:document>';
  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Default Extension="png" ContentType="image/png"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
    '</Types>';

  return zipBlob([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: relsXml([['rId1', 'officeDocument', 'word/document.xml']]) },
    { name: 'word/_rels/document.xml.rels', data: relsXml(drel) },
    { name: 'word/styles.xml', data: DOCX_STYLES },
    { name: 'word/footer1.xml', data: footerXml },
    { name: 'word/document.xml', data: docXml }
  ].concat(media), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

/* ---------- Pure OpenXML PowerPoint Engine (Zero PptxGenJS / JSZip Dependency) ---------- */
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_M = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const NS_MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006';
const NS_A14 = 'http://schemas.microsoft.com/office/drawing/2010/main';
const EMU = 914400;
const emu = inches => Math.round((inches || 0) * EMU);

function dataUrlToBytes(dataUrl) {
  const b64 = String(dataUrl || '').replace(/^data:[^;]+;base64,/, '');
  const bin = atob(b64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function createMiniPptx() {
  const slides = [];
  const mediaFiles = [];
  const mediaMap = new Map();
  let mediaSeq = 0;

  function registerMedia(dataUrlOrBytes) {
    const key = typeof dataUrlOrBytes === 'string' ? dataUrlOrBytes.slice(0, 120) + ':' + dataUrlOrBytes.length : 'bin_' + (++mediaSeq);
    if (mediaMap.has(key)) return mediaMap.get(key);
    const id = ++mediaSeq;
    const name = 'image' + id + '.png';
    const bytes = typeof dataUrlOrBytes === 'string' ? dataUrlToBytes(dataUrlOrBytes) : dataUrlOrBytes;
    const entry = { id, name, bytes };
    mediaFiles.push(entry);
    mediaMap.set(key, entry);
    return entry;
  }

  function addSlide() {
    const shapes = [];
    const rels = [['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml']];
    let shapeId = 2;
    let rIdSeq = 2;
    const s = {
      background: { color: '000000' },
      addShape(type, opt) {
        opt = opt || {};
        const id = shapeId++;
        const x = emu(opt.x), y = emu(opt.y), cx = emu(opt.w), cy = emu(opt.h);
        const isRound = type === 'roundRect';
        const adj = isRound ? '<a:avLst><a:gd name="adj" fmla="val ' + (opt.rectRadius && opt.rectRadius >= 0.2 ? 50000 : 18000) + '"/></a:avLst>' : '<a:avLst/>';
        const fillXml = (!opt.fill || opt.fill.type === 'none' || !opt.fill.color)
          ? '<a:noFill/>'
          : '<a:solidFill><a:srgbClr val="' + String(opt.fill.color).replace('#', '') + '"/></a:solidFill>';
        const lnXml = (!opt.line || opt.line.type === 'none' || !opt.line.color)
          ? '<a:ln><a:noFill/></a:ln>'
          : '<a:ln w="' + Math.round((opt.line.width || 1) * 12700) + '"><a:solidFill><a:srgbClr val="' + String(opt.line.color).replace('#', '') + '"/></a:solidFill><a:prstDash val="solid"/></a:ln>';
        shapes.push(
          '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Shape ' + id + '"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' +
          '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
          '<a:prstGeom prst="' + (isRound ? 'roundRect' : 'rect') + '">' + adj + '</a:prstGeom>' +
          fillXml + lnXml + '</p:spPr></p:sp>'
        );
      },
      addText(textOrRuns, opt) {
        opt = opt || {};
        const id = shapeId++;
        const x = emu(opt.x), y = emu(opt.y), cx = emu(opt.w), cy = emu(opt.h);
        const anchor = opt.valign === 'middle' ? 'ctr' : opt.valign === 'bottom' ? 'b' : 't';
        const mar = opt.margin === 0 ? ' lIns="0" tIns="0" rIns="0" bIns="0"' : ' lIns="45720" tIns="22860" rIns="45720" bIns="22860"';
        const fitXml = opt.fit === 'shrink' ? '<a:normAutofit/>' : '<a:noAutofit/>';

        // Normalize into paragraphs: each paragraph has { align, spcAft, lineSpacingMultiple, runs: [...] }
        const items = Array.isArray(textOrRuns)
          ? textOrRuns
          : [{ text: String(textOrRuns == null ? '' : textOrRuns), options: opt }];

        const paras = [[]];
        items.forEach(it => {
          const rOpt = Object.assign({}, opt, it.options || {});
          const rawText = String(it.text == null ? '' : it.text);
          if (it.mathTex != null) {
            paras[paras.length - 1].push({ mathTex: it.mathTex, options: rOpt });
            if (rOpt.breakLine) paras.push([]);
            return;
          }
          const parts = rawText.split('\n');
          parts.forEach((seg, idx) => {
            if (idx > 0) paras.push([]);
            if (seg !== '') paras[paras.length - 1].push({ text: seg, options: rOpt });
          });
          if (rOpt.breakLine) paras.push([]);
        });
        while (paras.length > 1 && paras[paras.length - 1].length === 0) paras.pop();

        const parasXml = paras.map(pRuns => {
          const firstOpt = (pRuns[0] && pRuns[0].options) || opt;
          const algn = firstOpt.align === 'center' ? 'ctr' : firstOpt.align === 'right' ? 'r' : 'l';
          const spcAft = firstOpt.paraSpaceAfter != null ? firstOpt.paraSpaceAfter : (opt.paraSpaceAfter != null ? opt.paraSpaceAfter : 0);
          const lnSpc = firstOpt.lineSpacingMultiple ? '<a:lnSpc><a:spcPct val="' + Math.round(firstOpt.lineSpacingMultiple * 100000) + '"/></a:lnSpc>' : '';
          const spcXml = spcAft > 0 ? '<a:spcAft><a:spcPts val="' + Math.round(spcAft * 100) + '"/></a:spcAft>' : '';
          // Strictly ONE <a:pPr> at the start of <a:p>
          const pPrXml = '<a:pPr algn="' + algn + '" indent="0" marL="0">' + lnSpc + spcXml + '<a:buNone/></a:pPr>';
          const defSz = Math.round((firstOpt.fontSize || opt.fontSize || 18) * 100);

          const runsXml = pRuns.map(r => {
            const ro = r.options || opt;
            const sz = Math.round((ro.fontSize || opt.fontSize || 18) * 100);
            const col = String(ro.color || opt.color || 'FFFFFF').replace('#', '');
            const face = ro.fontFace || opt.fontFace || 'Arial';
            const b = ro.bold ? ' b="1"' : '';
            const itl = ro.italic ? ' i="1"' : '';
            const spc = ro.charSpacing ? ' spc="' + Math.round(ro.charSpacing * 100) + '"' : '';
            if (r.mathTex != null) {
              let inner = M().omml(r.mathTex, false, 'pptx@' + sz).replace('<m:oMath>', '<m:oMath xmlns:m="' + NS_M + '">');
              inner = inner.replace(/<a:rPr\b[^>]*>/g, m0 => m0 + '<a:solidFill><a:srgbClr val="' + col + '"/></a:solidFill>');
              const fb = '<a:r><a:rPr lang="en-US" sz="' + sz + '" dirty="0"><a:solidFill><a:srgbClr val="' + col + '"/></a:solidFill><a:latin typeface="' + face + '"/><a:ea typeface="' + face + '"/><a:cs typeface="' + face + '"/></a:rPr><a:t>' + esc(M().toText(r.mathTex)) + '</a:t></a:r>';
              return '<mc:AlternateContent xmlns:mc="' + NS_MC + '"><mc:Choice xmlns:a14="' + NS_A14 + '" Requires="a14"><a14:m>' + inner + '</a14:m></mc:Choice><mc:Fallback>' + fb + '</mc:Fallback></mc:AlternateContent>';
            }
            return '<a:r><a:rPr lang="en-US" sz="' + sz + '"' + b + itl + spc + ' dirty="0">' +
              '<a:solidFill><a:srgbClr val="' + col + '"/></a:solidFill>' +
              '<a:latin typeface="' + face + '"/><a:ea typeface="' + face + '"/><a:cs typeface="' + face + '"/>' +
              '</a:rPr><a:t>' + esc(r.text) + '</a:t></a:r>';
          }).join('');

          return '<a:p>' + pPrXml + runsXml + '<a:endParaRPr lang="en-US" sz="' + defSz + '" dirty="0"/></a:p>';
        }).join('');

        shapes.push(
          '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="Text ' + id + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>' +
          '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
          '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>' +
          '<p:txBody><a:bodyPr wrap="square"' + mar + ' rtlCol="0" anchor="' + anchor + '">' + fitXml + '</a:bodyPr><a:lstStyle/>' +
          parasXml + '</p:txBody></p:sp>'
        );
      },
      addImage(opt) {
        if (!opt || !opt.data) return;
        const id = shapeId++;
        const media = registerMedia(opt.data);
        const rId = 'rIdImg' + (rIdSeq++);
        rels.push([rId, 'image', '../media/' + media.name]);
        const x = emu(opt.x), y = emu(opt.y), cx = emu(opt.w), cy = emu(opt.h);
        shapes.push(
          '<p:pic><p:nvPicPr><p:cNvPr id="' + id + '" name="Picture ' + id + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>' +
          '<p:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>' +
          '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
          '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'
        );
      },
      _buildXml() {
        const bgCol = String((s.background && s.background.color) || '000000').replace('#', '');
        const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<p:sld xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '">' +
          '<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="' + bgCol + '"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>' +
          '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
          '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
          shapes.join('') +
          '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
        return { xml, rels };
      }
    };
    slides.push(s);
    return s;
  }

  function toBlob() {
    const T = root.QB_PPT_TPL;
    const files = [];
    let ct = '';
    let sldIds = '';
    const presRels = [
      ['rId1', 'slideMaster', 'slideMasters/slideMaster1.xml'],
      ['rId2', 'presProps', 'presProps.xml'],
      ['rId3', 'viewProps', 'viewProps.xml'],
      ['rId4', 'theme', 'theme/theme1.xml'],
      ['rId5', 'tableStyles', 'tableStyles.xml']
    ];
    slides.forEach((s, idx) => {
      const n = idx + 1;
      const built = s._buildXml();
      files.push({ name: 'ppt/slides/slide' + n + '.xml', data: built.xml });
      files.push({ name: 'ppt/slides/_rels/slide' + n + '.xml.rels', data: relsXml(built.rels) });
      ct += '<Override PartName="/ppt/slides/slide' + n + '.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>';
      sldIds += '<p:sldId id="' + (256 + idx) + '" r:id="rId' + (100 + n) + '"/>';
      presRels.push(['rId' + (100 + n), 'slide', 'slides/slide' + n + '.xml']);
    });
    mediaFiles.forEach(m => {
      files.push({ name: 'ppt/media/' + m.name, data: m.bytes });
    });
    const pres = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<p:presentation xmlns:a="' + NS_A + '" xmlns:r="' + NS_R + '" xmlns:p="' + NS_P + '" saveSubsetFonts="1">' +
      '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
      '<p:sldIdLst>' + sldIds + '</p:sldIdLst>' +
      '<p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>' +
      '<p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:defaultTextStyle></p:presentation>';
    const types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
      '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' +
      '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' +
      '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
      '<Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>' +
      '<Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>' +
      '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>' +
      ct + '</Types>';

    return zipBlob([
      { name: '[Content_Types].xml', data: types },
      { name: '_rels/.rels', data: relsXml([['rId1', 'officeDocument', 'ppt/presentation.xml']]) },
      { name: 'ppt/presentation.xml', data: pres },
      { name: 'ppt/_rels/presentation.xml.rels', data: relsXml(presRels) },
      { name: 'ppt/slideMasters/slideMaster1.xml', data: T.master },
      { name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: relsXml([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId2', 'theme', '../theme/theme1.xml']]) },
      { name: 'ppt/slideLayouts/slideLayout1.xml', data: T.layout },
      { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: relsXml([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]) },
      { name: 'ppt/theme/theme1.xml', data: T.theme },
      { name: 'ppt/presProps.xml', data: T.presProps },
      { name: 'ppt/viewProps.xml', data: T.viewProps },
      { name: 'ppt/tableStyles.xml', data: T.tableStyles }
    ].concat(files), 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  }

  return { addSlide, toBlob };
}

/* ---------- Avanti Fellows Dark Slide Deck (buildCwPptx) ---------- */
async function buildCwPptx(PptxGenJS, JSZip, d, H) {
  H = H || {};
  const BLACK = '000000', NAVYC = '1B2A41', CORAL = 'E8573E', TEAL = '2A9D8F', GRAYC = '9CA3AF', LIME = '9BE15D', YEL = 'F4D35E', WHITE = 'FFFFFF', GREEN = '4ADE80', RED = 'EF4444', PURPLE = 'A855F7';
  const LVC = { L1: GREEN, L2: YEL, L3: RED };
  const FH = 'Georgia', FB = 'Arial', FQ = 'Times New Roman';
  const QFS = 24;
  const pptx = createMiniPptx();

  const mathRun = (tex, opt) => ({ mathTex: tex, options: Object.assign({}, opt) });
  function runs(text, base, mathColor) {
    const out = [];
    M().split(cleanFigTag(text)).forEach(pt => {
      if (pt.t === 'text') {
        pt.s.split('\n').forEach((ln, k) => {
          if (k && out.length) out[out.length - 1].options = Object.assign({}, out[out.length - 1].options, { breakLine: true });
          if (ln) out.push({ text: ln, options: Object.assign({}, base) });
        });
      } else {
        out.push(mathRun(pt.s.replace(/\s+$/, ''), Object.assign({}, base, { color: mathColor || base.color })));
      }
    });
    return out;
  }

  /* Smart Whole-Question Given (LIME #9BE15D) vs. To-Find (YEL #F4D35E) stem equation classifier */
  const FIND_CUE = /(then\b[\s\S]{0,60}$|find\b|evaluate\b|value\s+of\b|values\s+of\b|determine\b|compute\b|calculate\b|equal\s+to\b|equals\b|is\s+equal\s+to|what\s+is\b|coefficient\s+of\b|remainder\s+when\b|domain\s+of\b|range\s+of\b|locus\s+of\b|area\s+of\b|length\s+of\b|number\s+of\b|sum\s+of\b|product\s+of\b|minimum\s+value\s+of|maximum\s+value\s+of)/i;
  const GIVEN_START = /^\s*(let\b|if\b|given\b|suppose\b|consider\b|where\b|statement\s*[I12V]+|list[\s-]*[I12]+|column[\s-]*[I12]+)/i;
  const TARGET_TAIL = /^\s*(is\s*:?\s*$|is\s+equal\s+to|equals\b|is\s+______|are\s*:?\s*$|respectively\s+are)/i;

  function qRuns(text, base) {
    const cleaned = cleanFigTag(text);
    const parts = M().split(cleaned);
    const pure = parts.length === 1 && parts[0].t !== 'text';
    const yel = parts.map((pt, i) => {
      if (pt.t === 'text') return false;
      if (pure) return true;
      const prev = parts[i - 1], next = parts[i + 1];
      const prevTxt = prev && prev.t === 'text' ? prev.s : '';
      const nextTxt = next && next.t === 'text' ? next.s : '';
      if (nextTxt && TARGET_TAIL.test(nextTxt)) return true;
      const lastSentence = prevTxt.split(/[.?!;\n]/).pop() || '';
      if (FIND_CUE.test(lastSentence) && !GIVEN_START.test(lastSentence)) return true;
      return false;
    });
    if (!pure && !yel.some(Boolean)) {
      // Fallback: if the final clause asks for a quantity, highlight the last math token in the question clause
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].t !== 'text') {
          const afterTxt = parts.slice(i + 1).map(p => p.s).join(' ');
          if (afterTxt.length < 45 && !/\b(where|given|take|assume)\b/i.test(afterTxt)) {
            yel[i] = true;
          }
          break;
        }
      }
    }
    const out = [];
    parts.forEach((pt, i) => {
      if (pt.t === 'text') {
        pt.s.split('\n').forEach((ln, k) => {
          if (k && out.length) out[out.length - 1].options = Object.assign({}, out[out.length - 1].options, { breakLine: true });
          if (ln) {
            ln.split(/(\((?:I{1,3}|IV|V|P|Q|R|S|[1-6])\)|List[\s-]*(?:II|I|1|2)\s*:?|Column[\s-]*(?:II|I|1|2)\s*:?|Statement[\s-]*(?:II|I|1|2)\s*:?)/i).forEach(g => {
              if (!g) return;
              const isHighlight = /^(\((?:I{1,3}|IV|V|P|Q|R|S|[1-6])\)|List|Column|Statement)/i.test(g);
              out.push({ text: g, options: Object.assign({}, base, isHighlight ? { color: YEL, bold: true } : {}) });
            });
          }
        });
      } else {
        out.push(mathRun(pt.s.replace(/\s+$/, ''), Object.assign({}, base, { color: yel[i] ? YEL : LIME })));
      }
    });
    return out;
  }

  const hEm = nodes => {
    let h = 1;
    nodes.forEach(n => {
      let v = 1;
      switch (n.k) {
        case 'frac': v = 0.75 * (hEm(n.n) + hEm(n.d)) + 0.15; break;
        case 'rad': v = hEm(n.e) + 0.15; break;
        case 'nary': v = Math.max(1.7, hEm(n.e)); break;
        case 'grp': case 'delim': case 'acc': case 'bar': v = hEm(n.e); break;
        case 'limUpp': case 'limLow': v = hEm(n.e) + 0.45; break;
        case 'script': v = hEm(n.e) + (n.sup ? 0.45 : 0) + (n.sub ? 0.25 : 0); break;
        case 'mat': v = n.rows.length * 1.15; break;
      }
      h = Math.max(h, v);
    });
    return h;
  };

  const textH = (text, fs, boxW) => {
    const limit = boxW * 72 / fs * 0.985;
    let total = 0, cur = 0, h = 1.2;
    const flush = () => { total += h; cur = 0; h = 1.2; };
    M().split(cleanFigTag(text)).forEach(p => {
      if (p.t === 'text') {
        p.s.split('\n').forEach((seg, k) => {
          if (k) flush();
          seg.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            const w = tok.length * 0.5;
            if (cur + w > limit && /\S/.test(tok)) flush();
            cur += w;
          });
        });
      } else {
        const w = M().width('\\(' + p.s + '\\)');
        let ht = 1.2;
        try { ht = Math.max(1.2, hEm(M().parse(p.s))); } catch (e) {}
        if (cur + w > limit && cur > 0) flush();
        cur += w;
        h = Math.max(h, ht);
      }
    });
    flush();
    return total * fs / 72;
  };

  const card = (s, x, y, w, h, color) => s.addShape('roundRect', { x, y, w, h, fill: { color }, line: { type: 'none' }, rectRadius: 0.1 });
  const blank = () => { const b = pptx.addSlide(); b.background = { color: BLACK }; };
  const yrs = Object.keys(d.years || {}).map(Number).filter(Boolean).sort((a, b) => a - b);
  const chNum = d.cc ? d.cc.split('M')[1] : '';
  const clLabel = d.clLabel || ('CLASS ' + (d.cl || '11 & 12'));
  const chLabel = d.chLabel || (chNum ? 'CHAPTER ' + chNum : (d.bucket === 'KCET' ? 'KCET MATHEMATICS' : 'JEE MATHEMATICS'));
  const kindLabel = d.kindLabel || ((d.bucketName || (d.bucket === 'KCET' ? 'KCET' : 'JEE Main')) + ' PYQs');
  const yearLabel = d.year === 'all' ? (yrs.length ? 'All years · ' + yrs[0] + '–' + yrs[yrs.length - 1] : 'All years') : String(d.year || 'All years');
  const logoData = (d.logo && d.logo.dataUrl) || (root.QB_LOGO_B64 ? 'data:image/png;base64,' + root.QB_LOGO_B64 : null);
  const logoW = (d.logo && d.logo.w) || root.QB_LOGO_W || 480;
  const logoH = (d.logo && d.logo.h) || root.QB_LOGO_H || 165;

  function addLogoTopRight(s, lw, yPos) {
    if (!logoData) return;
    lw = lw || 2.1;
    s.addImage({ data: logoData, x: 13.33 - 0.45 - lw, y: yPos != null ? yPos : 0.18, w: lw, h: lw * logoH / logoW });
  }

  function leftBlock(s, big, bigColor, bigSize) {
    const pillW = Math.max(1.6, 0.4 + clLabel.length * 0.15);
    s.addShape('roundRect', { x: 0.6, y: 0.6, w: pillW, h: 0.42, fill: { type: 'none' }, line: { color: CORAL, width: 1.5 }, rectRadius: 0.2 });
    s.addText(clLabel, { x: 0.6, y: 0.6, w: pillW, h: 0.42, fontFace: FB, bold: true, fontSize: 13, color: CORAL, align: 'center', valign: 'middle', charSpacing: 3, margin: 0 });
    s.addText(chLabel, { x: 0.6, y: 1.55, w: 7.6, h: 0.4, fontFace: FB, bold: true, fontSize: 16, color: TEAL, charSpacing: 3, margin: 0 });
    const titleFs = String(d.chapter || '').length > 34 ? 36 : 44;
    s.addText(d.chapter || 'JEE Mathematics', { x: 0.6, y: 2.0, w: 7.6, h: 1.9, fontFace: FH, bold: true, fontSize: titleFs, color: WHITE, valign: 'top', lineSpacingMultiple: 0.95, margin: 0 });
    s.addShape('rect', { x: 0.6, y: 4.05, w: 0.9, h: 0.07, fill: { color: CORAL }, line: { type: 'none' } });
    if (big) s.addText(big, { x: 0.6, y: 4.35, w: 7.6, h: 1.2, fontFace: FH, bold: true, fontSize: bigSize || 54, color: bigColor || CORAL, valign: 'top', margin: 0 });
  }

  /* 1. Cover Slide */
  {
    const s = pptx.addSlide();
    s.background = { color: BLACK };
    leftBlock(s, '', WHITE);
    s.addText('YEAR', { x: 0.6, y: 4.35, w: 3, h: 0.3, fontFace: FB, bold: true, fontSize: 12, color: GRAYC, charSpacing: 3, margin: 0 });
    s.addText(yearLabel, { x: 0.6, y: 4.65, w: 7.6, h: 0.5, fontFace: FB, bold: true, fontSize: 22, color: WHITE, margin: 0 });
    s.addText('QUESTIONS', { x: 0.6, y: 5.3, w: 3, h: 0.3, fontFace: FB, bold: true, fontSize: 12, color: GRAYC, charSpacing: 3, margin: 0 });
    s.addText(d.count + ' · ' + kindLabel, { x: 0.6, y: 5.6, w: 7.6, h: 0.5, fontFace: FB, bold: true, fontSize: 22, color: WHITE, margin: 0 });
    card(s, 8.9, 1.55, 3.8, 4.4, NAVYC);
    s.addText(String(d.count), { x: 8.9, y: 2.5, w: 3.8, h: 1.4, fontFace: FH, bold: true, fontSize: 88, color: CORAL, align: 'center', valign: 'middle', margin: 0 });
    s.addText('questions', { x: 8.9, y: 4.1, w: 3.8, h: 0.5, fontFace: FB, fontSize: 18, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
    addLogoTopRight(s, 2.4, 0.4);
  }

  /* 2. Contents / Topic Cards Grid (Paginated up to 10 topics per slide with non-overlapping header) */
  const allTopics = (d.topics || []).length ? d.topics : [{ name: d.chapter || 'Selected Questions', n: d.count }];
  const PER_SLIDE = 10;
  const totalTopicSlides = Math.max(1, Math.ceil(allTopics.length / PER_SLIDE));
  for (let pIdx = 0; pIdx < totalTopicSlides; pIdx++) {
    const chunk = allTopics.slice(pIdx * PER_SLIDE, (pIdx + 1) * PER_SLIDE);
    const s = pptx.addSlide();
    s.background = { color: BLACK };
    const tLen = String(d.chapter || '').length;
    const hFs = tLen > 48 ? 22 : tLen > 36 ? 25 : 28;
    const subLabel = 'CONTENTS · ' + allTopics.length + (allTopics.length === 1 ? ' TOPIC' : ' TOPICS') +
      (totalTopicSlides > 1 ? ' (PART ' + (pIdx + 1) + ' OF ' + totalTopicSlides + ')' : '') +
      ' · ' + d.count + ' QUESTIONS';
    s.addText([
      { text: d.chapter || 'Selected Questions', options: { fontFace: FH, bold: true, fontSize: hFs, color: WHITE, paraSpaceAfter: 6, breakLine: true } },
      { text: subLabel, options: { fontFace: FB, bold: true, fontSize: 13, color: CORAL, charSpacing: 3 } }
    ], { x: 0.5, y: 0.22, w: 9.95, h: 1.15, valign: 'top', margin: 0 });
    addLogoTopRight(s, 2.1, 0.22);

    const cols = 2, rows = Math.max(1, Math.ceil(chunk.length / cols));
    const top = 1.52, avail = 5.48, gap = 0.14, GW = 12.33;
    const cwid = (GW - (cols - 1) * 0.22) / cols, nameW = cwid - 1.35;
    const ch = Math.min(0.95, (avail - (rows - 1) * gap) / rows);
    chunk.forEach((t, idx) => {
      const globalIdx = pIdx * PER_SLIDE + idx + 1;
      const c = Math.floor(idx / rows), r = idx % rows;
      const x = 0.5 + c * (cwid + 0.22), y = top + r * (ch + gap);
      card(s, x, y, cwid, ch, NAVYC);
      s.addText(String(globalIdx).padStart(2, '0'), { x: x + 0.14, y, w: 0.65, h: ch, fontFace: FH, bold: true, fontSize: 20, color: CORAL, valign: 'middle', margin: 0 });
      const nameStr = String(t.name || '');
      const nf = nameStr.length > 55 ? 14 : nameStr.length > 40 ? 16 : 18;
      s.addText(nameStr, { x: x + 0.85, y, w: nameW, h: ch, fontFace: FB, fontSize: nf, color: WHITE, valign: 'middle', margin: 0 });
      s.addText(String(t.n || 0), { x: x + cwid - 0.6, y, w: 0.48, h: ch, fontFace: FB, bold: true, fontSize: 18, color: t.n ? TEAL : GRAYC, align: 'right', valign: 'middle', margin: 0 });
    });
  }

  /* 3. Year-wise Questions Vector Bar Chart Slide (when PYQ years >= 2020 exist) */
  const firstYr = 2020, lastYr = yrs.length ? Math.max(2025, yrs[yrs.length - 1]) : 0;
  if (lastYr >= firstYr) {
    const s = pptx.addSlide();
    s.background = { color: BLACK };
    s.addText([
      { text: 'Questions per year', options: { fontFace: FH, bold: true, fontSize: 28, color: WHITE, paraSpaceAfter: 6, breakLine: true } },
      { text: (d.chapter || 'Selected Questions') + ' · ' + kindLabel + ' · 2020 onwards', options: { fontFace: FB, bold: true, fontSize: 13, color: CORAL, charSpacing: 2 } }
    ], { x: 0.5, y: 0.22, w: 9.95, h: 1.15, valign: 'top', margin: 0 });
    addLogoTopRight(s, 2.1, 0.22);

    const labels = [], values = [];
    for (let y = firstYr; y <= lastYr; y++) { labels.push(String(y)); values.push((d.years && d.years[y]) || 0); }
    const maxV = Math.max(4, ...values);
    const stepV = maxV <= 10 ? 2 : maxV <= 25 ? 5 : maxV <= 50 ? 10 : Math.ceil(maxV / 5 / 5) * 5;
    const topV = Math.ceil(maxV / stepV) * stepV;
    const chartX = 1.0, chartY = 1.75, chartW = 11.6, chartH = 4.6;

    // Gridlines and Y-axis labels
    for (let v = 0; v <= topV; v += stepV) {
      const gy = chartY + chartH - (v / topV) * chartH;
      s.addShape('rect', { x: chartX, y: gy, w: chartW, h: 0.012, fill: { color: v === 0 ? '4B5563' : '262626' }, line: { type: 'none' } });
      s.addText(String(v), { x: 0.35, y: gy - 0.15, w: 0.55, h: 0.3, fontFace: FB, fontSize: 11, color: GRAYC, align: 'right', valign: 'middle', margin: 0 });
    }
    // Bars, value labels, and X-axis year labels
    const slotW = chartW / labels.length;
    const barW = Math.min(0.85, slotW * 0.55);
    labels.forEach((yr, idx) => {
      const val = values[idx];
      const bx = chartX + idx * slotW + (slotW - barW) / 2;
      const bh = val > 0 ? Math.max(0.06, (val / topV) * chartH) : 0;
      const by = chartY + chartH - bh;
      if (bh > 0) {
        s.addShape('rect', { x: bx, y: by, w: barW, h: bh, fill: { color: CORAL }, line: { type: 'none' } });
      }
      s.addText(String(val), { x: chartX + idx * slotW, y: by - 0.32, w: slotW, h: 0.28, fontFace: FB, bold: true, fontSize: 11, color: val > 0 ? WHITE : GRAYC, align: 'center', valign: 'bottom', margin: 0 });
      s.addText(yr, { x: chartX + idx * slotW, y: chartY + chartH + 0.08, w: slotW, h: 0.32, fontFace: FB, bold: true, fontSize: 11, color: WHITE, align: 'center', valign: 'top', margin: 0 });
    });
  }

  /* 4+. One Question Per Slide (Strict 24pt font, Smart Given vs To-Find math coloring, aligned left Coral bar) */
  const ansText = q => /^[A-D](,\s*[A-D])*$/.test(q.a || '') ? q.a.split(/,\s*/).map(l => '(' + l + ')').join(', ') : (q.a || '—');
  const exam0 = d.bucket === 'Adv' ? ['JEE ADVANCED', RED] : (d.bucket === 'KCET' ? ['KCET', PURPLE] : ['JEE MAINS', GREEN]);
  const examOf = q => {
    const qid = String(q.i || q.id || '');
    const pm = (d.meta && (d.meta[qid] || d.meta[q.i] || d.meta[q.id])) || {};
    const exName = q.ex || q.exam || pm.exam || (qid.startsWith('KCET') ? 'KCET' : (qid.startsWith('JA') || qid.startsWith('IIT') ? 'JEE Advanced' : (qid.startsWith('AIEEE') ? 'AIEEE' : '')));
    if (exName === 'KCET' || q.e === 'KCET' || d.bucket === 'KCET' || /\bKCET\b/i.test(String(q.p || pm.paper || ''))) return ['KCET', PURPLE];
    if (exName === 'AIEEE' || q.e === 'AIEEE' || /\bAIEEE\b/i.test(String(q.p || pm.paper || ''))) return ['AIEEE', GREEN];
    if (d.perQ) {
      if (q.s === 'P' || q.source === 'PYQ') {
        if (q.e === 'Adv' || exName === 'JEE Advanced' || exName === 'IIT' || /\b(JEE Advanced|IIT)\b/i.test(String(q.p || pm.paper || ''))) return ['JEE ADVANCED', RED];
        return ['JEE MAINS', GREEN];
      }
      return ['PRACTICE · ' + String(q.pb || q.publisher || 'AVANTI').toUpperCase(), TEAL];
    }
    return exam0;
  };

  (d.qs || []).forEach(q => {
    const exam = examOf(q), practice = d.perQ && q.s !== 'P';
    const s = pptx.addSlide();
    s.background = { color: BLACK };
    const pm = (d.meta && (d.meta[q.i] || d.meta[q.id])) || {}, pStr = String(pm.paper || q.p || '');
    const dm = /\d{1,2} [A-Za-z]{3} \d{4}/.exec(pStr), sd = /^(\d{4})-(\d{2})-(\d{2})/.exec(pm.sort_date || '');
    const date = dm ? dm[0] : sd && sd[2] !== '00' ? new Date(+sd[1], +sd[2] - 1, +sd[3]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const shift = pStr.replace(/\d{1,2} [A-Za-z]{3} \d{4}/, '').replace(/IIT-JEE|JEE (Main|Advanced)|AIEEE|KCET/gi, '').replace(/\b(19|20)\d{2}\b/g, '').replace(/\s+/g, ' ').trim();
    const when = [date || (q.y ? String(q.y) : ''), shift].filter(Boolean).join(' · ');
    const pillText = practice ? exam[0] : (when ? exam[0] + ' · ' + when : exam[0]);
    const pillW = Math.min(7.8, Math.max(2.2, 0.5 + pillText.length * 0.135));

    // Ques box
    s.addShape('roundRect', { x: 0.5, y: 0.3, w: 1.05, h: 0.42, fill: { type: 'none' }, line: { color: CORAL, width: 2 }, rectRadius: 0.1 });
    s.addText('Ques', { x: 0.5, y: 0.3, w: 1.05, h: 0.42, fontFace: FH, bold: true, fontSize: 22, color: WHITE, align: 'center', valign: 'middle', margin: 0 });

    // Exam/Shift pill
    s.addShape('roundRect', { x: 1.7, y: 0.3, w: pillW, h: 0.42, fill: { type: 'none' }, line: { color: exam[1], width: 1.25 }, rectRadius: 0.21 });
    s.addText(pillText, { x: 1.7, y: 0.3, w: pillW, h: 0.42, fontFace: FB, bold: true, fontSize: 16, margin: 0, color: exam[1], align: 'center', valign: 'middle' });

    // Level pill (L1 / L2 / L3)
    const lvl = /^L[123]$/.test(q.d || '') ? q.d : '', lvX = 1.7 + pillW + 0.15, lvW = 0.8;
    if (lvl) {
      s.addShape('roundRect', { x: lvX, y: 0.3, w: lvW, h: 0.42, fill: { type: 'none' }, line: { color: LVC[lvl], width: 1.25 }, rectRadius: 0.21 });
      s.addText(lvl, { x: lvX, y: 0.3, w: lvW, h: 0.42, fontFace: FB, bold: true, fontSize: 16, color: LVC[lvl], align: 'center', valign: 'middle', margin: 0 });
    }

    // Top-right Avanti Logo
    addLogoTopRight(s, 2.0, 0.16);

    const hasFig = !!(q.f && H.figs && H.figs[q.i]);
    const blockX = 61 / 72, blockW = (hasFig ? 8.4 : 924 / 72) - blockX, TOP = 68 / 72;
    let rawStem = cleanFigTag(q.q || q.question || '');
    const mt = (H.matchParts || matchParts)(rawStem);
    if (mt) {
      const mLines = [];
      if (mt.pre) mLines.push(mt.pre);
      const nRows = Math.max(mt.left.length, mt.right.length);
      mLines.push(mt.head[0] + ' :      ' + mt.head[1] + ' :');
      for (let r = 0; r < nRows; r++) {
        const lTxt = (mt.left[r] || '').trim();
        const rTxt = (mt.right[r] || '').trim();
        mLines.push([lTxt, rTxt].filter(Boolean).join('      |      '));
      }
      rawStem = mLines.join('\n');
    }
    const QT = mt ? rawStem : rawStem.split(/(\\\([\s\S]*?\\\))/).map((seg, idx) => idx % 2 ? seg : seg.replace(/\s*(\((?:I{1,3}|IV|V|VI)\)|\([1-9]\))(?=\s)/g, (m, lab, off) => (off === 0 && idx === 0) ? m : '\n' + lab)).join('');

    // Strict 24pt Question & Options typography
    const fs = QFS;
    const base = { fontFace: FQ, fontSize: fs, color: WHITE };
    const paras = [qRuns(QT, base)];
    if (q.t === 'MSQ') {
      paras[0] = paras[0].concat([{ text: '   (one or more options correct)', options: Object.assign({}, base, { italic: true, color: GRAYC, fontSize: 20 }) }]);
    }
    const opts = q.o || q.options || [];
    opts.forEach((op, k) => {
      const pr = [{ text: '(' + LET[k] + ') ', options: Object.assign({}, base, { bold: true, color: '3B9EFF' }) }];
      pr.push(...runs(op, base, WHITE));
      paras.push(pr);
    });
    const hs = [textH(QT + (q.t === 'MSQ' ? '   (one or more options correct)' : ''), fs, blockW)]
      .concat(opts.map((op, k) => textH('(' + LET[k] + ') ' + op, fs, blockW)));
    const boxH = Math.min(5.48, Math.max(1.2, hs.reduce((a, b) => a + b, 0) + (paras.length - 1) * 0.083));

    const flat = [];
    paras.forEach((pr, k) => {
      pr.forEach((r, j) => {
        const o = Object.assign({}, r.options, { paraSpaceAfter: 6 });
        if (j === pr.length - 1 && k < paras.length - 1) o.breakLine = true;
        flat.push(r.mathTex != null ? { mathTex: r.mathTex, options: o } : { text: r.text, options: o });
      });
    });

    // Aligned left vertical Coral bar & Question text box at TOP = 68/72 in
    s.addShape('rect', { x: 0.5, y: TOP, w: 6 / 72, h: boxH, fill: { color: CORAL }, line: { type: 'none' } });
    s.addText(flat, { x: blockX, y: TOP, w: blockW, h: boxH + 0.1, valign: 'top', margin: 0 });

    if (hasFig) {
      const f = H.figs[q.i];
      const w = 3.7, h = Math.min(5.2, w * (f.h || 180) / (f.w || 260));
      s.addImage({ data: f.dataUrl || f.data || f.png, x: 9.1, y: TOP, w, h });
    }

    // Bottom Answer Key
    s.addText(
      [{ text: 'Ans: ', options: { bold: true, fontFace: FB, fontSize: 16, color: GRAYC } }]
        .concat(runs(ansText(q), { fontFace: FB, fontSize: 16, color: GRAYC }, GRAYC)),
      { x: 0.5, y: 6.6, w: 8.0, h: 0.5, valign: 'middle', margin: 0 }
    );
    blank();
  });

  /* Final Slide: Thank You */
  {
    const s = pptx.addSlide();
    s.background = { color: BLACK };
    s.addShape('roundRect', { x: 4.17, y: 0.9, w: 5.0, h: 0.42, fill: { type: 'none' }, line: { color: CORAL, width: 1.5 }, rectRadius: 0.2 });
    s.addText(clLabel + '  ·  ' + chLabel, { x: 4.17, y: 0.9, w: 5.0, h: 0.42, fontFace: FB, bold: true, fontSize: 13, color: CORAL, align: 'center', valign: 'middle', charSpacing: 2, margin: 0 });
    s.addText('Thank you', { x: 0.5, y: 1.9, w: 12.33, h: 1.9, fontFace: FH, bold: true, fontSize: 72, color: CORAL, align: 'center', valign: 'middle', margin: 0 });
    s.addShape('rect', { x: 6.17, y: 4.0, w: 1.0, h: 0.07, fill: { color: CORAL }, line: { type: 'none' } });
    s.addText(d.chapter || 'JEE Mathematics', { x: 0.5, y: 4.3, w: 12.33, h: 0.8, fontFace: FH, bold: true, fontSize: 30, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
    s.addText(kindLabel + ' · ' + d.count + ' questions', { x: 0.5, y: 5.1, w: 12.33, h: 0.5, fontFace: FB, fontSize: 16, color: GRAYC, align: 'center', valign: 'middle', margin: 0 });
    s.addText('Avanti Fellows', { x: 0.5, y: 6.7, w: 12.33, h: 0.4, fontFace: FB, fontSize: 12, color: GRAYC, align: 'center', valign: 'middle', charSpacing: 2, margin: 0 });
  }

  return pptx.toBlob();
}

/* Convert multi-page DPP / Shiftwise sheet into the Avanti dark slide deck format */
async function buildPptx(PptxGenJS, JSZip, pages, H) {
  H = H || {};
  const allQs = [].concat(...(pages || []).map(p => p.qs || []));
  const p0 = (pages && pages[0]) || {};
  const ccs = [...new Set(allQs.map(q => q.cc).filter(Boolean))];
  const one = ccs.length === 1;
  const c0 = one && H.CHMAP && H.CHMAP.get ? H.CHMAP.get(ccs[0]) : null;
  const years = {};
  allQs.forEach(q => { if (q.y) years[q.y] = (years[q.y] || 0) + 1; });
  const tm = new Map();
  allQs.forEach(q => {
    const tName = q._t || q.tp || (H.CHMAP && H.CHMAP.get && H.CHMAP.get(q.cc) ? H.CHMAP.get(q.cc).n : 'Questions');
    tm.set(tName, (tm.get(tName) || 0) + 1);
  });
  const topics = [...tm.entries()].map(([name, n]) => ({ name, n }));
  const ex = [...new Set(allQs.filter(q => q.s === 'P').map(q => q.ex || q.e || q.exam))];
  const isKcet = ex.length === 1 && ex[0] === 'KCET';
  const isAdv = ex.length === 1 && ex[0] === 'Adv';
  const bucket = isKcet ? 'KCET' : (isAdv ? 'Adv' : 'Main');
  const d = {
    chapter: p0.title || (c0 ? c0.n : (isKcet ? 'KCET Mathematics' : 'JEE Mathematics')),
    cl: c0 ? c0.cl : '11 & 12',
    cc: one ? ccs[0] : '',
    clLabel: c0 ? 'CLASS ' + c0.cl : (isKcet ? 'KCET MATHS' : 'JEE MATHS'),
    chLabel: one && ccs[0].indexOf('M') >= 0 ? 'CHAPTER ' + ccs[0].split('M')[1] : (p0.badge || (isKcet ? 'KCET PYQs' : 'PRACTICE & PYQs')),
    bucket: bucket,
    bucketName: p0.sub || (isKcet ? 'KCET Mathematics' : 'JEE Mathematics'),
    kindLabel: p0.sub || (isKcet ? 'KCET PYQs' : 'JEE Mathematics'),
    perQ: true,
    year: 'all',
    count: allQs.length,
    years,
    topics,
    qs: allQs,
    figs: H.figs || {},
    meta: H.meta || {}
  };
  return buildCwPptx(PptxGenJS, JSZip, d, H);
}

root.OfficeDoc = { buildDocx, buildPptx, buildCwPptx, zipBytes, zipBlob, matchParts };
if (typeof module !== 'undefined') module.exports = root.OfficeDoc;
})(typeof window !== 'undefined' ? window : globalThis);
