#!/usr/bin/env node

/**
 * Auto-start service for Windsurf Local CI/CD Pipeline
 * Automatically starts the file watcher when the project opens
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AutoStartService {
  constructor() {
    this.watcherProcess = null;
    this.isRunning = false;
    this.projectRoot = path.resolve(__dirname, '..');
    this.lockFile = path.join(__dirname, '.pipeline.lock');
  }

  async start() {
    console.log('🎯 Windsurf Auto-Start Service initializing...');
    
    // Check if already running
    if (this.isAlreadyRunning()) {
      console.log('⚠️ Pipeline already running, skipping auto-start');
      return;
    }

    // Start the file watcher
    await this.startWatcher();
    
    // Create lock file
    this.createLockFile();
    
    // Setup cleanup handlers
    this.setupCleanupHandlers();
  }

  isAlreadyRunning() {
    return fs.existsSync(this.lockFile);
  }

  async startWatcher() {
    console.log('🚀 Starting local pipeline file watcher...');
    
    const watcherScript = path.join(__dirname, 'file-watcher.js');
    
    this.watcherProcess = spawn('node', [watcherScript], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    this.watcherProcess.stdout.on('data', (data) => {
      process.stdout.write(`[WATCHER] ${data}`);
    });

    this.watcherProcess.stderr.on('data', (data) => {
      process.stderr.write(`[WATCHER ERROR] ${data}`);
    });

    this.watcherProcess.on('close', (code) => {
      console.log(`🛑 File watcher exited with code ${code}`);
      this.cleanup();
    });

    this.watcherProcess.on('error', (error) => {
      console.error('❌ Failed to start file watcher:', error.message);
      this.cleanup();
    });

    this.isRunning = true;
    console.log('✅ Auto-start service ready - Pipeline will run automatically on file changes');
  }

  createLockFile() {
    const lockData = {
      pid: process.pid,
      watcherPid: this.watcherProcess?.pid,
      startTime: new Date().toISOString(),
      projectRoot: this.projectRoot
    };
    
    fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
  }

  cleanup() {
    console.log('🧹 Cleaning up auto-start service...');
    
    if (this.watcherProcess && !this.watcherProcess.killed) {
      this.watcherProcess.kill('SIGTERM');
    }
    
    if (fs.existsSync(this.lockFile)) {
      fs.unlinkSync(this.lockFile);
    }
    
    this.isRunning = false;
  }

  setupCleanupHandlers() {
    // Handle various exit scenarios
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down...');
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      this.cleanup();
      process.exit(0);
    });

    process.on('exit', () => {
      this.cleanup();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught exception:', error);
      this.cleanup();
      process.exit(1);
    });
  }
}

// Auto-start if this script is run directly
if (require.main === module) {
  const service = new AutoStartService();
  service.start().catch(error => {
    console.error('❌ Failed to start auto-service:', error);
    process.exit(1);
  });
}

module.exports = AutoStartService;
