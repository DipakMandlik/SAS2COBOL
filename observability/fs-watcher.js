/**
 * SAS2COBOL — Live Artifact Filesystem Watcher
 * Zero-dependency, passive watcher for real target migration deliverables in output/.
 * Implements strict debouncing and deduplication to prevent event spam.
 */

const fs = require('fs');
const path = require('path');
const eventBus = require('./event-bus');

const REPO_ROOT = process.env.SAS2COBOL_ROOT || path.resolve(__dirname, '..');

// Watch exclusively target output deliverables (COBOL, copybooks, JCL, SQL, manifests)
const WATCH_DIRS = [
  path.resolve(REPO_ROOT, 'output'),
];

const knownFiles = new Map();
const lastEmittedTime = new Map();
const debounceTimers = new Map();
const watchers = [];

function scanExisting() {
  for (const dir of WATCH_DIRS) {
    if (!fs.existsSync(dir)) continue;
    scanDirRecursive(dir);
  }
}

function scanDirRecursive(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'runs' || ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
        scanDirRecursive(fullPath);
      } else if (ent.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          const relPath = path.relative(REPO_ROOT, fullPath);
          knownFiles.set(relPath, stats.mtimeMs);
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

function startWatching() {
  // Prevent duplicate watchers if already running in this process
  if (watchers.length > 0) {
    return;
  }

  scanExisting();

  for (const dir of WATCH_DIRS) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {
        continue;
      }
    }

    try {
      const w = fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        if (filename.startsWith('.') || filename.includes('.git') || filename.endsWith('.tmp')) return;

        const fullPath = path.join(dir, filename);
        const relPath = path.relative(REPO_ROOT, fullPath);

        // Debounce by path (300ms) to coalesce rapid macOS FSEvents
        if (debounceTimers.has(relPath)) {
          clearTimeout(debounceTimers.get(relPath));
        }

        debounceTimers.set(relPath, setTimeout(() => {
          debounceTimers.delete(relPath);

          if (!fs.existsSync(fullPath)) return;
          try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) return;

            const now = Date.now();
            const lastEmit = lastEmittedTime.get(relPath) || 0;
            // Suppress duplicate events within 1.5 seconds
            if (now - lastEmit < 1500) {
              return;
            }

            const lastMtime = knownFiles.get(relPath);
            if (!lastMtime) {
              knownFiles.set(relPath, stat.mtimeMs);
              lastEmittedTime.set(relPath, now);
              eventBus.emitEvent({
                type: 'artifact.created',
                actor: 'File System',
                message: `Created ${relPath}`,
                metadata: { path: relPath, size: stat.size },
              });
            } else if (stat.mtimeMs > lastMtime + 1000) {
              knownFiles.set(relPath, stat.mtimeMs);
              lastEmittedTime.set(relPath, now);
              eventBus.emitEvent({
                type: 'artifact.updated',
                actor: 'File System',
                message: `Updated ${relPath}`,
                metadata: { path: relPath, size: stat.size },
              });
            }
          } catch (e) {
            // ignore temporarily locked or unreadable files
          }
        }, 300));
      });
      watchers.push(w);
    } catch (e) {
      console.error(`[Watcher] Could not watch ${dir}:`, e.message);
    }
  }
}

function stopWatching() {
  for (const w of watchers) {
    try {
      w.close();
    } catch (e) {}
  }
  watchers.length = 0;
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
}

module.exports = {
  startWatching,
  stopWatching,
  scanExisting,
};
