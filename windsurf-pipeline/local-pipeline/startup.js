#!/usr/bin/env node

/**
 * Startup script that automatically starts the file watcher
 * This runs when the project is opened and starts monitoring immediately
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if already running to prevent duplicates
const lockFile = path.join(__dirname, '.pipeline.lock');

if (fs.existsSync(lockFile)) {
  console.log('⚠️ Pipeline already running, exiting...');
  process.exit(0);
}

// Start the file watcher immediately
console.log('🚀 Auto-starting Windsurf Local CI/CD Pipeline...');

const watcherScript = path.join(__dirname, 'file-watcher.js');
const watcher = spawn('node', [watcherScript], {
  cwd: __dirname,
  stdio: 'inherit',
  detached: true
});

// Create lock file
fs.writeFileSync(lockFile, JSON.stringify({
  pid: watcher.pid,
  startTime: new Date().toISOString()
}));

// Detach the process so it continues running
watcher.unref();

console.log('✅ Pipeline started automatically - monitoring /src directory');
console.log('🔥 File watcher is now running in the background');

// Clean up lock file on exit
process.on('exit', () => {
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
});
