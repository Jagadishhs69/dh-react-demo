#!/usr/bin/env node

/**
 * Utility script to clean up stale lock files
 * Usage: node cleanup-locks.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lockFile = path.join(__dirname, '.watcher.lock');

function isProcessRunning(pid) {
    try {
        if (process.platform === 'win32') {
            const result = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
            return result.includes(pid.toString());
        } else {
            process.kill(pid, 0);
            return true;
        }
    } catch (error) {
        return false;
    }
}

function cleanupStaleLocks() {
    console.log('🔍 Checking for stale lock files...');
    
    if (!fs.existsSync(lockFile)) {
        console.log('✅ No lock file found - all clean!');
        return;
    }

    try {
        const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
        const pid = lockData.pid;
        const startTime = lockData.startTime;
        
        console.log(`📋 Found lock file:`);
        console.log(`   PID: ${pid}`);
        console.log(`   Started: ${startTime}`);
        
        if (isProcessRunning(pid)) {
            console.log('✅ Process is still running - lock file is valid');
        } else {
            console.log('🧹 Process not running - removing stale lock file');
            fs.unlinkSync(lockFile);
            console.log('✅ Stale lock file removed successfully');
        }
    } catch (error) {
        console.log('🧹 Corrupted lock file found - removing it');
        fs.unlinkSync(lockFile);
        console.log('✅ Corrupted lock file removed successfully');
    }
}

// Run cleanup
cleanupStaleLocks();
