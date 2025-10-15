# A friendly launcher for the gallery setup wizard.
# Tries to use the Python launcher (py) on Windows first, then falls back to python.

$ErrorActionPreference = 'Stop'

Write-Host ([Environment]::NewLine + 'Add New Gallery Wizard') -ForegroundColor Cyan
Write-Host 'This will help you resize photos, generate manifests, update galleries, and set the gallery password.' -ForegroundColor Gray

# Ensure we're running from the repo root regardless of how the script was started
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
Set-Location $repoRoot

# Prefer the Windows Python launcher if present
$pythonCmd = $null
if (Get-Command py -ErrorAction SilentlyContinue) {
	$pythonCmd = 'py'
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
	$pythonCmd = 'python'
}

if (-not $pythonCmd) {
	Write-Host ([Environment]::NewLine + 'Python is not installed or not on PATH. Please install Python 3.x from https://www.python.org/downloads/ and try again.') -ForegroundColor Red
	Read-Host -Prompt 'Press Enter to exit'
	exit 1
}

# Launch the Python wizard
try {
	& $pythonCmd 'utils/handler.py'
} catch {
	Write-Host ([Environment]::NewLine + 'Something went wrong while running the wizard:') -ForegroundColor Red
	Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ([Environment]::NewLine + 'All done. You can re-run this script anytime to add another gallery.') -ForegroundColor Green
Read-Host -Prompt 'Press Enter to close'