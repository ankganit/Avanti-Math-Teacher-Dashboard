import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support large HTML uploads (up to 50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API endpoint to save uploaded HTML directly into the project directory
  app.post('/api/save-html', (req, res) => {
    try {
      const { html, fileName } = req.body;
      if (!html) {
        return res.status(400).json({ error: 'No HTML content provided' });
      }

      const targetPath = path.resolve(process.cwd(), 'uploaded_dashboard.html');
      fs.writeFileSync(targetPath, html, 'utf-8');

      console.log(`Successfully saved ${targetPath} (${html.length} characters)`);
      return res.json({
        success: true,
        message: 'File saved to workspace as uploaded_dashboard.html',
        bytes: html.length,
        fileName: fileName || 'uploaded_dashboard.html',
      });
    } catch (err: any) {
      console.error('Error saving uploaded HTML:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Serve the dashboard
  app.get('/dashboard', (_req, res) => {
    const targetPath = path.resolve(process.cwd(), 'index.html');
    if (fs.existsSync(targetPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(targetPath);
    }
    return res.status(404).send('Dashboard not found');
  });

  // API endpoint to check if uploaded_dashboard.html exists
  app.get('/api/get-html', (_req, res) => {
    const targetPath = path.resolve(process.cwd(), 'uploaded_dashboard.html');
    if (fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, 'utf-8');
      return res.json({ exists: true, content, size: content.length });
    }
    return res.json({ exists: false });
  });

  // ========== Teacher & Student Portal APIs ==========
  const STUDENTS_CSV_FILE_11 = path.resolve(process.cwd(), 'public/assets/aistudio/For_Gemini_36953960');
  const STUDENTS_CSV_FILE_12 = path.resolve(process.cwd(), 'public/assets/aistudio/For_Gemini_4ab96fc9');
  const PUBLISHED_TESTS_FILE = path.resolve(process.cwd(), '.published_tests.json');
  const SUBMISSIONS_FILE = path.resolve(process.cwd(), '.test_submissions.json');

  interface StudentRecord {
    sNo: number;
    avantiId: string;
    name: string;
    dob: string;
    gender: string;
    stream: string;
    email: string;
    batch: string;
    class: '11' | '12';
  }

  interface BatchInfo {
    id: string;
    name: string;
    class: '11' | '12';
    count: number;
  }

  function getStudents(): { batch: string; batches: BatchInfo[]; students: StudentRecord[] } {
    const batch11Name = 'Class XI · JNV Dakshina Kannada Class XI Nodal (Sec-A)';
    const batch12Name = 'Class XII · CLASS XII (JEE/NEET/KCET) 2026-27';
    const students: StudentRecord[] = [];

    // 1. Parse Class 11 CSV
    try {
      if (fs.existsSync(STUDENTS_CSV_FILE_11)) {
        const raw = fs.readFileSync(STUDENTS_CSV_FILE_11, 'utf-8');
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        let headerPassed = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('S. No.') && line.includes('Avanti ID')) {
            headerPassed = true;
            continue;
          }
          if (!headerPassed) continue;
          const parts = line.split(',');
          if (parts.length >= 6) {
            students.push({
              sNo: parseInt(parts[0], 10) || (students.length + 1),
              avantiId: (parts[1] || '').trim(),
              name: (parts[2] || '').trim(),
              dob: (parts[3] || '').trim(),
              gender: (parts[4] || '').trim(),
              stream: (parts[5] || 'JEE').trim().toUpperCase(),
              email: (parts[6] || '').trim(),
              batch: batch11Name,
              class: '11'
            });
          }
        }
      }
    } catch (e) {
      console.error('Error parsing Class 11 students CSV:', e);
    }

    // 2. Parse Class 12 CSV
    try {
      if (fs.existsSync(STUDENTS_CSV_FILE_12)) {
        const raw = fs.readFileSync(STUDENTS_CSV_FILE_12, 'utf-8');
        const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        let headerPassed = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('Rank') && line.includes('AFID')) {
            headerPassed = true;
            continue;
          }
          if (!headerPassed) continue;
          const parts = line.split(',');
          if (parts.length >= 5) {
            students.push({
              sNo: parseInt(parts[0], 10) || (students.length + 1),
              name: (parts[1] || '').trim(),
              avantiId: (parts[2] || '').trim(),
              dob: (parts[3] || '').trim(),
              stream: (parts[4] || 'JEE').trim().toUpperCase(),
              gender: (parts[5] || '').trim(),
              email: '',
              batch: batch12Name,
              class: '12'
            });
          }
        }
      }
    } catch (e) {
      console.error('Error parsing Class 12 students CSV:', e);
    }

    const c11Count = students.filter(s => s.class === '11').length;
    const c12Count = students.filter(s => s.class === '12').length;

    const batches: BatchInfo[] = [
      { id: 'batch_11', name: batch11Name, class: '11', count: c11Count },
      { id: 'batch_12', name: batch12Name, class: '12', count: c12Count }
    ];

    return {
      batch: batch11Name,
      batches,
      students
    };
  }

  function loadPublishedTests(): any[] {
    try {
      if (fs.existsSync(PUBLISHED_TESTS_FILE)) {
        return JSON.parse(fs.readFileSync(PUBLISHED_TESTS_FILE, 'utf-8'));
      }
    } catch (e) {
      console.warn('Error reading tests file, initializing empty:', e);
    }
    return [];
  }

  function savePublishedTests(tests: any[]): void {
    try {
      fs.writeFileSync(PUBLISHED_TESTS_FILE, JSON.stringify(tests, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving published tests:', e);
    }
  }

  function loadSubmissions(): any[] {
    try {
      if (fs.existsSync(SUBMISSIONS_FILE)) {
        return JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf-8'));
      }
    } catch (e) {
      console.warn('Error reading submissions file:', e);
    }
    return [];
  }

  function saveSubmissions(subs: any[]): void {
    try {
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving submissions:', e);
    }
  }

  // GET /api/students
  app.get('/api/students', (_req, res) => {
    const data = getStudents();
    return res.json({ success: true, ...data });
  });

  // GET /api/batches
  app.get('/api/batches', (_req, res) => {
    const data = getStudents();
    return res.json({ success: true, batches: data.batches });
  });

  // GET /api/tests
  app.get('/api/tests', (_req, res) => {
    const tests = loadPublishedTests();
    return res.json({ success: true, tests });
  });

  // POST /api/tests
  app.post('/api/tests', (req, res) => {
    try {
      const newTest = req.body;
      if (!newTest || !newTest.title) {
        return res.status(400).json({ error: 'Test title is required' });
      }
      const tests = loadPublishedTests();
      if (!newTest.id) {
        newTest.id = 'test_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      }
      if (!newTest.createdAt) {
        newTest.createdAt = new Date().toISOString();
      }
      newTest.status = newTest.status || 'active';
      tests.unshift(newTest);
      savePublishedTests(tests);
      return res.json({ success: true, test: newTest });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/tests/:id
  app.delete('/api/tests/:id', (req, res) => {
    try {
      const { id } = req.params;
      const tests = loadPublishedTests();
      const filtered = tests.filter(t => t.id !== id && t.code !== id);
      savePublishedTests(filtered);
      return res.json({ success: true, remaining: filtered.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET /api/submissions
  app.get('/api/submissions', (req, res) => {
    const { testId, studentId } = req.query;
    let subs = loadSubmissions();
    if (testId) subs = subs.filter(s => s.testId === testId);
    if (studentId) subs = subs.filter(s => s.studentId === studentId);
    return res.json({ success: true, submissions: subs });
  });

  // POST /api/submissions
  app.post('/api/submissions', (req, res) => {
    try {
      const sub = req.body;
      if (!sub || !sub.testId || !sub.studentId) {
        return res.status(400).json({ error: 'testId and studentId are required' });
      }
      sub.id = sub.id || 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      sub.submittedAt = sub.submittedAt || new Date().toISOString();
      const subs = loadSubmissions();
      // Replace existing submission if same student and same test, or add new
      const idx = subs.findIndex(s => s.testId === sub.testId && s.studentId === sub.studentId);
      if (idx >= 0) {
        subs[idx] = sub;
      } else {
        subs.unshift(sub);
      }
      saveSubmissions(subs);
      return res.json({ success: true, submission: sub });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Persistent Usage Tracker Store
  const USAGE_FILE = path.resolve(process.cwd(), '.usage_tracker.json');

  interface UsageStore {
    minuteTimestamp: number;
    hourTimestamp: number;
    dayKey: string;
    minuteLimit: number;
    minuteUsed: number;
    hourLimit: number;
    hourUsed: number;
    dayLimit: number;
    dayUsed: number;
    model: string;
    user: string;
    lastUpdated: string;
  }

  function getNowDayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function loadUsageStore(): UsageStore {
    const defaultStore: UsageStore = {
      minuteTimestamp: Math.floor(Date.now() / 60000),
      hourTimestamp: Math.floor(Date.now() / 3600000),
      dayKey: getNowDayKey(),
      minuteLimit: 1000000,
      minuteUsed: 125000,
      hourLimit: 15000000,
      hourUsed: 2600000,
      dayLimit: 40000000,
      dayUsed: 8900000,
      model: 'gemini-3.8-flash',
      user: 'ank.pcm@gmail.com',
      lastUpdated: new Date().toISOString(),
    };

    try {
      if (fs.existsSync(USAGE_FILE)) {
        const raw = fs.readFileSync(USAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...defaultStore, ...parsed };
      }
    } catch (e) {
      console.warn('Could not read usage store, using defaults:', e);
    }
    return defaultStore;
  }

  function saveUsageStore(store: UsageStore): void {
    try {
      store.lastUpdated = new Date().toISOString();
      fs.writeFileSync(USAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save usage store:', e);
    }
  }

  function syncWindows(store: UsageStore): void {
    const currentMin = Math.floor(Date.now() / 60000);
    const currentHr = Math.floor(Date.now() / 3600000);
    const currentDay = getNowDayKey();

    if (store.minuteTimestamp !== currentMin) {
      store.minuteTimestamp = currentMin;
      store.minuteUsed = 0;
    }
    if (store.hourTimestamp !== currentHr) {
      store.hourTimestamp = currentHr;
      store.hourUsed = 0;
    }
    if (store.dayKey !== currentDay) {
      store.dayKey = currentDay;
      store.dayUsed = 0;
    }
  }

  // GET /api/usage - Fetch current token consumption and remaining percentage
  app.get('/api/usage', (_req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const store = loadUsageStore();
      syncWindows(store);
      saveUsageStore(store);

      const now = new Date();
      const nowSec = Math.floor(Date.now() / 1000);

      const resetMinSec = 60 - (nowSec % 60);
      const resetHrSec = 3600 - (nowSec % 3600);

      // Day reset seconds to midnight UTC
      const tomorrowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const resetDaySec = Math.max(0, Math.floor((tomorrowUtc.getTime() - now.getTime()) / 1000));

      const minLeftTokens = Math.max(0, store.minuteLimit - store.minuteUsed);
      const hrLeftTokens = Math.max(0, store.hourLimit - store.hourUsed);
      const dayLeftTokens = Math.max(0, store.dayLimit - store.dayUsed);

      const tokensLeftMinPercentage = Math.round((minLeftTokens / store.minuteLimit) * 1000) / 10;
      const tokensLeftHourPercentage = Math.round((hrLeftTokens / store.hourLimit) * 1000) / 10;
      const tokensLeftDayPercentage = Math.round((dayLeftTokens / store.dayLimit) * 1000) / 10;
      const currentConsumptionPercentage = Math.round((store.dayUsed / store.dayLimit) * 1000) / 10;

      return res.json({
        success: true,
        user: store.user,
        model: store.model,
        isOwnerOnly: true,
        currentConsumptionPercentage,
        tokensLeftMinPercentage,
        tokensLeftHourPercentage,
        tokensLeftDayPercentage,
        minute: {
          limit: store.minuteLimit,
          used: store.minuteUsed,
          remaining: minLeftTokens,
          percentLeft: tokensLeftMinPercentage,
          percentConsumed: Math.round((store.minuteUsed / store.minuteLimit) * 1000) / 10,
          resetSeconds: resetMinSec,
        },
        hour: {
          limit: store.hourLimit,
          used: store.hourUsed,
          remaining: hrLeftTokens,
          percentLeft: tokensLeftHourPercentage,
          percentConsumed: Math.round((store.hourUsed / store.hourLimit) * 1000) / 10,
          resetSeconds: resetHrSec,
        },
        day: {
          limit: store.dayLimit,
          used: store.dayUsed,
          remaining: dayLeftTokens,
          percentLeft: tokensLeftDayPercentage,
          percentConsumed: currentConsumptionPercentage,
          resetSeconds: resetDaySec,
        },
        lastUpdated: store.lastUpdated,
      });
    } catch (err: any) {
      console.error('Error in /api/usage:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/usage/record - Record token consumption
  app.post('/api/usage/record', (req, res) => {
    try {
      const { tokens } = req.body;
      const count = Number(tokens) || 0;
      if (count <= 0) return res.status(400).json({ error: 'Tokens count must be positive' });

      const store = loadUsageStore();
      syncWindows(store);

      store.minuteUsed += count;
      store.hourUsed += count;
      store.dayUsed += count;

      saveUsageStore(store);

      return res.json({ success: true, added: count, dayUsed: store.dayUsed });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST /api/usage/calibrate - Calibrate consumption percentage
  app.post('/api/usage/calibrate', (req, res) => {
    try {
      const { consumedPercentage, remainingPercentage, dayLimit, minuteLimit, hourLimit, dayUsed } = req.body;
      const store = loadUsageStore();
      syncWindows(store);

      if (dayLimit && Number(dayLimit) > 0) store.dayLimit = Number(dayLimit);
      if (minuteLimit && Number(minuteLimit) > 0) store.minuteLimit = Number(minuteLimit);
      if (hourLimit && Number(hourLimit) > 0) store.hourLimit = Number(hourLimit);

      if (dayUsed != null && !isNaN(Number(dayUsed))) {
        store.dayUsed = Math.max(0, Math.min(store.dayLimit, Number(dayUsed)));
      } else if (consumedPercentage != null && !isNaN(Number(consumedPercentage))) {
        const pct = Math.max(0, Math.min(100, Number(consumedPercentage)));
        store.dayUsed = Math.round((store.dayLimit * pct) / 100);
      } else if (remainingPercentage != null && !isNaN(Number(remainingPercentage))) {
        const rem = Math.max(0, Math.min(100, Number(remainingPercentage)));
        const pct = 100 - rem;
        store.dayUsed = Math.round((store.dayLimit * pct) / 100);
      }

      saveUsageStore(store);
      return res.json({ success: true, message: 'Usage calibrated', store });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
