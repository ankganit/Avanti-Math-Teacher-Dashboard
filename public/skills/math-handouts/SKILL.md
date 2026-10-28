---
name: "math-handouts"
description: "Create colourful, beautified, short-notes style revision handouts (PDF) for JEE/Class 12 Maths chapters, in the \"MARKS\"-style formula-sheet look - pastel title banners, coloured formula boxes, worked examples, two panels per landscape A4 page. Use this skill whenever the user asks for a handout, short notes, formula sheet, revision sheet, cheat sheet or \"notes like the 12M20 handout\" for any Maths chapter (e.g. Differential Equation, Definite Integration, Matrices, Vectors, Probability), even if they do not say \"PDF\" or \"handout\" explicitly."
---

# Math Handouts

Builds a landscape A4 PDF of short, colourful JEE revision notes for one Maths chapter, plus a black-and-white print version of the same pages. Each page has two panels; each panel is one idea with a coloured banner, formula boxes and tiny examples. The look matches the 12M20 Definite Integration handout. Bundled example: `assets/example_12M21_Differential_Equation.pdf` (old 8-page version: look at it for the style, but follow the rules below).

## Audience and focus
These are JEE Main AND JEE Advanced revision handouts. The handout must cover everything the chapter needs up to JEE Advanced level, with no topic left out. Give the most space to what scores in the exam: standard methods, shortcuts, traps, special types that PYQs keep asking, and formulas students must know cold. Do not skip the easy basics, but keep them short (half a panel) and spend the rest on competition material (for example integral equations, limit-defined or functional equations, count and parameter problems, multi-concept PYQs).

## Page count: flexible, but try not to go beyond 20 pages
Let the chapter decide the length: a small chapter can be 6-8 pages, a normal one 10-16, a big one up to 20. Try NOT to go beyond 20 pages (the user asked for 20 as the ceiling; trim the weakest extra examples rather than go over). Never cut JEE Advanced content to hit a number, and never pad. Rules: the total is always EVEN; page 1 is the cover + contents; the method-chooser + tips page is always the LAST page; the Tricky PYQ pages (2-3 questions per panel, usually two or three pages) sit just before it. JEE-special topics that do not fit under a subtopic (functional equations, counting, periodicity tricks) get their own pages after the subtopic pages.

## Page feel: roomy, but filled to the bottom (user rule)
- Do not pack panels. Aim for each panel to end at about 88-95% of the page height: nothing crowded, and no empty band of 20-30% at the bottom. Use more panels or pages (within the 20-page ceiling) rather than shrinking text; math is never tiny.
- Worked-example boxes are relaxed: question, working and answer on separate lines, line-height about 1.45, padding and a gap between boxes. Never jam question, steps and answer in one line.
- Where a panel has spare room and no new concept to add, add a clean figure/graph (bigger graphs are welcome: 2 per row or one large one) or one more short worked example (JEE style, verified with sympy or numerically).
- Put spaces around words inside math: `\;\text{if}\;`, `\quad\text{or}\quad`, `\;\text{and}\;` (never a glued `if`/`or`/`and`).
- After the content is final, run the fill step (Workflow step 8b) so leftover vertical space is spread evenly between blocks.

## Workflow
1. **Chapter and subtopics.** Read `/mnt/skills/plugins/avanti-jee-maths-syllabus/SKILL.md` and its reference CSV/MD. Use the CMS subtopic names verbatim, in CMS order. Do NOT print the JM-xx codes anywhere (Contents lists names and page numbers only). If the chapter is not in the list, ask for the subtopics.
2. **Plan the pages.** Order: cover + contents, the content pages (1-2 panels per subtopic, with extra panels for whatever JEE Advanced needs), the JEE special-types pages if any, two or three Tricky PYQ pages, then the method chooser + tips page last. Count the panels, round the total up to an even number of pages (20 at most), and put the real page numbers in the Contents. Use `references/design_rules.md` for colours, layout and style.
3. **Cover:** code and chapter name, the pill `Quick Revision Handout`, under it the line `Made with <red heart> by Ankit` (inline SVG heart in a div of class `madeby`), and a small motivation quote (see Cover quote below).
4. **Set up the build folder** (npm is allowed):
   ```bash
   mkdir -p /home/claude/hb && cd /home/claude/hb
   npm init -y >/dev/null && npm install katex @fontsource/fredoka @fontsource/patrick-hand @fontsource/baloo-2
   cp /mnt/skills/user/math-handouts/assets/handout_template.html handout.html   # path may differ; use the skill's folder
   cp /mnt/skills/user/math-handouts/scripts/render.py .
   ```
