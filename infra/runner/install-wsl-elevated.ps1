# Platform-only UAC wrapper. Never installs a distro, changes unrelated settings, or reboots.
$ErrorActionPreference='Stop'
$workspaceRoot=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$evidenceRoot=Join-Path $workspaceRoot 'docs/release-evidence'
New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$transcriptPath=Join-Path $evidenceRoot ('wsl-platform-install-'+$stamp+'.txt')
$resultPath=Join-Path $evidenceRoot 'wsl-platform-install-result.json'
$result=@{scope='WSL platform only';startedAt=(Get-Date).ToUniversalTime().ToString('o');status='running';transcript=$transcriptPath;noAutomaticReboot=$true;noDistroInstalledByRequest=$true}
$result | ConvertTo-Json | Set-Content -LiteralPath $resultPath
$transcribing=$false
try {
  Start-Transcript -LiteralPath $transcriptPath -Force | Out-Null
  $transcribing=$true
  $principal=[Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
  if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'UAC elevation did not provide Administrator permissions.'}
  # Separate child invocation avoids the install script's exit ending this evidence wrapper.
  $powershellExe=Join-Path $PSHOME 'powershell.exe'
  if(-not(Test-Path -LiteralPath $powershellExe)){$powershellExe=Join-Path $PSHOME 'pwsh.exe'}
  & $powershellExe -NoProfile -File (Join-Path $PSScriptRoot 'install-wsl.ps1') -Install -PlatformOnly
  $result.exitCode=$LASTEXITCODE
  $result.status=if($LASTEXITCODE -eq 0){'installer-returned-success-restart-state-unverified'}else{'installer-failed-or-restart-required'}
  Write-Host ('Recorded installer exit code: '+$LASTEXITCODE)
  Write-Host 'No reboot performed. Inspect Windows messages and fresh WSL capabilities before any distro setup.'
}catch{
  $result.status='failed';$result.error=$_.Exception.Message
  Write-Host $result.error
}finally{
  $result.completedAt=(Get-Date).ToUniversalTime().ToString('o')
  if($transcribing){Stop-Transcript | Out-Null}
  $result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $resultPath
}
