param([Parameter(Mandatory=$true)][string]$ProofFile,[Parameter(Mandatory=$true)][string]$Address,[switch]$Grading)
$ErrorActionPreference='Stop'
$taskProof=Get-Content -LiteralPath $ProofFile | ConvertFrom-Json -DateKind String
$taskPid=$taskProof.launchPid
$taskOwner=Get-CimInstance Win32_Process -Filter ("ProcessId="+$taskPid)
if(-not $taskOwner -or $taskOwner.Name -ne 'node.exe' -or $taskOwner.CommandLine -notmatch 'tests/frontend/fixture-final-provider.ts' -or $taskOwner.CreationDate.ToUniversalTime().ToString('o') -ne $taskProof.processCreation){throw 'Owned fixture identity changed; refusing restart'}
$taskUri=[Uri]$Address
if($taskUri.Host -ne '127.0.0.1' -or $taskUri.Port -notin @(3191,3192)){throw 'Only the explicitly owned final fixtures may restart'}
if(-not(netstat.exe -ano | Select-String ("127.0.0.1:"+$taskUri.Port+"\s+.*LISTENING\s+"+$taskPid+"\s*$"))){throw 'Owned fixture listener missing'}
$taskRoot=[IO.Path]::GetFullPath((Join-Path (Get-Location).Path '.runtime'))
$taskData=[IO.Path]::GetFullPath($taskProof.dataDir)
if(-not $taskData.StartsWith($taskRoot+[IO.Path]::DirectorySeparatorChar)){throw 'Profile outside intended workspace'}
$taskNode=$taskOwner.ExecutablePath
& ./scripts/stop.ps1 -Address $Address
$taskDeadline=(Get-Date).AddSeconds(8)
do{$taskGone=-not(netstat.exe -ano | Select-String ("127.0.0.1:"+$taskUri.Port+"\s+.*LISTENING"));if($taskGone){break};Start-Sleep -Milliseconds 100}while((Get-Date)-lt $taskDeadline)
if(-not$taskGone){throw 'Owned listener did not close'}
$env:PORT=[string]$taskUri.Port
$env:CODEWISE2_FIXTURE_DATA_DIR=$taskData
$env:CODEWISE2_FINAL_JOURNEY_GRADING=if($Grading){'1'}else{'0'}
$taskStem=if($Grading){'frontend-final-native'}else{'frontend-final-provider'}
$taskNew=Start-Process -FilePath $taskNode -ArgumentList @('--import','tsx','tests/frontend/fixture-final-provider.ts') -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -PassThru -RedirectStandardOutput ("docs/release-evidence/"+$taskStem+"-restart.stdout.log") -RedirectStandardError ("docs/release-evidence/"+$taskStem+"-restart.stderr.log")
$taskNewOwner=Get-CimInstance Win32_Process -Filter ("ProcessId="+$taskNew.Id)
$taskRecord=@{launchPid=$taskNew.Id;processCreation=$taskNewOwner.CreationDate.ToUniversalTime().ToString('o');dataDir=$taskData;oldPid=$taskPid;oldCreation=$taskProof.processCreation;oldIdentityVerified=$true;gracefulStop=$true;listenerAbsentBeforeStart=$true;gradingEnabled=[bool]$Grading;startedAt=(Get-Date).ToUniversalTime().ToString('o')}
$taskRecord | ConvertTo-Json | Set-Content -LiteralPath $ProofFile
$taskRecord | ConvertTo-Json | Set-Content -LiteralPath ("docs/release-evidence/"+$taskStem+"-restart-lifecycle.json")
