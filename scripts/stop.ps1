param([string]$Address='http://127.0.0.1:3000')
$ErrorActionPreference='Stop'
$taskUri=[Uri]$Address
if($taskUri.Scheme -ne 'http' -or $taskUri.Host -notin @('127.0.0.1','localhost') -or $taskUri.UserInfo -or $taskUri.Query -or $taskUri.Fragment -or $taskUri.AbsolutePath -ne '/'){throw 'Use the printed CodeWise2 loopback address.'}
$Address=$taskUri.GetLeftPart([UriPartial]::Authority)
function Test-CodeWiseListener {
    $sockets=@(& netstat.exe -ano -p tcp)
    if($LASTEXITCODE -ne 0){throw 'Could not verify listening ports. No process was stopped.'}
    $pattern='^\s*TCP\s+\S+:'+$taskUri.Port+'\s+\S+\s+LISTENING\s+\d+\s*$'
    return @($sockets | Where-Object { $_ -match $pattern }).Count -gt 0
}
$taskSession=New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $taskBootstrap=Invoke-RestMethod -Uri "$Address/api/bootstrap" -WebSession $taskSession -TimeoutSec 5
} catch {
    if(-not (Test-CodeWiseListener)) {
        Write-Host "CodeWise2 is already stopped at $Address. Nothing needed closing."
        exit 0
    }
    throw "A service is listening on port $($taskUri.Port), but CodeWise2 could not be reached. No process was stopped. Check the app terminal."
}
if(-not $taskBootstrap.csrfToken -or -not $taskBootstrap.catalogue -or -not $taskBootstrap.storagePath){throw 'This address did not return a CodeWise2 bootstrap response. No shutdown was requested.'}
$null=Invoke-RestMethod -Uri "$Address/api/lifecycle/stop" -Method Post -WebSession $taskSession -TimeoutSec 5 -ContentType 'application/json' -Headers @{'Origin'=$Address;'X-CSRF-Token'=$taskBootstrap.csrfToken} -Body '{}'
$taskDeadline=[DateTime]::UtcNow.AddSeconds(20)
while(Test-CodeWiseListener) {
    if([DateTime]::UtcNow -ge $taskDeadline){throw 'Shutdown was requested, but the port is still listening. Check the app terminal; no process was forcibly stopped.'}
    Start-Sleep -Milliseconds 250
}
$taskHttpReachable=$false
try { $null=Invoke-RestMethod -Uri "$Address/api/bootstrap" -TimeoutSec 2; $taskHttpReachable=$true } catch {}
if($taskHttpReachable){throw 'The address responded again after shutdown. Check the app terminal; no additional process was stopped.'}
Write-Host 'CodeWise2 stopped. Your durable work is preserved.'
