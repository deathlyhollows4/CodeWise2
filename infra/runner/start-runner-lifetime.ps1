param([ValidateRange(60,28800)][int]$Seconds=28800)
$ErrorActionPreference='Stop'
$workspace=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$evidence=Join-Path $workspace 'docs/release-evidence'
$statePath=Join-Path $evidence 'runner-lifetime.json'
$owner=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
$bootstrap=Get-Content -Raw -LiteralPath (Join-Path $evidence 'runner-bootstrap-result.json')|ConvertFrom-Json
if($bootstrap.distro -ne 'CodeWise2Runner' -or $bootstrap.distroCreatedByBootstrap -ne $true -or $bootstrap.workspace -ne $workspace -or $bootstrap.ownerSid -ne $owner){throw 'Dedicated distro ownership not verified'}
if(Test-Path -LiteralPath $statePath){
 $previous=Get-Content -Raw -LiteralPath $statePath|ConvertFrom-Json
 $live=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$previous.pid) -ErrorAction SilentlyContinue
 if($live -and $previous.creationDate -eq $live.CreationDate.ToUniversalTime().ToString('o') -and $previous.ownerSid -eq $owner -and $previous.workspace -eq $workspace -and $live.Name -eq 'wsl.exe' -and $live.CommandLine -match '--distribution CodeWise2Runner --user root --cd /root --exec /bin/sleep '){
  Write-Host ('Existing owned runner lifetime PID '+$live.ProcessId);exit 0
 }
 if($live){throw 'Previous lifetime PID now has an unexpected identity; refusing duplicate startup'}
}
$arguments='--distribution CodeWise2Runner --user root --cd /root --exec /bin/sleep '+$Seconds
$process=Start-Process -FilePath (Join-Path $env:WINDIR 'System32/wsl.exe') -ArgumentList $arguments -WindowStyle Hidden -PassThru
Start-Sleep -Milliseconds 500
if($process.HasExited){throw ('Named distro lifetime client exited: '+$process.ExitCode)}
$identity=Get-CimInstance Win32_Process -Filter ('ProcessId='+$process.Id)
@{schemaVersion=1;pid=$process.Id;creationDate=$identity.CreationDate.ToUniversalTime().ToString('o');expiresAt=$identity.CreationDate.AddSeconds($Seconds).ToUniversalTime().ToString('o');ownerSid=$owner;workspace=$workspace;distro='CodeWise2Runner';arguments=$arguments;startedAt=(Get-Date).ToUniversalTime().ToString('o');maximumSeconds=$Seconds;policyReapplied=$false}|ConvertTo-Json|Set-Content -LiteralPath $statePath
Write-Host ('Owned CodeWise2Runner host client started, PID '+$process.Id+'. No crash policy was changed; current readiness still requires verification.')
