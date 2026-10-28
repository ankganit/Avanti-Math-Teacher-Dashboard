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

  // Serve the full math teacher dashboard directly
  app.get('/dashboard', (_req, res) => {
    let targetPath = path.resolve(process.cwd(), 'public/dashboard.html');
    if (!fs.existsSync(targetPath)) {
      targetPath = path.resolve(process.cwd(), 'uploaded_dashboard.html');
    }
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
