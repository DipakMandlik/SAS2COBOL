/**
 * SAS2COBOL — Live Observability HTTP & SSE Server
 * Zero-dependency, ultra-lightweight server using Node.js standard library.
 * Serves the Apple-style Live UI and streams real-time events over SSE.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const eventBus = require('./event-bus');
const fsWatcher = require('./fs-watcher');

const PORT = parseInt(process.env.OBSERVER_PORT || '3210', 10);
const UI_PATH = path.join(__dirname, 'ui/index.html');

function startServer(port = PORT) {
  // Start filesystem watcher
  fsWatcher.startWatching();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // CORS headers for flexibility
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Serve HTML UI
    if (url.pathname === '/' || url.pathname === '/index.html') {
      if (fs.existsSync(UI_PATH)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(UI_PATH).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('UI file not found.');
      }
      return;
    }

    // Server-Sent Events (SSE) stream
    if (url.pathname === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      });
      res.write(': connected\n\n');
      eventBus.registerSseClient(res);
      return;
    }

    // API: Snapshot
    if (url.pathname === '/api/snapshot') {
      const runId = url.searchParams.get('runId') || undefined;
      const snapshot = eventBus.getSnapshot(runId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(snapshot));
      return;
    }

    // API: Event list
    if (url.pathname === '/api/events') {
      const runId = url.searchParams.get('runId') || undefined;
      const events = eventBus.getEvents(runId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(events));
      return;
    }

    // API: Gate verification output
    if (url.pathname.startsWith('/api/gate/')) {
      const phaseStr = url.pathname.replace('/api/gate/', '');
      const phaseNum = parseInt(phaseStr, 10) || 1;
      // Fetch gate validation if available
      try {
        const { execSync } = require('child_process');
        const output = execSync(`node .claude/hooks/gate-validator.js --phase ${phaseNum}`, {
          encoding: 'utf8',
          cwd: path.resolve(__dirname, '..'),
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, output }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, output: err.stdout || err.message }));
      }
      return;
    }

    // API: Post event manually
    if (url.pathname === '/api/event' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const payload = JSON.parse(body);
          const ev = eventBus.emitEvent(payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, event: ev }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      fsWatcher.stopWatching();
      console.log(`[Observer] SAS2COBOL Live Observer is already active on port ${port}. Connecting to existing server.`);
      process.exit(0);
    } else {
      console.error('[Observer] Server error:', err);
    }
  });

  server.listen(port, () => {
    const runId = eventBus.getActiveRunId();
    console.log(`=======================================================`);
    console.log(` SAS2COBOL LIVE ORCHESTRATION OBSERVER`);
    console.log(` URL:     http://localhost:${port}`);
    console.log(` Run ID:  ${runId}`);
    console.log(` Status:  Listening for real Claude Code events & artifacts`);
    console.log(`=======================================================`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
