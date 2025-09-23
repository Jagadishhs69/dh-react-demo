# PowerShell script to install Windsurf Local Pipeline as Windows Service
# Run as Administrator: powershell -ExecutionPolicy Bypass -File install-as-service.ps1

param(
    [string]$Action = "install"
)

$ServiceName = "WindsurfLocalPipeline"
$ServiceDisplayName = "Windsurf Local CI/CD Pipeline"
$ServiceDescription = "Automatically monitors /src directory and runs CI/CD pipeline on file changes"
$WorkingDirectory = Split-Path -Parent $MyInvocation.MyCommand.Definition
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
$ServiceScript = Join-Path $WorkingDirectory "auto-start-service.js"

function Install-Service {
    Write-Host "🔧 Installing Windsurf Local Pipeline as Windows Service..." -ForegroundColor Cyan
    
    # Check if Node.js is available
    if (-not $NodePath) {
        Write-Error "❌ Node.js not found in PATH. Please install Node.js first."
        exit 1
    }
    
    # Check if service already exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "⚠️ Service already exists. Removing first..." -ForegroundColor Yellow
        Remove-Service
    }
    
    # Create service using sc.exe
    $binaryPath = "`"$NodePath`" `"$ServiceScript`""
    
    $result = & sc.exe create $ServiceName binPath= $binaryPath start= auto DisplayName= $ServiceDisplayName
    
    if ($LASTEXITCODE -eq 0) {
        # Set service description
        & sc.exe description $ServiceName $ServiceDescription
        
        Write-Host "✅ Service installed successfully!" -ForegroundColor Green
        Write-Host "📋 Service Details:" -ForegroundColor Cyan
        Write-Host "   Name: $ServiceName"
        Write-Host "   Display Name: $ServiceDisplayName"
        Write-Host "   Working Directory: $WorkingDirectory"
        Write-Host "   Script: $ServiceScript"
        Write-Host ""
        Write-Host "🚀 To start the service:" -ForegroundColor Yellow
        Write-Host "   Start-Service -Name $ServiceName"
        Write-Host ""
        Write-Host "🛑 To stop the service:" -ForegroundColor Yellow
        Write-Host "   Stop-Service -Name $ServiceName"
    } else {
        Write-Error "❌ Failed to install service. Make sure you're running as Administrator."
        exit 1
    }
}

function Remove-Service {
    Write-Host "🗑️ Removing Windsurf Local Pipeline service..." -ForegroundColor Yellow
    
    # Stop service if running
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Host "🛑 Stopping service..." -ForegroundColor Yellow
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
    }
    
    # Remove service
    $result = & sc.exe delete $ServiceName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Service removed successfully!" -ForegroundColor Green
    } else {
        Write-Error "❌ Failed to remove service."
    }
}

function Show-Status {
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    
    if ($service) {
        Write-Host "📊 Service Status:" -ForegroundColor Cyan
        Write-Host "   Name: $($service.Name)"
        Write-Host "   Status: $($service.Status)"
        Write-Host "   Start Type: $($service.StartType)"
        
        if ($service.Status -eq 'Running') {
            Write-Host "✅ Pipeline is running automatically!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Service is installed but not running" -ForegroundColor Yellow
            Write-Host "💡 Start with: Start-Service -Name $ServiceName" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Service not installed" -ForegroundColor Red
        Write-Host "💡 Install with: .\install-as-service.ps1 -Action install" -ForegroundColor Cyan
    }
}

# Main execution
switch ($Action.ToLower()) {
    "install" { Install-Service }
    "remove" { Remove-Service }
    "uninstall" { Remove-Service }
    "status" { Show-Status }
    default {
        Write-Host "❓ Usage: .\install-as-service.ps1 -Action [install|remove|status]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Cyan
        Write-Host "   .\install-as-service.ps1 -Action install    # Install as Windows service"
        Write-Host "   .\install-as-service.ps1 -Action remove     # Remove service"
        Write-Host "   .\install-as-service.ps1 -Action status     # Check service status"
    }
}
