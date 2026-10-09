param([switch]$Restart)
$ErrorActionPreference='Stop'
$serviceName='WslService'
$workspaceRoot=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$evidenceRoot=Join-Path $workspaceRoot 'docs/release-evidence'
New-Item -ItemType Directory -Path $evidenceRoot -Force|Out-Null
$service=Get-CimInstance Win32_Service -Filter "Name='WslService'"
$expectedExecutable=[IO.Path]::GetFullPath((Join-Path $env:ProgramFiles 'WSL/wslservice.exe'))
$actualExecutable=if($service){$service.PathName.Trim('"')}else{''}
if(-not $service -or $service.Name -ne 'WslService' -or $actualExecutable -ne $expectedExecutable -or -not(Test-Path -LiteralPath $expectedExecutable)){throw 'Exact installed Windows WSL service identity not verified'}
$before=@{name=$service.Name;state=$service.State;processId=$service.ProcessId;path=$service.PathName;capturedAt=(Get-Date).ToUniversalTime().ToString('o')}
if(-not $Restart){$before|ConvertTo-Json;Write-Host 'Inspection only. Restart would interrupt shared WSL workloads; no restart performed.';exit 0}
$principal=[Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if(-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'Approved exact-service recovery needs Administrator elevation through Windows UAC.'}
$result=@{schemaVersion=1;scope='One restart of exact Windows WslService';before=$before;status='running';windowsReboot=$false;configChanged=$false;corePolicyApplied=$false;knownRegisteredDistro='CodeWise2Runner';otherUserWorkloads='Unverified; shared WSL sessions may be interrupted'}
$recoveryExit=0
$resultPath=Join-Path $evidenceRoot 'wsl-service-recovery-result.json'
$result|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $resultPath
$transcript=Join-Path $evidenceRoot ('wsl-service-recovery-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.txt')
Start-Transcript -LiteralPath $transcript -Force|Out-Null
try{
 $controller=[System.ServiceProcess.ServiceController]::new($serviceName)
 $controller.Refresh()
 if($controller.Status -ne [System.ServiceProcess.ServiceControllerStatus]::Stopped){
  Write-Host 'Stopping only Windows WslService. WSL sessions may be interrupted.'
  $controller.Stop()
  $controller.WaitForStatus([System.ServiceProcess.ServiceControllerStatus]::Stopped,[TimeSpan]::FromSeconds(30))
 }
 Write-Host 'Starting the same WslService once. No reboot or configuration changes.'
 $controller.Start()
 $controller.WaitForStatus([System.ServiceProcess.ServiceControllerStatus]::Running,[TimeSpan]::FromSeconds(30))
 $controller.Refresh();$result.status='exact-service-restarted';$result.afterState=$controller.Status.ToString()
}catch{$recoveryExit=1;$result.status='failed-or-timeout';$result.error=$_.Exception.Message;Write-Host $result.error}
finally{try{$after=Get-Service -Name $serviceName;$result.afterState=$after.Status.ToString()}catch{$result.afterState='unavailable'};Stop-Transcript|Out-Null;$result.completedAt=(Get-Date).ToUniversalTime().ToString('o');$result.transcript=$transcript;$result.exitCode=$recoveryExit;$result|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $resultPath}
exit $recoveryExit
# No force-kill, retries, wsl --shutdown, reboot, distro reset/unregister, or unrelated service action.
