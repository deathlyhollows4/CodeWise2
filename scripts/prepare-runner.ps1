# Called with an owned WSL lifetime already held by start.ps1.
function Initialize-CodeWiseRunner {
    param(
        [scriptblock]$RunWsl = {
            param([string[]]$Arguments)
            $output = & wsl.exe --distribution CodeWise2Runner --user root --exec @Arguments 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Runner command failed: $($output -join [Environment]::NewLine)" }
            return ($output -join [Environment]::NewLine)
        },
        [scriptblock]$Probe = {
            $output = & node --import tsx scripts/runner-doctor.ts 2>&1
            try { return ($output -join [Environment]::NewLine) | ConvertFrom-Json }
            catch { throw 'Runner diagnostics failed. Run npm.cmd run doctor:runner for details.' }
        },
        [scriptblock]$Confirm = { Read-Host 'Allow this recovery? Type YES to approve' }
    )
    $policy = (& $RunWsl @('python3', '/opt/codewise2-runner/core-policy.py', 'inspect')) | ConvertFrom-Json
    $ready = & $Probe
    if ($ready.ready -and $ready.controlsVerified -and $policy.current -eq 'core') {
        Write-Host 'Isolated runner ready.'
        return
    }
    if ($policy.current -ne 'core') {
        Write-Host 'WSL reset the crash-dump safety setting. Recovery sets it to core.'
        Write-Host 'This affects ALL distros in the shared WSL2 VM. The previous value stays backed up.'
        Write-Host 'Recovery stops only the dedicated controller and runs fixed isolation checks.'
        if ((& $Confirm) -cne 'YES') { throw 'Recovery declined. No policy was changed. Run/Submit remains disabled.' }
        & $RunWsl @('python3', '/opt/codewise2-runner/core-policy.py', 'apply') | Out-Host
    }
    & $RunWsl @('systemctl', 'start', 'codewise2-runner.service') | Out-Null
    Write-Host 'Checking isolation and renewing the 24-hour verification. This may take a minute.'
    # Never run submitted learner code, reinstall packages, or change unrelated WSL services.
    & $RunWsl @('python3', '/opt/codewise2-runner/verify-canaries.py') | Out-Null
    $ready = & $Probe
    if (-not $ready.ready -or -not $ready.controlsVerified) {
        throw "Runner remains unavailable: $($ready.message). See docs/runner.md; no safety gate was bypassed."
    }
    Write-Host 'Isolation checks passed. Runner ready.'
}
