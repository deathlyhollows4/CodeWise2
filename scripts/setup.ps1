$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
node --version
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Dependency setup failed.' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
