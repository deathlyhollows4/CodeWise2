@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0.runtime\powershell7\pwsh.exe" (
  "%~dp0.runtime\powershell7\pwsh.exe" -NoProfile -File "%~dp0scripts\start.ps1" %*
  exit /b
)
if exist "%ProgramFiles%\PowerShell\7\pwsh.exe" (
  "%ProgramFiles%\PowerShell\7\pwsh.exe" -NoProfile -File "%~dp0scripts\start.ps1" %*
  exit /b
)
echo Standalone PowerShell 7 is required. Microsoft Store PowerShell can redirect access to your learning data.
echo Install the standalone MSI or ZIP package from https://learn.microsoft.com/powershell/scripting/install/install-powershell-on-windows
exit /b 1
