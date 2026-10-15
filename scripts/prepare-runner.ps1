function Resolve-CodeWiseDataFolders {
    param(
        [string]$KnownLocalAppData = [Environment]::GetFolderPath('LocalApplicationData'),
        [string]$DataOverride = $env:CODEWISE2_DATA_DIR,
        [string]$RunnerOverride = $env:CODEWISE2_RUNNER_DATA_DIR,
        [string]$MachineProfileFile = (Join-Path (Split-Path $PSScriptRoot -Parent) '.runtime/active-profile.json')
    )
    $machineProfile = $null
    if ([string]::IsNullOrWhiteSpace($DataOverride)) {
        if ($MachineProfileFile -and (Test-Path -LiteralPath $MachineProfileFile)) {
            $machineProfile = Get-Content -LiteralPath $MachineProfileFile -Raw | ConvertFrom-Json
            if ($machineProfile.schemaVersion -ne 1 -or [string]::IsNullOrWhiteSpace($machineProfile.dataDirectory) -or -not [IO.Path]::IsPathRooted($machineProfile.dataDirectory)) { throw 'The selected local profile configuration is invalid. No alternate profile was created.' }
            if (-not (Test-Path -LiteralPath (Join-Path $machineProfile.dataDirectory 'codewise2.sqlite'))) { throw 'The selected learning database is missing. No empty replacement profile was created.' }
            $DataOverride = $machineProfile.dataDirectory
        } else {
            if ([string]::IsNullOrWhiteSpace($KnownLocalAppData)) { throw 'Windows could not resolve Local AppData. Set CODEWISE2_DATA_DIR explicitly.' }
            $DataOverride = Join-Path $KnownLocalAppData 'CodeWise2'
        }
    }
    if ([string]::IsNullOrWhiteSpace($RunnerOverride)) {
        if ($machineProfile -and $machineProfile.runnerDirectory) { $RunnerOverride = $machineProfile.runnerDirectory }
        else { $RunnerOverride = $DataOverride }
    }
    return @{ DataDirectory = $DataOverride; RunnerDirectory = $RunnerOverride }
}
function Assert-CodeWiseWslResult {
    param([int]$ExitCode, [string]$Output)
    if ($ExitCode -eq 0) { return }
    $message = $Output.Replace("`0", '').Trim()
    if ($message -match 'ERROR_TIMEOUT') {
        throw 'Windows Linux (WSL) is not responding (Wsl/Service/ERROR_TIMEOUT). Save your work, restart Windows, then run final.ps1 again. Your existing runner and learning data have not been replaced.'
    }
    throw "Runner command failed: $message"
}

# Called with an owned WSL lifetime already held by start.ps1.
function Initialize-CodeWiseRunner {
    param(
        [scriptblock]$RunWsl = {
            param([string[]]$Arguments)
            $output = & wsl.exe --distribution CodeWise2Runner --user root --exec @Arguments 2>&1
            $text = ($output -join [Environment]::NewLine).Replace("`0", '')
            Assert-CodeWiseWslResult -ExitCode $LASTEXITCODE -Output $text
            return $text
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
