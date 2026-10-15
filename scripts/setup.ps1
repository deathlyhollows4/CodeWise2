param([switch]$InstallRunner)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'Use PowerShell 7: pwsh -File scripts/setup.ps1' }
node --version
if ($LASTEXITCODE -ne 0) { throw 'Install Node.js 24 or later first.' }
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed.' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
if ($InstallRunner) {
    . (Join-Path $PSScriptRoot 'prepare-runner.ps1')
    $runnerFolders = Resolve-CodeWiseDataFolders
    Write-Host 'Runner installation creates a dedicated Ubuntu WSL environment and installs sandbox/compiler packages.'
    Write-Host 'It disables drive automount and Windows interoperability only in that dedicated distro.'
    Write-Host 'If CodeWise2Runner already exists, this script will not overwrite it. See docs/runner.md.'
    if ((Read-Host 'Type INSTALL to approve dedicated runner installation') -cne 'INSTALL') { throw 'Runner installation declined; app build is complete.' }
    & pwsh -NoProfile -File infra/runner/bootstrap-wsl.ps1 -Install -DataDirectory $runnerFolders.RunnerDirectory
    if ($LASTEXITCODE -ne 0) { throw 'Runner installation did not complete. See docs/runner.md; do not delete or replace an existing distro.' }
    # Install the optional recovery tool without applying its shared policy.
    $policyText = [IO.File]::ReadAllText((Join-Path (Get-Location) 'infra/runner/core-policy.py')).Replace("`r`n", "`n")
    $payload = [Convert]::ToBase64String([Text.UTF8Encoding]::new($false).GetBytes($policyText))
    $payload | & wsl.exe --distribution CodeWise2Runner --user root --exec /bin/sh -c 'set -eu; umask 077; tr -d ''\r\n'' | base64 -d > /opt/codewise2-runner/core-policy.py; chmod 600 /opt/codewise2-runner/core-policy.py'
    if ($LASTEXITCODE -ne 0) { throw 'Optional runner recovery tool installation failed. See docs/runner.md.' }
}
Write-Host 'Setup complete. Continue startup with final.ps1.'
