$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/../../scripts/prepare-runner.ps1"
function Assert([bool]$Value, [string]$Message) { if (-not $Value) { throw $Message } }
Assert-CodeWiseWslResult -ExitCode 0 -Output ''
$timeoutCaught = $false
try { Assert-CodeWiseWslResult -ExitCode 1 -Output "W`0s`0l/Service/ERROR_TIMEOUT" } catch {
    $timeoutCaught = $_.Exception.Message -match 'restart Windows' -and $_.Exception.Message -notmatch "`0"
}
Assert $timeoutCaught 'WSL timeout should explain recovery without unreadable null characters'
$otherFailure = $false
try { Assert-CodeWiseWslResult -ExitCode 1 -Output 'Access denied' } catch { $otherFailure = $_.Exception.Message -match 'Access denied' }
Assert $otherFailure 'Other WSL failures must retain the actual error'
$savedLocalAppData = $env:LOCALAPPDATA
try {
    $env:LOCALAPPDATA = 'C:\RedirectedShell\Local'
    $paths = Resolve-CodeWiseDataFolders -KnownLocalAppData 'C:\RealProfile\Local' -DataOverride '' -RunnerOverride '' -MachineProfileFile ''
    Assert ($paths.DataDirectory -eq 'C:\RealProfile\Local\CodeWise2') 'Default profile must use registered Windows folder, not redirected shell environment'
    Assert ($paths.RunnerDirectory -eq $paths.DataDirectory) 'Default runner and learning profiles must match'
    $paths = Resolve-CodeWiseDataFolders -KnownLocalAppData 'C:\RealProfile\Local' -DataOverride 'D:\Learning' -RunnerOverride '' -MachineProfileFile ''
    Assert ($paths.DataDirectory -eq 'D:\Learning' -and $paths.RunnerDirectory -eq 'D:\Learning') 'Explicit learning data override must be preserved'
    $paths = Resolve-CodeWiseDataFolders -KnownLocalAppData 'C:\RealProfile\Local' -DataOverride 'D:\Learning' -RunnerOverride 'D:\Runner' -MachineProfileFile ''
    Assert ($paths.RunnerDirectory -eq 'D:\Runner' -and $paths.DataDirectory -eq 'D:\Learning') 'Separate explicit runner override must be preserved'
} finally { $env:LOCALAPPDATA = $savedLocalAppData }
$fixtureDir = Join-Path ([IO.Path]::GetTempPath()) ('codewise-profile-selection-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixtureDir | Out-Null
$selectionFile = Join-Path $fixtureDir 'selection.json'
[IO.File]::WriteAllText((Join-Path $fixtureDir 'codewise2.sqlite'), 'synthetic database placeholder')
@{schemaVersion=1;dataDirectory=$fixtureDir;runnerDirectory='D:\ExistingRunner'} | ConvertTo-Json | Set-Content -LiteralPath $selectionFile
$paths = Resolve-CodeWiseDataFolders -DataOverride '' -RunnerOverride '' -MachineProfileFile $selectionFile
Assert ($paths.DataDirectory -eq $fixtureDir -and $paths.RunnerDirectory -eq 'D:\ExistingRunner') 'Selected stable profile must retain the existing runner directory'
$paths = Resolve-CodeWiseDataFolders -DataOverride 'D:\ExplicitProfile' -RunnerOverride '' -MachineProfileFile $selectionFile
Assert ($paths.DataDirectory -eq 'D:\ExplicitProfile' -and $paths.RunnerDirectory -eq 'D:\ExplicitProfile') 'Explicit profile overrides must remain effective'
Remove-Item -LiteralPath (Join-Path $fixtureDir 'codewise2.sqlite')
$missingRejected = $false
try { Resolve-CodeWiseDataFolders -DataOverride '' -RunnerOverride '' -MachineProfileFile $selectionFile | Out-Null } catch { $missingRejected = $_.Exception.Message -match 'No empty replacement' }
Assert $missingRejected 'A missing selected database must fail without silently creating an empty profile'
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
