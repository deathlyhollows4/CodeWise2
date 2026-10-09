# Completes ONLY the unattempted start phase of the already-authorized one restart.
$ErrorActionPreference='Stop'
$serviceName='WslService'
$workspace=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$evidence=Join-Path $workspace 'docs/release-evidence'
New-Item -ItemType Directory -Path $evidence -Force|Out-Null
$service=Get-CimInstance Win32_Service -Filter "Name='WslService'"
$expected=[IO.Path]::GetFullPath((Join-Path $env:ProgramFiles 'WSL/wslservice.exe'))
if(-not $service -or $service.Name -ne $serviceName -or $service.PathName.Trim('"') -ne $expected -or -not(Test-Path -LiteralPath $expected)){throw 'Exact installed WSL service identity not verified'}
if($service.State -ne 'Stopped'){throw 'Service is not Stopped; no start attempted'}
$principal=[Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'This approved start phase requires Windows UAC Administrator elevation'}
$result=@{schemaVersion=1;scope='Complete unattempted start phase only';beforeState=$service.State;beforeProcessId=$service.ProcessId;startedAt=(Get-Date).ToUniversalTime().ToString('o');status='running';stopIssued=$false;restartIssued=$false;configChanged=$false;windowsReboot=$false}
$resultPath=Join-Path $evidence 'wsl-service-start-only-result.json'
$result|ConvertTo-Json|Set-Content -LiteralPath $resultPath
$transcript=Join-Path $evidence ('wsl-service-start-only-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.txt')
Start-Transcript -LiteralPath $transcript -Force|Out-Null
$code=0
try{
 $controller=[System.ServiceProcess.ServiceController]::new($serviceName);$controller.Refresh()
 if($controller.Status -ne [System.ServiceProcess.ServiceControllerStatus]::Stopped){throw 'Service state changed; no start attempted'}
 $controller.Start();$result.startIssued=$true
 $controller.WaitForStatus([System.ServiceProcess.ServiceControllerStatus]::Running,[TimeSpan]::FromSeconds(30))
 $result.status='start-phase-completed'
}catch{$code=1;$result.status='failed-or-timeout';$result.error=$_.Exception.Message;Write-Host $result.error}
finally{try{$result.afterState=(Get-Service -Name $serviceName).Status.ToString()}catch{$result.afterState='unknown'};Stop-Transcript|Out-Null;$result.exitCode=$code;$result.completedAt=(Get-Date).ToUniversalTime().ToString('o');$result.transcript=$transcript;$result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath $resultPath}
exit $code
