param([string]$Address='http://127.0.0.1:3000')
$ErrorActionPreference='Stop'
$taskUri=[Uri]$Address
if($taskUri.Scheme -ne 'http' -or $taskUri.Host -notin @('127.0.0.1','localhost')){throw 'Use the printed CodeWise2 loopback address.'}
$taskSession=New-Object Microsoft.PowerShell.Commands.WebRequestSession
$taskBootstrap=Invoke-RestMethod -Uri "$Address/api/bootstrap" -WebSession $taskSession
Invoke-RestMethod -Uri "$Address/api/lifecycle/stop" -Method Post -WebSession $taskSession -ContentType 'application/json' -Headers @{'Origin'=$Address;'X-CSRF-Token'=$taskBootstrap.csrfToken} -Body '{}'
Write-Host 'CodeWise2 requested shutdown. Your durable work is preserved.'
