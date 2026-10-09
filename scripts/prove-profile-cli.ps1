param([int]$Port=3180)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$taskWorkspace=(Get-Location).Path
foreach($taskCandidate in @($Port,($Port+1))){if(Get-NetTCPConnection -LocalPort $taskCandidate -State Listen -ErrorAction SilentlyContinue){throw 'Proof port occupied; no existing listener changed.'}}
$taskData=Join-Path $taskWorkspace ('.runtime/profile-cli-proof-'+[Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $taskData|Out-Null
$env:CODEWISE2_DATA_DIR=$taskData
$env:CODEWISE2_RUNNER_DATA_DIR=Join-Path $env:LOCALAPPDATA 'CodeWise2'
$env:PORT="$Port"
$taskStart=[DateTime]::UtcNow
$taskFirst=Start-Process powershell.exe -ArgumentList @('-NoProfile','-NonInteractive','-File',(Join-Path $taskWorkspace 'scripts/start.ps1')) -WorkingDirectory $taskWorkspace -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskData 'first.stdout.log') -RedirectStandardError (Join-Path $taskData 'first.stderr.log')
$null=$taskFirst.Handle
$taskAddress="http://127.0.0.1:$Port"
$taskBootstrap=$null
for($taskAttempt=0;$taskAttempt -lt 90;$taskAttempt++){try{$taskBootstrap=Invoke-RestMethod "$taskAddress/api/bootstrap" -TimeoutSec 2;break}catch{Start-Sleep -Milliseconds 500}}
if(!$taskBootstrap){throw 'First documented CLI startup failed; logs preserved.'}
$taskReadyMs=([DateTime]::UtcNow-$taskStart).TotalMilliseconds
$taskListener=Get-NetTCPConnection -LocalPort $Port -State Listen
$taskNode=Get-CimInstance Win32_Process -Filter "ProcessId=$($taskListener.OwningProcess)"
if($taskNode.Name -ne 'node.exe' -or $taskNode.CommandLine -notmatch 'dist/server/index.mjs'){throw 'First listener identity mismatch'}
$taskOwner=Get-Content -LiteralPath (Join-Path $taskData 'profile-owner.json') -Raw|ConvertFrom-Json
if($taskOwner.pid -ne $taskNode.ProcessId){throw 'Owner diagnostic identity mismatch'}
# Seed an inert running marker into the live profile to verify second-start preservation; no code/provider execution.
$env:CODEWISE2_PROOF_ROW='owner-concurrency-controlled-row'
@'
import{DatabaseSync}from'node:sqlite';import{join}from'node:path';const db=new DatabaseSync(join(process.env.CODEWISE2_DATA_DIR,'codewise2.sqlite'));const row={id:process.env.CODEWISE2_PROOF_ROW,idempotencyKey:'inert-owner-proof-idempotency',status:'running',problemId:'controlled-no-execution-fixture',code:'INERT FIXTURE; no program executed',createdAt:new Date().toISOString()};db.prepare('INSERT INTO jobs VALUES (?,?,?)').run(row.id,row.idempotencyKey,JSON.stringify(row));db.close();
'@ | node --input-type=module
if($LASTEXITCODE -ne 0){throw 'Inert proof marker insert failed'}
$env:PORT="$($Port+1)"
$taskSecondStart=[DateTime]::UtcNow
$taskSecond=Start-Process powershell.exe -ArgumentList @('-NoProfile','-NonInteractive','-File',(Join-Path $taskWorkspace 'scripts/start.ps1')) -WorkingDirectory $taskWorkspace -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskData 'second.stdout.log') -RedirectStandardError (Join-Path $taskData 'second.stderr.log')
$null=$taskSecond.Handle
if(!$taskSecond.WaitForExit(15000)){throw 'Second profile admission did not fail promptly; no forced cleanup issued'}
$taskSecondRejectedMs=([DateTime]::UtcNow-$taskSecondStart).TotalMilliseconds
if($taskSecond.ExitCode -ne 1){throw 'Second same-profile CLI did not return exit1'}
if(Get-NetTCPConnection -LocalPort ($Port+1) -State Listen -ErrorAction SilentlyContinue){throw 'Rejected instance consumed a port'}
$taskRow=@'
import{DatabaseSync}from'node:sqlite';import{join}from'node:path';const db=new DatabaseSync(join(process.env.CODEWISE2_DATA_DIR,'codewise2.sqlite'),{readOnly:true});console.log(JSON.parse(db.prepare('SELECT data FROM jobs WHERE id=?').get(process.env.CODEWISE2_PROOF_ROW).data).status);db.close();
'@ | node --input-type=module
if($taskRow.Trim() -ne 'running'){throw 'Second startup changed the live job marker'}
$taskOwnerAfter=Get-Content -LiteralPath (Join-Path $taskData 'profile-owner.json') -Raw|ConvertFrom-Json
if($taskOwnerAfter.instanceId -ne $taskOwner.instanceId){throw 'Rejected startup changed owner marker'}
& scripts/stop.ps1 -Address $taskAddress|Out-Null
if(!$taskFirst.WaitForExit(30000)){throw 'Normal profile shutdown did not finish; no forced termination issued'}
if(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue){throw 'First listener remains'}
if(Test-Path -LiteralPath (Join-Path $taskData 'profile-owner.json')){throw 'Normal close did not remove its own marker'}
# A new normal CLI must reacquire the same profile after clean release.
$env:PORT="$Port"
$taskRestart=Start-Process powershell.exe -ArgumentList @('-NoProfile','-NonInteractive','-File',(Join-Path $taskWorkspace 'scripts/start.ps1')) -WorkingDirectory $taskWorkspace -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskData 'restart.stdout.log') -RedirectStandardError (Join-Path $taskData 'restart.stderr.log')
$null=$taskRestart.Handle
$taskRestartReady=$false
for($taskAttempt=0;$taskAttempt -lt 90;$taskAttempt++){try{Invoke-RestMethod "$taskAddress/api/bootstrap" -TimeoutSec 2|Out-Null;$taskRestartReady=$true;break}catch{Start-Sleep -Milliseconds 500}}
if(!$taskRestartReady){throw 'Clean-released profile did not restart'}
& scripts/stop.ps1 -Address $taskAddress|Out-Null
if(!$taskRestart.WaitForExit(30000)){throw 'Restart shutdown did not finish'}
if(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue){throw 'Restart listener remains'}
$taskResult=[ordered]@{schemaVersion=1;passed=$true;timestamp=[DateTime]::UtcNow.ToString('o');command='powershell.exe -NoProfile -NonInteractive -File scripts/prove-profile-cli.ps1';platform='win32-arm64';dataDir=$taskData;address=$taskAddress;nodePid=$taskNode.ProcessId;nodeCreation=$taskNode.CreationDate.ToUniversalTime().ToString('o');nodeCommand=$taskNode.CommandLine;owner=$taskOwner;firstReadyMs=$taskReadyMs;secondExit=$taskSecond.ExitCode;secondRejectedMs=$taskSecondRejectedMs;liveJobPreserved=$true;secondPortUnused=$true;normalStopExit=$taskFirst.ExitCode;restartStopExit=$taskRestart.ExitCode;inertMarkerOnly=$true;providerCalls=0;programExecutions=0;sharedShutdownIssued=$false;sourceHashes=@{owner=(Get-FileHash apps/server/src/profile-owner.ts).Hash;store=(Get-FileHash apps/server/src/store.ts).Hash;index=(Get-FileHash apps/server/src/index.ts).Hash;compiled=(Get-FileHash dist/server/index.mjs).Hash}}
$taskResult|ConvertTo-Json -Depth 10|Set-Content docs/release-evidence/profile-owner-actual-cli.json -Encoding UTF8
Write-Host 'Actual CLI same-profile rejection, live-row preservation, clean shutdown and restart passed.'
