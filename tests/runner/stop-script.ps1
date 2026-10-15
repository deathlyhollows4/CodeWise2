$ErrorActionPreference='Stop'
$stopScript=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../scripts/stop.ps1'))
$global:codeWiseStopPosts=0
$global:codeWiseStopScenario='offline'
function netstat.exe {
    $global:LASTEXITCODE=0
    if($global:codeWiseStopScenario -eq 'occupied'){ '  TCP    127.0.0.1:3000    0.0.0.0:0    LISTENING    99999' }
}
function Invoke-RestMethod {
    param($Uri,$WebSession,$TimeoutSec,$Method,$ContentType,$Headers,$Body)
    if($Method -eq 'Post') {
        $global:codeWiseStopPosts++
        if($global:codeWiseStopScenario -eq 'post-failed'){throw 'Shutdown refused'}
        if($Headers.Origin -ne 'http://127.0.0.1:3000' -or $Headers.'X-CSRF-Token' -ne 'synthetic-csrf'){throw 'Invalid shutdown request'}
        return @{ok=$true}
    }
    if($global:codeWiseStopScenario -in @('offline','occupied') -or $global:codeWiseStopPosts -gt 0){throw 'Connection unavailable'}
    if($global:codeWiseStopScenario -eq 'unrelated'){return @{csrfToken='synthetic-csrf'}}
    return @{csrfToken='synthetic-csrf';catalogue=@{published=243};storagePath='synthetic-profile'}
}
foreach($scenario in @('offline','occupied','unrelated','success','post-failed')) {
    $global:codeWiseStopScenario=$scenario
    $global:codeWiseStopPosts=0
    $failed=$false
    try { & $stopScript -Address 'http://127.0.0.1:3000/' } catch { $failed=$true }
    if($failed -ne ($scenario -in @('occupied','unrelated','post-failed'))){throw "$scenario failure handling"}
    $expectedPosts=if($scenario -in @('success','post-failed')){1}else{0}
    if($global:codeWiseStopPosts -ne $expectedPosts){throw "$scenario unexpected shutdown request"}
}
Write-Host 'Stop script handles already-stopped, occupied, unrelated, successful, and failed shutdown scenarios.'
