param([int]$Port=3140)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$taskRoot=(Get-Location).Path
$taskEvidence=Join-Path $taskRoot 'docs/release-evidence/production-lifetime.json'
$taskData=Join-Path $taskRoot ('.runtime/lifecycle-proof-'+[Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $taskData | Out-Null
$taskAddress="http://127.0.0.1:$Port"
if(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue){throw 'Proof port already occupied; no existing listener changed.'}
$env:PORT="$Port"
$env:CODEWISE2_DATA_DIR=$taskData
$env:CODEWISE2_RUNNER_DATA_DIR=Join-Path $env:LOCALAPPDATA 'CodeWise2'
$taskLaunch=Start-Process powershell.exe -ArgumentList @('-NoProfile','-NonInteractive','-File',(Join-Path $taskRoot 'scripts/start.ps1')) -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskData 'start.stdout.log') -RedirectStandardError (Join-Path $taskData 'start.stderr.log')
$null=$taskLaunch.Handle
$taskBootstrap=$null
for($taskTry=0;$taskTry -lt 60;$taskTry++){
  try{$taskBootstrap=Invoke-RestMethod "$taskAddress/api/bootstrap" -TimeoutSec 2;break}catch{Start-Sleep -Milliseconds 500}
}
if(!$taskBootstrap){throw 'Documented startup failed to become reachable; profile/logs preserved.'}
$taskListener=Get-NetTCPConnection -LocalPort $Port -State Listen
$taskNode=Get-CimInstance Win32_Process -Filter "ProcessId=$($taskListener.OwningProcess)"
if($taskNode.Name -ne 'node.exe' -or $taskNode.CommandLine -notmatch 'dist/server/index.mjs'){throw 'Listener ownership differs from compiled production server.'}
$taskLifetimePath=Join-Path $taskData "runner-app-lifetime-$($taskNode.ProcessId).json"
$taskLifetime=Get-Content -LiteralPath $taskLifetimePath -Raw | ConvertFrom-Json
if($taskLifetime.status -ne 'active'){throw 'Named-distro app lifetime was not verified active.'}
$taskKeeper=Get-CimInstance Win32_Process -Filter "ProcessId=$($taskLifetime.identity.pid)"
if(!$taskKeeper -or $taskKeeper.CommandLine -ne $taskLifetime.identity.commandLine){throw 'App keeper ownership mismatch.'}
# A second documented launch must fail on the occupied out-of-retry-range port and release its own keeper.
$taskFailureData=Join-Path $taskData 'occupied-port-profile'
New-Item -ItemType Directory -Path $taskFailureData | Out-Null
$env:CODEWISE2_DATA_DIR=$taskFailureData
$taskFailure=Start-Process powershell.exe -ArgumentList @('-NoProfile','-NonInteractive','-File',(Join-Path $taskRoot 'scripts/start.ps1')) -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskFailureData 'stdout.log') -RedirectStandardError (Join-Path $taskFailureData 'stderr.log')
$null=$taskFailure.Handle
if(!$taskFailure.WaitForExit(30000)){throw 'Occupied-port start did not finish bounded cleanup; no forced termination issued.'}
if($taskFailure.ExitCode -ne 1){throw "Expected native failure exit 1; got $($taskFailure.ExitCode)."}
$taskFailureRecords=@(Get-ChildItem -LiteralPath $taskFailureData -Filter 'runner-app-lifetime-*.json' | ForEach-Object {Get-Content -LiteralPath $_.FullName -Raw|ConvertFrom-Json})
if($taskFailureRecords.Count -ne 1 -or $taskFailureRecords[0].status -ne 'stopped'){throw 'Failed startup keeper cleanup was not recorded stopped.'}
if(Get-Process -Id $taskFailureRecords[0].identity.pid -ErrorAction SilentlyContinue){throw 'Failed startup keeper still exists.'}
& (Join-Path $taskRoot 'scripts/stop.ps1') -Address $taskAddress | Out-Null
if(!$taskLaunch.WaitForExit(30000)){throw 'Normal stop did not finish; no forced termination issued.'}
$taskStopped=Get-Content -LiteralPath $taskLifetimePath -Raw | ConvertFrom-Json
if($taskStopped.status -ne 'stopped'){throw 'Normal owned EOF exit not confirmed.'}
if(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue){throw 'Production listener remains after stop.'}
if(Get-Process -Id $taskKeeper.ProcessId -ErrorAction SilentlyContinue){throw 'Owned WSL client remains after stop.'}
$taskHttpGone=$false
try{Invoke-RestMethod "$taskAddress/api/bootstrap" -TimeoutSec 2 | Out-Null}catch{$taskHttpGone=$true}
if(!$taskHttpGone){throw 'HTTP remained reachable after stop.'}
$taskResult=[ordered]@{schemaVersion=1;passed=$true;platform='win32-arm64';timestamp=[DateTime]::UtcNow.ToString('o');commands=@('powershell.exe -NoProfile -NonInteractive -File scripts/start.ps1','powershell.exe -NoProfile -NonInteractive -File scripts/stop.ps1 -Address http://127.0.0.1:3140');environment=@{PORT=$Port;CODEWISE2_DATA_DIR=$taskData;CODEWISE2_RUNNER_DATA_DIR=$env:CODEWISE2_RUNNER_DATA_DIR};node=@{pid=$taskNode.ProcessId;creation=$taskNode.CreationDate.ToUniversalTime().ToString('o');command=$taskNode.CommandLine};lifetime=$taskStopped;startupExit=$taskLaunch.ExitCode;occupiedPortExit=$taskFailure.ExitCode;failedStartupLifetime=$taskFailureRecords[0];httpGone=$taskHttpGone;fixture=$taskBootstrap.fixture;published=$taskBootstrap.catalogue.published;keyStatus=$taskBootstrap.key.status;sharedShutdownIssued=$false;policyReapplied=$false;sourceHashes=@{index=(Get-FileHash apps/server/src/index.ts).Hash;lifetime=(Get-FileHash apps/server/src/wsl-lifetime.ts).Hash;start=(Get-FileHash scripts/start.ps1).Hash;compiled=(Get-FileHash dist/server/index.mjs).Hash}}
$taskResult|ConvertTo-Json -Depth 12|Set-Content -LiteralPath $taskEvidence -Encoding UTF8
Write-Host "Production lifecycle proof passed. Evidence: $taskEvidence"
