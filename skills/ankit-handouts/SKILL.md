---
name: "ankit-handouts"
description: "Make Ankit's handwritten-notes style revision handouts (PDF, portrait, ruled notebook look, coloured pens, Hinglish asides) for any JEE/Class 11-12 Maths chapter. Use for 'Ankit-Handouts', 'handwritten handout', 'notes like my C12M16 / C11M8 notes'."
---

# Ankit-Handouts

Builds a portrait A4 PDF that looks like Ankit's own handwritten class notes (his C12M16 Matrices and C11M8 Binomial Theorem PDFs): PLAIN WHITE paper (no blue ruled lines) with RED MARGIN LINES: a double red line on the left AND a single red line on the right (the user insists on both; never drop the left one), red `#` headings with a hand-drawn underline, black/blue/dark-green/red pens, boxed formulas, circled answers, stars on key points, small tree diagrams, margin asides in Hinglish. It is separate from the `math-handouts` skill (coloured landscape formula sheets). Never edit that skill; use this one only when the user wants the handwritten look or says `Ankit-Handouts`.

First example made with it: `Sequences and Series (New)` (11M6, 14 pages).

## FORMAT RULES (user's standing rule: always follow)
An Ankit handout is ONLY: COLOURED, PORTRAIT, A4, WHITE background. Therefore:
- Never make a black-and-white / print version, never make a landscape version, never make PPTX or DOCX copies. One colour PDF is the whole deliverable.
- Do not use coloured paper, ruled blue lines or any background other than white (the red margin lines stay).
- When the user asks to add it to the handouts section of the Math Teacher Dashboard, follow `Adding to the Math Teacher Dashboard` below exactly (colour PDF only, portrait label, no BW/PPTX/DOCX buttons).

