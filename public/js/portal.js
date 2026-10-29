/* Avanti Fellows - Teacher Login & Student Dashboard Module */
(function() {
  'use strict';

  // State Management
  const PortalState = {
    teacherAuth: false,
    teacherActiveTab: 'students', // 'students' | 'performance' | 'make-test'
    studentAuth: null, // { avantiId, name, stream, batch, dob, email, class }
    students: [],
    batches: [],
    studentBatchFilter: 'all', // 'all' | 'batch_11' | 'batch_12'
    perfBatchFilter: 'all', // 'all' | 'batch_11' | 'batch_12'
    tests: [],
    submissions: [],
    batchName: 'Class XI · JNV Dakshina Kannada Class XI Nodal (Sec-A)',
    
    // New test maker state
    newTest: {
      title: 'Class 11 Maths Test · Conic Sections',
      batch: 'Class XI · JNV Dakshina Kannada Class XI Nodal (Sec-A)',
      targetType: 'all', // 'all' | 'custom'
      targetStudents: new Set(),
      mins: 60,
      pos: 4,
      neg: 1,
      source: 'both', // 'pyq' | 'practice' | 'both'
      diff: 'all', // 'all' | 'L1' | 'L2' | 'L3'
      count: 15,
      classFilter: 'all', // 'all' | '11' | '12'
      chapterCode: 'all', // 'all' or chapter code (e.g. '11M11')
      topic: 'all', // 'all' or specific topic name
      selectedQs: []
    },

    // Active test taking state
    runningTest: null
  };

  const TEACHER_CREDENTIALS = {
    id: 'AF736',
    dob: '01/05/1997'
  };

  // Helper DOM creator
  const h = (tag, props, ...kids) => {
    const el = document.createElement(tag);
    for (const k in (props || {})) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (['checked', 'value', 'disabled'].includes(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => {
      if (c != null && c !== false) {
        el.append(c.nodeType ? c : document.createTextNode(c));
      }
    });
    return el;
  };

  function toast(msg) {
    let t = document.querySelector('.portal-toast');
    if (t) t.remove();
    t = h('div', { class: 'portal-toast toast', text: msg });
    document.body.append(t);
    setTimeout(() => t.remove(), 3500);
  }

  // Register window.__mh with Temml if not already defined
  if (typeof window.__mh !== 'function' && window.temml) {
    window.__mh = function(tex, isDisplay) {
      try {
        return window.temml.renderToString(tex, { displayMode: !!isDisplay });
      } catch (e) {
        return tex;
      }
    };
  }

  function renderLatex(tex, isDisp) {
    if (!tex) return '';
    try {
      if (typeof window.__mh === 'function') {
        return window.__mh(tex, !!isDisp);
      }
      if (window.temml && typeof window.temml.renderToString === 'function') {
        return window.temml.renderToString(tex, { displayMode: !!isDisp });
      }
    } catch (e) {
      // fallback
    }
    return tex;
  }

  function math(node) {
    if (!node) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let cur;
    while ((cur = walker.nextNode())) {
      const p = cur.parentNode;
      if (!p || /^(SCRIPT|STYLE|TEXTAREA|MATH|SVG)$/i.test(p.nodeName) || (p.closest && p.closest('math, .katex, .mx, .mx-disp'))) continue;
      const v = cur.nodeValue;
      if (v && (v.indexOf('\\(') >= 0 || v.indexOf('\\[') >= 0 || v.indexOf('$$') >= 0 || v.indexOf('$') >= 0)) {
        textNodes.push(cur);
      }
    }

    const re = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\$([^\$\n\r]+?)\$/g;
    textNodes.forEach(tn => {
      const s = tn.nodeValue;
      re.lastIndex = 0;
      let last = 0, m;
      const frag = document.createDocumentFragment();
      let changed = false;
      while ((m = re.exec(s))) {
        changed = true;
        if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
        const isDisp = m[2] != null || m[3] != null;
        const tex = (m[1] || m[2] || m[3] || m[4] || '').trim();
        const wrap = document.createElement(isDisp ? 'div' : 'span');
        wrap.className = isDisp ? 'katex-display mx-disp' : 'mx';
        const rendered = renderLatex(tex, isDisp);
        if (rendered && (rendered.indexOf('<math') >= 0 || rendered.indexOf('<span') >= 0)) {
          wrap.innerHTML = rendered;
        } else {
          wrap.textContent = tex;
        }
        frag.appendChild(wrap);
        last = re.lastIndex;
      }
      if (!changed) return;
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      if (tn.parentNode) tn.parentNode.replaceChild(frag, tn);
    });
  }

  // Helper to build a reactive segmented button group with active color toggling
  function buildSeg(options, curVal, onChange) {
    const seg = h('div', { class: 'seg' });
    options.forEach(([val, label]) => {
      const isAct = val === curVal;
      const btn = h('button', {
        type: 'button',
        class: isAct ? 'active' : '',
        'aria-pressed': String(isAct),
        'data-active': String(isAct),
        text: label,
        onclick: () => {
          seg.querySelectorAll('button').forEach(b => {
            b.setAttribute('aria-pressed', 'false');
            b.setAttribute('data-active', 'false');
            b.classList.remove('active');
          });
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('data-active', 'true');
          btn.classList.add('active');
          onChange(val);
        }
      });
      seg.append(btn);
    });
    return seg;
  }

  // Normalize DOB strings for flexible matching (handles 01/05/1997, 1997-05-01, 1-May-1997, 17-Sep-09, 20-Mar-2010, 01-05-1997)
  function normDob(str) {
    if (!str) return '';
    const s = String(str).trim().toLowerCase();
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    
    // Check 20-Mar-2010 or 17-Sep-09 or 1-May-1997
    const m1 = s.match(/^(\d{1,2})[-\/ ]([a-z]{3})[-\/ ](\d{2,4})$/);
    if (m1) {
      const d = m1[1].padStart(2, '0');
      const m = months[m1[2]] || '01';
      let yr = m1[3];
      if (yr.length === 2) {
        yr = (parseInt(yr, 10) > 40 ? '19' : '20') + yr;
      }
      return `${d}/${m}/${yr}`;
    }
    
    // Check YYYY-MM-DD
    const m2 = s.match(/^(\d{4})[-\/ ](\d{1,2})[-\/ ](\d{1,2})$/);
    if (m2) {
      return `${m2[3].padStart(2, '0')}/${m2[2].padStart(2, '0')}/${m2[1]}`;
    }

    // Check DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
    const m3 = s.match(/^(\d{1,2})[-\/ ](\d{1,2})[-\/ ](\d{2,4})$/);
    if (m3) {
      let yr = m3[3];
      if (yr.length === 2) {
        yr = (parseInt(yr, 10) > 40 ? '19' : '20') + yr;
      }
      return `${m3[1].padStart(2, '0')}/${m3[2].padStart(2, '0')}/${yr}`;
    }

    return s.replace(/[^a-z0-9]/g, '');
  }

  // ==========================================
  // Data Loading & Syncing
  // ==========================================
  async function loadInitialData() {
    try {
      // 1. Load students & batches
      const sRes = await fetch('/api/students');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.students && sData.students.length) {
          PortalState.students = sData.students;
          PortalState.batches = sData.batches || [];
          PortalState.batchName = sData.batch || PortalState.batchName;
        }
      }
    } catch (e) {
      console.warn('Could not fetch /api/students:', e);
    }

    // Trigger ensureDpp to have full bank with subtopics and shifts loaded
    try {
      if (window.QB_EXPORT && typeof window.QB_EXPORT.ensureDpp === 'function') {
        window.QB_EXPORT.ensureDpp().catch(() => {});
      }
    } catch (e) {}

    try {
      // 2. Load published tests
      const tRes = await fetch('/api/tests');
      if (tRes.ok) {
        const tData = await tRes.json();
        if (tData.tests) {
          PortalState.tests = tData.tests;
        }
      }
    } catch (e) {
      console.warn('Could not fetch /api/tests:', e);
    }

    try {
      // 3. Load submissions
      const subRes = await fetch('/api/submissions');
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.submissions) {
          PortalState.submissions = subData.submissions;
        }
      }
    } catch (e) {
      console.warn('Could not fetch /api/submissions:', e);
    }

    // If no published test exists, seed a starter test so student login has immediate test to take
    if (!PortalState.tests.length) {
      seedStarterTest();
    }
  }

  function seedStarterTest() {
    const defaultQs = [
      {
        i: 'DEMO_Q1',
        q: 'The equation of the tangent to the parabola $y^2 = 8x$ which is parallel to the line $2x - y + 7 = 0$ is:',
        o: ['2x - y + 1 = 0', '2x - y - 1 = 0', '2x - y + 2 = 0', '2x - y - 2 = 0'],
        a: 'A',
        t: 'MCQ',
        d: 'L1',
        sub: 'Conic Sections'
      },
      {
        i: 'DEMO_Q2',
        q: 'If the roots of the equation $x^2 - px + q = 0$ differ by unity, then:',
        o: ['p^2 = 4q + 1', 'p^2 = 4q - 1', 'q^2 = 4p + 1', 'p^2 = 4q'],
        a: 'A',
        t: 'MCQ',
        d: 'L1',
        sub: 'Quadratic Equations'
      },
      {
        i: 'DEMO_Q3',
        q: 'The eccentricity of the hyperbola $9x^2 - 16y^2 = 144$ is:',
        o: ['5/4', '4/3', '5/3', '4/5'],
        a: 'A',
        t: 'MCQ',
        d: 'L1',
        sub: 'Conic Sections'
      },
      {
        i: 'DEMO_Q4',
        q: 'The number of real solutions of the equation $e^x = x$ is:',
        o: ['0', '1', '2', 'Infinitely many'],
        a: 'A',
        t: 'MCQ',
        d: 'L2',
        sub: 'Functions'
      },
      {
        i: 'DEMO_Q5',
        q: 'The length of the latus rectum of the ellipse $25x^2 + 16y^2 = 400$ is:',
        o: ['32/5', '18/5', '50/3', '8/5'],
        a: 'A',
        t: 'MCQ',
        d: 'L1',
        sub: 'Conic Sections'
      }
    ];

    const starterTest = {
      id: 'test_starter_demo',
      title: 'Class 11 Maths Diagnostic Test · Conic Sections & Quadratics',
      batch: 'JNV Dakshina Kannada Class XI Nodal (Sec-A)',
      assignedStudentIds: ['*'], // All students
      mins: 30,
      pos: 4,
      neg: 1,
      source: 'JEE Main PYQs & DPP',
      diff: 'L1 & L2',
      count: defaultQs.length,
      qs: defaultQs,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    PortalState.tests.push(starterTest);
    // Persist via POST
    fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(starterTest)
    }).catch(() => {});
  }

  // ==========================================
  // TEACHER PORTAL VIEWS
  // ==========================================
  function renderTeacherView() {
    const host = document.getElementById('viewTeacher');
    if (!host) return;
    host.innerHTML = '';

    if (!PortalState.teacherAuth) {
      renderTeacherLogin(host);
    } else {
      renderTeacherDashboard(host);
    }
  }

  function renderTeacherLogin(host) {
    const wrap = h('div', { class: 'portal-auth-wrap' });
    const card = h('div', { class: 'portal-auth-card' });

    card.append(
      h('div', { class: 'portal-auth-badge teacher', text: 'Teacher Portal' }),
      h('div', { class: 'portal-auth-head' },
        h('h2', { text: 'Teacher Login' }),
        h('p', { text: 'Enter your teacher ID and date of birth to access student details, performance analytics, and test maker.' })
      )
    );

    const errBox = h('div', { class: 'portal-err', style: 'display:none;' });
    card.append(errBox);

    const idInput = h('input', {
      type: 'text',
      class: 'portal-input',
      placeholder: 'e.g. AF736',
      value: 'AF736' // Pre-filled for user convenience
    });

    const dobInput = h('input', {
      type: 'text',
      class: 'portal-input',
      placeholder: 'DD/MM/YYYY (e.g. 01/05/1997)',
      value: '01/05/1997' // Pre-filled for user convenience
    });

    const form = h('form', {
      onsubmit: (e) => {
        e.preventDefault();
        const idVal = idInput.value.trim().toUpperCase();
        const dobVal = normDob(dobInput.value);
        const expectedDob = normDob(TEACHER_CREDENTIALS.dob);

        if (idVal === TEACHER_CREDENTIALS.id && dobVal === expectedDob) {
          PortalState.teacherAuth = true;
          toast('Welcome, Teacher! Login successful.');
          renderTeacherView();
        } else {
          errBox.style.display = 'block';
          errBox.textContent = 'Invalid ID or Date of Birth. Correct ID is AF736 and DOB is 01/05/1997.';
        }
      }
    },
      h('div', { class: 'portal-form-group', style: 'margin-bottom:14px;' },
        h('label', { text: 'Teacher ID' }),
        idInput
      ),
      h('div', { class: 'portal-form-group', style: 'margin-bottom:14px;' },
        h('label', { text: 'Date of Birth (DOB)' }),
        dobInput
      ),
      h('div', { class: 'portal-hint-box', style: 'margin-bottom:18px;' },
        h('span', { text: 'Login credentials: ' }),
        h('div', null,
          h('code', { text: 'ID: AF736' }),
          ' ',
          h('code', { text: 'DOB: 01/05/1997' })
        )
      ),
      h('button', {
        type: 'submit',
        class: 'btn pri',
        style: 'width:100%;height:44px;font-size:15px;font-weight:700;',
        text: 'Login to Teacher Portal'
      })
    );

    card.append(form);
    wrap.append(card);
    host.append(wrap);
  }

  function renderTeacherDashboard(host) {
    // Header bar
    const header = h('div', { class: 'teacher-header' },
      h('div', { class: 'teacher-meta-box' },
        h('div', { class: 'teacher-avatar', text: 'AF' }),
        h('div', { class: 'teacher-info' },
          h('h3', { text: 'Teacher Portal · ID: AF736' }),
          h('span', { text: 'Batch: ' + PortalState.batchName })
        )
      ),
      h('div', { class: 'teacher-nav-tabs' },
        h('button', {
          type: 'button',
          class: 'teacher-nav-btn',
          'aria-selected': String(PortalState.teacherActiveTab === 'students'),
          onclick: () => { PortalState.teacherActiveTab = 'students'; renderTeacherView(); }
        }, '👥 (1) Students Details'),
        h('button', {
          type: 'button',
          class: 'teacher-nav-btn',
          'aria-selected': String(PortalState.teacherActiveTab === 'performance'),
          onclick: () => { PortalState.teacherActiveTab = 'performance'; renderTeacherView(); }
        }, '📊 (2) Performance'),
        h('button', {
          type: 'button',
          class: 'teacher-nav-btn',
          'aria-selected': String(PortalState.teacherActiveTab === 'make-test'),
          onclick: () => { PortalState.teacherActiveTab = 'make-test'; renderTeacherView(); }
        }, '📝 (3) Make a new Test')
      ),
      h('button', {
        type: 'button',
        class: 'portal-logout-btn',
        onclick: () => {
          PortalState.teacherAuth = false;
          toast('Logged out from Teacher Portal');
          renderTeacherView();
        }
      }, 'Log out')
    );

    const bodyContainer = h('div', { class: 'portal-container' });

    if (PortalState.teacherActiveTab === 'students') {
      renderStudentsTab(bodyContainer);
    } else if (PortalState.teacherActiveTab === 'performance') {
      renderPerformanceTab(bodyContainer);
    } else if (PortalState.teacherActiveTab === 'make-test') {
      renderMakeTestTab(bodyContainer);
    }

    host.append(header, bodyContainer);
  }

  // --- (1) STUDENTS DETAILS ---
  let studentSearchQuery = '';
  let studentStreamFilter = 'ALL';

  function renderStudentsTab(container) {
    const allStudents = PortalState.students || [];
    const batchFilter = PortalState.studentBatchFilter || 'all';
    
    // Filter by batch first
    const batchFiltered = allStudents.filter(s => {
      if (batchFilter === '11') return s.class === '11' || s.batch.includes('XI');
      if (batchFilter === '12') return s.class === '12' || s.batch.includes('XII');
      return true;
    });

    const totalCount = batchFiltered.length;
    const jeeCount = batchFiltered.filter(s => s.stream && s.stream.toUpperCase().includes('JEE')).length;
    const neetCount = batchFiltered.filter(s => s.stream && s.stream.toUpperCase().includes('NEET')).length;
    const kcetCount = batchFiltered.filter(s => s.stream && s.stream.toUpperCase().includes('CET')).length;

    // Batch Selector Header
    const batchBar = h('div', { class: 'card', style: 'padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;' },
      h('div', { style: 'display:flex;align-items:center;gap:10px;' },
        h('span', { style: 'font-weight:700;font-size:14px;color:#1e293b;', text: 'Select Batch:' }),
        buildSeg([
          ['all', `All Batches (${allStudents.length})`],
          ['11', `Class XI (${allStudents.filter(s => s.class === '11').length})`],
          ['12', `Class XII (${allStudents.filter(s => s.class === '12').length})`]
        ], batchFilter, (val) => {
          PortalState.studentBatchFilter = val;
          renderTeacherView();
        })
      ),
      h('span', { style: 'font-size:12.5px;color:#64748b;font-weight:600;', text: batchFilter === '11' ? 'Batch: Class XI · JNV Dakshina Kannada' : batchFilter === '12' ? 'Batch: Class XII · CLASS XII (JEE/NEET/KCET) 2026-27' : 'Displaying all 120 enrolled students' })
    );

    // Metrics cards
    const metrics = h('div', { class: 'portal-metrics-grid' },
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'Enrolled in Selection' }),
        h('b', { text: String(totalCount) }),
        h('small', { text: batchFilter === 'all' ? 'Across all batches' : batchFilter === '11' ? 'Class XI Nodal' : 'Class XII 2026-27' })
      ),
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'JEE Stream' }),
        h('b', { style: 'color:#2563eb;', text: String(jeeCount) }),
        h('small', { text: Math.round((jeeCount / (totalCount || 1)) * 100) + '% of selection' })
      ),
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'NEET Stream' }),
        h('b', { style: 'color:#db2777;', text: String(neetCount) }),
        h('small', { text: Math.round((neetCount / (totalCount || 1)) * 100) + '% of selection' })
      ),
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'KCET / CET Stream' }),
        h('b', { style: 'color:#d97706;', text: String(kcetCount) }),
        h('small', { text: Math.round((kcetCount / (totalCount || 1)) * 100) + '% of selection' })
      )
    );

    // Search and filters
    const controls = h('div', { class: 'portal-table-controls' },
      h('div', { class: 'portal-search-box' },
        h('span', { class: 'portal-search-icon', text: '🔍' }),
        h('input', {
          type: 'text',
          placeholder: 'Search by student name, AFID, or stream…',
          value: studentSearchQuery,
          oninput: (e) => {
            studentSearchQuery = e.target.value.toLowerCase();
            updateStudentsTable();
          }
        })
      ),
      h('div', { class: 'portal-filter-chips' },
        ['ALL', 'JEE', 'NEET', 'KCET'].map(str => h('button', {
          type: 'button',
          class: 'portal-chip-btn' + (studentStreamFilter === str ? ' active' : ''),
          text: str === 'ALL' ? 'All Streams (' + totalCount + ')' : str + ' (' + (str === 'JEE' ? jeeCount : str === 'NEET' ? neetCount : kcetCount) + ')',
          onclick: () => {
            studentStreamFilter = str;
            renderTeacherView();
          }
        }))
      )
    );

    const tableWrap = h('div', { class: 'portal-table-wrap', id: 'studentsTableHost' });

    container.append(batchBar, metrics, controls, tableWrap);
    updateStudentsTable();
  }

  function updateStudentsTable() {
    const host = document.getElementById('studentsTableHost');
    if (!host) return;
    host.innerHTML = '';

    const batchFilter = PortalState.studentBatchFilter || 'all';
    const filtered = (PortalState.students || []).filter(s => {
      // 1. Batch filter
      if (batchFilter === '11' && s.class !== '11' && !s.batch.includes('XI')) return false;
      if (batchFilter === '12' && s.class !== '12' && !s.batch.includes('XII')) return false;

      // 2. Stream filter
      if (studentStreamFilter !== 'ALL') {
        const str = (s.stream || '').toUpperCase();
        if (studentStreamFilter === 'KCET' && !str.includes('CET')) return false;
        if (studentStreamFilter === 'JEE' && !str.includes('JEE')) return false;
        if (studentStreamFilter === 'NEET' && !str.includes('NEET')) return false;
      }

      // 3. Search query
      const matchSearch = !studentSearchQuery ||
        s.name.toLowerCase().includes(studentSearchQuery) ||
        s.avantiId.toLowerCase().includes(studentSearchQuery) ||
        (s.stream && s.stream.toLowerCase().includes(studentSearchQuery)) ||
        (s.batch && s.batch.toLowerCase().includes(studentSearchQuery));
      return matchSearch;
    });

    if (!filtered.length) {
      host.innerHTML = '<div style="padding:40px;text-align:center;color:#64748b;">No students found matching your criteria.</div>';
      return;
    }

    const table = h('table', { class: 'portal-table' },
      h('thead', null,
        h('tr', null,
          h('th', { text: '#' }),
          h('th', { text: 'Batch' }),
          h('th', { text: 'Avanti ID' }),
          h('th', { text: 'Full Name' }),
          h('th', { text: 'Stream' }),
          h('th', { text: 'DOB' }),
          h('th', { text: 'Gender' }),
          h('th', { text: 'Action' })
        )
      )
    );

    const tbody = h('tbody');
    filtered.forEach((st, idx) => {
      const isC12 = st.class === '12' || (st.batch && st.batch.includes('XII'));
      const streamUpper = (st.stream || '').toUpperCase();
      const streamClass = streamUpper.includes('JEE') ? 'jee' : streamUpper.includes('NEET') ? 'neet' : 'kcet';

      tbody.append(
        h('tr', null,
          h('td', { style: 'font-weight:600;color:#94a3b8;', text: String(st.sNo || idx + 1) }),
          h('td', null, h('span', { class: 'batch-badge ' + (isC12 ? 'c12' : 'c11'), text: isC12 ? 'Class XII' : 'Class XI' })),
          h('td', { style: 'font-family:var(--font-mono, monospace);font-weight:700;', text: st.avantiId }),
          h('td', { style: 'font-weight:700;', text: st.name }),
          h('td', null, h('span', { class: 'stream-badge ' + streamClass, text: st.stream })),
          h('td', { text: st.dob }),
          h('td', { text: st.gender }),
          h('td', null,
            h('button', {
              type: 'button',
              class: 'btn sm',
              style: 'padding:4px 10px;font-size:12px;',
              onclick: () => showStudentModal(st)
            }, 'View Profile')
          )
        )
      );
    });

    table.append(tbody);
    host.append(table);
  }

  function showStudentModal(student) {
    const old = document.querySelector('.portal-modal-overlay');
    if (old) old.remove();

    const studentSubs = (PortalState.submissions || []).filter(s => s.studentId === student.avantiId);
    const avgScore = studentSubs.length ? Math.round(studentSubs.reduce((acc, s) => acc + (s.score / s.max * 100), 0) / studentSubs.length) : 0;

    const overlay = h('div', {
      class: 'portal-modal-overlay',
      onclick: (e) => { if (e.target === overlay) overlay.remove(); }
    });

    const modal = h('div', { class: 'portal-modal-card' },
      h('div', { class: 'portal-modal-head' },
        h('div', null,
          h('h3', { text: student.name }),
          h('span', { style: 'font-size:13px;color:#64748b;', text: 'Avanti ID: ' + student.avantiId + ' · Stream: ' + student.stream })
        ),
        h('button', { class: 'portal-modal-close', text: '✕', onclick: () => overlay.remove() })
      ),
      h('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#f8fafc;padding:12px;border-radius:10px;' },
        h('div', null, h('span', { style: 'font-size:11px;color:#64748b;display:block;', text: 'DOB' }), h('b', { text: student.dob })),
        h('div', null, h('span', { style: 'font-size:11px;color:#64748b;display:block;', text: 'Tests Taken' }), h('b', { text: String(studentSubs.length) })),
        h('div', null, h('span', { style: 'font-size:11px;color:#64748b;display:block;', text: 'Average Score' }), h('b', { text: avgScore + '%' }))
      ),
      h('h4', { style: 'margin:8px 0 0;', text: 'Test Attempt History' }),
      h('div', { style: 'max-height:260px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;' },
        studentSubs.length ? h('table', { class: 'portal-table' },
          h('thead', null,
            h('tr', null,
              h('th', { text: 'Test Name' }),
              h('th', { text: 'Date' }),
              h('th', { text: 'Score' }),
              h('th', { text: 'Time' }),
              h('th', { text: 'Leaves' })
            )
          ),
          h('tbody', null,
            studentSubs.map(sub => h('tr', null,
              h('td', { style: 'font-weight:600;', text: sub.testTitle || 'Test' }),
              h('td', { text: sub.submittedAt ? sub.submittedAt.slice(0, 10) : '—' }),
              h('td', { text: sub.score + ' / ' + sub.max }),
              h('td', { text: Math.floor(sub.secs / 60) + 'm ' + (sub.secs % 60) + 's' }),
              h('td', null, h('span', { class: 'tag-flag ' + (sub.sw > 0 ? 'warn' : 'clean'), text: sub.sw + ' leaves' }))
            ))
          )
        ) : h('p', { style: 'padding:20px;text-align:center;color:#94a3b8;margin:0;', text: 'No tests attempted yet by this student.' })
      )
    );

    overlay.append(modal);
    document.body.append(overlay);
  }

  // --- (2) PERFORMANCE TAB ---
  let perfFilterTestId = 'ALL';
  let perfFilterBatch = 'ALL';

  function renderPerformanceTab(container) {
    const allSubs = PortalState.submissions || [];
    const tests = PortalState.tests || [];
    const studentMap = new Map((PortalState.students || []).map(s => [s.avantiId, s]));

    // Filter by test and batch
    const filteredSubs = allSubs.filter(s => {
      if (perfFilterTestId !== 'ALL' && s.testId !== perfFilterTestId) return false;
      const st = studentMap.get(s.studentId);
      const isC12 = st ? (st.class === '12' || (st.batch && st.batch.includes('XII'))) : false;
      if (perfFilterBatch === '11' && isC12) return false;
      if (perfFilterBatch === '12' && !isC12) return false;
      return true;
    });

    const totalAttempts = filteredSubs.length;
    const avgScore = totalAttempts ? Math.round(filteredSubs.reduce((acc, s) => acc + (s.score / s.max * 100), 0) / totalAttempts) : 0;
    const topScore = totalAttempts ? Math.max(0, ...filteredSubs.map(s => Math.round(s.score / s.max * 100))) : 0;

    const metrics = h('div', { class: 'portal-metrics-grid' },
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'Active Tests Published' }),
        h('b', { text: String(tests.length) }),
        h('small', { text: 'Ready for students' })
      ),
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'Total Submissions' }),
        h('b', { style: 'color:#0e6b84;', text: String(totalAttempts) }),
        h('small', { text: 'Student test sessions completed' })
      ),
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'Average Score' }),
        h('b', { style: 'color:#16a34a;', text: avgScore + '%' }),
        h('small', { text: 'Mean accuracy in filter' })
      ),
      h('div', { class: 'portal-metric-card' },
        h('span', { text: 'Highest Score' }),
        h('b', { style: 'color:#7c3aed;', text: topScore + '%' }),
        h('small', { text: 'Top student performance' })
      )
    );

    // Controls with Batch & Test Filters
    const controls = h('div', { class: 'portal-table-controls' },
      h('div', { style: 'display:flex;align-items:center;gap:12px;flex-wrap:wrap;' },
        h('div', { style: 'display:flex;align-items:center;gap:6px;' },
          h('label', { style: 'font-weight:700;font-size:13px;', text: 'Batch:' }),
          buildSeg([['ALL', 'All Batches'], ['11', 'Class XI'], ['12', 'Class XII']], perfFilterBatch, (val) => {
            perfFilterBatch = val;
            renderTeacherView();
          })
        ),
        h('div', { style: 'display:flex;align-items:center;gap:6px;' },
          h('label', { style: 'font-weight:700;font-size:13px;', text: 'Test:' }),
          h('select', {
            class: 'portal-input',
            style: 'width:auto;min-width:240px;height:38px;',
            onchange: (e) => {
              perfFilterTestId = e.target.value;
              renderTeacherView();
            }
          },
            h('option', { value: 'ALL', text: 'All Tests (' + tests.length + ' tests)' }),
            tests.map(t => h('option', {
              value: t.id,
              selected: perfFilterTestId === t.id,
              text: t.title + ' (' + (allSubs.filter(s => s.testId === t.id).length) + ' submissions)'
            }))
          )
        )
      ),
      h('div', { style: 'display:flex;gap:10px;' },
        h('button', {
          type: 'button',
          class: 'btn',
          onclick: () => exportPerformanceCSV(filteredSubs)
        }, '📥 Export Results to CSV')
      )
    );

    const tableWrap = h('div', { class: 'portal-table-wrap' });

    if (!filteredSubs.length) {
      tableWrap.innerHTML = '<div style="padding:50px;text-align:center;color:#64748b;"><h3 style="margin-bottom:8px;">No submissions found</h3><p>When students complete live tests in the Student Login section, their scores, time spent, and anti-cheat tracking will appear here.</p></div>';
    } else {
      const table = h('table', { class: 'portal-table' },
        h('thead', null,
          h('tr', null,
            h('th', { text: 'Student' }),
            h('th', { text: 'Batch' }),
            h('th', { text: 'Avanti ID' }),
            h('th', { text: 'Test Name' }),
            h('th', { text: 'Score' }),
            h('th', { text: 'Breakdown' }),
            h('th', { text: 'Time Taken' }),
            h('th', { text: 'Anti-Cheat Monitor' }),
            h('th', { text: 'Action' })
          )
        ),
        h('tbody', null,
          filteredSubs.map(s => {
            const st = studentMap.get(s.studentId);
            const isC12 = st ? (st.class === '12' || (st.batch && st.batch.includes('XII'))) : false;
            const pct = Math.round((s.score / s.max) * 100);
            return h('tr', null,
              h('td', { style: 'font-weight:700;', text: s.studentName || s.studentId }),
              h('td', null, h('span', { class: 'batch-badge ' + (isC12 ? 'c12' : 'c11'), text: isC12 ? 'Class XII' : 'Class XI' })),
              h('td', { style: 'font-family:monospace;font-size:13px;', text: s.studentId }),
              h('td', { style: 'max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;', text: s.testTitle }),
              h('td', null,
                h('b', { text: s.score + ' / ' + s.max }),
                h('span', {
                  style: 'margin-left:6px;font-size:11px;padding:2px 6px;border-radius:10px;font-weight:700;' +
                    (pct >= 70 ? 'background:#dcfce7;color:#166534;' : pct >= 40 ? 'background:#fef3c7;color:#92400e;' : 'background:#fee2e2;color:#991b1b;'),
                  text: pct + '%'
                })
              ),
              h('td', { style: 'font-size:12.5px;', text: s.ok + '✓ · ' + s.no + '✗ · ' + s.skip + '–' }),
              h('td', { text: Math.floor(s.secs / 60) + 'm ' + (s.secs % 60) + 's' }),
              h('td', null,
                h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;' },
                  h('span', {
                    class: 'tag-flag ' + (s.sw > 0 ? 'warn' : 'clean'),
                    title: 'Student switched away from test tab ' + (s.sw || 0) + ' times, away for ' + Math.round(s.sa || 0) + 's',
                    text: (s.sw > 0 ? '⚠️ ' + s.sw + ' leaves (' + Math.round(s.sa || 0) + 's)' : '✓ 0 leaves')
                  }),
                  s.ps > 0 ? h('span', {
                    class: 'tag-flag warn',
                    title: 'Student attempted screen capture',
                    text: '📸 ' + s.ps + ' flag'
                  }) : null
                )
              ),
              h('td', null,
                h('button', {
                  type: 'button',
                  class: 'btn sm',
                  onclick: () => showSubmissionDetailModal(s)
                }, 'Question Details')
              )
            );
          })
        )
      );
      tableWrap.append(table);
    }

    container.append(metrics, controls, tableWrap);
  }

  function showSubmissionDetailModal(sub) {
    const old = document.querySelector('.portal-modal-overlay');
    if (old) old.remove();

    const overlay = h('div', {
      class: 'portal-modal-overlay',
      onclick: (e) => { if (e.target === overlay) overlay.remove(); }
    });

    const modal = h('div', { class: 'portal-modal-card', style: 'max-width:750px;' },
      h('div', { class: 'portal-modal-head' },
        h('div', null,
          h('h3', { text: 'Test Response: ' + sub.studentName }),
          h('span', { style: 'font-size:13px;color:#64748b;', text: sub.testTitle + ' · Score: ' + sub.score + ' / ' + sub.max })
        ),
        h('button', { class: 'portal-modal-close', text: '✕', onclick: () => overlay.remove() })
      ),
      h('div', { style: 'display:flex;gap:12px;background:#f8fafc;padding:12px;border-radius:10px;font-size:13px;' },
        h('span', null, h('b', { text: 'Time: ' }), Math.floor(sub.secs / 60) + 'm ' + (sub.secs % 60) + 's'),
        h('span', null, h('b', { text: 'Tab leaves: ' }), sub.sw || 0, ' (away ' + Math.round(sub.sa || 0) + 's)'),
        h('span', null, h('b', { text: 'Screenshots blocked: ' }), sub.ps || 0)
      ),
      h('div', { style: 'max-height:380px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;' },
        (sub.rows || []).map((r, i) => {
          const isOk = r.st === 'ok';
          const isNo = r.st === 'no';
          return h('div', {
            style: 'border:1px solid ' + (isOk ? '#bbf7d0' : isNo ? '#fecaca' : '#e2e8f0') + ';background:' + (isOk ? '#f0fdf4' : isNo ? '#fef2f2' : '#ffffff') + ';border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:6px;'
          },
            h('div', { style: 'display:flex;justify-content:space-between;align-items:center;font-size:12px;' },
              h('b', { text: 'Question ' + (i + 1) + (r.q && r.q.sub ? ' · ' + r.q.sub : '') }),
              h('span', {
                style: 'font-weight:700;' + (isOk ? 'color:#15803d;' : isNo ? 'color:#b91c1c;' : 'color:#64748b;'),
                text: isOk ? '✓ Correct (' + (r.m > 0 ? '+' + r.m : r.m) + ')' : isNo ? '✗ Wrong (' + r.m + ')' : '– Skipped (0)'
              })
            ),
            h('div', { class: 'stem', style: 'font-size:14px;color:#1e293b;', text: String(r.q && r.q.q || 'Question stem').replace(/\s*\{\{figure\}\}\s*/g, ' ').trim() }),
            h('div', { style: 'display:flex;gap:16px;font-size:13px;margin-top:4px;' },
              h('span', null, h('span', { style: 'color:#64748b;', text: 'Given Answer: ' }), h('b', { text: formatAnswer(r.a) })),
              h('span', null, h('span', { style: 'color:#64748b;', text: 'Correct Answer: ' }), h('b', { style: 'color:#15803d;', text: (r.q && r.q.a) || '—' })),
              h('span', { style: 'color:#64748b;', text: 'Time: ' + (r.t || 0) + 's' })
            )
          );
        })
      )
    );

    overlay.append(modal);
    document.body.append(overlay);
    math(modal);
  }

  function formatAnswer(a) {
    if (a == null || a === '') return '— (Skipped)';
    if (Array.isArray(a)) return a.join(', ');
    return String(a);
  }

  function exportPerformanceCSV(subsList) {
    const studentMap = new Map((PortalState.students || []).map(s => [s.avantiId, s]));
    const subs = subsList || (perfFilterTestId === 'ALL' ? (PortalState.submissions || []) : (PortalState.submissions || []).filter(s => s.testId === perfFilterTestId));
    if (!subs.length) {
      toast('No data to export');
      return;
    }
    const headers = ['Student Name', 'Batch', 'Avanti ID', 'Stream', 'Test Title', 'Score', 'Max Marks', 'Percentage', 'Correct', 'Wrong', 'Skipped', 'Time (s)', 'Tab Switches', 'Away Seconds', 'Screenshot Flags', 'Submitted At'];
    const rows = subs.map(s => {
      const st = studentMap.get(s.studentId);
      const isC12 = st ? (st.class === '12' || (st.batch && st.batch.includes('XII'))) : false;
      const batchLabel = isC12 ? 'Class XII' : 'Class XI';
      return [
        `"${s.studentName || ''}"`,
        `"${batchLabel}"`,
        `"${s.studentId}"`,
        `"${s.stream || ''}"`,
        `"${s.testTitle || ''}"`,
        s.score,
        s.max,
        Math.round((s.score / s.max) * 100),
        s.ok,
        s.no,
        s.skip,
        s.secs,
        s.sw || 0,
        Math.round(s.sa || 0),
        s.ps || 0,
        `"${s.submittedAt || ''}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Performance_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast('CSV report downloaded');
  }

  // --- (3) MAKE A NEW TEST ---
  function renderMakeTestTab(container) {
    const nt = PortalState.newTest;
    const bank = (window.QB_EXPORT && window.QB_EXPORT.BANK && window.QB_EXPORT.BANK()) || window.BANK || null;
    const allChapters = (bank && bank.chapters) || [
      { c: '11M1', n: 'Sets', cl: '11' },
      { c: '11M2', n: 'Relations & Functions', cl: '11' },
      { c: '11M3', n: 'Trigonometric Functions', cl: '11' },
      { c: '11M4', n: 'Quadratic Equations', cl: '11' },
      { c: '11M5', n: 'Linear Inequalities', cl: '11' },
      { c: '11M6', n: 'Permutations & Combinations', cl: '11' },
      { c: '11M7', n: 'Binomial Theorem', cl: '11' },
      { c: '11M8', n: 'Sequences & Series', cl: '11' },
      { c: '11M9', n: 'Straight Lines', cl: '11' },
      { c: '11M10', n: 'Circles', cl: '11' },
      { c: '11M11', n: 'Conic Sections', cl: '11' },
      { c: '11M12', n: '3D Geometry (11)', cl: '11' },
      { c: '12M13', n: 'Functions (12)', cl: '12' },
      { c: '12M14', n: 'Inverse Trigonometric Functions', cl: '12' },
      { c: '12M15', n: 'Matrices', cl: '12' },
      { c: '12M16', n: 'Determinants', cl: '12' },
      { c: '12M17', n: 'Continuity & Differentiability', cl: '12' },
      { c: '12M18', n: 'Applications of Derivatives', cl: '12' },
      { c: '12M19', n: 'Indefinite Integration', cl: '12' },
      { c: '12M20', n: 'Definite Integration', cl: '12' },
      { c: '12M21', n: 'Differential Equations', cl: '12' },
      { c: '12M22', n: 'Vector Algebra', cl: '12' },
      { c: '12M23', n: 'Three Dimensional Geometry', cl: '12' },
      { c: '12M24', n: 'Probability', cl: '12' }
    ];

    const wrap = h('div', { class: 'make', style: 'padding-top:0;' });
    const leftRail = h('div', { class: 'rail' });

    // CARD 0: Whole Shift / Past Exam Paper 1-Click Test Creator (Requested Feature)
    const shiftBox = h('div', { class: 'shift-paper-box' });
    shiftBox.append(
      h('h4', null, '⚡ Direct Whole Shift / Past Exam Paper Test'),
      h('p', { class: 'hint', style: 'color:#065f46;margin-bottom:10px;', text: 'Directly create and publish a complete official shift paper (JEE Advanced Paper 1/2 or JEE Main shift) with all questions in order.' })
    );

    const shiftSelect = h('select', { class: 'portal-input', id: 'shiftPaperSelect', style: 'background:#fff;margin-bottom:8px;' });
    shiftSelect.append(h('option', { value: '', text: '— Select a Past Paper / Shift —' }));

    function populateShiftDropdown() {
      const papers = (window.QB_EXPORT && window.QB_EXPORT.getShiftPapers && window.QB_EXPORT.getShiftPapers()) || [];
      if (papers.length) {
        shiftSelect.innerHTML = '';
        shiftSelect.append(h('option', { value: '', text: '— Select an official paper (' + papers.length + ' available) —' }));
        papers.forEach(p => {
          shiftSelect.append(h('option', {
            value: p.key,
            text: `${p.label} (${p.qs.length} questions)`
          }));
        });
      }
    }
    populateShiftDropdown();

    const loadPaperBtn = h('button', {
      type: 'button',
      class: 'btn pri',
      style: 'width:100%;font-weight:700;',
      text: '📥 Load Entire Paper Questions & Details',
      onclick: () => {
        const key = shiftSelect.value;
        if (!key) {
          toast('Please select an official exam paper first');
          return;
        }
        const papers = (window.QB_EXPORT && window.QB_EXPORT.getShiftPapers && window.QB_EXPORT.getShiftPapers()) || [];
        const found = papers.find(p => p.key === key);
        if (found && found.qs && found.qs.length) {
          nt.title = found.label + ' (Full Exam Paper)';
          nt.selectedQs = found.qs.slice();
          nt.count = found.qs.length;
          nt.mins = 180;
          nt.pos = 4;
          nt.neg = 1;
          const titleInp = document.getElementById('testNameInput');
          if (titleInp) titleInp.value = nt.title;
          renderPickedQuestionsList();
          updateTestSummary();
          toast(`Loaded ${found.qs.length} questions from ${found.label}!`);
        } else {
          toast('No questions found for this shift paper');
        }
      }
    });

    shiftBox.append(shiftSelect, loadPaperBtn);

    // Card 1: Test Details
    const detailsCard = h('div', { class: 'card' },
      h('h3', { text: 'Test Details' }),
      h('div', { class: 'fld' },
        h('label', { class: 'lbl', text: 'Test Name' }),
        h('input', {
          type: 'text',
          id: 'testNameInput',
          class: 'portal-input',
          value: nt.title,
          oninput: (e) => { nt.title = e.target.value; updateTestSummary(); }
        })
      ),
      h('div', { class: 'fld' },
        h('label', { class: 'lbl', text: 'Target Batch' }),
        h('select', {
          class: 'portal-input',
          id: 'testBatchSelect',
          onchange: (e) => {
            nt.batch = e.target.value;
            renderStudentSelectionCheckboxes();
            updateTestSummary();
          }
        },
          h('option', { value: 'Class XI · JNV Dakshina Kannada Class XI Nodal (Sec-A)', selected: nt.batch.includes('XI'), text: 'Class XI · JNV Dakshina Kannada Class XI Nodal (Sec-A)' }),
          h('option', { value: 'Class XII · CLASS XII (JEE/NEET/KCET) 2026-27', selected: nt.batch.includes('XII'), text: 'Class XII · CLASS XII (JEE/NEET/KCET) 2026-27' }),
          h('option', { value: 'All Batches (Class XI & XII)', selected: nt.batch.includes('All Batches'), text: 'All Batches (Class XI & XII)' })
        )
      ),
      h('div', { class: 'row' },
        h('div', { class: 'fld' },
          h('label', { class: 'lbl', text: 'Time (Minutes)' }),
          h('input', {
            type: 'number',
            class: 'portal-input',
            value: nt.mins,
            min: 5,
            max: 300,
            oninput: (e) => { nt.mins = parseInt(e.target.value, 10) || 60; updateTestSummary(); }
          })
        ),
        h('div', { class: 'fld' },
          h('label', { class: 'lbl', text: 'Marks Per Correct' }),
          h('input', {
            type: 'number',
            class: 'portal-input',
            value: nt.pos,
            min: 1,
            max: 10,
            oninput: (e) => { nt.pos = parseFloat(e.target.value) || 4; updateTestSummary(); }
          })
        ),
        h('div', { class: 'fld' },
          h('label', { class: 'lbl', text: 'Marks Lost (Wrong)' }),
          h('input', {
            type: 'number',
            class: 'portal-input',
            value: nt.neg,
            min: 0,
            max: 5,
            step: 0.25,
            oninput: (e) => { nt.neg = parseFloat(e.target.value) || 1; updateTestSummary(); }
          })
        )
      )
    );

    // Card 2: Chapter & Subtopic Selection (Requested Feature)
    const filteredChapters = allChapters.filter(c => {
      if (nt.classFilter === '11') return c.c.startsWith('11') || c.cl === '11';
      if (nt.classFilter === '12') return c.c.startsWith('12') || c.cl === '12';
      return true;
    });

    const chapterSelect = h('select', {
      class: 'portal-input',
      id: 'chapterPickerSelect',
      onchange: (e) => {
        nt.chapterCode = e.target.value;
        nt.topic = 'all'; // Reset topic on chapter change
        updateTopicDropdown();
        autoUpdateTitle();
        regenerateTestQuestions();
      }
    },
      h('option', { value: 'all', text: 'All Chapters (Mixed Syllabus)' }),
      filteredChapters.map(c => h('option', {
        value: c.c,
        selected: nt.chapterCode === c.c,
        text: (c.c.startsWith('11') ? 'Class 11 · ' : 'Class 12 · ') + c.n
      }))
    );

    const topicSelect = h('select', {
      class: 'portal-input',
      id: 'topicPickerSelect',
      onchange: (e) => {
        nt.topic = e.target.value;
        autoUpdateTitle();
        regenerateTestQuestions();
      }
    });

    function updateTopicDropdown() {
      topicSelect.innerHTML = '';
      topicSelect.append(h('option', { value: 'all', text: 'All Subtopics in Selected Chapter' }));
      
      const currentBank = (window.QB_EXPORT && window.QB_EXPORT.BANK && window.QB_EXPORT.BANK()) || window.BANK || null;
      const pool = (currentBank && currentBank.qs) || [];
      const topicSet = new Set();
      
      pool.forEach(q => {
        if (nt.chapterCode !== 'all' && q.cc !== nt.chapterCode) return;
        if (nt.classFilter === '11' && q.cc && !q.cc.startsWith('11')) return;
        if (nt.classFilter === '12' && q.cc && !q.cc.startsWith('12')) return;
        if (q.tp) topicSet.add(q.tp.trim());
      });

      if (currentBank && currentBank.chapters && nt.chapterCode !== 'all') {
        const chObj = currentBank.chapters.find(c => c.c === nt.chapterCode || c.code === nt.chapterCode);
        if (chObj && Array.isArray(chObj.subs)) {
          chObj.subs.forEach(s => {
            if (s && s.name) topicSet.add(s.name.trim());
          });
        }
      }

      const sortedTopics = Array.from(topicSet).sort();
      sortedTopics.forEach(tp => {
        topicSelect.append(h('option', {
          value: tp,
          selected: nt.topic === tp,
          text: tp
        }));
      });
    }
    updateTopicDropdown();

    // Trigger ensureDpp to load topics and shift papers if not loaded yet
    if (window.QB_EXPORT && window.QB_EXPORT.ensureDpp) {
      window.QB_EXPORT.ensureDpp().then(() => {
        populateShiftDropdown();
        updateTopicDropdown();
      }).catch(() => {});
    }

    function autoUpdateTitle() {
      const titleInp = document.getElementById('testNameInput');
      let chName = '';
      if (nt.chapterCode !== 'all') {
        const found = allChapters.find(c => c.c === nt.chapterCode);
        if (found) chName = found.n;
      }
      let newTitle = '';
      if (chName) {
        newTitle = (nt.chapterCode.startsWith('11') ? 'Class 11' : 'Class 12') + ' Maths Test · ' + chName;
        if (nt.topic !== 'all') newTitle += ' (' + nt.topic + ')';
      } else {
        newTitle = (nt.classFilter === '11' ? 'Class 11' : nt.classFilter === '12' ? 'Class 12' : 'JEE') + ' Mathematics Test';
      }
      nt.title = newTitle;
      if (titleInp) titleInp.value = newTitle;
      updateTestSummary();
    }

    const syllabusCard = h('div', { class: 'card' },
      h('h3', { text: 'Class, Chapter & Subtopic Selection' }),
      h('p', { class: 'hint', text: 'Filter question pool by syllabus, chapter and detailed subtopics.' }),
      h('div', { class: 'fld' },
        h('span', { class: 'lbl', text: 'Class' }),
        buildSeg([['all', 'All Classes'], ['11', 'Class 11'], ['12', 'Class 12']], nt.classFilter, (val) => {
          nt.classFilter = val;
          chapterSelect.innerHTML = '';
          chapterSelect.append(h('option', { value: 'all', text: 'All Chapters (Mixed Syllabus)' }));
          allChapters.filter(c => (val === 'all' || c.c.startsWith(val) || c.cl === val)).forEach(c => {
            chapterSelect.append(h('option', {
              value: c.c,
              selected: nt.chapterCode === c.c,
              text: (c.c.startsWith('11') ? 'Class 11 · ' : 'Class 12 · ') + c.n
            }));
          });
          updateTopicDropdown();
          autoUpdateTitle();
          regenerateTestQuestions();
        })
      ),
      h('div', { class: 'fld' },
        h('label', { class: 'lbl', text: 'Chapter' }),
        chapterSelect
      ),
      h('div', { class: 'fld' },
        h('label', { class: 'lbl', text: 'Subtopic' }),
        topicSelect
      )
    );

    // Card 3: Question Parameters & Source
    const sourceCard = h('div', { class: 'card' },
      h('h3', { text: 'Question Selection & Difficulty' }),
      h('div', { class: 'fld' },
        h('span', { class: 'lbl', text: 'Questions Source' }),
        buildSeg([['both', 'Both (Mixed)'], ['pyq', 'JEE PYQs Only'], ['practice', 'Practice Bank']], nt.source, (val) => {
          nt.source = val;
          regenerateTestQuestions();
        })
      ),
      h('div', { class: 'fld' },
        h('span', { class: 'lbl', text: 'Difficulty Level' }),
        buildSeg([['all', 'All (Mixed)'], ['L1', 'L1 (Easy)'], ['L2', 'L2 (Medium)'], ['L3', 'L3 (Hard)']], nt.diff, (val) => {
          nt.diff = val;
          regenerateTestQuestions();
        })
      ),
      h('div', { class: 'fld' },
        h('label', { class: 'lbl', text: 'Number of Questions' }),
        h('div', { style: 'display:flex;align-items:center;gap:10px;' },
          h('input', {
            type: 'number',
            class: 'portal-input',
            value: nt.count,
            min: 5,
            max: 90,
            oninput: (e) => { nt.count = parseInt(e.target.value, 10) || 15; regenerateTestQuestions(); }
          }),
          h('button', {
            type: 'button',
            class: 'btn pri',
            style: 'white-space:nowrap;',
            onclick: () => regenerateTestQuestions()
          }, '🎲 Regenerate Questions')
        )
      )
    );

    // Card 4: Assign to Students (Multi-Batch aware)
    const assignCard = h('div', { class: 'card' },
      h('h3', { text: 'Target Students' }),
      h('p', { class: 'hint', text: 'Choose which students will see this test in their Student Login.' }),
      h('div', { class: 'fld' },
        buildSeg([['all', 'All Students in Target Batch'], ['custom', 'Select Specific Students']], nt.targetType, (val) => {
          nt.targetType = val;
          updateTargetStudentUI();
        })
      ),
      h('div', { id: 'customStudentsHost', style: nt.targetType === 'custom' ? 'display:block;' : 'display:none;' },
        h('div', { style: 'display:flex;gap:6px;margin:8px 0;flex-wrap:wrap;' },
          h('button', {
            type: 'button',
            class: 'btn sm',
            text: 'JEE Stream Only',
            onclick: () => {
              nt.targetStudents.clear();
              getTargetBatchStudents().filter(s => (s.stream || '').includes('JEE')).forEach(s => nt.targetStudents.add(s.avantiId));
              renderStudentSelectionCheckboxes();
            }
          }),
          h('button', {
            type: 'button',
            class: 'btn sm',
            text: 'Select All',
            onclick: () => {
              getTargetBatchStudents().forEach(s => nt.targetStudents.add(s.avantiId));
              renderStudentSelectionCheckboxes();
            }
          }),
          h('button', {
            type: 'button',
            class: 'btn sm',
            text: 'Clear',
            onclick: () => {
              nt.targetStudents.clear();
              renderStudentSelectionCheckboxes();
            }
          })
        ),
        h('div', {
          id: 'studentCheckboxList',
          style: 'max-height:180px;overflow-y:auto;border:1px solid #d7dfe3;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:4px;'
        })
      )
    );

    function getTargetBatchStudents() {
      const b = nt.batch;
      if (b.includes('All Batches')) return PortalState.students || [];
      if (b.includes('XII')) return (PortalState.students || []).filter(s => s.class === '12' || (s.batch && s.batch.includes('XII')));
      return (PortalState.students || []).filter(s => s.class === '11' || (s.batch && s.batch.includes('XI')));
    }

    function renderStudentSelectionCheckboxes() {
      const host = document.getElementById('studentCheckboxList');
      if (!host) return;
      host.innerHTML = '';
      const list = getTargetBatchStudents();
      list.forEach(s => {
        const isC12 = s.class === '12' || (s.batch && s.batch.includes('XII'));
        host.append(
          h('label', {
            style: 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:3px 6px;border-radius:4px;'
          },
            h('input', {
              type: 'checkbox',
              checked: nt.targetStudents.has(s.avantiId),
              onchange: (e) => {
                if (e.target.checked) nt.targetStudents.add(s.avantiId);
                else nt.targetStudents.delete(s.avantiId);
              }
            }),
            h('span', { class: 'batch-badge ' + (isC12 ? 'c12' : 'c11'), style: 'font-size:10px;padding:1px 5px;', text: isC12 ? 'XII' : 'XI' }),
            h('span', { style: 'font-weight:600;', text: s.name }),
            h('span', { style: 'color:#64748b;font-size:11px;', text: '(' + s.avantiId + ' · ' + s.stream + ')' })
          )
        );
      });
    }

    leftRail.append(shiftBox, detailsCard, syllabusCard, sourceCard, assignCard);

    // Right Stage: Action Bar, Summary, and Question Previews
    const rightStage = h('div', { class: 'rail' });

    // Actions & Export Card with "Save and Publish Test"
    const actionCard = h('div', { class: 'card', style: 'background:linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);' },
      h('div', { style: 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;' },
        h('div', null,
          h('h3', { text: 'Publish & Export' }),
          h('p', { class: 'hint', id: 'testSummaryText', text: nt.selectedQs.length + ' questions · ' + nt.mins + ' min · +' + nt.pos + '/−' + nt.neg + ' marking' })
        ),
        h('div', { style: 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;' },
          // Export buttons that follow Question Bank rules
          h('button', {
            type: 'button',
            class: 'btn',
            title: 'Download printable PDF test paper (Question Bank format with answer key)',
            onclick: () => exportTest('pdf')
          }, '📄 Export PDF'),
          h('button', {
            type: 'button',
            class: 'btn',
            title: 'Download editable Word document with native OMML equations (.docx)',
            onclick: () => exportTest('docx')
          }, '📝 Export DOCX'),
          h('button', {
            type: 'button',
            class: 'btn',
            title: 'Download editable PowerPoint presentation with OMML formulas (.pptx)',
            onclick: () => exportTest('pptx')
          }, '📊 Export PPTX'),

          // KEY REQUESTED BUTTON: "Save and Publish Test"
          h('button', {
            type: 'button',
            class: 'btn btn-publish-test',
            onclick: () => saveAndPublishTest()
          }, '🚀 Save and Publish Test')
        )
      )
    );

    // Questions List Preview
    const previewCard = h('div', { class: 'card' },
      h('div', { style: 'display:flex;justify-content:space-between;align-items:center;' },
        h('h3', { text: 'Questions in this Test' }),
        h('span', { style: 'font-size:12.5px;color:#64748b;', id: 'questionCountBadge', text: nt.selectedQs.length + ' questions picked' })
      ),
      h('div', { id: 'testQuestionsHost', style: 'display:flex;flex-direction:column;gap:12px;margin-top:8px;' })
    );

    rightStage.append(actionCard, previewCard);
    wrap.append(leftRail, rightStage);
    container.append(wrap);

    // Initial population of questions
    if (!nt.selectedQs.length) {
      regenerateTestQuestions();
    } else {
      renderPickedQuestionsList();
    }
  }

  function updateTargetStudentUI() {
    const nt = PortalState.newTest;
    const host = document.getElementById('customStudentsHost');
    if (host) {
      host.style.display = nt.targetType === 'custom' ? 'block' : 'none';
    }
  }

  function updateTestSummary() {
    const nt = PortalState.newTest;
    const el = document.getElementById('testSummaryText');
    if (el) {
      el.textContent = `${nt.selectedQs.length} questions · ${nt.mins} min · +${nt.pos}/−${nt.neg} marking · ${nt.batch}`;
    }
  }

  function regenerateTestQuestions() {
    const nt = PortalState.newTest;
    const pool = getQuestionPool(nt.source, nt.diff);
    
    // Shuffle pool and take count
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    nt.selectedQs = shuffled.slice(0, Math.min(nt.count, shuffled.length));

    // Update count badge and render
    renderPickedQuestionsList();
    updateTestSummary();
  }

  function getQuestionPool(source, diff) {
    const nt = PortalState.newTest;
    const bank = (window.QB_EXPORT && window.QB_EXPORT.BANK && window.QB_EXPORT.BANK()) || window.BANK || null;
    if (bank && Array.isArray(bank.qs) && bank.qs.length) {
      return bank.qs.filter(q => {
        // Class filter
        if (nt.classFilter === '11' && !q.cc.startsWith('11')) return false;
        if (nt.classFilter === '12' && !q.cc.startsWith('12')) return false;

        // Chapter filter
        if (nt.chapterCode && nt.chapterCode !== 'all' && q.cc !== nt.chapterCode) return false;

        // Topic filter
        if (nt.topic && nt.topic !== 'all' && q.tp !== nt.topic) return false;

        // Source filter
        const matchSrc = source === 'both' ? true : source === 'pyq' ? (q.s === 'P') : (q.s !== 'P');
        if (!matchSrc) return false;

        // Difficulty filter
        const matchDiff = diff === 'all' ? true : (q.d === diff);
        if (!matchDiff) return false;

        return q.q && q.a;
      });
    }

    // Fallback seed question bank with authentic JEE Math questions
    return [
      { i: 'Q_101', cc: '11M1', tp: 'Limits', q: 'The value of $\\lim_{x \\to 0} \\frac{\\sin 2x}{x}$ is:', o: ['1', '2', '0', 'Does not exist'], a: 'B', d: 'L1', sub: 'Limits', t: 'MCQ' },
      { i: 'Q_102', cc: '12M15', tp: 'Determinants', q: 'If $A$ is a square matrix of order 3 such that $|A| = 4$, then $|2A|$ is:', o: ['8', '16', '32', '64'], a: 'C', d: 'L1', sub: 'Matrices', t: 'MCQ' },
      { i: 'Q_103', cc: '11M9', tp: 'Distance', q: 'The distance between the parallel lines $3x + 4y - 9 = 0$ and $6x + 8y + 15 = 0$ is:', o: ['33/10', '3/10', '33/5', '12/5'], a: 'A', d: 'L1', sub: 'Straight Lines', t: 'MCQ' },
      { i: 'Q_104', cc: '11M8', tp: 'GP', q: 'The sum of the series $1 + \\frac{1}{2} + \\frac{1}{4} + \\frac{1}{8} + \\dots$ to infinity is:', o: ['1', '2', '3/2', 'Infinity'], a: 'B', d: 'L1', sub: 'Sequences & Series', t: 'MCQ' },
      { i: 'Q_105', cc: '11M11', tp: 'Parabola', q: 'The focus of the parabola $y^2 = -12x$ is at:', o: ['(3, 0)', '(-3, 0)', '(0, 3)', '(0, -3)'], a: 'B', d: 'L1', sub: 'Conic Sections', t: 'MCQ' },
      { i: 'Q_106', cc: '11M3', tp: 'Identities', q: 'If $\\sin \\theta + \\csc \\theta = 2$, then $\\sin^5 \\theta + \\csc^5 \\theta$ is equal to:', o: ['1', '2', '2^5', '0'], a: 'B', d: 'L2', sub: 'Trigonometry', t: 'MCQ' },
      { i: 'Q_107', cc: '11M7', tp: 'General Term', q: 'The number of terms in the expansion of $(x + y + z)^{10}$ is:', o: ['11', '66', '55', '36'], a: 'B', d: 'L2', sub: 'Binomial Theorem', t: 'MCQ' },
      { i: 'Q_108', cc: '12M17', tp: 'Chain Rule', q: 'The derivative of $f(x) = \\ln(\\sec x + \\tan x)$ with respect to $x$ is:', o: ['\\sec x', '\\tan x', '\\sec x \\tan x', '\\sec^2 x'], a: 'A', d: 'L2', sub: 'Differentiation', t: 'MCQ' },
      { i: 'Q_109', cc: '12M13', tp: 'Domain', q: 'The domain of the function $f(x) = \\sqrt{9 - x^2}$ is:', o: ['(-3, 3)', '[-3, 3]', '[0, 3]', '(-∞, -3] ∪ [3, ∞)'], a: 'B', d: 'L1', sub: 'Functions', t: 'MCQ' },
      { i: 'Q_110', cc: '12M21', tp: 'Variable Separable', q: 'The general solution of the differential equation $\\frac{dy}{dx} = e^{x-y}$ is:', o: ['e^y = e^x + C', 'e^{-y} = e^x + C', 'e^y = -e^x + C', 'e^x + e^y = C'], a: 'A', d: 'L2', sub: 'Differential Equations', t: 'MCQ' },
      { i: 'Q_111', cc: '12M22', tp: 'Dot Product', q: 'If vectors $\\vec{a} = 2\\hat{i} + \\hat{j} + \\hat{k}$ and $\\vec{b} = \\hat{i} - 4\\hat{j} + \\lambda\\hat{k}$ are perpendicular, then $\\lambda$ is:', o: ['2', '-2', '1', '4'], a: 'A', d: 'L1', sub: 'Vectors', t: 'MCQ' },
      { i: 'Q_112', cc: '12M20', tp: 'Area', q: 'The area bounded by the curve $y = x^2$ and the line $y = 4$ is:', o: ['16/3', '32/3', '64/3', '8'], a: 'B', d: 'L2', sub: 'Definite Integration', t: 'MCQ' },
      { i: 'Q_113', cc: '11M10', tp: 'Equation', q: 'The radius of the circle $x^2 + y^2 - 4x + 6y - 12 = 0$ is:', o: ['4', '5', '6', '7'], a: 'B', d: 'L1', sub: 'Circles', t: 'MCQ' },
      { i: 'Q_114', cc: '12M24', tp: 'Classical', q: 'A card is drawn from a well-shuffled pack of 52 cards. The probability that it is a Queen or a King is:', o: ['1/13', '2/13', '4/13', '1/26'], a: 'B', d: 'L1', sub: 'Probability', t: 'MCQ' },
      { i: 'Q_115', cc: '12M20', tp: 'Properties', q: 'The value of $\\int_0^{\\pi/2} \\frac{\\sqrt{\\sin x}}{\\sqrt{\\sin x} + \\sqrt{\\cos x}} dx$ is:', o: ['\\pi', '\\pi/2', '\\pi/4', '0'], a: 'C', d: 'L2', sub: 'Definite Integration', t: 'MCQ' }
    ];
  }

  function renderPickedQuestionsList() {
    const host = document.getElementById('testQuestionsHost');
    const badge = document.getElementById('questionCountBadge');
    if (!host) return;
    host.innerHTML = '';

    const nt = PortalState.newTest;
    if (badge) badge.textContent = nt.selectedQs.length + ' questions picked';

    if (!nt.selectedQs.length) {
      host.innerHTML = '<div style="padding:24px;text-align:center;color:#64748b;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1;">No questions currently match these criteria. Try choosing "All Chapters" or "Both (Mixed)" and click "Regenerate Questions".</div>';
      return;
    }

    nt.selectedQs.forEach((q, i) => {
      const qCard = h('div', {
        style: 'border:1px solid #d7dfe3;background:#ffffff;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px;'
      },
        h('div', { style: 'display:flex;justify-content:space-between;align-items:center;' },
          h('div', { style: 'display:flex;align-items:center;gap:8px;' },
            h('span', { style: 'font-weight:700;background:#eef1f3;padding:2px 8px;border-radius:4px;font-size:12px;', text: 'Q' + (i + 1) }),
            h('span', { style: 'font-size:11px;padding:2px 6px;border-radius:4px;background:#e0f2fe;color:#0369a1;font-weight:700;', text: q.d || 'L1' }),
            h('span', { style: 'font-size:12px;color:#64748b;', text: q.tp ? (q.tp + ' · ' + (q.sub || 'Maths')) : (q.sub || 'Mathematics') })
          ),
          h('div', { style: 'display:flex;gap:6px;' },
            h('button', {
              type: 'button',
              class: 'btn sm',
              style: 'padding:2px 8px;font-size:11.5px;',
              onclick: () => swapQuestion(i)
            }, '🔄 Swap'),
            h('button', {
              type: 'button',
              class: 'btn sm',
              style: 'padding:2px 8px;font-size:11.5px;color:#dc2626;',
              onclick: () => removeQuestion(i)
            }, '✕ Remove')
          )
        ),
        h('div', { class: 'stem', style: 'font-size:15px;line-height:1.5;color:#1e293b;', text: String(q.q || '').replace(/\s*\{\{figure\}\}\s*/g, ' ').trim() }),
        q.f ? h('img', { class: 'fig', alt: 'Figure', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(q.f.svg), width: q.f.w, height: q.f.h }) : null,
        q.o && q.o.length ? h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13.5px;margin-top:4px;' },
          q.o.map((opt, oIdx) => {
            const letter = 'ABCD'[oIdx];
            const isAns = q.a === letter;
            return h('div', {
              style: 'padding:6px 10px;background:' + (isAns ? '#ecfdf5' : '#f8fafc') + ';border:1px solid ' + (isAns ? '#a7f3d0' : '#e2e8f0') + ';border-radius:6px;display:flex;align-items:center;gap:6px;'
            },
              h('b', { style: 'color:' + (isAns ? '#059669' : '#0e6b84') + ';', text: '(' + letter + ')' }),
              h('span', { class: 'opt-text', text: opt })
            );
          })
        ) : null
      );
      host.append(qCard);
    });

    math(host);
  }

  function swapQuestion(idx) {
    const nt = PortalState.newTest;
    const pool = getQuestionPool(nt.source, nt.diff);
    const existingIds = new Set(nt.selectedQs.map(q => q.i));
    const available = pool.filter(q => !existingIds.has(q.i));
    if (available.length) {
      const randomQ = available[Math.floor(Math.random() * available.length)];
      nt.selectedQs[idx] = randomQ;
      renderPickedQuestionsList();
      toast('Swapped question ' + (idx + 1));
    } else {
      toast('No alternate questions found');
    }
  }

  function removeQuestion(idx) {
    const nt = PortalState.newTest;
    if (nt.selectedQs.length <= 1) {
      toast('Test must have at least 1 question');
      return;
    }
    nt.selectedQs.splice(idx, 1);
    nt.count = nt.selectedQs.length;
    renderPickedQuestionsList();
    updateTestSummary();
  }

  // SAVE AND PUBLISH TEST ACTION
  async function saveAndPublishTest() {
    const nt = PortalState.newTest;
    if (!nt.selectedQs.length) {
      toast('Cannot publish test without questions');
      return;
    }

    let assigned = ['*']; // All students
    if (nt.targetType === 'custom') {
      assigned = Array.from(nt.targetStudents);
      if (!assigned.length) {
        toast('Please select at least one student or choose All Students');
        return;
      }
    }

    const testPayload = {
      id: 'test_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      title: nt.title.trim() || 'Mathematics Test',
      batch: nt.batch.trim() || PortalState.batchName,
      assignedStudentIds: assigned,
      mins: nt.mins || 60,
      pos: nt.pos || 4,
      neg: nt.neg || 1,
      source: nt.source,
      diff: nt.diff,
      count: nt.selectedQs.length,
      qs: nt.selectedQs,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (res.ok) {
        const data = await res.json();
        PortalState.tests.unshift(data.test || testPayload);
        const countMsg = assigned.includes('*') ? `all ${PortalState.students.length} students` : `${assigned.length} selected students`;
        toast(`🎉 Test "${testPayload.title}" published successfully! Available immediately in Student Login for ${countMsg}.`);
        
        // Switch to performance tab or update state
        PortalState.teacherActiveTab = 'performance';
        perfFilterTestId = testPayload.id;
        renderTeacherView();
      } else {
        toast('Failed to publish test to server');
      }
    } catch (e) {
      console.error('Error publishing test:', e);
      // Fallback local save
      PortalState.tests.unshift(testPayload);
      toast(`Test published locally!`);
      PortalState.teacherActiveTab = 'performance';
      renderTeacherView();
    }
  }

  // Export handlers adhering to Question Bank rules
  async function exportTest(format) {
    const nt = PortalState.newTest;
    if (!nt.selectedQs.length) {
      toast('No questions to export');
      return;
    }

    toast(`Preparing Question Bank standard ${format.toUpperCase()} export…`);

    function normalizeMathForExport(text) {
      if (!text) return '';
      return String(text).replace(/\s*\{\{figure\}\}\s*/g, ' ').trim();
    }

    const exportedQs = nt.selectedQs.map(q => ({
      ...q,
      q: normalizeMathForExport(q.q),
      o: q.o ? q.o.map(opt => normalizeMathForExport(opt)) : []
    }));

    try {
      if (window.QB_EXPORT && typeof window.QB_EXPORT.doExport === 'function') {
        const chMap = window.QB_EXPORT.CHMAP ? window.QB_EXPORT.CHMAP() : null;
        let sub = 'Mathematics';
        if (nt.chapterCode && nt.chapterCode !== 'all' && chMap && chMap.get(nt.chapterCode)) {
          sub = chMap.get(nt.chapterCode).n;
          if (nt.topic && nt.topic !== 'all') sub += ' · ' + nt.topic;
        }

        const baseParams = {
          mode: 'test',
          kind: 'test',
          title: nt.title.trim() || 'Mathematics Test',
          sub,
          batch: nt.batch.trim() || PortalState.batchName,
          date: new Date().toISOString().slice(0, 10),
          mins: nt.mins || 60,
          pos: nt.pos || 4,
          neg: nt.neg || 1,
          cols: 2,
          tag: true,
          key: true,
          qs: exportedQs,
          file: (nt.title.trim() || 'Test').replace(/[^A-Za-z0-9]+/g, '_')
        };

        const pages = (window.QB_EXPORT.testPages && window.QB_EXPORT.testPages(baseParams)) || [baseParams];
        await window.QB_EXPORT.doExport(format, { pages, file: baseParams.file });
        return;
      }
    } catch (err) {
      console.warn('QB_EXPORT failed, falling back:', err);
    }

    // High fidelity printable fallback
    if (format === 'pdf') {
      window.print();
    } else {
      toast('Export is building, please check downloads.');
    }
  }


  // ==========================================
  // STUDENT PORTAL & TEST TAKING SCREEN
  // ==========================================
  function renderStudentView() {
    const host = document.getElementById('viewStudent');
    if (!host) return;
    host.innerHTML = '';

    if (!PortalState.studentAuth) {
      renderStudentLogin(host);
    } else if (PortalState.runningTest) {
      renderActiveTestTakingScreen(host);
    } else {
      renderStudentDashboard(host);
    }
  }

  function renderStudentLogin(host) {
    const wrap = h('div', { class: 'portal-auth-wrap' });
    const card = h('div', { class: 'portal-auth-card' });

    card.append(
      h('div', { class: 'portal-auth-badge student', text: 'Student Portal' }),
      h('div', { class: 'portal-auth-head' },
        h('h2', { text: 'Student Login' }),
        h('p', { text: 'Enter your Avanti ID to view your assigned live tests and submit your responses.' })
      )
    );

    const errBox = h('div', { class: 'portal-err', style: 'display:none;' });
    card.append(errBox);

    const idInput = h('input', {
      type: 'text',
      class: 'portal-input',
      placeholder: 'Enter 12-digit Avanti ID (e.g. 202818165253)'
    });

    // Quick demo selector organized by batches
    const c11Students = (PortalState.students || []).filter(s => s.class === '11' || (s.batch && s.batch.includes('XI')));
    const c12Students = (PortalState.students || []).filter(s => s.class === '12' || (s.batch && s.batch.includes('XII')));

    const quickPick = h('select', {
      class: 'portal-input',
      style: 'margin-bottom:14px;background:#f8fafc;font-size:13px;',
      onchange: (e) => {
        if (e.target.value) {
          idInput.value = e.target.value;
        }
      }
    },
      h('option', { value: '', text: '— Or pick a student from roster —' }),
      h('optgroup', { label: `Class XI · JNV Dakshina Kannada (${c11Students.length} students)` },
        c11Students.map(s => h('option', {
          value: s.avantiId,
          text: s.name + ' (' + s.avantiId + ' · ' + s.stream + ')'
        }))
      ),
      h('optgroup', { label: `Class XII · CLASS XII 2026-27 (${c12Students.length} students)` },
        c12Students.map(s => h('option', {
          value: s.avantiId,
          text: s.name + ' (' + s.avantiId + ' · ' + s.stream + ')'
        }))
      )
    );

    const form = h('form', {
      onsubmit: (e) => {
        e.preventDefault();
        const enteredId = idInput.value.trim();
        const found = (PortalState.students || []).find(s => s.avantiId === enteredId);

        if (found) {
          PortalState.studentAuth = found;
          toast('Welcome, ' + found.name + '! Login successful.');
          renderStudentView();
        } else {
          errBox.style.display = 'block';
          errBox.textContent = 'Avanti ID not found in enrolled rosters (Class XI / XII). Please check your ID or choose from the dropdown.';
        }
      }
    },
      h('div', { class: 'portal-form-group', style: 'margin-bottom:10px;' },
        h('label', { text: 'Quick Student Selector' }),
        quickPick
      ),
      h('div', { class: 'portal-form-group', style: 'margin-bottom:16px;' },
        h('label', { text: 'Avanti ID' }),
        idInput
      ),
      h('button', {
        type: 'submit',
        class: 'btn pri',
        style: 'width:100%;height:44px;font-size:15px;font-weight:700;',
        text: 'Login to Student Portal'
      })
    );

    card.append(form);
    wrap.append(card);
    host.append(wrap);
  }

  function renderStudentDashboard(host) {
    const student = PortalState.studentAuth;

    // Banner
    const banner = h('div', { class: 'student-banner' },
      h('div', { class: 'student-banner-left' },
        h('div', { class: 'student-avatar', text: student.name.charAt(0) }),
        h('div', { class: 'student-banner-info' },
          h('h2', { text: student.name }),
          h('p', null,
            h('span', { text: 'Avanti ID: ' + student.avantiId }),
            h('span', { class: 'stream-badge ' + student.stream.toLowerCase(), text: student.stream }),
            h('span', { text: student.batch || PortalState.batchName })
          )
        )
      ),
      h('button', {
        type: 'button',
        class: 'portal-logout-btn',
        style: 'color:#cbd5e1;border-color:#475569;',
        onclick: () => {
          PortalState.studentAuth = null;
          toast('Logged out from Student Portal');
          renderStudentView();
        }
      }, 'Log out')
    );

    const container = h('div', { class: 'portal-container' });

    // Available Tests (assigned to all '*' or specifically to this student)
    const assignedTests = (PortalState.tests || []).filter(t => {
      if (!t.assignedStudentIds || t.assignedStudentIds.includes('*')) return true;
      return t.assignedStudentIds.includes(student.avantiId);
    });

    const studentSubs = (PortalState.submissions || []).filter(s => s.studentId === student.avantiId);
    const completedTestIds = new Set(studentSubs.map(s => s.testId));

    const liveTests = assignedTests.filter(t => !completedTestIds.has(t.id));

    // Section 1: Live & Active Tests
    const liveSection = h('div', { style: 'margin-bottom:36px;' },
      h('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:16px;' },
        h('h2', { style: 'font-size:20px;font-weight:700;margin:0;', text: 'Live & Active Tests' }),
        h('span', { class: 'live-badge' }, h('span', { class: 'live-dot-pulse' }), liveTests.length + ' Available')
      ),
      liveTests.length ? h('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:16px;' },
        liveTests.map(t => {
          const maxMarks = (t.qs ? t.qs.length : t.count || 15) * (t.pos || 4);
          return h('div', { class: 'test-card' },
            h('div', { class: 'test-card-top' },
              h('div', null,
                h('h3', { text: t.title }),
                h('p', { text: t.batch || PortalState.batchName })
              ),
              h('span', { class: 'live-badge' }, 'LIVE')
            ),
            h('div', { class: 'test-card-facts' },
              h('div', { class: 'test-fact-item' }, h('b', { text: String(t.qs ? t.qs.length : t.count || 15) }), h('span', { text: 'Questions' })),
              h('div', { class: 'test-fact-item' }, h('b', { text: t.mins + ' min' }), h('span', { text: 'Time' })),
              h('div', { class: 'test-fact-item' }, h('b', { text: String(maxMarks) }), h('span', { text: 'Max Marks' })),
              h('div', { class: 'test-fact-item' }, h('b', { text: `+${t.pos}/−${t.neg}` }), h('span', { text: 'Marking' }))
            ),
            h('div', { class: 'test-card-footer' },
              h('span', { style: 'font-size:12px;color:#64748b;', text: 'Assigned on ' + (t.createdAt ? t.createdAt.slice(0, 10) : 'Today') }),
              h('button', {
                type: 'button',
                class: 'btn pri',
                style: 'font-weight:700;padding:8px 18px;',
                onclick: () => startTestSession(t)
              }, 'Start Test ▶')
            )
          );
        })
      ) : h('div', {
        style: 'background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:32px;text-align:center;color:#64748b;'
      },
        h('p', { style: 'margin:0;font-size:15px;', text: 'You have completed all assigned tests! Check your results below.' })
      )
    );

    // Section 2: Completed Tests & Past Results
    const completedSection = h('div', null,
      h('h2', { style: 'font-size:20px;font-weight:700;margin:0 0 16px;', text: 'My Past Results & Analysis' }),
      studentSubs.length ? h('div', { class: 'portal-table-wrap' },
        h('table', { class: 'portal-table' },
          h('thead', null,
            h('tr', null,
              h('th', { text: 'Test Name' }),
              h('th', { text: 'Submitted Date' }),
              h('th', { text: 'Score' }),
              h('th', { text: 'Percentage' }),
              h('th', { text: 'Correct / Wrong' }),
              h('th', { text: 'Time Taken' }),
              h('th', { text: 'Action' })
            )
          ),
          h('tbody', null,
            studentSubs.map(s => {
              const pct = Math.round((s.score / s.max) * 100);
              return h('tr', null,
                h('td', { style: 'font-weight:700;', text: s.testTitle }),
                h('td', { text: s.submittedAt ? s.submittedAt.slice(0, 10) : '—' }),
                h('td', { style: 'font-weight:700;', text: s.score + ' / ' + s.max }),
                h('td', null,
                  h('span', {
                    style: 'font-weight:700;padding:2px 8px;border-radius:10px;font-size:12px;' +
                      (pct >= 70 ? 'background:#dcfce7;color:#166534;' : pct >= 40 ? 'background:#fef3c7;color:#92400e;' : 'background:#fee2e2;color:#991b1b;'),
                    text: pct + '%'
                  })
                ),
                h('td', { text: `${s.ok}✓ · ${s.no}✗ · ${s.skip}–` }),
                h('td', { text: Math.floor(s.secs / 60) + 'm ' + (s.secs % 60) + 's' }),
                h('td', null,
                  h('button', {
                    type: 'button',
                    class: 'btn sm',
                    onclick: () => showSubmissionDetailModal(s)
                  }, 'Review Answers')
                )
              );
            })
          )
        )
      ) : h('p', { style: 'color:#64748b;font-size:14px;', text: 'No tests completed yet. Start an active test above!' })
    );

    container.append(liveSection, completedSection);
    host.append(banner, container);
  }

  // ==========================================
  // TEST TAKING SCREEN & ANTI-CHEAT ENGINE
  // (Follows test_taking_screen_code_9bc229b1.js)
  // ==========================================
  function startTestSession(test) {
    PortalState.runningTest = {
      test: test,
      state: 'intro', // 'intro' | 'taking' | 'result'
      currentQ: 0,
      answers: {}, // index -> answer
      questionStatus: {}, // '' unvisited, 'r' not answered, 'g' answered, 'v' marked for review, 'gv' answered & marked
      questionTimes: {}, // index -> seconds
      qStartTime: null,
      startedAt: null,
      endsAt: null,
      timerInterval: null,
      isFullscreen: false,
      
      // Anti-cheat logging
      switches: 0, // sw
      awaySeconds: 0, // sa
      lastLeaveTime: 0, // lt
      printScreenHits: 0, // ps
      lastPsTime: 0,

      // Final result
      result: null
    };

    renderStudentView();
  }

  function renderActiveTestTakingScreen(host) {
    const rt = PortalState.runningTest;
    if (rt.state === 'intro') {
      renderTestIntroScreen(host);
    } else if (rt.state === 'taking') {
      renderTestQuestionScreen(host);
    } else if (rt.state === 'result') {
      renderTestResultScreen(host);
    }
  }

  // 1. Intro and Rules
  function renderTestIntroScreen(host) {
    const rt = PortalState.runningTest;
    const t = rt.test;
    const m = {
      t: t.title,
      m: t.mins,
      p: t.pos || 4,
      n: t.neg || 1
    };
    const maxMarks = (t.qs ? t.qs.length : 15) * m.p;

    const wrap = h('div', { class: 'wrap' },
      h('div', { class: 'take' },
        h('h1', { text: m.t }),
        h('div', { class: 'facts' },
          h('div', { class: 'fact' }, h('b', { text: String(t.qs ? t.qs.length : 15) }), h('span', { text: 'Questions' })),
          h('div', { class: 'fact' }, h('b', { text: m.m + ' min' }), h('span', { text: 'Time' })),
          h('div', { class: 'fact' }, h('b', { text: String(maxMarks) }), h('span', { text: 'Max marks' })),
          h('div', { class: 'fact' }, h('b', { text: '+' + m.p + ' / −' + m.n }), h('span', { text: 'Marking' }))
        ),
        h('div', { class: 'card', style: 'text-align:left;' },
          h('h3', { text: 'Read these rules before you start' }),
          h('ul', { class: 'rules' }, [
            'This test is monitored all the time. Everything listed below is recorded against your Avanti ID and your teacher can see it.',
            'The test opens in full screen. If you leave full screen, the questions are hidden and the leave is recorded. The timer keeps running.',
            'Switching tab or window, minimising the browser, opening another app, or pressing the Windows key is recorded every time, with the total time you were away.',
            'Taking a screenshot or screen recording is not allowed. Pressing the Windows key or Print Screen hides the screen and is recorded.',
            'Copy, paste, cut, right-click, save and print are switched off.',
            'Do not refresh or close this page. If it closes by mistake, log in again on the same device and the test continues. The timer does not stop.',
            'Marking: single-answer +' + m.p + ' for correct, −' + m.n + ' for wrong. Questions with more than one correct option need every correct option and no wrong one, and have no negative marking. Numerical questions have no negative marking. You cannot change answers after you submit.'
          ].map(x => h('li', { text: x }))),
          h('label', { class: 'agree' },
            h('input', {
              type: 'checkbox',
              id: 'agreeRulesBox',
              onchange: (e) => {
                const btn = document.getElementById('startTestBtn');
                if (btn) btn.disabled = !e.target.checked;
              }
            }),
            h('span', { text: 'I have read and understood all the rules. I know that my activity is being recorded.' })
          ),
          h('p', { class: 'hint', text: `${PortalState.studentAuth.name} · Avanti ID ${PortalState.studentAuth.avantiId}` }),
          h('div', { class: 'btns' },
            h('button', {
              type: 'button',
              class: 'btn pri',
              id: 'startTestBtn',
              disabled: true,
              style: 'padding:10px 24px;font-weight:700;',
              onclick: () => startActualTest()
            }, 'Start test ▶'),
            h('button', {
              type: 'button',
              class: 'btn',
              onclick: () => {
                PortalState.runningTest = null;
                renderStudentView();
              }
            }, 'Back to Dashboard')
          )
        )
      )
    );

    host.append(wrap);
    math(host);
  }

  function startActualTest() {
    const rt = PortalState.runningTest;
    const t = rt.test;

    // 1. Fullscreen request
    try {
      const de = document.documentElement;
      if (de.requestFullscreen) {
        de.requestFullscreen().then(() => { rt.isFullscreen = true; }).catch(() => {});
      }
    } catch (e) {}

    // 2. Initialize timers & Anti-cheat listeners
    rt.state = 'taking';
    rt.startedAt = Date.now();
    rt.endsAt = rt.startedAt + t.mins * 60000;
    rt.qStartTime = Date.now();

    // Attach anti-cheat
    attachAntiCheatListeners();

    // Ensure any watermark is removed completely as requested
    const oldWm = document.getElementById('wm');
    if (oldWm) oldWm.remove();

    // Start tick
    startTestTimer();

    // Render questions
    renderStudentView();
  }

  function removeWatermark() {
    const wm = document.getElementById('wm');
    if (wm) wm.remove();
  }

  // Anti-cheat Listeners
  let antiCheatAttached = false;
  function attachAntiCheatListeners() {
    if (antiCheatAttached) return;
    antiCheatAttached = true;

    function awayOut() {
      const rt = PortalState.runningTest;
      if (rt && rt.state === 'taking' && !rt.lastLeaveTime) {
        rt.lastLeaveTime = Date.now();
        rt.switches = (rt.switches || 0) + 1;
      }
    }

    function awayBack() {
      const rt = PortalState.runningTest;
      if (rt && rt.lastLeaveTime) {
        rt.awaySeconds = (rt.awaySeconds || 0) + (Date.now() - rt.lastLeaveTime) / 1000;
        rt.lastLeaveTime = 0;
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) awayOut();
      else awayBack();
    });

    window.addEventListener('blur', awayOut);
    window.addEventListener('focus', awayBack);

    // Fullscreen change check
    document.addEventListener('fullscreenchange', () => {
      const rt = PortalState.runningTest;
      if (document.fullscreenElement) {
        if (rt && rt.state === 'taking') rt.isFullscreen = true;
        const o = document.getElementById('fsOver');
        if (o) o.remove();
        awayBack();
        return;
      }
      if (!rt || rt.state !== 'taking' || !rt.isFullscreen) return;
      awayOut();
      if (!document.getElementById('fsOver')) {
        document.body.append(
          h('div', {
            id: 'fsOver',
            style: 'position:fixed;inset:0;z-index:999;background:rgba(20,27,51,.96);color:#fff;display:grid;place-items:center;padding:24px;text-align:center'
          },
            h('div', { style: 'max-width:440px;display:flex;flex-direction:column;gap:14px;align-items:center' },
              h('h2', { style: 'color:#fff;margin:0;', text: 'You left full screen' }),
              h('p', { text: 'Your teacher is notified every time you leave the test screen. The timer is still running. Return to full screen to continue.' }),
              h('button', {
                type: 'button',
                class: 'btn pri',
                style: 'padding:10px 20px;font-weight:700;',
                text: 'Return to full screen',
                onclick: () => {
                  const o = document.getElementById('fsOver');
                  if (o) o.remove();
                  try { document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
                }
              })
            )
          )
        );
      }
    });

    // Disable copy, cut, paste, context menu
    ['contextmenu', 'copy', 'cut', 'paste'].forEach(ev => {
      document.addEventListener(ev, (e) => {
        const rt = PortalState.runningTest;
        if (rt && rt.state === 'taking') e.preventDefault();
      });
    });

    // Block PrintScreen and Meta keys
    function snipCover() {
      const rt = PortalState.runningTest;
      if (!rt || rt.state !== 'taking' || document.getElementById('snipC')) return;
      document.body.append(
        h('div', {
          id: 'snipC',
          style: 'position:fixed;inset:0;z-index:998;background:#141B33;color:#fff;display:grid;place-items:center;font-weight:700;font-size:20px;text-align:center;padding:24px;',
          text: 'Screen hidden. Screenshots are not allowed during the test.'
        })
      );
    }

    function snipUncover() {
      const c = document.getElementById('snipC');
      if (c) c.remove();
    }

    function psHit() {
      const rt = PortalState.runningTest;
      if (!rt || rt.state !== 'taking') return;
      if (Date.now() - (rt.lastPsTime || 0) > 1500) {
        rt.printScreenHits = (rt.printScreenHits || 0) + 1;
        rt.lastPsTime = Date.now();
      }
      try { navigator.clipboard.writeText('Screenshots are not allowed during the test.').catch(() => {}); } catch (e) {}
      snipCover();
      setTimeout(snipUncover, 2000);
    }

    document.addEventListener('keydown', (e) => {
      const rt = PortalState.runningTest;
      if (!rt || rt.state !== 'taking') return;
      if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Super') {
        snipCover();
        if (!e.repeat && Date.now() - (rt.lastPsTime || 0) > 1500) {
          rt.printScreenHits = (rt.printScreenHits || 0) + 1;
          rt.lastPsTime = Date.now();
        }
      } else if (e.key === 'PrintScreen') {
        psHit();
      } else if ((e.ctrlKey || e.metaKey) && /^[ps]$/i.test(e.key)) {
        e.preventDefault();
      }
    }, true);

    document.addEventListener('keyup', (e) => {
      if (e.key === 'Meta' || e.key === 'OS' || e.key === 'Super') {
        setTimeout(snipUncover, 600);
      } else if (e.key === 'PrintScreen') {
        psHit();
      }
    }, true);
  }

  // Timer Tick
  function startTestTimer() {
    stopTestTimer();
    PortalState.runningTest.timerInterval = setInterval(testTick, 1000);
  }

  function stopTestTimer() {
    if (PortalState.runningTest && PortalState.runningTest.timerInterval) {
      clearInterval(PortalState.runningTest.timerInterval);
      PortalState.runningTest.timerInterval = null;
    }
  }

  function testTick() {
    const rt = PortalState.runningTest;
    if (!rt || rt.state !== 'taking') {
      stopTestTimer();
      return;
    }

    const left = Math.max(0, rt.endsAt - Date.now());
    const s = Math.ceil(left / 1000);
    const timeEl = document.getElementById('testCountdownTimer');
    if (timeEl) {
      timeEl.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      timeEl.classList.toggle('low', s <= 300);
    }

    const qe = document.getElementById('qtimer');
    if (qe) {
      const spent = Math.floor((rt.questionTimes[rt.currentQ] || 0) + (rt.qStartTime ? (Date.now() - rt.qStartTime) / 1000 : 0));
      qe.textContent = `Q${rt.currentQ + 1}  ${String(Math.floor(spent / 60)).padStart(2, '0')}:${String(spent % 60).padStart(2, '0')}`;
    }

    if (left <= 0) {
      finishTest(true);
    }
  }

  function accrueQuestionTime() {
    const rt = PortalState.runningTest;
    if (!rt || rt.state !== 'taking') return;
    const now = Date.now();
    if (rt.qStartTime) {
      rt.questionTimes[rt.currentQ] = (rt.questionTimes[rt.currentQ] || 0) + (now - rt.qStartTime) / 1000;
    }
    rt.qStartTime = now;
  }

  const hasAnswer = a => !(a == null || a === '' || (Array.isArray(a) && !a.length));

  function settleQuestion(i, mode) {
    const rt = PortalState.runningTest;
    if (!rt) return;
    const has = hasAnswer(rt.answers[i]);
    const old = rt.questionStatus[i];
    const wasMarked = old === 'v' || old === 'gv';

    if (mode === 'mark') {
      rt.questionStatus[i] = 'v';
    } else if (mode === 'review') {
      rt.questionStatus[i] = has ? 'gv' : 'v';
    } else if (mode === 'passive') {
      rt.questionStatus[i] = old === 'v' ? 'v' : has ? (old === 'gv' ? 'gv' : 'g') : (wasMarked ? 'v' : 'r');
    } else {
      rt.questionStatus[i] = has ? 'g' : 'r';
    }
  }

  // 2. Active Question Screen
  function renderTestQuestionScreen(host) {
    const rt = PortalState.runningTest;
    const t = rt.test;
    const qs = t.qs || [];
    const n = qs.length;
    const curIdx = rt.currentQ;
    const q = qs[curIdx];

    const wrap = h('div', { class: 'wrap' });
    const take = h('div', { class: 'take wide' });

    // Top Bar 3-column
    const topBar = h('div', { class: 'tbar3' },
      h('b', { class: 'tb-l', text: 'Avanti Fellows' }),
      h('b', { class: 'tb-c', text: t.title }),
      h('div', { class: 'timers tb-r' },
        h('span', { class: 'qtimer', id: 'qtimer', text: `Q${curIdx + 1}  00:00` }),
        h('span', { class: 'timer', id: 'testCountdownTimer', text: '--:--' })
      )
    );

    // Left Main: Question stem, options, action bars
    const mainCol = h('div', { class: 'tmain' });

    const cleanQ = String(q.q || '').replace(/\s*\{\{figure\}\}\s*/g, ' ').trim();
    const qCard = h('div', { class: 'qcard' },
      h('div', { class: 'qhead', text: `Question ${curIdx + 1} of ${n} · ${q.tp ? (q.tp + ' · ') : ''}${q.sub || 'Mathematics'}` }),
      h('div', { class: 'stem', text: cleanQ })
    );

    if (q.f) {
      qCard.append(h('img', { class: 'fig', alt: 'Figure', src: 'data:image/svg+xml;utf8,' + encodeURIComponent(q.f.svg), width: q.f.w, height: q.f.h }));
    }

    // Options
    if (q.t === 'Numerical') {
      qCard.append(
        h('div', { class: 'fld', style: 'margin-top:12px;' },
          h('label', { class: 'lbl', text: 'Your Numerical Answer:' }),
          h('input', {
            type: 'text',
            class: 'portal-input',
            style: 'max-width:240px;',
            value: rt.answers[curIdx] || '',
            oninput: (e) => {
              rt.answers[curIdx] = e.target.value.trim();
            }
          })
        )
      );
    } else {
      const opts = q.o || [];
      const optsWrap = h('div', { style: 'display:flex;flex-direction:column;gap:10px;margin-top:10px;' });
      opts.forEach((opt, oi) => {
        const letter = 'ABCD'[oi];
        const isSelected = rt.answers[curIdx] === letter;
        optsWrap.append(
          h('label', { class: 'choice' },
            h('input', {
              type: 'radio',
              name: 'test_opt_' + curIdx,
              checked: isSelected,
              onchange: () => {
                rt.answers[curIdx] = letter;
              }
            }),
            h('b', { text: '(' + letter + ')' }),
            h('span', { class: 'ot', text: opt })
          )
        );
      });
      qCard.append(optsWrap);
    }

    // Question navigation helpers
    const goTo = (i) => {
      accrueQuestionTime();
      rt.currentQ = i;
      renderStudentView();
    };

    const passive = (i) => {
      settleQuestion(rt.currentQ, 'passive');
      goTo(i);
    };

    const nextQ = (mode) => {
      settleQuestion(rt.currentQ, mode);
      goTo((rt.currentQ + 1) % n);
    };

    // Action bar 1
    const abar = h('div', { class: 'abar' },
      h('button', {
        type: 'button',
        class: 'nb nb-g',
        text: 'SAVE & NEXT',
        onclick: () => nextQ('save')
      }),
      h('button', {
        type: 'button',
        class: 'nb nb-w',
        text: 'CLEAR',
        onclick: () => {
          delete rt.answers[curIdx];
          delete rt.questionStatus[curIdx];
          renderStudentView();
        }
      }),
      h('button', {
        type: 'button',
        class: 'nb nb-o',
        text: 'SAVE & MARK FOR REVIEW',
        onclick: () => nextQ('review')
      }),
      h('button', {
        type: 'button',
        class: 'nb nb-b',
        text: 'MARK FOR REVIEW & NEXT',
        onclick: () => nextQ('mark')
      })
    );

    // Navigation bar 2
    const nbar = h('div', { class: 'nbar' },
      h('button', {
        type: 'button',
        class: 'nb nb-w',
        disabled: curIdx === 0,
        text: '<< BACK',
        onclick: () => passive(curIdx - 1)
      }),
      h('button', {
        type: 'button',
        class: 'nb nb-w',
        disabled: curIdx === n - 1,
        text: 'NEXT >>',
        onclick: () => passive(curIdx + 1)
      })
    );

    mainCol.append(qCard, abar, nbar);

    // Right Side: Palette, Legend, and Submit Button
    const sideCol = h('aside', { class: 'tside' });
    const sideCard = h('div', { class: 'card' });

    // Status counts
    const countStatus = (k) => qs.filter((_, i) => (rt.questionStatus[i] || '') === k).length;

    // Palette legend
    const legend = h('div', { class: 'plegend' },
      h('div', { class: 'lgi' }, h('i', { class: 'ps', text: String(countStatus('')) }), h('span', { text: 'Not Visited' })),
      h('div', { class: 'lgi' }, h('i', { class: 'ps r', text: String(countStatus('r')) }), h('span', { text: 'Not Answered' })),
      h('div', { class: 'lgi' }, h('i', { class: 'ps g', text: String(countStatus('g')) }), h('span', { text: 'Answered' })),
      h('div', { class: 'lgi' }, h('i', { class: 'ps v', text: String(countStatus('v')) }), h('span', { text: 'Marked for Review' })),
      h('div', { class: 'lgi wide' },
        h('i', { class: 'ps gv', text: String(countStatus('gv')) }),
        h('span', null, 'Answered & Marked for Review ', h('small', { style: 'color:#64748b;display:block;', text: '(considered for evaluation)' }))
      )
    );

    // Question button grid
    const paletteGrid = h('div', { class: 'palette' },
      qs.map((_, i) => {
        const st = rt.questionStatus[i] || '';
        const isCur = i === curIdx;
        return h('button', {
          type: 'button',
          class: `ps ${st}${isCur ? ' cur' : ''}`,
          text: String(i + 1),
          onclick: () => passive(i)
        });
      })
    );

    // Submit test section
    const subGap = h('div', { class: 'subgap' },
      h('button', {
        type: 'button',
        class: 'btn danger',
        text: 'Submit test',
        onclick: () => renderSubmitConfirmation()
      })
    );

    sideCard.append(legend, h('div', { class: 'psub', style: 'margin-top:14px;', text: 'Questions Palette' }), paletteGrid, subGap);
    sideCol.append(sideCard);

    // Overall layout
    const layout = h('div', { class: 'tlay' }, mainCol, sideCol);
    take.append(topBar, layout);
    wrap.append(take);
    host.append(wrap);

    math(host);
    testTick();
  }

  // Submit confirmation modal
  function renderSubmitConfirmation() {
    const rt = PortalState.runningTest;
    const qs = rt.test.qs || [];
    const un = qs.filter((_, i) => !hasAnswer(rt.answers[i]) || rt.questionStatus[i] === 'v').length;

    const old = document.querySelector('.confirm-dialog-overlay');
    if (old) old.remove();

    const overlay = h('div', {
      class: 'confirm-dialog-overlay portal-modal-overlay',
      onclick: (e) => { if (e.target === overlay) overlay.remove(); }
    });

    const box = h('div', { class: 'portal-modal-card', style: 'max-width:480px;text-align:center;' },
      h('h3', { text: un ? `⚠️ ${un} of ${qs.length} questions are unanswered` : '✓ All questions are answered!' }),
      h('p', {
        style: 'color:#64748b;margin:8px 0 16px;',
        text: 'After submitting, you cannot change your answers. Your final score and response breakdown will be saved.'
      }),
      h('div', { style: 'display:flex;gap:12px;justify-content:center;' },
        h('button', {
          type: 'button',
          class: 'btn danger',
          style: 'width:auto;padding:10px 24px;',
          text: 'Confirm & Submit Now',
          onclick: () => {
            overlay.remove();
            finishTest(false);
          }
        }),
        h('button', {
          type: 'button',
          class: 'btn',
          style: 'width:auto;padding:10px 20px;',
          text: 'Keep Working',
          onclick: () => overlay.remove()
        })
      )
    );

    overlay.append(box);
    document.body.append(overlay);
  }

  // 3. Finalize and Submit Test
  async function finishTest(auto) {
    const rt = PortalState.runningTest;
    if (!rt || rt.state === 'result') return;

    accrueQuestionTime();
    stopTestTimer();

    // Exit fullscreen & remove watermark
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
    removeWatermark();
    const fsOver = document.getElementById('fsOver');
    if (fsOver) fsOver.remove();

    // Calculate score
    const t = rt.test;
    const qs = t.qs || [];
    const pos = t.pos || 4;
    const neg = t.neg || 1;

    let score = 0;
    let ok = 0;
    let no = 0;
    let skip = 0;

    const rows = qs.map((q, i) => {
      const given = rt.answers[i];
      const isMarkedOnly = rt.questionStatus[i] === 'v' && !hasAnswer(given);
      const isSkipped = !hasAnswer(given) || isMarkedOnly;

      let st = 'skip';
      let m = 0;

      if (!isSkipped) {
        if (q.t === 'Numerical') {
          if (String(given).trim() === String(q.a).trim()) {
            st = 'ok';
            m = pos;
            ok++;
          } else {
            st = 'no';
            m = 0; // numerical usually has no negative
            no++;
          }
        } else {
          if (String(given).trim().toUpperCase() === String(q.a).trim().toUpperCase()) {
            st = 'ok';
            m = pos;
            ok++;
          } else {
            st = 'no';
            m = -neg;
            no++;
          }
        }
      } else {
        skip++;
      }

      score += m;

      return {
        qIndex: i + 1,
        q: q,
        a: given || '',
        st: st,
        m: m,
        t: Math.round(rt.questionTimes[i] || 0)
      };
    });

    const max = qs.length * pos;
    const totalSecs = Math.round((Math.min(Date.now(), rt.endsAt) - rt.startedAt) / 1000);

    const submissionPayload = {
      id: 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      testId: t.id,
      testTitle: t.title,
      studentId: PortalState.studentAuth.avantiId,
      studentName: PortalState.studentAuth.name,
      stream: PortalState.studentAuth.stream,
      submittedAt: new Date().toISOString(),
      score: score,
      max: max,
      ok: ok,
      no: no,
      skip: skip,
      secs: totalSecs,
      sw: rt.switches || 0,
      sa: Math.round(rt.awaySeconds || 0),
      ps: rt.printScreenHits || 0,
      rows: rows
    };

    rt.result = submissionPayload;
    rt.state = 'result';

    // Store in local list
    PortalState.submissions.unshift(submissionPayload);

    // Save to server
    try {
      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionPayload)
      });
    } catch (e) {
      console.warn('Could not post submission to /api/submissions:', e);
    }

    renderStudentView();
    if (auto) {
      toast('Time up! Your test has been automatically submitted.');
    } else {
      toast('Test submitted successfully!');
    }
  }

  // 4. Result & Analysis Screen
  function renderTestResultScreen(host) {
    const rt = PortalState.runningTest;
    const res = rt.result;
    const pct = Math.round((res.score / res.max) * 100);

    const wrap = h('div', { class: 'wrap', style: 'padding:24px 16px;' },
      h('div', { class: 'card', style: 'max-width:850px;margin:0 auto;' },
        h('div', { style: 'text-align:center;border-bottom:1px solid #d7dfe3;padding-bottom:18px;' },
          h('span', { class: 'stream-badge jee', text: 'Test Completed' }),
          h('h2', { style: 'margin:8px 0 4px;font-size:26px;', text: res.testTitle }),
          h('p', { style: 'color:#64748b;margin:0;', text: `${res.studentName} · Avanti ID: ${res.studentId} · Batch: ${PortalState.batchName}` })
        ),
        h('div', { class: 'portal-metrics-grid', style: 'margin:20px 0;' },
          h('div', { class: 'portal-metric-card', style: 'text-align:center;' },
            h('span', { text: 'Your Score' }),
            h('b', { style: pct >= 50 ? 'color:#15803d;' : 'color:#dc2626;', text: `${res.score} / ${res.max}` }),
            h('small', { text: pct + '% Overall' })
          ),
          h('div', { class: 'portal-metric-card', style: 'text-align:center;' },
            h('span', { text: 'Accuracy' }),
            h('b', { style: 'color:#2563eb;', text: `${res.ok} / ${(res.ok + res.no) || 1}` }),
            h('small', { text: `${res.ok} Correct · ${res.no} Wrong · ${res.skip} Skipped` })
          ),
          h('div', { class: 'portal-metric-card', style: 'text-align:center;' },
            h('span', { text: 'Time Spent' }),
            h('b', { text: `${Math.floor(res.secs / 60)}m ${res.secs % 60}s` }),
            h('small', { text: `Avg ${Math.round(res.secs / (res.rows.length || 1))}s / Q` })
          ),
          h('div', { class: 'portal-metric-card', style: 'text-align:center;' },
            h('span', { text: 'Anti-Cheat Monitor' }),
            h('b', { style: res.sw > 0 ? 'color:#dc2626;' : 'color:#15803d;', text: `${res.sw} leaves` }),
            h('small', { text: `${Math.round(res.sa)}s away · ${res.ps} flags` })
          )
        ),
        h('h3', { style: 'margin:20px 0 12px;', text: 'Question-by-Question Solution & Review' }),
        h('div', { style: 'display:flex;flex-direction:column;gap:12px;' },
          res.rows.map(r => {
            const isOk = r.st === 'ok';
            const isNo = r.st === 'no';
            return h('div', {
              style: 'border:1px solid ' + (isOk ? '#bbf7d0' : isNo ? '#fecaca' : '#e2e8f0') + ';background:' + (isOk ? '#f0fdf4' : isNo ? '#fef2f2' : '#ffffff') + ';border-radius:10px;padding:16px;'
            },
              h('div', { style: 'display:flex;justify-content:space-between;margin-bottom:6px;' },
                h('b', { text: `Q${r.qIndex}. ${r.q.sub || ''}` }),
                h('span', {
                  style: 'font-weight:700;' + (isOk ? 'color:#15803d;' : isNo ? 'color:#b91c1c;' : 'color:#64748b;'),
                  text: isOk ? `✓ Correct (+${r.m})` : isNo ? `✗ Wrong (${r.m})` : '– Skipped (0)'
                })
              ),
              h('div', { style: 'font-size:15px;margin-bottom:8px;', html: r.q.q }),
              r.q.o ? h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;margin-bottom:8px;' },
                r.q.o.map((o, oi) => {
                  const L = 'ABCD'[oi];
                  const wasChosen = r.a === L;
                  const isCorrect = r.q.a === L;
                  return h('div', {
                    style: 'padding:4px 8px;border-radius:4px;border:1px solid ' + (isCorrect ? '#86efac' : wasChosen ? '#fca5a5' : '#e2e8f0') + ';background:' + (isCorrect ? '#dcfce7' : wasChosen ? '#fee2e2' : '#f8fafc') + ';'
                  },
                    h('b', { text: '(' + L + ') ' }),
                    h('span', { html: o }),
                    isCorrect ? h('b', { style: 'color:#15803d;margin-left:4px;', text: '✓' }) : null,
                    wasChosen && !isCorrect ? h('b', { style: 'color:#b91c1c;margin-left:4px;', text: '✗ (Your answer)' }) : null
                  );
                })
              ) : null,
              h('div', { style: 'font-size:12.5px;color:#64748b;display:flex;gap:12px;' },
                h('span', null, 'Time spent: ', h('b', { text: `${r.t}s` })),
                h('span', null, 'Correct key: ', h('b', { style: 'color:#15803d;', text: r.q.a }))
              )
            );
          })
        ),
        h('div', { style: 'margin-top:24px;text-align:center;' },
          h('button', {
            type: 'button',
            class: 'btn pri',
            style: 'padding:10px 24px;font-weight:700;',
            onclick: () => {
              PortalState.runningTest = null;
              renderStudentView();
            }
          }, 'Back to Student Dashboard')
        )
      )
    );

    host.append(wrap);
    math(host);
  }

  // ==========================================
  // INITIALIZATION & TAB HOOKS
  // ==========================================
  async function init() {
    await loadInitialData();
  }

  window.PortalApp = {
    init,
    renderTeacherView,
    renderStudentView,
    getState: () => PortalState
  };

  // Run initial data load
  init();
})();
