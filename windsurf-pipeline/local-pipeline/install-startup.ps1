# PowerShell script to install Windsurf Pipeline as Windows startup service
# Run as Administrator for system-wide installation

param(
    [switch]$Uninstall,
    [switch]$UserOnly
)

$ErrorActionPreference = "Stop"

# Configuration
$ServiceName = "WindsurfPipeline"
$ServiceDisplayName = "Windsurf Local CI/CD Pipeline"
$ServiceDescription = "Automatically monitors /src directory and runs CI/CD pipeline on file changes"
$ScriptPath = Join-Path $PSScriptRoot "auto-startup.bat"
$StartupFolder = if ($UserOnly) { 
    [Environment]::GetFolderPath("Startup") 
} else { 
    "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup" 
}

function Install-StartupShortcut {
    Write-Host "🔧 Installing Windsurf Pipeline auto-startup..." -ForegroundColor Green
    
    # Create shortcut in startup folder
    $ShortcutPath = Join-Path $StartupFolder "Windsurf Pipeline.lnk"
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $ScriptPath
    $Shortcut.WorkingDirectory = $PSScriptRoot
    $Shortcut.Description = $ServiceDescription
    $Shortcut.WindowStyle = 7  # Minimized
    $Shortcut.Save()
    
    Write-Host "✅ Startup shortcut created: $ShortcutPath" -ForegroundColor Green
    Write-Host "🎯 Pipeline will auto-start when Windows boots" -ForegroundColor Cyan
}

function Uninstall-StartupShortcut {
    Write-Host "🗑️ Removing Windsurf Pipeline auto-startup..." -ForegroundColor Yellow
    
    $ShortcutPath = Join-Path $StartupFolder "Windsurf Pipeline.lnk"
    if (Test-Path $ShortcutPath) {
        Remove-Item $ShortcutPath -Force
        Write-Host "✅ Startup shortcut removed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No startup shortcut found" -ForegroundColor Yellow
    }
}

function Install-WindowsService {
    Write-Host "🔧 Installing Windows Service..." -ForegroundColor Green
    
    # Create service wrapper script
    $ServiceScript = @"
@echo off
cd /d "$PSScriptRoot"
node auto-start-service.js
"@
    
    $ServiceScriptPath = Join-Path $PSScriptRoot "service-wrapper.bat"
    $ServiceScript | Out-File -FilePath $ServiceScriptPath -Encoding ASCII
    
    # Install service using sc command
    $BinaryPath = "cmd.exe /c `"$ServiceScriptPath`""
    
    & sc.exe create $ServiceName binPath= $BinaryPath start= auto DisplayName= $ServiceDisplayName
    & sc.exe description $ServiceName $ServiceDescription
    & sc.exe start $ServiceName
    
    Write-Host "✅ Windows Service installed and started" -ForegroundColor Green
}

function Uninstall-WindowsService {
    Write-Host "🗑️ Removing Windows Service..." -ForegroundColor Yellow
    
    & sc.exe stop $ServiceName 2>$null
    & sc.exe delete $ServiceName 2>$null
    
    $ServiceScriptPath = Join-Path $PSScriptRoot "service-wrapper.bat"
    if (Test-Path $ServiceScriptPath) {
        Remove-Item $ServiceScriptPath -Force
    }
    
    Write-Host "✅ Windows Service removed" -ForegroundColor Green
}

# Main execution
try {
    Write-Host ""
    Write-Host "🎯 Windsurf Pipeline Auto-Startup Installer" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Uninstall) {
        Uninstall-StartupShortcut
        if (-not $UserOnly) {
            Uninstall-WindowsService
        }
    } else {
        # Check if running as administrator for system-wide installation
        $IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        
        if (-not $UserOnly -and -not $IsAdmin) {
            Write-Host "⚠️ Run as Administrator for system-wide installation" -ForegroundColor Yellow
            Write-Host "   Installing for current user only..." -ForegroundColor Yellow
            $UserOnly = $true
        }
        
        Install-StartupShortcut
        
        if (-not $UserOnly -and $IsAdmin) {
            Install-WindowsService
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor White
    Write-Host "  • Pipeline will start automatically when Windows boots" -ForegroundColor Gray
    Write-Host "  • File changes in /src will trigger CI/CD pipeline" -ForegroundColor Gray
    Write-Host "  • Desktop notifications will show completion status" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To uninstall: .\install-startup.ps1 -Uninstall" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
