"""Render an HTML handout to a landscape A4 PDF and report panel overflow.

Usage: python render.py handout.html out.pdf
Run from the folder that contains node_modules/ (katex + fontsource fonts).
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

src = pathlib.Path(sys.argv[1]).resolve()
out = sys.argv[2] if len(sys.argv) > 2 else 'handout.pdf'

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.goto(src.as_uri())
    pg.wait_for_selector('body[data-ready="1"]')
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(800)
    res = pg.evaluate("""() => [...document.querySelectorAll('.panel')].map((p,i)=>{
        const r=p.getBoundingClientRect(); let m=0;
        p.querySelectorAll('*').forEach(e=>{ if(e.classList.contains('pno'))return;
            const bt=e.getBoundingClientRect().bottom; if(bt>m)m=bt;});
        return [i+1, Math.round(r.height), Math.round(m-r.top)];
    })""")
    bad = False
    for n, h, c in res:
        flag = "OVERFLOW - shorten this panel" if c > h - 18 else ""
        bad |= bool(flag)
        print(f"panel {n}: content {c}px of {h}px {flag}")
    pg.pdf(path=out, prefer_css_page_size=True, print_background=True)
    b.close()
print("WROTE", out, "| overflow found" if bad else "| all panels fit")