5. **Write the pages** in the template's structure: `<div class="page"><div class="frame"><div class="divider"></div><div class="panel left">...</div><div class="panel">...</div></div></div>`. Blocks: `.banner.b-<colour>`, `.sh.t-<colour>`, `.box.<colour>` (add `.c` to centre), `.step` with `.n`, `.tip`, `.warn`, `table.t.<colour>t`, `.small`, `.hl`. Math is KaTeX with `$inline$` and `$$display$$`. Never write a bare `<` followed by a letter inside math (HTML swallows it): use `\lt`.
6. **Graphs and figures: add them where they teach.** Draw small inline SVGs (about 220x100 viewBox, two side by side, one large, or one at about 60% width) from a Python helper: axes, labelled curves, dashed asymptotes or reference lines, a short caption. Use them for graph-based ideas (for example vertical line test, trig, inverse trig, exp/log, step and fractional part, max/min, mappings, even/odd, periodic, inverse) and for families of curves, orthogonal trajectories, growth and cooling curves. Do not add a figure when a formula or a sentence is enough, but do prefer a figure over blank space. Use the panel palette for colours.
7. **Tricky PYQ pages: answer-only.** Each question shows only the source tag (exam and year), the question, the options and `Ans <letter(s) or value>`. No explanation, no chapter tags, no 'how to attack' box, no pattern list. Pull multi-concept or trap questions (L3 first, include JEE Advanced ones) from the teacher artifact's `qb/data/pyq.json` for the chapter, copy the text from the JSON (convert `\( \)` to `$ $`), and SOLVE EVERY ONE yourself to confirm the printed key before including it. Put 2-3 questions per panel (never crowd a panel); 12-16 questions over 4-6 panels (2-3 pages).
8. **Render and check:** `python render.py f.html out.pdf`. Fix every panel flagged OVERFLOW (limit about 713 of 731 px; the comfortable content height before the fill step is about 600-650 px): shorten text, drop an example, shrink a figure. Then `pdftoppm -r 70 -png out.pdf v` and VIEW every page. Look for tiny math in tables, awkward wraps, empty half-panels.
8b. **Fill step (always).** Render the final PDFs with `render_fill.py` instead of plain `render.py` (colour target 690, black-and-white target 680). It spreads leftover vertical space evenly between a panel's blocks (up to about 20-34 px per gap, plus a little padding inside boxes) so panels end near the bottom without looking crowded; its `OVERFLOW panels` list must be empty. Do the figure/example additions BEFORE this step so gaps stay small. Save this as `render_fill.py` next to `render.py` and run `python render_fill.py f.html out.pdf 690`:
   ```python
"""Like render.py, but spreads spare vertical room inside each panel so pages look filled (not packed).
Usage: python render_fill.py in.html out.pdf [target_px]"""
import sys, pathlib
from playwright.sync_api import sync_playwright
src = pathlib.Path(sys.argv[1]).resolve(); out = sys.argv[2]
target = int(sys.argv[3]) if len(sys.argv) > 3 else 690
JS = """(target) => {
 const panels=[...document.querySelectorAll('.panel')];
 const used=p=>{const r=p.getBoundingClientRect();let m=0;p.querySelectorAll('*').forEach(e=>{if(e.classList.contains('pno')||e.closest('.deco'))return;const b=e.getBoundingClientRect().bottom;if(b>m)m=b;});return m-r.top;};
 const log=[];
 panels.forEach((p,i)=>{
  if(i===0) return;
  const kids=[...p.children].filter(e=>!e.classList.contains('pno')&&!e.classList.contains('deco')&&e.getBoundingClientRect().height>0);
  if(kids.length<3) return;
  const before=used(p); let free=target-before; if(free<8) return;
  // pass 1: gaps between blocks (cap 20px each)
  const gaps=kids.length-1; let g=Math.min(20,Math.floor(free/gaps));
  for(let k=1;k<kids.length;k++){ const cur=parseFloat(getComputedStyle(kids[k]).marginTop)||0; kids[k].style.marginTop=(cur+g)+'px'; }
  let after=used(p); free=target-after;
  // pass 2: extra inner padding for box-like blocks
  if(free>10){ const boxes=kids.slice(1); const pad=Math.min(9,Math.floor(free/(2*boxes.length)));
    if(pad>=1) boxes.forEach(e=>{const cs=getComputedStyle(e); if(parseFloat(cs.paddingTop)>0||e.className.match(/box|step|tip|warn|qb/)){e.style.paddingTop=(parseFloat(cs.paddingTop)+pad)+'px';e.style.paddingBottom=(parseFloat(cs.paddingBottom)+pad)+'px';}}); }
  after=used(p); free=target-after;
  // pass 3: still room -> bigger gaps (cap 34px)
  if(free>10){ const g2=Math.min(14,Math.floor(free/gaps)); for(let k=1;k<kids.length;k++){const cur=parseFloat(kids[k].style.marginTop)||0;kids[k].style.marginTop=(cur+g2)+'px';} }
  log.push([i+1,Math.round(before),Math.round(used(p))]);
 });
 return log;}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); pg.goto(src.as_uri())
    pg.wait_for_selector('body[data-ready="1"]'); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(800)
    log = pg.evaluate(JS, target)
    res = pg.evaluate("""() => [...document.querySelectorAll('.panel')].map((p,i)=>{const r=p.getBoundingClientRect();let m=0;p.querySelectorAll('*').forEach(e=>{if(e.classList.contains('pno'))return;const bt=e.getBoundingClientRect().bottom;if(bt>m)m=bt;});return [i+1,Math.round(r.height),Math.round(m-r.top)];})""")
    bad=[n for n,h,c in res if c>h-18 and n!=1]
    print("filled:", " ".join(f"{n}:{a}->{c}" for n,a,c in log))
    print("OVERFLOW panels:", bad)
    pg.pdf(path=out, prefer_css_page_size=True, print_background=True); b.close()
print("WROTE", out)
   ```
