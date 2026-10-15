$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$fixtureRoot = Join-Path $repoRoot ('.runtime/profile-recovery-test-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixtureRoot | Out-Null
$database = Join-Path $fixtureRoot 'codewise2.sqlite'
[IO.File]::WriteAllText($database, 'Synthetic saved-progress bytes; do not replace')
$originalHash = (Get-FileHash -LiteralPath $database).Hash
$installation = Join-Path $fixtureRoot 'synthetic-installation'
$global:codeWiseProfileRecoveryScripts = Join-Path $installation 'scripts'
$proofDirectory = Join-Path $installation 'docs/release-evidence'
New-Item -ItemType Directory -Path $proofDirectory -Force | Out-Null
$proofPath = Join-Path $proofDirectory 'runner-bootstrap-result.json'
$fixtureProof = @{distro='CodeWise2Runner';distroCreatedByBootstrap=$true;workspace=$installation;ownerSid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value}
$fixtureProof | ConvertTo-Json | Set-Content -LiteralPath $proofPath
$recoverySource = [IO.File]::ReadAllText((Join-Path $repoRoot 'scripts/repair-runner-profile.ps1'))
$recover = [scriptblock]::Create($recoverySource.Replace('$PSScriptRoot', '$global:codeWiseProfileRecoveryScripts'))
$global:codeWiseProfileRecoveryCopies = 0
function Test-Path {
    param([string]$LiteralPath)
    if ($LiteralPath -eq '\\wsl.localhost\CodeWise2Runner\var\lib\codewise2-runner\token') { return $true }
    return Microsoft.PowerShell.Management\Test-Path -LiteralPath $LiteralPath
}
function Copy-Item {
    param([string]$LiteralPath, [string]$Destination)
    if ($LiteralPath -ne '\\wsl.localhost\CodeWise2Runner\var\lib\codewise2-runner\token' -or -not $Destination.StartsWith($fixtureRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Unexpected credential transfer in synthetic test' }
    $global:codeWiseProfileRecoveryCopies++
    [IO.File]::WriteAllText($Destination, 'SYNTHETIC_TEST_CREDENTIAL')
}
& $recover -DataDirectory $fixtureRoot
if ($global:codeWiseProfileRecoveryCopies -ne 1 -or (Get-FileHash -LiteralPath $database).Hash -ne $originalHash) { throw 'Recovery must preserve learning data and transfer only a missing credential' }
$config = Get-Content -LiteralPath (Join-Path $fixtureRoot 'runner.json') -Raw | ConvertFrom-Json
if ($config.schemaVersion -ne 1 -or $config.endpoint -ne 'http://127.0.0.1:2358') { throw 'Recovered configuration is not the fixed loopback runner' }
$tokenHash = (Get-FileHash -LiteralPath (Join-Path $fixtureRoot 'credentials/runner/token')).Hash
& $recover -DataDirectory $fixtureRoot
if ($global:codeWiseProfileRecoveryCopies -ne 1 -or (Get-FileHash -LiteralPath (Join-Path $fixtureRoot 'credentials/runner/token')).Hash -ne $tokenHash) { throw 'Recovery replaced an existing credential' }
$fixtureProof.ownerSid = 'S-1-5-21-0'
$fixtureProof | ConvertTo-Json | Set-Content -LiteralPath $proofPath
$refused = $false
$wrongOwnerTarget = Join-Path $fixtureRoot 'wrong-owner-profile'
try { & $recover -DataDirectory $wrongOwnerTarget } catch { $refused = $_.Exception.Message -match 'does not match' }
if (-not $refused -or (Test-Path -LiteralPath $wrongOwnerTarget) -or $global:codeWiseProfileRecoveryCopies -ne 1) { throw 'Unknown ownership must fail before changing any profile or credential' }
Write-Host 'Synthetic profile recovery preserves progress and existing credentials.'
