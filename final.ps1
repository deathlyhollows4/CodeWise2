param([switch]$ReadingOnly, [switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Exit-CodeWiseLauncher {
    param([int]$Code)
    exit $Code
}

function Get-ZipRuntime {
    param([string]$Url, [string]$HashUrl, [string]$Asset, [string]$Destination)
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $scratch = Join-Path $PSScriptRoot '.runtime'
    New-Item -ItemType Directory -Path $scratch -Force | Out-Null
    $archive = Join-Path $scratch $Asset
    $hashFile = Join-Path $scratch ($Asset + '.sha256')
    Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $archive
    Invoke-WebRequest -UseBasicParsing -Uri $HashUrl -OutFile $hashFile
    $row = Get-Content -LiteralPath $hashFile | Where-Object { $_ -match ([regex]::Escape($Asset) + '$') } | Select-Object -First 1
    $expected = [regex]::Match([string]$row, '[a-fA-F0-9]{64}').Value
    if (-not $expected -or (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) { throw 'Runtime download failed its official SHA256 check. Nothing will be executed.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $Destination -Force
}

try {
    if (-not ('CodeWisePackageIdentity' -as [type])) {
        Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class CodeWisePackageIdentity {
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode)]
    public static extern int GetCurrentPackageFullName(ref int length, StringBuilder name);
    public static bool IsPackaged() { int length=0; return GetCurrentPackageFullName(ref length, null)!=15700; }
}
'@
    }
    $packagedShell = [CodeWisePackageIdentity]::IsPackaged()
    # Windows PowerShell 5.1 can bootstrap this file. Use a non-Store PS7 for app data.
    $architecture = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') { 'arm64' } else { 'x64' }
    $runtime = Join-Path $PSScriptRoot '.runtime/powershell7/pwsh.exe'
    if (-not (Test-Path -LiteralPath $runtime)) {
        $installed = Join-Path $env:ProgramFiles 'PowerShell/7/pwsh.exe'
        if (Test-Path -LiteralPath $installed) { $runtime = $installed }
        elseif ($PSVersionTable.PSVersion.Major -ge 7 -and -not $packagedShell) { $runtime = Join-Path $PSHOME 'pwsh.exe' }
        else {
            if ($CheckOnly) { throw 'Standalone PowerShell is missing. Run final.ps1 normally to download it automatically.' }
            Write-Host 'Preparing standalone PowerShell (one-time download).'
            $asset = "PowerShell-7.6.7-win-$architecture.zip"
            Get-ZipRuntime -Url "https://github.com/PowerShell/PowerShell/releases/download/v7.6.7/$asset" -HashUrl 'https://github.com/PowerShell/PowerShell/releases/download/v7.6.7/hashes.sha256' -Asset $asset -Destination (Split-Path $runtime -Parent)
        }
    }
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath)
    if ($ReadingOnly) { $arguments += '-ReadingOnly' }
    if ($CheckOnly) { $arguments += '-CheckOnly' }
    if ($packagedShell) {
        # A plain child and UAC can both inherit Store filesystem virtualization.
        & $runtime @arguments
        Exit-CodeWiseLauncher $LASTEXITCODE
    }
    if ($PSVersionTable.PSVersion.Major -lt 7 -or [IO.Path]::GetFullPath((Join-Path $PSHOME 'pwsh.exe')) -ne [IO.Path]::GetFullPath($runtime)) {
        & $runtime @arguments
        Exit-CodeWiseLauncher $LASTEXITCODE
    }
    # Ensure nested setup commands find this exact standalone PowerShell.
    $env:PATH = (Split-Path $runtime -Parent) + [IO.Path]::PathSeparator + $env:PATH
    $cachedNodeDirectory = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '.runtime/node24') -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "^node-v24\.[0-9]+\.[0-9]+-win-$architecture$" -and (Test-Path (Join-Path $_.FullName 'node.exe')) } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($cachedNodeDirectory) { $env:PATH = $cachedNodeDirectory.FullName + [IO.Path]::PathSeparator + $env:PATH }
    $nodeReady = $false
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $version = & node -p 'Number(process.versions.node.split(".")[0])' 2>$null
        $nodeReady = $LASTEXITCODE -eq 0 -and [int]$version -ge 24
    }
    if (-not $nodeReady) {
        if ($CheckOnly) { throw 'Node.js 24+ is missing. Normal startup will download it automatically.' }
        Write-Host 'Preparing Node.js 24 (one-time download).'
        $base = 'https://nodejs.org/dist/latest-v24.x/'
        $hashes = (Invoke-WebRequest -UseBasicParsing ($base + 'SHASUMS256.txt')).Content
        if ($hashes -is [byte[]]) { $hashes = [Text.Encoding]::UTF8.GetString($hashes) }
        $asset = [regex]::Match([string]$hashes, "node-v24\.[0-9]+\.[0-9]+-win-$architecture\.zip").Value
        if (-not $asset) { throw 'Official Node.js runtime could not be identified.' }
        $nodeRoot = Join-Path $PSScriptRoot '.runtime/node24'
        $existingNode = Join-Path $nodeRoot (($asset -replace '\.zip$', '') + '/node.exe')
        if (-not (Test-Path $existingNode)) { Get-ZipRuntime -Url ($base + $asset) -HashUrl ($base + 'SHASUMS256.txt') -Asset $asset -Destination $nodeRoot }
        $env:PATH = (Split-Path $existingNode -Parent) + [IO.Path]::PathSeparator + $env:PATH
        & node -e 'if(Number(process.versions.node.split(".")[0])<24)process.exit(1)'
        if ($LASTEXITCODE -ne 0) { throw 'Node.js startup check failed.' }
    }
    . (Join-Path $PSScriptRoot 'scripts/prepare-runner.ps1')
    $folders = Resolve-CodeWiseDataFolders
    $env:CODEWISE2_DATA_DIR = $folders.DataDirectory
    $env:CODEWISE2_RUNNER_DATA_DIR = $folders.RunnerDirectory
    $hasRunner = (Test-Path -LiteralPath (Join-Path $folders.RunnerDirectory 'runner.json')) -and (Test-Path -LiteralPath (Join-Path $folders.RunnerDirectory 'credentials/runner/token'))
    if (-not $hasRunner -and -not $ReadingOnly) {
        $knownDistros = (& wsl.exe --list --quiet 2>&1 | Out-String).Replace("`0", '')
        if ($knownDistros -match 'ERROR_TIMEOUT') { Assert-CodeWiseWslResult -ExitCode $LASTEXITCODE -Output $knownDistros }
        if ($knownDistros -match '(?m)^\s*CodeWise2Runner\s*$') {
            if ($CheckOnly) { throw 'The runner exists but profile files are missing. Normal final.ps1 startup restores them from the verified existing installation.' }
            & (Join-Path $PSScriptRoot 'scripts/repair-runner-profile.ps1') -DataDirectory $folders.RunnerDirectory
            $hasRunner = (Test-Path -LiteralPath (Join-Path $folders.RunnerDirectory 'runner.json')) -and (Test-Path -LiteralPath (Join-Path $folders.RunnerDirectory 'credentials/runner/token'))
            if (-not $hasRunner -and -not $ReadingOnly) { throw 'Runner profile recovery did not complete.' }
        }
    }
    if (-not $CheckOnly) {
        foreach ($port in 3000..3010) {
            $boot = $null
            try { $boot = Invoke-RestMethod "http://127.0.0.1:$port/api/bootstrap" -TimeoutSec 1 } catch {}
            if ($boot.csrfToken -and $boot.catalogue -and $boot.storagePath -eq $folders.DataDirectory) {
                if ($boot.runner.ready -or $ReadingOnly) { Write-Host "CodeWise2 is already running: http://127.0.0.1:$port"; Exit-CodeWiseLauncher 0 }
                throw "Your app is already running with the runner unavailable. Stop it safely with .\scripts\stop.ps1 -Address http://127.0.0.1:$port, then run final.ps1 again."
            }
        }
    }

    # Hash application inputs: ordinary sessions skip install/build; changed source rebuilds.
    $inputs = @(Get-Item package.json, package-lock.json, tsconfig.json, vite.config.ts)
    foreach ($directory in @('apps','packages','content')) { $inputs += Get-ChildItem -LiteralPath $directory -File -Recurse }
    $identityText = (($inputs | Sort-Object FullName | ForEach-Object { $_.FullName.Substring($PSScriptRoot.Length) + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }) -join "`n")
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $identity = ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($identityText)))).Replace('-', '') } finally { $sha.Dispose() }
    $marker = Join-Path $PSScriptRoot '.runtime/final-build.sha256'
    $lastBuild = if (Test-Path $marker) { (Get-Content $marker -Raw).Trim() } else { '' }
    $needsDependencies = -not (Test-Path node_modules/tsx) -or -not (Test-Path node_modules/.package-lock.json)
    $needsBuild = $lastBuild -ne $identity -or -not (Test-Path dist/server/index.mjs) -or -not (Test-Path dist/web/index.html)
    if ($CheckOnly) {
        Write-Host "Standalone PowerShell ready. Node ready. Learning data: $($folders.DataDirectory)"
        Write-Host "Setup/build needed: $($needsDependencies -or $needsBuild). Existing runner configuration: $hasRunner"
        Exit-CodeWiseLauncher 0
    }
    if ($needsDependencies -or $needsBuild) {
        Write-Host 'Preparing the app. Future unchanged sessions skip this step.'
        & $runtime -NoProfile -File scripts/setup.ps1
        if ($LASTEXITCODE -ne 0) { throw 'App setup failed. Rerun final.ps1 after resolving the displayed error.' }
        New-Item -ItemType Directory -Path (Split-Path $marker -Parent) -Force | Out-Null
        Set-Content -LiteralPath $marker -Value $identity
    }
    if (-not $ReadingOnly -and -not $hasRunner) {
        $distros = (& wsl.exe --list --quiet 2>&1 | Out-String).Replace("`0", '')
        if ($distros -match 'ERROR_TIMEOUT') { Assert-CodeWiseWslResult -ExitCode $LASTEXITCODE -Output $distros }
        if ($distros -match '(?m)^\s*CodeWise2Runner\s*$') { throw "Existing runner found, but its profile configuration is missing at '$($folders.RunnerDirectory)'. It will not be replaced. Check your data-directory override." }
        & wsl.exe --version *> $null
        if ($LASTEXITCODE -ne 0) {
            Write-Host 'Windows needs WSL. Approve the Windows permission prompt; restart if Windows requests it, then run final.ps1 again.'
            $wslInstaller = Join-Path $PSScriptRoot 'infra/runner/install-wsl.ps1'
            $process = Start-Process $runtime -ArgumentList "-NoProfile -File `"$wslInstaller`" -Install -PlatformOnly" -Verb RunAs -Wait -PassThru
            if ($process.ExitCode -ne 0) { throw 'WSL platform setup did not complete.' }
            throw 'WSL platform setup finished. Restart Windows if requested, then run final.ps1 again.'
        }
        & $runtime -NoProfile -File scripts/setup.ps1 -InstallRunner
        if ($LASTEXITCODE -ne 0) { throw 'Runner setup did not complete. Your existing learning data is preserved.' }
    }
    # Keep startup exceptions in this terminal so the actual cause stays visible.
    & (Join-Path $PSScriptRoot 'scripts/start.ps1') -ReadingOnly:$ReadingOnly
    $startExit = $LASTEXITCODE
    if ($startExit -ne 0) { throw "App startup failed (exit $startExit). See the startup window output above." }
    Exit-CodeWiseLauncher 0
} catch {
    Write-Host ("CodeWise2: " + $_.Exception.Message) -ForegroundColor Red
    Exit-CodeWiseLauncher 1
}
