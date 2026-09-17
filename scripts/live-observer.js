#!/usr/bin/env node
/**
 * SAS2COBOL — Live Observability Launcher
 * Starts the ultra-lightweight observer and opens the active run.
 */

const { startServer } = require('../observability/server');
const eventBus = require('../observability/event-bus');

// Initialize run if not already active
const runId = eventBus.getActiveRunId();
startServer();
