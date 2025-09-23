#!/usr/bin/env node

/**
 * Notification system for Windsurf Local CI/CD Pipeline
 * Provides multiple notification methods for pipeline completion
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PipelineNotifications {
    constructor(options = {}) {
        this.config = {
            enableDesktop: options.enableDesktop !== false, // Default true
            enableSound: options.enableSound !== false,     // Default true
            enableConsole: options.enableConsole !== false, // Default true
            enableFile: options.enableFile !== false,       // Default true
            ...options
        };
    }

    async notify(result) {
        const { overall, duration, results } = result;
        const success = overall === 'success';
        
        const message = {
            title: success ? '✅ Pipeline Success' : '❌ Pipeline Failed',
            body: `Windsurf CI/CD completed in ${duration}s`,
            icon: success ? 'success' : 'error',
            details: this.formatResults(results)
        };

        // Send notifications through all enabled channels
        const promises = [];
        
        if (this.config.enableConsole) {
            promises.push(this.consoleNotification(message, success));
        }
        
        if (this.config.enableDesktop) {
            promises.push(this.desktopNotification(message, success));
        }
        
        if (this.config.enableSound) {
            promises.push(this.soundNotification(success));
        }
        
        if (this.config.enableFile) {
            promises.push(this.fileNotification(message, success));
        }

        await Promise.allSettled(promises);
    }

    formatResults(results) {
        const stages = [
            { name: 'Language Detection', result: results.languageDetection },
            { name: 'Dependencies', result: results.dependencyCheck },
            { name: 'Code Quality', result: results.codeQuality },
            { name: 'NPM Version Scan', result: results.npmVersionScan },
            { name: 'Secret Detection', result: results.secretDetection },
            { name: 'SAST Scan', result: results.sastScan }
        ];

        return stages.map(stage => 
            `${stage.name}: ${stage.result?.success ? '✅' : '❌'}`
        ).join(' | ');
    }

    async consoleNotification(message, success) {
        const border = success ? '🎉' : '⚠️';
        const color = success ? '\x1b[32m' : '\x1b[31m'; // Green or Red
        const reset = '\x1b[0m';
        
        console.log('\n' + '='.repeat(60));
        console.log(`${border} ${color}${message.title}${reset} ${border}`);
        console.log(`📊 ${message.body}`);
        console.log(`🔍 ${message.details}`);
        console.log('='.repeat(60) + '\n');
    }

    async desktopNotification(message, success) {
        try {
            // Windows Toast Notification
            if (process.platform === 'win32') {
                await this.windowsToast(message, success);
            }
            // macOS Notification
            else if (process.platform === 'darwin') {
                await this.macNotification(message, success);
            }
            // Linux Notification
            else if (process.platform === 'linux') {
                await this.linuxNotification(message, success);
            }
        } catch (error) {
            console.log('Desktop notification failed:', error.message);
        }
    }

    async windowsToast(message, success) {
        // PowerShell toast notification with debugging
        const psScript = `
            try {
                Add-Type -AssemblyName System.Windows.Forms
                $notification = New-Object System.Windows.Forms.NotifyIcon
                $notification.Icon = [System.Drawing.SystemIcons]::${success ? 'Information' : 'Warning'}
                $notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::${success ? 'Info' : 'Warning'}
                $notification.BalloonTipText = "${message.body}\\n${message.details}"
                $notification.BalloonTipTitle = "${message.title}"
                $notification.Visible = $true
                $notification.ShowBalloonTip(5000)
                Write-Host "Notification displayed successfully"
                Start-Sleep -Seconds 6
                $notification.Dispose()
            } catch {
                Write-Host "Notification error: $_"
                # Fallback to Windows 10+ toast notification
                $ToastXml = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>${message.title}</text>
            <text>${message.body}</text>
            <text>${message.details}</text>
        </binding>
    </visual>
</toast>
"@
                try {
                    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
                    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
                    $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
                    $xml.LoadXml($ToastXml)
                    $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
                    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Windsurf CI/CD").Show($toast)
                    Write-Host "Toast notification displayed"
                } catch {
                    Write-Host "Toast fallback failed: $_"
                }
            }
        `;
        
        return new Promise((resolve) => {
            const ps = spawn('powershell', ['-Command', psScript], { 
                stdio: ['ignore', 'pipe', 'pipe'],
                windowsHide: false 
            });
            
            let output = '';
            ps.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            ps.stderr.on('data', (data) => {
                console.log('Notification debug:', data.toString());
            });
            
            ps.on('close', (code) => {
                if (output.includes('successfully') || output.includes('displayed')) {
                    console.log('✅ Desktop notification sent');
                } else {
                    console.log('⚠️ Desktop notification may have failed');
                }
                resolve();
            });
            
            setTimeout(resolve, 3000); // Increased timeout
        });
    }

    async macNotification(message, success) {
        const script = `display notification "${message.body}\\n${message.details}" with title "${message.title}"`;
        
        return new Promise((resolve) => {
            const osascript = spawn('osascript', ['-e', script], { stdio: 'ignore' });
            osascript.on('close', () => resolve());
            setTimeout(resolve, 1000);
        });
    }

    async linuxNotification(message, success) {
        const urgency = success ? 'normal' : 'critical';
        
        return new Promise((resolve) => {
            const notify = spawn('notify-send', [
                '--urgency', urgency,
                '--expire-time', '5000',
                message.title,
                `${message.body}\\n${message.details}`
            ], { stdio: 'ignore' });
            notify.on('close', () => resolve());
            setTimeout(resolve, 1000);
        });
    }

    async soundNotification(success) {
        try {
            if (process.platform === 'win32') {
                // Windows system sound
                const sound = success ? 'SystemAsterisk' : 'SystemExclamation';
                const psScript = `[System.Media.SystemSounds]::${sound}.Play()`;
                
                spawn('powershell', ['-Command', psScript], { 
                    stdio: 'ignore',
                    windowsHide: true 
                });
            }
            else if (process.platform === 'darwin') {
                // macOS system sound
                const sound = success ? 'Glass' : 'Basso';
                spawn('afplay', [`/System/Library/Sounds/${sound}.aiff`], { stdio: 'ignore' });
            }
            else if (process.platform === 'linux') {
                // Linux beep
                spawn('paplay', ['/usr/share/sounds/alsa/Front_Left.wav'], { stdio: 'ignore' });
            }
        } catch (error) {
            // Sound notification is optional, don't fail
        }
    }

    async fileNotification(message, success) {
        try {
            const notificationFile = path.join(process.cwd(), '..', 'logs', 'latest-notification.txt');
            const timestamp = new Date().toISOString();
            
            const content = `
[${timestamp}] ${message.title}
${message.body}
${message.details}

Status: ${success ? 'SUCCESS' : 'FAILED'}
============================================
`;
            
            fs.writeFileSync(notificationFile, content);
        } catch (error) {
            // File notification is optional
        }
    }
}

module.exports = PipelineNotifications;
