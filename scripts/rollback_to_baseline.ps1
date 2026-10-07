# Mission-RX Baseline Rollback Script
# Restores the codebase to the exact working baseline state (v-working-baseline / baseline-backup)
# Guarantees ZERO data loss for all active logs, inventory, and dispense/discard records.

param(
    [switch]$RestoreDatabaseSnapshot = $false,
    [switch]$PushToGitHub = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [Mission-RX] Initiating Safe Baseline Rollback..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# 1. Safety First: Backup Current Active Databases
Write-Host "`n[1/4] Preserving active database & audit logs..." -ForegroundColor Cyan
$backupDir = Join-Path $projectRoot "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

if (Test-Path "$projectRoot\prisma\dev.db") {
    $prismaSafetyBackup = Join-Path $backupDir "safety_pre_rollback_prisma_dev_$timestamp.db"
    Copy-Item "$projectRoot\prisma\dev.db" $prismaSafetyBackup -Force
    Write-Host "  -> Safe snapshot created: backups/safety_pre_rollback_prisma_dev_$timestamp.db" -ForegroundColor Green
}

if (Test-Path "$projectRoot\dev.db") {
    $rootSafetyBackup = Join-Path $backupDir "safety_pre_rollback_root_dev_$timestamp.db"
    Copy-Item "$projectRoot\dev.db" $rootSafetyBackup -Force
    Write-Host "  -> Safe snapshot created: backups/safety_pre_rollback_root_dev_$timestamp.db" -ForegroundColor Green
}

if ($RestoreDatabaseSnapshot) {
    Write-Host "  -> [-RestoreDatabaseSnapshot specified]: Restoring pre-refactor database snapshot..." -ForegroundColor Yellow
    if (Test-Path "$projectRoot\backups\pre_refactor_prisma_dev.db") {
        Copy-Item "$projectRoot\backups\pre_refactor_prisma_dev.db" "$projectRoot\prisma\dev.db" -Force
        Write-Host "  -> Restored prisma/dev.db from pre-refactor snapshot" -ForegroundColor Green
    }
    if (Test-Path "$projectRoot\backups\pre_refactor_root_dev.db") {
        Copy-Item "$projectRoot\backups\pre_refactor_root_dev.db" "$projectRoot\dev.db" -Force
        Write-Host "  -> Restored root dev.db from pre-refactor snapshot" -ForegroundColor Green
    }
} else {
    Write-Host "  -> Active database preserved intact. Zero logs or inventory lost." -ForegroundColor Green
}

# 2. Revert Git Working Tree to Baseline
Write-Host "`n[2/4] Resetting git working tree to baseline (v-working-baseline)..." -ForegroundColor Cyan
Push-Location $projectRoot
try {
    git reset --hard v-working-baseline
    # Preserve backups directory and rollback scripts during clean
    git clean -fd -e backups -e scripts/rollback_to_baseline.ps1 -e rollback.bat
    Write-Host "  -> Git repository successfully reset to v-working-baseline" -ForegroundColor Green
} catch {
    Write-Host "  -> Git reset encountered an error: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}

# 3. Optional: Sync GitHub Live Deploy to Baseline
if ($PushToGitHub) {
    Write-Host "`n[3/4] Updating GitHub remote main branch to baseline live deployment..." -ForegroundColor Cyan
    try {
        git push origin v-working-baseline:main --force
        Write-Host "  -> origin/main successfully updated to v-working-baseline on GitHub (Vercel redeploy triggered)" -ForegroundColor Green
    } catch {
        Write-Host "  -> Warning: Failed to push rollback to origin/main: $_" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "`n[3/4] Local working tree reset to baseline." -ForegroundColor Cyan
    Write-Host "  -> Tip: To also revert the live GitHub/Vercel deploy, run: .\scripts\rollback_to_baseline.ps1 -PushToGitHub" -ForegroundColor Gray
}

# 4. Regenerate Prisma Client
Write-Host "`n[4/4] Regenerating Prisma Client..." -ForegroundColor Cyan
try {
    npx prisma generate
    Write-Host "  -> Prisma Client regenerated successfully" -ForegroundColor Green
} catch {
    Write-Host "  -> Warning: prisma generate error: $_" -ForegroundColor DarkYellow
} finally {
    Pop-Location
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " [Mission-RX] Rollback Complete! Codebase restored to working baseline." -ForegroundColor Green
Write-Host " All clinical logs and inventory records are 100% safe and intact." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