## Content rules
- Cover everything for JEE Main AND JEE Advanced. The CMS subtopics (read `avanti-jee-maths-syllabus` for the chapter's subtopic names and order) are the MINIMUM; the user said there is no restriction to CMS subtopics, so add every extra topic, identity, trap and special type a JEE Main/Advanced student needs. Do not print JM-codes.
- Page 1: chapter code + chapter name as the red title, then definitions. Total pages is EVEN (flexible; 12-16 is typical).
- Last three pages, in this order: (a) ONE questions page: `Good Ques.` JEE Main style, about 8 questions, then `Good Ques. (Advanced)` JEE Adv style, about 6 questions; each question is only the text plus an `Ans` box on the right (NO solution lines under the questions); (b) a `Kaunsa method lagaun ?` table, a `Last minute formula strip` (grid of 6 small coloured boxes with key formulas) and `Dhyan rakho (common galtiyan)`; (c) the LAST page: `Hints (separately)` for every Main question and `Hints (Advanced)` for every Advanced question, one or two lines per question (a nudge on the method, not the full solution, answer not repeated), then the `Advanced me kya dhyan rakhein` tips block. The user asked for hints for ALL questions separately on the last page, and for more JEE Main and Advanced questions, so never fewer than this.
- One idea per section: heading, formula box, 1-2 tiny worked examples, one tip. Examples are short: question, 1-2 lines of working, circled answer.
- Human touch: Hinglish asides in small dark-green Caveat (`<span class="note">`), phrases like `Dhyan rakho`, `Trick :`, `Agar ... toh`, `yaad rakho`; stars on the must-know formulas; circled final answers; boxes drawn with a slightly wobbly pen; every row tilted a tiny random angle. Keep it natural and not babyish.
- Pen colours: red `#d4202c` = headings, key formulas, warnings; blue `#1d3fae` = main working and rules; DARK green `#0a6428` = examples and asides (the user does not want light green); black = question text (`.k`).
- VERIFY EVERY formula, worked example and question answer numerically (python `fractions`/brute force) before putting it in. Never print an unchecked answer. Do not attribute questions to a real exam year unless certain; label them `JEE Main style` / `JEE Adv style`.
- Never use Google Fonts or other blocked domains; fonts come from npm `@fontsource`.

## Build (npm + playwright are available)
```bash
mkdir -p /home/claude/hb && cd /home/claude/hb && npm init -y >/dev/null
npm install katex @fontsource/kalam @fontsource/caveat
```
Write `handout.html` = `<head>` with `<link rel=stylesheet href=node_modules/katex/dist/katex.min.css>` + the CSS below, then one `<section class="page"><div class="inner">...sections...<div class="pno">N</div></div></section>` per page, then the two KaTeX script tags (`node_modules/katex/dist/katex.min.js`, `node_modules/katex/dist/contrib/auto-render.min.js`) and the JS below. Math is KaTeX: `$inline$`; never a bare `<` in math (use `\lt`, `\gt`). Use `$\to$`, `$\Rightarrow$`, `$\iff$` for arrows (the handwriting font lacks them). Do NOT add a stray `<svg width=0>` after the last page (it makes a blank page).

Every page's content is a list of `<div class="sec">` blocks; `.inner` is a flex column with `justify-content:space-between`, so spare height is spread evenly between sections. Aim for each page's content at 900-1000px of 1022px (render.py prints it; the questions and hints pages may be lower). Add one more worked example when a content page is under about 850px, and move a section to the next page when it overflows. Boxes and circles overlapped neighbouring lines before: keep the margins in the CSS below, put a formula that has big fractions on its own line, split lines that wrap with a lonely `=` or answer, and give rows that contain stacked fractions class `fr`.

After the PDF is rendered, LOOK at page 1 and check that BOTH the left double red line and the right red line are visible. (Bug seen once: using `background-image:` with positions/sizes is invalid CSS and silently removes all the red lines; always use the `background:` shorthand exactly as below.)

### HTML building blocks
- Title (page 1): `<div class="title"><span class="code">c11M6</span><span class="ul">CHAPTER NAME</span></div>`
- Heading: `<div class="h"><span class="hash">#</span><span class="ul">Heading</span> <span class="k" style="font-weight:400;font-size:19px">: short definition</span></div>`
- Ink: wrap rows in `.b` (blue), `.g` (dark green), `.r` (red), `.k` (black). Hanging list rows: `<div class="it">(i) ...</div>` (numbered) or `<div class="it2">$\to$ ...</div>`.
- Boxed formula: inline `<span class="box" style="--bc:#d4202c">...</span>` or block `<span class="box blk" style="--bc:#d4202c;padding:6px 14px">...</span>` (box colours: red #d4202c, blue #1d3fae, dark green #0a6428).
- Circled answer: `<span class="circ" style="--bc:#d4202c">$728$</span>`
- Stars: `<i class="s1"></i>` (one) or `<i class="s2"></i>` (two) before a must-know line.
- Aside: `<span class="note">n ki jagah (2n-1)</span>`; small text: `class="small"`.
- Type label: `<div class="r" style="font-weight:700"><u>Type-1</u> : <span class="k" style="font-weight:400">what it is</span></div>`
- Question row: flex row with the question text (`<b>Q1.</b> <span class="k">...</span>`) on the left and `<span class="box" style="--bc:#1d3fae;font-size:17px;white-space:nowrap;flex:none">Ans : ...</span>` on the right.
- Hint row: `<div class="it g" style="font-size:18px;line-height:30px"><b class="r">Q1</b> &nbsp;hint text</div>`.
- Tree / flow diagrams: hand-written inline SVG (Kalam text, slightly wobbly paths), like the Progressions tree on page 1 of 11M6.
- Method table: `<table class="m">` rows `<td class="b">pattern</td><td class="r">$\Rightarrow$ method</td>`.
- Page number only at bottom right (`.pno`).

### CSS (put in `<style>`)
```css
@font-face{font-family:'Kalam';font-weight:400;src:url(node_modules/@fontsource/kalam/files/kalam-latin-400-normal.woff2) format('woff2');}
@font-face{font-family:'Kalam';font-weight:700;src:url(node_modules/@fontsource/kalam/files/kalam-latin-700-normal.woff2) format('woff2');}
@font-face{font-family:'Caveat';font-weight:700;src:url(node_modules/@fontsource/caveat/files/caveat-latin-700-normal.woff2) format('woff2');}
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:'Kalam',cursive;font-size:19px;line-height:34px;color:#16181d}
.page{width:794px;height:1120px;position:relative;overflow:hidden;page-break-after:always;
 background:
  linear-gradient(#e0555d,#e0555d) 60px 0/2px 100% no-repeat,
  linear-gradient(#e0555d,#e0555d) 65px 0/1px 100% no-repeat,
  linear-gradient(#e0555d,#e0555d) 772px 0/1px 100% no-repeat,
  #fff;}
.inner{position:absolute;left:84px;right:30px;top:24px;height:1022px;display:flex;flex-direction:column;justify-content:space-between}
.sec{position:relative}
.pno{position:absolute;right:6px;bottom:-34px;font-family:'Caveat';font-weight:700;font-size:20px;line-height:20px;color:#444}
.r{color:#d4202c}.b{color:#1d3fae}.g{color:#0a6428}.k{color:#16181d}
.title{text-align:center;font-weight:700;font-size:30px;letter-spacing:1px;line-height:44px;color:#d4202c}
.title .code{font-size:23px;color:#1d3fae;margin-right:60px;letter-spacing:0}
.h{font-weight:700;font-size:23px;color:#d4202c;line-height:44px;margin-bottom:3px}
.fr{line-height:48px}
.hash{display:inline-block;margin-right:6px}
.ul,.box,.circ{position:relative;display:inline-block}
.box,.circ{text-indent:0}
.box{padding:0 9px;margin:3px 0}.circ{margin:5px 12px}
.blk{display:block}
.box.blk{margin:4px 0}
.it{padding-left:36px;text-indent:-36px}
.it2{padding-left:20px;text-indent:-20px}
.note{font-family:'Caveat';font-weight:700;font-size:23px;line-height:26px;color:#0a6428}
.small{font-size:17px;line-height:28px}
.cols{display:grid;grid-template-columns:1fr 1fr;column-gap:26px}
svg.ov{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}
svg.st{width:22px;height:22px;vertical-align:-3px;margin-right:3px;overflow:visible}
svg.st path{fill:none;stroke:#d4202c;stroke-width:1.8;stroke-linejoin:round}
.katex{font-size:1.06em}
.katex-display{margin:2px 0 !important;text-align:left}
.katex-display>.katex{text-align:left}
table.m{border-collapse:collapse;font-size:18px;line-height:28px;width:100%}
table.m td{padding:3px 8px;vertical-align:top}
```
Note: `.box,.circ{text-indent:0}` is needed, otherwise boxes inside a hanging `.it` row shift left and the hand-drawn border lands in the wrong place. The page number sits below `.inner` (bottom:-34px) so it never touches the last line.

### JS (put in `<script>` at the end of body)
It renders KaTeX, swaps star placeholders, then draws hand-drawn vector overlays (wobbly box borders, overshooting circles, wavy underlines) sized from each element, tilts every row a tiny random angle, and sets `data-ready`.
```js
(function(){
 function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
 const NS='http://www.w3.org/2000/svg';
 function mk(el,d,sw,col){const s=document.createElementNS(NS,'svg');s.setAttribute('class','ov');
   const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke',col);
   p.setAttribute('stroke-width',sw);p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');s.appendChild(p);el.appendChild(s);}
 function line(pts,r,j){let o='';pts.forEach((q,i)=>{o+=(i?'L':'M')+(q[0]+(r()-.5)*j).toFixed(1)+' '+(q[1]+(r()-.5)*j).toFixed(1)});return o;}
 function seg(a,b,r){const n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/14));const o=[];for(let i=0;i<=n;i++){o.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);}return o;}
 function rectPath(w,h,r){const c=()=> (r()-.5)*3;const e=0;
   const tl=[-e+c(),-e+c()],tr=[w+e+c(),-e+c()],br=[w+e+c(),h+e+c()],bl=[-e+c(),h+e+c()];
   const pts=[].concat(seg(tl,tr,r),seg(tr,br,r),seg(br,bl,r),seg(bl,[tl[0]+(r()*3),tl[1]+4+r()*3],r));
   return line(pts,r,1.3);}
 function ellPath(w,h,r){const cx=w/2,cy=h/2,rx=w/2+6,ry=h/2+3;const N=44;const o=[];const st=r()*0.5;
   for(let i=0;i<=N;i++){const t=st+i/N*Math.PI*2*1.07;const k=1+i/N*0.07+(r()-.5)*0.025;o.push([cx+Math.cos(t)*rx*k,cy+Math.sin(t)*ry*k]);}
   return line(o,r,0.6);}
 function underPath(w,h,r){const y=h-2;const o=[];const n=Math.max(3,Math.round(w/18));for(let i=0;i<=n;i++)o.push([ -2+(w+4)*i/n, y+(r()-.5)*1.6+(i/n)*1.5]);return line(o,r,0.5);}
 function starSvg(n,r){let h='';for(let i=0;i<n;i++){const rot=(r()*20-10).toFixed(0);
   h+='<svg class="st" viewBox="0 0 24 24" style="transform:rotate('+rot+'deg)"><path d="M12 2 L14.8 9 L22 9.4 L16.4 14 L18.3 21.5 L12 17.4 L5.7 21.5 L7.6 14 L2 9.4 L9.2 9 Z"/></svg>';}
  return h;}
 function run(){
  renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});
  const R=rng(7);
  document.querySelectorAll('i.s1').forEach(e=>{e.outerHTML=starSvg(1,R)});
  document.querySelectorAll('i.s2').forEach(e=>{e.outerHTML=starSvg(2,R)});
  document.fonts.ready.then(()=>{
   const r=rng(21);
   document.querySelectorAll('.box').forEach(e=>{const w=e.offsetWidth,h=e.offsetHeight;
     mk(e,rectPath(w,h,r),1.8,getComputedStyle(e).getPropertyValue('--bc')||'#1d3fae');});
   document.querySelectorAll('.circ').forEach(e=>{const w=e.offsetWidth,h=e.offsetHeight;
     mk(e,ellPath(w,h,r),1.7,getComputedStyle(e).getPropertyValue('--bc')||'#d4202c');});
   document.querySelectorAll('.ul').forEach(e=>{const w=e.offsetWidth,h=e.offsetHeight;
     const col=e.closest('.title')?'#d4202c':getComputedStyle(e).color;
     mk(e,underPath(w,h,r),e.closest('.title')?2.4:1.8,col);});
   const t=rng(5);
   document.querySelectorAll('.inner .sec > div, .inner .sec > table').forEach(e=>{e.style.transform='rotate('+((t()-.5)*0.45).toFixed(2)+'deg)';e.style.transformOrigin='left center';});
   document.body.setAttribute('data-ready','1');
  });
 }
 window.addEventListener('load',run);
})();
```

### render.py (save next to handout.html)
```python
import sys, pathlib
from playwright.sync_api import sync_playwright
src = pathlib.Path(sys.argv[1]).resolve(); out = sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width':794,'height':1123}); pg.goto(src.as_uri())
    pg.wait_for_selector('body[data-ready="1"]', timeout=30000); pg.wait_for_timeout(500)
    rep = pg.evaluate("""()=>[...document.querySelectorAll('.inner')].map((el,i)=>{
      const secs=[...el.children].filter(c=>c.classList.contains('sec'));
      const used=secs.reduce((a,c)=>a+c.getBoundingClientRect().height,0);
      return [i+1, Math.round(used), el.clientHeight];})""")
    for n,u,h in rep: print(f"page {n}: content {u}px of {h}px", "OVERFLOW" if u>h else "")
    pg.pdf(path=out, prefer_css_page_size=True, print_background=True); b.close()
print("WROTE", out)
```

## Workflow
1. Read the chapter's CMS subtopics; list extra JEE Main/Advanced topics to add; plan an even number of pages (intro, content pages, special types, then the three closing pages described above).
2. Write the HTML page by page; verify every formula, worked answer and question answer with python before it goes in.
3. `python render.py handout.html out.pdf`; fix any OVERFLOW; make sure `pdfinfo` page count equals the number of `.page` sections.
4. `pdftoppm -r 70 -png out.pdf v` and LOOK at every page: left and right red lines visible, boxes and circles must not overlap neighbouring text or each other, no wrong box positions, no awkward wraps (shorten or split the line), no content page under ~850px of content.
5. Name the file exactly as the user asked (for example `Sequences and Series (New).pdf`), save it under `/mnt/user-data/outputs/`, send it with SendUserFile, and tell the user to skim it. Keep the reply to a line or two. Colour portrait PDF only (see FORMAT RULES).

## Adding to the Math Teacher Dashboard (handouts section)
When the user says to put an Ankit handout in the Math Teacher Dashboard / handouts section (artifact `https://claude.ai/artifact/UgXUYU8es1bDbPrckV3Cn8`; find it with the Artifact `list` action if the URL changes). The Handouts tab is a card list read from `handouts/index.json`; each card normally offers colour/BW PDF, PPTX and DOCX. An Ankit handout gets ONLY a colour PDF:
1. Read the artifact (`read` with the url, then `read` with `paths` for `handouts/index.json` and `teacher.js`), so you build on the live version.
2. Copy the finished colour PDF to `handouts/<CODE>_<Chapter_Name>_Handout.pdf` (for example `handouts/11M6_Sequences_and_Series_New_Handout.pdf`). Do NOT create `handouts/<CODE>/bw/...`, and do NOT create anything under `handouts/office/`.
3. Prepend (so it is first in its class section) an entry to `handouts/index.json`: `{"code":"11M6","title":"Sequences and Series (New)","file":"11M6_Sequences_and_Series_New_Handout.pdf","dir":"11M6","pages":14,"orient":"Portrait A4","kind":"Handwritten notes","nobw":true,"pdfonly":true}` (pages = real page count; the code's first two digits pick the Class 11 / Class 12 section).
4. `teacher.js` must support those flags. Check that it already contains `x.orient || 'Landscape A4'`, `x.nobw ? null :` and `x.pdfonly ? null :`; if any is missing, patch it with exact string replacements: replace `h('span', { text: 'Landscape A4' }), h('span', { text: 'Short notes' })` with `h('span', { text: x.orient || 'Landscape A4' }), h('span', { text: x.kind || 'Short notes' })`; replace `btn(x, 'pdf', false, 'PDF'), btn(x, 'pptx', false, 'PPTX'), btn(x, 'docx', false, 'DOCX')` with `btn(x, 'pdf', false, 'PDF'), x.pdfonly ? null : btn(x, 'pptx', false, 'PPTX'), x.pdfonly ? null : btn(x, 'docx', false, 'DOCX')`; and put `x.nobw ? null : ` in front of the `h('div', { class: 'hosec' }, ... 'Black and white (print)' ...)` block.
5. Republish with the Artifact tool: `url` = the dashboard, `file_path` = a page file made from the live `index.html` BODY only (the text between `<body>` and `</body>`, no doctype/head/skeleton), `root` = your working folder, and `files` = only the changed or new files (`teacher.js` if patched, `handouts/index.json`, the new PDF). Existing files are kept. Do not pass `capabilities`.
6. Tell the user in one sentence that it is in the Handouts section, as a colour portrait PDF only.