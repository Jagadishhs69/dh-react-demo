#!/usr/bin/env node

/**
 * Local File Watcher for Windsurf CI/CD Pipeline
 * Monitors /src directory for changes and triggers local CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

class WindsurfLocalPipeline {
    constructor(config = {}) {
        this.config = {
            watchDir: config.watchDir || path.resolve(__dirname, '../src'),
            pipelineScript: config.pipelineScript || './run-pipeline.js',
            debounceMs: config.debounceMs || 5000,
            logLevel: config.logLevel || 'info',
            ...config
        };
        
        this.isRunning = false;
        this.runCount = 0;
        this.debounceTimer = null;
        this.lockFile = path.join(__dirname, '.watcher.lock');
        this.pendingFiles = new Set(); // Track pending file changes
    }

    isWatcherRunning() {
        if (!fs.existsSync(this.lockFile)) {
            return false;
        }

        try {
            const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
            const pid = lockData.pid;
            
            // Check if the process is actually running
            if (this.isProcessRunning(pid)) {
                return true;
            } else {
                // Stale lock file - remove it
                this.log('warn', `🧹 Removing stale lock file (PID ${pid} not running)`);
                this.cleanup();
                return false;
            }
        } catch (error) {
            // Corrupted lock file - remove it
            this.log('warn', '🧹 Removing corrupted lock file');
            this.cleanup();
            return false;
        }
    }

    isProcessRunning(pid) {
        try {
            // On Windows, use tasklist to check if process exists
            if (process.platform === 'win32') {
                const { execSync } = require('child_process');
                const result = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
                return result.includes(pid.toString());
            } else {
                // On Unix-like systems, use kill signal 0 to check process existence
                process.kill(pid, 0);
                return true;
            }
        } catch (error) {
            return false;
        }
    }

    createLockFile() {
        const lockData = {
            pid: process.pid,
            startTime: new Date().toISOString(),
            watchDir: this.config.watchDir
        };
        fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
    }

    cleanup() {
        // Clear health check interval
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        // Remove lock file
        if (fs.existsSync(this.lockFile)) {
            fs.unlinkSync(this.lockFile);
            this.log('info', '🧹 Lock file cleaned up');
        }
    }

    setupCleanupHandlers() {
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.log('info', '🛑 Shutting down file watcher...');
            this.cleanup();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            this.log('info', '🛑 Terminating file watcher...');
            this.cleanup();
            process.exit(0);
        });

        process.on('exit', () => {
            this.cleanup();
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.log('error', '💥 Uncaught exception:', error.message);
            this.cleanup();
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.log('error', '💥 Unhandled rejection:', reason);
            this.cleanup();
            process.exit(1);
        });

        // Windows-specific cleanup
        if (process.platform === 'win32') {
            require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            }).on('SIGINT', () => {
                this.cleanup();
                process.exit(0);
            });
        }
    }

    startHealthCheck() {
        // Periodic health check to update lock file timestamp
        this.healthCheckInterval = setInterval(() => {
            try {
                if (fs.existsSync(this.lockFile)) {
                    const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
                    lockData.lastHeartbeat = new Date().toISOString();
                    fs.writeFileSync(this.lockFile, JSON.stringify(lockData, null, 2));
                }
            } catch (error) {
                this.log('warn', '⚠️ Health check failed:', error.message);
            }
        }, 30000); // Update every 30 seconds
    }

    log(level, message, ...args) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const currentLevel = levels[this.config.logLevel] || 2;
        
        if (levels[level] <= currentLevel) {
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
            console.log(prefix, message, ...args);
        }
    }

    async checkDependencies() {
        this.log('info', '🔍 Checking dependencies...');
        
        // Check if chokidar is available
        try {
            require.resolve('chokidar');
        } catch (error) {
            this.log('error', '❌ chokidar not found. Installing...');
            await this.installDependency('chokidar');
        }
    }

    async installDependency(packageName) {
        return new Promise((resolve, reject) => {
            const npm = spawn('npm', ['install', packageName], { stdio: 'inherit' });
            npm.on('close', (code) => {
                if (code === 0) {
                    this.log('info', `✅ ${packageName} installed successfully`);
                    resolve();
                } else {
                    reject(new Error(`Failed to install ${packageName}`));
                }
            });
        });
    }

    async triggerPipeline(changedFiles = []) {
        if (this.isRunning) {
            this.log('warn', '⚠️ Pipeline already running, skipping trigger');
            return;
        }

        this.isRunning = true;
        this.runCount++;
        
        this.log('info', `🚀 Triggering pipeline run #${this.runCount}`);
        this.log('info', `📁 Changed files: ${changedFiles.join(', ')}`);

        try {
            const startTime = Date.now();
            
            // Run the pipeline script
            await this.runPipelineScript(changedFiles);
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.log('info', `✅ Pipeline completed in ${duration}s`);
            
        } catch (error) {
            this.log('error', '❌ Pipeline failed:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    async runPipelineScript(changedFiles) {
        return new Promise((resolve, reject) => {
            const args = ['--changed-files', JSON.stringify(changedFiles)];
            const pipeline = spawn('node', [this.config.pipelineScript, ...args], {
                stdio: 'inherit',
                cwd: process.cwd()
            });

            pipeline.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Pipeline exited with code ${code}`));
                }
            });

            pipeline.on('error', (error) => {
                reject(error);
            });
        });
    }

    debouncedTrigger(changedFiles) {
        // Add files to pending set
        changedFiles.forEach(file => this.pendingFiles.add(file));
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            const allChangedFiles = Array.from(this.pendingFiles);
            this.pendingFiles.clear();
            this.triggerPipeline(allChangedFiles);
        }, this.config.debounceMs);
    }

    async start() {
        // Check if another watcher is already running
        if (this.isWatcherRunning()) {
            this.log('warn', '⚠️ Another file watcher is already running. Exiting to prevent duplicates.');
            process.exit(0);
        }
        
        this.createLockFile();
        this.setupCleanupHandlers();
        this.startHealthCheck();
        
        this.log('info', '🎯 Starting Windsurf Local CI/CD Pipeline...');
        
        // Check dependencies
        await this.checkDependencies();

        // Verify watch directory exists
        if (!fs.existsSync(this.config.watchDir)) {
            this.log('warn', `📁 Watch directory ${this.config.watchDir} does not exist, creating...`);
            fs.mkdirSync(this.config.watchDir, { recursive: true });
        }

        // Verify pipeline script exists
        if (!fs.existsSync(this.config.pipelineScript)) {
            this.log('error', `❌ Pipeline script ${this.config.pipelineScript} not found`);
            process.exit(1);
        }

        this.log('info', `👀 Watching directory: ${path.resolve(this.config.watchDir)}`);
        this.log('info', `⚙️ Pipeline script: ${path.resolve(this.config.pipelineScript)}`);
        this.log('info', `⏱️ Debounce delay: ${this.config.debounceMs}ms`);

        // Set up file watcher with more restrictive options
        const watcher = chokidar.watch(this.config.watchDir, {
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/.vscode/**',
                '**/coverage/**',
                '**/*.log'
            ],
            persistent: true,
            ignoreInitial: true
        });

        let changedFiles = [];

        watcher.on('add', (filePath) => {
            this.log('debug', `📄 File added: ${filePath}`);
            changedFiles.push(filePath);
            this.debouncedTrigger([...changedFiles]);
        });

        watcher.on('change', (filePath) => {
            // Skip if pipeline is already running
            if (this.isRunning) {
                this.log('debug', `⏭️ Skipping change for ${path.relative(this.config.watchDir, filePath)} - pipeline running`);
                return;
            }
            
            this.log('info', `📝 File changed: ${path.relative(this.config.watchDir, filePath)}`);
            this.debouncedTrigger([filePath]);
        });

        watcher.on('unlink', (filePath) => {
            this.log('debug', `🗑️ File deleted: ${filePath}`);
            changedFiles.push(filePath);
            this.debouncedTrigger([...changedFiles]);
        });

        watcher.on('ready', () => {
            this.log('info', '✅ File watcher ready');
            this.log('info', '🔥 Waiting for file changes in /src...');
        });

        watcher.on('error', (error) => {
            this.log('error', '❌ Watcher error:', error);
        });

        // Reset changed files after each trigger
        setInterval(() => {
            changedFiles = [];
        }, this.config.debounceMs * 2);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.log('info', '🛑 Shutting down file watcher...');
            watcher.close();
            process.exit(0);
        });

        // Trigger initial pipeline run
        setTimeout(() => {
            this.log('info', '🚀 Running initial pipeline...');
            this.triggerPipeline(['initial-run']);
        }, 1000);
    }
}

// CLI usage
if (require.main === module) {
    const config = {
        watchDir: process.env.WATCH_DIR || path.resolve(__dirname, '../src'),
        pipelineScript: process.env.PIPELINE_SCRIPT || './run-pipeline.js',
        debounceMs: parseInt(process.env.DEBOUNCE_MS) || 2000,
        logLevel: process.env.LOG_LEVEL || 'info'
    };

    const pipeline = new WindsurfLocalPipeline(config);
    pipeline.start().catch((error) => {
        console.error('❌ Failed to start pipeline:', error);
        process.exit(1);
    });
}

module.exports = WindsurfLocalPipeline;
