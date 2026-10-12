$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../../scripts/prepare-runner.ps1"
function Assert([bool]$Value, [string]$Message) { if (-not $Value) { throw $Message } }
foreach ($scenario in @('ready','expired','decline','approved','bad-controls','command-failure')) {
    $script:calls = @()
    $script:probes = 0
    $script:confirmed = 0
    $script:scenario = $scenario
    $run = {
        param([string[]]$Arguments)
        $script:calls += ($Arguments -join ' ')
        if ($Arguments[-1] -eq 'inspect') {
            $current = if ($script:scenario -in @('decline','approved')) { '|collector' } else { 'core' }
            return (@{current=$current} | ConvertTo-Json)
        }
        if ($script:scenario -eq 'command-failure') { throw 'Simulated verifier failure' }
    }
    $probe = {
        $script:probes++
        $ready = $script:scenario -eq 'ready' -or ($script:probes -gt 1 -and $script:scenario -ne 'bad-controls')
        return @{ready=$ready; controlsVerified=$ready; message='Simulated controls mismatch'}
    }
    $confirm = { $script:confirmed++; if ($script:scenario -eq 'approved') { 'YES' } else { 'NO' } }
    $failed = $false
    try { Initialize-CodeWiseRunner -RunWsl $run -Probe $probe -Confirm $confirm } catch { $failed = $true }
    Assert ($failed -eq ($scenario -in @('decline','bad-controls','command-failure'))) "$scenario failure handling"
    $applied = @($script:calls | Where-Object { $_ -like '*core-policy.py apply' }).Count
    Assert ($applied -eq [int]($scenario -eq 'approved')) "$scenario unauthorized policy write"
    if ($scenario -eq 'ready') { Assert ($script:calls.Count -eq 1 -and $script:confirmed -eq 0) 'Ready runner should not run fixtures or prompt' }
    if ($scenario -eq 'decline') { Assert ($script:calls.Count -eq 1) 'Declined recovery must not start service or run fixtures' }
    if ($scenario -eq 'expired') { Assert ($script:confirmed -eq 0 -and $script:calls[-1] -like '*verify-canaries.py') 'Expiry should refresh without policy change' }
}
Write-Host 'Six runner preflight scenarios passed.'
