param([switch]$ReadingOnly, [switch]$CheckRunnerOnly)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'Use PowerShell 7: pwsh -File scripts/start.ps1' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 24 or later, then run scripts/setup.ps1.' }
if (-not (Test-Path node_modules/tsx)) { throw 'Dependencies missing. Run .\scripts\setup.ps1 first.' }
if (-not (Test-Path dist/server/index.mjs)) { throw 'Build missing. Run .\scripts\setup.ps1 first.' }
$anchor = $null
try {
    if (-not $ReadingOnly) {
        $runnerData = if ($env:CODEWISE2_RUNNER_DATA_DIR) { $env:CODEWISE2_RUNNER_DATA_DIR } elseif ($env:CODEWISE2_DATA_DIR) { $env:CODEWISE2_DATA_DIR } else { Join-Path $env:LOCALAPPDATA 'CodeWise2' }
        if (-not (Test-Path (Join-Path $runnerData 'runner.json'))) {
            throw 'Runner is not installed for this profile. Run .\scripts\setup.ps1 -InstallRunner for guided setup, or .\scripts\start.ps1 -ReadingOnly to read/edit without grading.'
        }
        # Do not recover policy while any CodeWise2 app in the standard port range is active.
        foreach ($port in 3000..3010) {
            $boot = $null
            try { $boot = Invoke-RestMethod "http://127.0.0.1:$port/api/bootstrap" -TimeoutSec 1 } catch {}
            if ($boot.csrfToken -and $boot.catalogue -and $boot.runner) {
                if ($boot.runner.ready) { Write-Host "CodeWise2 is already running: http://127.0.0.1:$port"; exit 0 }
                throw "CodeWise2 is already running with its runner unavailable. Stop it first: .\scripts\stop.ps1 -Address http://127.0.0.1:$port ; then rerun this script."
            }
        }
        $info = [Diagnostics.ProcessStartInfo]::new('wsl.exe')
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardInput = $true
        foreach ($argument in @('--distribution','CodeWise2Runner','--user','root','--exec','/bin/cat')) { $info.ArgumentList.Add($argument) }
        $anchor = [Diagnostics.Process]::Start($info)
        . (Join-Path $PSScriptRoot 'prepare-runner.ps1')
        Initialize-CodeWiseRunner
        if ($anchor.HasExited) { throw 'Dedicated WSL lifetime exited unexpectedly. App startup withheld.' }
    }
    if ($CheckRunnerOnly) { exit 0 }
    Write-Host 'Starting CodeWise2. Keep this terminal open; Ctrl+C stops it safely.'
    npm.cmd start
    $appExit = $LASTEXITCODE
} finally {
    if ($anchor) {
        if (-not $anchor.HasExited) {
            $anchor.StandardInput.Close()
            if (-not $anchor.WaitForExit(10000)) { Write-Warning 'Owned temporary WSL client did not exit; no shared shutdown was issued.' }
        }
        $anchor.Dispose()
    }
}
exit $appExit
