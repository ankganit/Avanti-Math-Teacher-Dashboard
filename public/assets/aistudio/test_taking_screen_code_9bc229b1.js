/* ===== CSS: test-screen and rules styles (from student dashboard index.html) ===== */
.take{max-width:1100px;margin-inline:auto;padding-block:8px 64px;display:flex;flex-direction:column;gap:16px}
.take h1{font-size:28px;font-weight:700;margin-top:6px}
.fact{background:var(--bg);border-radius:8px;padding:12px 14px;min-width:0}
.fact b{display:block;font-size:22px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
.fact span{font-size:13px;color:var(--muted);font-weight:500}
.fact b.ok,.tp.ok{color:var(--ok)}.fact b.low,.tp.low{color:var(--bad)}
.fact small.dl,.dl{font-size:12px;font-weight:600;color:var(--muted)}
.timer{font-weight:700;font-size:22px;font-variant-numeric:tabular-nums;color:var(--ink);background:var(--panel);border:1px solid var(--rule);border-radius:8px;padding:2px 12px}
.timer.low{color:#fff;background:var(--bad);border-color:var(--bad)}
.confirm{background:var(--mark-soft);border:1.5px solid var(--mark);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:10px;color:var(--ink)}
@media (max-width:560px){.bigstat{font-size:44px}.take h1{font-size:24px}.qcard{padding:16px}}
.fact .dl{display:block;margin-top:3px}
.fact small.dl{display:block;margin-top:2px}
.timers{display:flex;align-items:center;gap:8px}
.qtimer{font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;color:var(--accent-deep);background:var(--accent-soft);border:1px solid var(--accent);border-radius:8px;padding:3px 10px;white-space:pre}
.take.wide{max-width:1200px}
.tbar3{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);border-bottom:1px solid var(--rule2);padding:12px 0;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px}
.tbar3 b{color:var(--ink)}
.tb-l{font-size:16px}.tb-c{font-size:20px;text-align:center}.tb-r{justify-self:end}
@media (max-width:700px){.tbar3{grid-template-columns:1fr auto}.tb-c{grid-column:1/-1;grid-row:2}}
.btn.danger{background:var(--bad);border-color:var(--bad);color:#fff}
.btn.danger:hover{background:#A92B24;border-color:#A92B24}
.subgap{margin-top:56px;padding-top:16px;border-top:1px dashed var(--rule2)}
.rules{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px;color:var(--ink);font-size:15px;line-height:1.5}
.agree{display:flex;gap:10px;align-items:flex-start;background:var(--mark-soft);border:1.5px solid var(--mark);border-radius:10px;padding:12px 14px;cursor:pointer;color:var(--ink);font-weight:600}
.agree input{width:20px;height:20px;margin-top:2px;accent-color:var(--accent);flex:none}
function stopTimer() { if (T.timer) { clearInterval(T.timer); T.timer = null; } }
function startTimer() { stopTimer(); T.timer = setInterval(tick, 1000); }
  const old = $('.confirm'); if (old) old.remove();
  $('.take').append(box); box.scrollIntoView({ block: 'center' });

/* ===== JS: intro, rules, full-screen, anti-cheat, logging ===== */
function renderIntro() {
  const { t } = T.run, m = t.meta, v = view();
  v.append(h('div', { class: 'wrap' }, brandBar(),
    h('div', { class: 'take' },
      h('h1', { text: m.t }),
      h('div', { class: 'facts' },
        h('div', { class: 'fact' }, h('b', { text: t.qs.length }), h('span', { text: 'Questions' })),
        h('div', { class: 'fact' }, h('b', { text: m.m + ' min' }), h('span', { text: 'Time' })),
        h('div', { class: 'fact' }, h('b', { text: t.qs.length * m.p }), h('span', { text: 'Max marks' })),
        h('div', { class: 'fact' }, h('b', { text: '+' + m.p + ' / −' + m.n }), h('span', { text: 'Marking' }))),
      h('div', { class: 'card' },
        h('h3', { text: 'Read these rules before you start' }),
        h('ul', { class: 'rules' }, [
          'This test is monitored all the time. Everything listed below is recorded against your Avanti ID and your teacher can see it.',
          'The test opens in full screen. If you leave full screen, the questions are hidden and the leave is recorded. The timer keeps running.',
          'Switching tab or window, minimising the browser, opening another app, or pressing the Windows key is recorded every time, with the total time you were away.',
          'Taking a screenshot or screen recording is not allowed. Pressing the Windows key or Print Screen hides the screen and is recorded.',
          'Copy, paste, cut, right-click, save and print are switched off.',
          'Do not refresh or close this page. If it closes by mistake, log in again on the same device and the test continues. The timer does not stop.',
          'After you submit, press Submit in the Google Form that opens, and wait until it says your response was recorded. Do not close this page before that.',
          'Marking: single-answer +' + m.p + ' for correct, −' + m.n + ' for wrong. Questions with more than one correct option need every correct option and no wrong one, and have no negative marking. Numerical questions have no negative marking. You cannot change answers after you submit.'
        ].map(x => h('li', { text: x }))),
        h('label', { class: 'agree' }, h('input', { type: 'checkbox', id: 'agreeBox', onchange: e => { const bt = $('#startBtn'); if (bt) bt.disabled = !e.target.checked; } }), h('span', { text: 'I have read and understood all the rules. I know that my activity is being recorded.' })),
        h('p', { class: 'hint', text: (me() ? me().n + ' · ' : '') + 'Avanti ID ' + AUTH }),
        h('div', { class: 'btns' },
          h('button', { type: 'button', class: 'btn pri', id: 'startBtn', disabled: true, text: 'Start test', onclick: () => {
            if (!$('#agreeBox') || !$('#agreeBox').checked) return;
            const prior = pastFor(t.code); if (prior) { openEntry(prior); return; }
            if (takenRemote(t.code)) { renderTaken(t); return; }
            try { const de = document.documentElement; if (de.requestFullscreen) de.requestFullscreen().then(() => { T.run.fs = true; }).catch(() => {}); } catch (e) { /* not supported */ } T.run.qt = {}; T.run.qmark = Date.now(); T.run.name = AUTH; T.run.started = Date.now(); T.run.end = T.run.started + m.m * 60000; save(); startTimer(); renderQuestion(); } }),
          h('button', { type: 'button', class: 'btn', text: 'Back', onclick: renderHome }))))));
  math(v);
}
function accrueQ() { const R = T.run; if (!R || R.done) return; const now = Date.now(); if (!R.qt) R.qt = {}; if (!R.qmark) { R.qmark = now; return; } R.qt[R.cur] = (R.qt[R.cur] || 0) + (now - R.qmark) / 1000; R.qmark = now; }
function awayOut() { const R = T.run; if (R && !R.done && R.started && !R.lt) { R.lt = Date.now(); R.sw = (R.sw || 0) + 1; save(); } }
function awayBack() { const R = T.run; if (R && R.lt) { R.sa = (R.sa || 0) + (Date.now() - R.lt) / 1000; R.lt = 0; if (!R.done) save(); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) awayOut(); else awayBack(); });
window.addEventListener('blur', awayOut); window.addEventListener('focus', awayBack);
function fsBack() { const o = $('#fsOver'); if (o) o.remove(); try { document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* ignore */ } }
document.addEventListener('fullscreenchange', () => {
  const R = T.run;
  if (document.fullscreenElement) { if (R && !R.done) R.fs = true; const o = $('#fsOver'); if (o) o.remove(); awayBack(); return; }
  if (!R || R.done || !R.started || !R.fs) return;
  awayOut();
  if (!$('#fsOver')) document.body.append(h('div', { id: 'fsOver', style: 'position:fixed;inset:0;z-index:99;background:rgba(20,27,51,.96);color:#fff;display:grid;place-items:center;padding:24px;text-align:center' },
    h('div', { style: 'max-width:420px;display:flex;flex-direction:column;gap:14px;align-items:center' }, h('h2', { style: 'color:#fff', text: 'You left full screen' }), h('p', { text: 'Your teacher is told every time you leave the test screen. The timer is still running. Return to full screen to continue.' }), h('button', { type: 'button', class: 'btn pri', text: 'Return to full screen', onclick: fsBack }))));
});
['contextmenu', 'copy', 'cut', 'paste'].forEach(ev => document.addEventListener(ev, e => { const R = T.run; if (R && !R.done && R.started) e.preventDefault(); }));
function addWm() {
  const lbl = String(AUTH || '') + ' ' + ((me() && me().n) || ''), svg = '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="170"><text x="130" y="85" text-anchor="middle" transform="rotate(-24 130 85)" font-family="Arial" font-size="16" font-weight="700" fill="#141B33" fill-opacity="0.11">' + lbl.replace(/[<>&"]/g, '') + '</text></svg>';
  document.body.append(h('div', { id: 'wm', style: 'position:fixed;inset:0;z-index:40;pointer-events:none;background:url("data:image/svg+xml,' + encodeURIComponent(svg) + '")' }));
}
function psHit() {
  const R = T.run; if (!R || R.done || !R.started) return;
  if (Date.now() - (R.psAt || 0) > 1500) { R.ps = (R.ps || 0) + 1; R.psAt = Date.now(); save(); }
  try { navigator.clipboard.writeText('Screenshots are not allowed during the test.').catch(() => {}); } catch (e) { /* ignore */ }
  const c = h('div', { style: 'position:fixed;inset:0;z-index:98;background:#141B33;color:#fff;display:grid;place-items:center;font-weight:700;font-size:20px;text-align:center;padding:24px', text: 'Screenshots are not allowed during the test. Your teacher is told.' });
  document.body.append(c); setTimeout(() => c.remove(), 2500);
}
function snipCover() {
  const R = T.run; if (!R || R.done || !R.started || $('#snipC')) return;
  document.body.append(h('div', { id: 'snipC', style: 'position:fixed;inset:0;z-index:98;background:#141B33;color:#fff;display:grid;place-items:center;font-weight:700;font-size:20px;text-align:center;padding:24px', text: 'Screen hidden. Screenshots are not allowed during the test.' }));
}
function snipUncover() { const c = $('#snipC'); if (c) c.remove(); }
document.addEventListener('keydown', e => { if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Super') { const R = T.run; if (R && !R.done && R.started) { snipCover(); if (!e.repeat && Date.now() - (R.psAt || 0) > 1500) { R.ps = (R.ps || 0) + 1; R.psAt = Date.now(); save(); } } } }, true);
document.addEventListener('keyup', e => { if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Super') setTimeout(snipUncover, 600); }, true);
window.addEventListener('blur', snipCover); window.addEventListener('focus', () => setTimeout(snipUncover, 300));
document.addEventListener('keyup', e => { if (e.key === 'PrintScreen') psHit(); });
document.addEventListener('keydown', e => { if (e.key === 'PrintScreen') psHit(); else if ((e.ctrlKey || e.metaKey) && /^[ps]$/i.test(e.key)) { const R = T.run; if (R && !R.done && R.started) e.preventDefault(); } });
function save() { const R = T.run; if (R && !R.done) { accrueQ(); ssSet('avanti_run', { code: R.t.code, name: R.name, started: R.started, end: R.end, ans: R.ans, cur: R.cur, qt: R.qt || {}, sw: R.sw || 0, sa: R.sa || 0, lt: R.lt || 0, ps: R.ps || 0, st: R.st || {} }); } }
function startTimer() { stopTimer(); T.timer = setInterval(tick, 1000); }
function tick() {
  if (!T.run || T.run.done) { stopTimer(); return; }
  const left = Math.max(0, T.run.end - Date.now()), el = $('#timer');
  if (el) { const s = Math.ceil(left / 1000); el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); el.classList.toggle('low', s <= 300); }
  const qe = $('#qtimer');
  if (qe) { const R = T.run, spent = Math.floor((R.qt && R.qt[R.cur] || 0) + (R.qmark ? (Date.now() - R.qmark) / 1000 : 0)); qe.textContent = 'Q' + (R.cur + 1) + '  ' + String(Math.floor(spent / 60)).padStart(2, '0') + ':' + String(spent % 60).padStart(2, '0'); }
  if (left <= 0) { const R = finishTest(); if (R) { try { const w = FORM ? window.open(formLink(R), '_blank') : null; if (w) { R.fo = true; markSent(R.t.code); try { w.opener = null; } catch (e) { /* ignore */ } } } catch (e) { /* blocked */ } renderResult(true); } }

/* ===== JS: timer, question screen, submit, logging ===== */
function startTimer() { stopTimer(); T.timer = setInterval(tick, 1000); }
function tick() {
  if (!T.run || T.run.done) { stopTimer(); return; }
  const left = Math.max(0, T.run.end - Date.now()), el = $('#timer');
  if (el) { const s = Math.ceil(left / 1000); el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); el.classList.toggle('low', s <= 300); }
  const qe = $('#qtimer');
  if (qe) { const R = T.run, spent = Math.floor((R.qt && R.qt[R.cur] || 0) + (R.qmark ? (Date.now() - R.qmark) / 1000 : 0)); qe.textContent = 'Q' + (R.cur + 1) + '  ' + String(Math.floor(spent / 60)).padStart(2, '0') + ':' + String(spent % 60).padStart(2, '0'); }
  if (left <= 0) { const R = finishTest(); if (R) { try { const w = FORM ? window.open(formLink(R), '_blank') : null; if (w) { R.fo = true; markSent(R.t.code); try { w.opener = null; } catch (e) { /* ignore */ } } } catch (e) { /* blocked */ } renderResult(true); } }
}
const hasAns = a => !(a == null || a === '' || (Array.isArray(a) && !a.length));
const subOf = q => q.sub || 'Mathematics';
/* Question states: '' not visited, r not answered, g answered, v marked for review, gv answered and marked (counted). */
function settleQ(i, mode) {
  const R = T.run; if (!R) return; if (!R.st) R.st = {};
  const has = hasAns(R.ans[i]), old = R.st[i], wasV = old === 'v' || old === 'gv';
  if (mode === 'mark') R.st[i] = 'v';
  else if (mode === 'review') R.st[i] = has ? 'gv' : 'v';
  else if (mode === 'passive') R.st[i] = old === 'v' ? 'v' : has ? (old === 'gv' ? 'gv' : 'g') : (wasV ? 'v' : 'r');
  else R.st[i] = has ? 'g' : 'r';
}
function renderQuestion() {
  const R = T.run, q = R.t.qs[R.cur], v = view(), n = R.t.qs.length; if (!R.st) R.st = {};
  const body = [h('div', { class: 'lbl', text: 'Question ' + (R.cur + 1) + ' of ' + n + ' · ' + subOf(q) + (q.t === 'MSQ' ? ' · one or more correct' : q.t === 'Numerical' ? ' · numerical' : '') }), h('div', { class: 'stem' }, q.q)];
  if (q.f) body.push(h('img', { class: 'figs', alt: 'Figure', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(q.f.svg), width: q.f.w, height: q.f.h }));
  if (q.t === 'Numerical') {
    body.push(h('div', { class: 'fld' }, h('label', { class: 'lbl', for: 'numIn', text: 'Your answer' }), h('input', { type: 'text', id: 'numIn', inputmode: 'decimal', autocomplete: 'off', value: R.ans[R.cur] || '', oninput: e => { R.ans[R.cur] = e.target.value.trim(); save(); } })));
  } else {
    const multi = q.t === 'MSQ';
    q.o.forEach((o, i) => {
      const L = 'ABCD'[i], sel = multi ? (R.ans[R.cur] || []).includes(L) : R.ans[R.cur] === L;
      body.push(h('label', { class: 'choice' }, h('input', { type: multi ? 'checkbox' : 'radio', name: 'opt', checked: sel, onchange: e => {
        if (multi) { const s = new Set(R.ans[R.cur] || []); e.target.checked ? s.add(L) : s.delete(L); R.ans[R.cur] = [...s].sort(); } else R.ans[R.cur] = L;
        save(); } }), h('b', { text: '(' + L + ')' }), h('span', { class: 'ot', text: o })));
    });
  }
  const goTo = i => { accrueQ(); R.cur = i; save(); renderQuestion(); };
  const passive = i => { settleQ(R.cur, 'passive'); goTo(i); };
  const nextQ = mode => { settleQ(R.cur, mode); goTo((R.cur + 1) % n); };
  const groups = []; R.t.qs.forEach((qq, i) => { const sname = subOf(qq); let g = groups.find(x => x.s === sname); if (!g) groups.push(g = { s: sname, ix: [] }); g.ix.push(i); });
  const pals = groups.map(g => h('div', { class: 'pgrp' }, h('div', { class: 'psub', text: 'Subject: ' + g.s + ' (' + g.ix.length + ' questions)' }),
    h('div', { class: 'palette' }, g.ix.map(i => h('button', { type: 'button', class: 'ps ' + (R.st[i] || '') + (i === R.cur ? ' cur' : ''), 'aria-label': 'Go to question ' + (i + 1), text: i + 1, onclick: () => passive(i) })))));
  const cnt = k => R.t.qs.filter((_, i) => (R.st[i] || '') === k).length;
  const lg = (k, t) => h('div', { class: 'lgi' }, h('i', { class: 'ps ' + k, text: String(cnt(k)) }), h('span', { text: t }));
  const legendP = h('div', { class: 'plegend' }, lg('', 'Not Visited'), lg('r', 'Not Answered'), lg('g', 'Answered'), lg('v', 'Marked for Review'),
    h('div', { class: 'lgi wide' }, h('i', { class: 'ps gv', text: String(cnt('gv')) }), h('span', null, 'Answered & Marked for Review', h('small', { text: '(will be considered for evaluation)' }))));
  v.append(h('div', { class: 'wrap' }, h('div', { class: 'take wide' },
    h('div', { class: 'tbar3' }, h('b', { class: 'tb-l', text: 'Avanti Fellows' }), h('b', { class: 'tb-c', text: R.t.meta.t }), h('div', { class: 'timers tb-r' }, h('span', { class: 'qtimer', id: 'qtimer', title: 'Time on this question', text: 'Q' + (R.cur + 1) + '  00:00' }), h('span', { class: 'timer', id: 'timer', text: '--:--' }))),
    h('div', { class: 'tlay' },
      h('div', { class: 'tmain' },
        h('div', { class: 'qcard' }, h('div', { class: 'qhead', text: 'Question ' + (R.cur + 1) + ':' }), body),
        h('div', { class: 'abar' },
          h('button', { type: 'button', class: 'nb nb-g', text: 'SAVE & NEXT', onclick: () => nextQ('save') }),
          h('button', { type: 'button', class: 'nb nb-w', text: 'CLEAR', onclick: () => { delete R.ans[R.cur]; if (R.st) delete R.st[R.cur]; save(); renderQuestion(); } }),
          h('button', { type: 'button', class: 'nb nb-o', text: 'SAVE & MARK FOR REVIEW', onclick: () => nextQ('review') }),
          h('button', { type: 'button', class: 'nb nb-b', text: 'MARK FOR REVIEW & NEXT', onclick: () => nextQ('mark') })),
        h('div', { class: 'nbar' },
          h('button', { type: 'button', class: 'nb nb-w', disabled: R.cur === 0, text: '<< BACK', onclick: () => passive(R.cur - 1) }),
          h('button', { type: 'button', class: 'nb nb-w', text: 'NEXT >>', onclick: () => passive((R.cur + 1) % n) }))),
      h('aside', { class: 'tside' }, h('div', { class: 'card' }, legendP, pals,
        h('div', { class: 'subgap' }, h('button', { type: 'button', class: 'btn danger', text: 'Submit test', onclick: renderConfirm }))))))));
  math(v); tick();
}
function renderConfirm() {
  const R = T.run, un = R.t.qs.filter((_, i) => !hasAns(R.ans[i]) || (R.st && R.st[i] === 'v')).length;
  const old = $('.confirm'); if (old) old.remove();
  const box = h('div', { class: 'confirm', role: 'alertdialog', 'aria-label': 'Submit test' },
    h('b', { text: un ? un + ' of ' + R.t.qs.length + ' questions are unanswered.' : 'All questions are answered.' }),
    h('span', { text: 'After you submit you cannot change your answers.' + (FORM ? ' A form opens in a new tab with your result filled in: press Submit there to send it to your teacher.' : '') }),
    h('div', { class: 'btns' }, FORM ? h('button', { type: 'button', class: 'btn danger', text: 'Submit test and send result', onclick: () => { const R = finishTest(); if (!R) return; let w = null; try { w = window.open(formLink(R), '_blank'); } catch (e) { w = null; } if (w) { R.fo = true; markSent(R.t.code); try { w.opener = null; } catch (e) { /* ignore */ } } renderResult(!w); } })
      : h('button', { type: 'button', class: 'btn danger', text: 'Submit now', onclick: () => submitTest(false) }), h('button', { type: 'button', class: 'btn', text: 'Keep working', onclick: () => box.remove() })));
  $('.take').append(box); box.scrollIntoView({ block: 'center' });
}
function finishTest() {
  const R = T.run; if (!R || R.done) return null;
  settleQ(R.cur, 'passive'); R.t.qs.forEach((_, i) => { if (!hasAns(R.ans[i]) || (R.st && R.st[i] === 'v')) delete R.ans[i]; });
  accrueQ(); awayBack(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* ignore */ } const fo = $('#fsOver'); if (fo) fo.remove(); const wm = $('#wm'); if (wm) wm.remove(); R.done = true; stopTimer(); ssSet('avanti_run', null);
  const m = R.t.meta, rows = R.t.qs.map((q, i) => Object.assign({ q, a: R.ans[i], t: Math.round((R.qt && R.qt[i]) || 0) }, grade(q, R.ans[i], m.p, m.n)));
  R.rows = rows; R.score = sum(rows.map(r => r.m)); R.max = R.t.qs.length * m.p;
  R.ok = rows.filter(r => r.st === 'ok').length; R.no = rows.filter(r => r.st === 'no').length; R.skip = rows.filter(r => r.st === 'skip').length;
  R.secs = Math.round((Math.min(Date.now(), R.end) - R.started) / 1000);
  histAdd(R); return R;
}
function submitTest(auto) { if (finishTest()) renderResult(auto); }
function resultText() {
  const R = T.run, m = R.t.meta, mm = Math.floor(R.secs / 60), ss = R.secs % 60;
  const lines = R.rows.map((r, i) => 'Q' + (i + 1) + ' ' + fmtAns(r.a) + (r.st === 'ok' ? ' ✓' : r.st === 'no' ? ' ✗ (ans ' + r.q.a + ')' : ' – (ans ' + r.q.a + ')') + ' · ' + (r.t || 0) + 's');
  return 'Avanti Fellows · Test result\nTest: ' + m.t + '\nName: ' + (me() ? me().n : '') + '\nAvanti ID: ' + R.name + '\nScore: ' + R.score + ' / ' + R.max + ' (' + Math.round(R.score / R.max * 100) + '%)\nCorrect ' + R.ok + ' · Wrong ' + R.no + ' · Skipped ' + R.skip + '\nTime used: ' + mm + ' min ' + ss + ' s\n\n' + lines.join('\n');
}

/* ===== JS: result form config, what gets sent to the teacher, answer settling ===== */
function doneEntry(code) { const k = String(code).replace(/^#/, ''); return histGet().find(x => x.code === k) || null; }
/* Result form (Google Form -> Google Sheet) and the list of IDs the teacher has recorded as finished, per test. */
const FORM = { url: 'https://docs.google.com/forms/d/e/1FAIpQLSdzpZteboqkkaJX7QZRiqKbRtH_bGfLgukR3Lk64woUGxYXZQ/viewform', id: 'entry.1007992697', key: 'entry.1272561655', name: 'entry.750278431', score: 'entry.802057645', det: 'entry.2053785497' }; /* {url:'https://docs.google.com/forms/d/e/.../viewform', id:'entry.1', key:'entry.2', name:'entry.3', score:'entry.4', det:'entry.5'} */
let TAKEN = {}, RES = {};
function testKey(code) { let x = 5381; const c = String(code).replace(/^#/, ''); for (let i = 0; i < c.length; i++) x = ((x << 5) + x + c.charCodeAt(i)) >>> 0; return 'k' + x.toString(36); }
function takenRemote(code) { const l = TAKEN[testKey(code)]; return !!(AUTH && l && l.indexOf(String(AUTH)) >= 0); }
function detailsOf(R) { return R.rows.map((r, i) => { const a = fmtAns(r.a) === '\u2014' ? '' : fmtAns(r.a).replace(/,/g, '+'); return (i + 1) + ':' + a + ':' + (r.st === 'ok' ? 'o' : r.st === 'no' ? 'x' : 's') + ':' + (r.t || 0); }).concat(['W:' + (R.sw || 0) + ':' + Math.round(R.sa || 0) + ':' + (R.ps || 0)]).join(';'); }
const sentKey = () => 'avanti_sent_' + AUTH;
function sentGet() { try { return JSON.parse(localStorage.getItem(sentKey()) || '{}'); } catch (e) { return {}; } }
function markSent(code) { try { const o = sentGet(); o[testKey(code)] = 1; localStorage.setItem(sentKey(), JSON.stringify(o)); } catch (e) { /* storage blocked */ } }
function isSent(code) { return !!(sentGet()[testKey(code)] || takenRemote(code) || sheetEntry(code)); }
function sheetEntry(code) {
  const rec = AUTH && RES[testKey(code)] && RES[testKey(code)][AUTH]; if (!rec) return null;
  const t = parseCode(code); if (!t) return null; const m = t.meta, det = String(rec.a || '').split(';').filter(Boolean), rows = [];
  det.forEach(x => { const p = x.split(':'); if (p.length < 4) return; const n = parseInt(p[0], 10), tm = +p[p.length - 1] || 0, st0 = p[p.length - 2], raw = p.slice(1, -2).join(':'), q = t.qs[n - 1]; if (!q) return;
    const a = raw === '' ? '' : (q.t === 'MSQ' || /\+/.test(raw)) ? raw.split('+') : raw; const g = grade(q, a, m.p, m.n); rows.push({ i: q.i, a, st: g.st, mk: g.m, t: tm }); });
  if (!rows.length) return null;
  return { id: 'sheet', code: t.code, at: Date.now(), sheet: true, m: { t: m.t, m: m.m, p: m.p, n: m.n }, score: sum(rows.map(r => r.mk)), max: t.qs.length * m.p, ok: rows.filter(r => r.st === 'ok').length, no: rows.filter(r => r.st === 'no').length, skip: rows.filter(r => r.st === 'skip').length, secs: sum(rows.map(r => r.t)), rows };
}
/* A test the teacher switched off ("off" in the saved test list) is hidden everywhere on this page. */
const isOff = code => { const k = testKey(code); return TESTS.some(t => t.off && testKey(t.code) === k); };
const pastFor = code => isOff(code) ? null : (sheetEntry(code) || doneEntry(code));
/* "My results": the stored sheet results first (they follow the student to any device), then anything only on this device */
function pastAll() {
  const out = [], seen = new Set();
  TESTS.forEach(t => { if (t.off) return; const e = sheetEntry(t.code); if (e) { out.push(e); seen.add(testKey(t.code)); } });
  histGet().forEach(x => { if (!seen.has(testKey(x.code)) && !isOff(x.code)) out.push(x); });
  return out;
}
function formLink(R) {
  if (!FORM) return null;
  const q = new URLSearchParams({ usp: 'pp_url' }); q.set(FORM.id, String(R.name)); q.set(FORM.key, testKey(R.t.code)); q.set(FORM.name, R.t.meta.t); q.set(FORM.score, R.score + ' / ' + R.max); if (FORM.det) q.set(FORM.det, detailsOf(R));
  return FORM.url + '?' + q.toString();
}

function settleQ(i, mode) {
  const R = T.run; if (!R) return; if (!R.st) R.st = {};
  const has = hasAns(R.ans[i]), old = R.st[i], wasV = old === 'v' || old === 'gv';
  if (mode === 'mark') R.st[i] = 'v';
  else if (mode === 'review') R.st[i] = has ? 'gv' : 'v';
  else if (mode === 'passive') R.st[i] = old === 'v' ? 'v' : has ? (old === 'gv' ? 'gv' : 'g') : (wasV ? 'v' : 'r');
  else R.st[i] = has ? 'g' : 'r';
}