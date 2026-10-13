$ErrorActionPreference = 'Stop'
$demoRoot = Split-Path -Parent $PSScriptRoot
$demoPython = Join-Path $demoRoot 'services/vision/.venv/Scripts/python.exe'
$demoServer = Join-Path $demoRoot 'services/vision/serve.py'
$demoToken = Join-Path $demoRoot 'services/vision/.env'
if (-not (Test-Path -LiteralPath $demoPython)) {
    throw 'Local AI environment is missing. Follow services/vision/README.md first.'
}
$demoReady = $false
try { $demoReady = (Invoke-RestMethod 'http://127.0.0.1:8765/health' -TimeoutSec 2).ready } catch {}
if (-not $demoReady) {
    Start-Process -FilePath $demoPython -ArgumentList ('"' + $demoServer + '"') -WorkingDirectory $demoRoot -WindowStyle Hidden
    Write-Host 'Loading local AI. This can take a minute.'
    for ($demoAttempt = 0; $demoAttempt -lt 60; $demoAttempt++) {
        Start-Sleep -Seconds 2
        try { $demoReady = (Invoke-RestMethod 'http://127.0.0.1:8765/health' -TimeoutSec 2).ready } catch {}
        if ($demoReady) { break }
    }
}
if (-not $demoReady) { throw 'AI startup failed. Run services/vision/serve.py to inspect the error.' }
if (-not (Test-Path -LiteralPath $demoToken)) { throw 'This checkout has no connection token. Port 8765 may belong to another checkout.' }
$demoSecret = (Get-Content -LiteralPath $demoToken -Raw).Trim()
try {
    $demoConnected = Invoke-RestMethod 'http://127.0.0.1:8765/connect' -Headers @{ Authorization = 'Bearer ' + $demoSecret } -TimeoutSec 5
    if (-not $demoConnected.ready) { throw 'Not ready' }
} catch { throw 'Token/server mismatch. Port 8765 may be serving another checkout. Run this script in the checkout that started that server.' }
Set-Clipboard -Value $demoSecret
Start-Process 'https://peach20040909.github.io/mobility-field-lab/demo/'
Write-Host 'AI is ready. Token copied. Paste it into the connection field and click Connect.'