9. **Black-and-white print version (always make it).** Do NOT recolour page images. Make a second HTML by inserting the CSS below before `</head>` and render it (with the fill step, target 680) to its own PDF (vector, small). It removes every colour fill, puts black outlines on banners (titles), underlines subheadings, outlines table headers and number chips, and turns graph colours black:
   ```css
   *{color:#000!important;text-shadow:none!important;box-shadow:none!important}
   .page *:not(.katex):not(.katex *):not(svg):not(svg *){background:transparent!important;background-image:none!important}
   .frame,.divider{border-color:#000!important}
   .banner{border:0.6mm solid #000!important}
   .sh{display:table;border-bottom:0.45mm solid #000;padding-bottom:0.3mm}
   .box{border:0.25mm solid #444!important}
   .warn,.tip{border-color:#000!important}
   table.t th{border:0.45mm solid #000!important;border-left-width:0!important;border-right-width:0!important}
   table.t th:first-child{border-left:0.45mm solid #000!important}
   table.t th:last-child{border-right:0.45mm solid #000!important}
   .cchip,.step .n,.covertag{border:0.5mm solid #000!important}
   .crow{border:0.25mm solid #444!important}
   .coverbox{border-color:#000!important}
   .deco{color:#bbb!important}
   ul.dots li::marker{color:#000!important}
   .pno{color:#000!important}
   .madeby svg path{fill:#000!important}
   svg polyline,svg path:not([fill]){stroke:#000!important}
   svg line:not([stroke="#1b1b2f"]):not([stroke="#9aa0aa"]){stroke:#000!important}
   svg text,svg circle[fill]:not([fill="#fff"]){fill:#000!important}
   svg circle[fill="#fff"]{stroke:#000!important}
   svg rect{stroke:#999!important}
   ```
10. **Page images for the dashboard:** `pdftoppm -r 140 -jpeg -jpegopt quality=80` for colour, and the same with `-gray` on the black-and-white PDF. Name them `p-1.jpg ... p-N.jpg` with NO zero padding (pdftoppm pads once there are 10 or more pages, so rename). Colour set in `handouts/<dir>/`, black-and-white set in `handouts/<dir>/bw/` with the PDF `<file>_BW.pdf`. `handouts/index.json` entries are `{code,title,file,dir,pages}` (pages = the real page count). The Handouts tab has a half-filled-circle icon that switches preview and download to the black-and-white set, plus Download and Maximize icons. There is no Print, Share or Save to Drive button: the artifact viewer cannot print or share, so do not add them.
11. **Verify the maths.** Work every example and answer yourself before delivering. Mention in the reply that the user should still skim it.
12. **Deliver:** copy the PDFs to `/mnt/user-data/outputs/<chapter code>_<Chapter_Name>_Handout.pdf` (and `_BW.pdf`) and publish the dashboard files by the user's publishing rules. Keep the reply short: pages, topics covered, offer tweaks.

## Cover quote
On the front page, under the `Made with <heart> by Ankit` line, add one short motivational quote in italics (one or two lines, small text, class `quote`). It must be DIFFERENT for every chapter and fit the chapter's spirit (for example Functions: every output needs an input; Differential Equations: small changes, big stories; Probability: odds favour the prepared). Write it yourself, short and original, and do not attribute it to a real person. Keep it clean in the black-and-white version too.

## Rules
- SHORT NOTES only: definition, formula box, 1-2 examples, one tip per panel. No long paragraphs.
- Even page count, flexible length (6 to 20 pages; try not to go beyond 20); the last page (method chooser + tips) stays last.
- Panels roomy but filled to the bottom (about 88-95%), examples relaxed, spacing around words in math.
- Cover JEE Advanced level fully, not only JEE Main.
- Use CMS chapter/subtopic names exactly, but never print the JM-codes in Contents.
- Do not copy any publisher's branding or watermark. Add the user's own logo only if they ask.
- Never use Google Fonts or any blocked domain; fonts come from `@fontsource` via npm.
- Page number only at the bottom right of the right panel.
- Colour-vary banners panel to panel; same hue family for banner, box and sub-heading in a panel.
- Every example and every PYQ answer must be checked by solving it.