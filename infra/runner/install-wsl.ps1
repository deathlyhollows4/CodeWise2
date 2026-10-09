param([switch]$Install,[switch]$PlatformOnly)
$ErrorActionPreference = 'Stop'
Write-Host 'CodeWise2 isolated Linux prerequisite. This changes Windows optional features and may require a restart.'
Write-Host ('Architecture: ' + [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $Install) {
  Write-Host 'Inspection only. Installation requires explicit authorization and an Administrator PowerShell.'
  wsl.exe --status
  wsl.exe --list --verbose
  Write-Host 'Authorized install command: pwsh -File infra/runner/install-wsl.ps1 -Install'
  exit 0
}
if (-not $isAdmin) { throw 'Open an Administrator PowerShell after approving WSL installation.' }
if ($PlatformOnly) {
  Write-Host 'Authorized platform-only installation. No Linux distribution or automatic restart requested.'
  wsl.exe --install --no-distribution
  if ($LASTEXITCODE -ne 0) { throw ('WSL platform installer returned '+$LASTEXITCODE+'. Inspect transcript; a restart may be required.') }
  Write-Host 'Platform installer returned success. Restart manually only if Windows requires it. Runner not yet configured.'
  exit 0
}
# Fail closed on unsupported bootstrap command syntax. Never install a default distro by accident.
$help = (wsl.exe --help 2>&1 | Out-String).Replace("`0",'')
if ($help -notmatch '--name') {
  Write-Host 'Installed WSL bootstrap lacks named distro support. Installing WSL platform only; no Ubuntu/default distro.'
  wsl.exe --install --no-distribution
  if ($LASTEXITCODE -ne 0) { throw 'WSL platform installation failed; inspect Windows diagnostic. No runner distro requested.' }
  Write-Host 'Restart if requested. Then run wsl --update and inspect current wsl --help before creating CodeWise2Runner.'
  exit 0
}
$existing = (wsl.exe --list --quiet 2>&1 | Out-String).Replace("`0",'')
if ($LASTEXITCODE -eq 0 -and $existing -match '(?m)^\s*CodeWise2Runner\s*$') {
  Write-Host 'CodeWise2Runner already exists. No change made. Inspect it before continuing Linux setup.'
  exit 0
}
# Dedicated distro. Never repurpose an existing learner/developer distro.
wsl.exe --install --distribution Ubuntu --name CodeWise2Runner --no-launch
if ($LASTEXITCODE -ne 0) { throw 'WSL installation did not complete. Read the Windows diagnostic; a restart may be required. Do not retry an unrelated distro.' }
Write-Host 'If Windows requested a restart, restart before Linux setup. Then initialize ONLY CodeWise2Runner.'
Write-Host 'The runner stays unavailable until Linux isolation, runtime versions, and canaries are verified.'
