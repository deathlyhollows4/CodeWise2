param([Parameter(Mandatory=$true)][string]$DataDirectory)
$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'Runner profile recovery requires standalone PowerShell 7.' }
$workspace = Split-Path $PSScriptRoot -Parent
$proofPath = Join-Path $workspace 'docs/release-evidence/runner-bootstrap-result.json'
if (-not (Test-Path -LiteralPath $proofPath)) { throw 'Existing runner ownership could not be verified. No installation or credential transfer attempted.' }
$proof = Get-Content -LiteralPath $proofPath -Raw | ConvertFrom-Json
$owner = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
if ($proof.distro -ne 'CodeWise2Runner' -or $proof.distroCreatedByBootstrap -ne $true -or $proof.workspace -ne $workspace -or $proof.ownerSid -ne $owner) {
    throw 'Existing runner ownership does not match this account and workspace. No installation or credential transfer attempted.'
}
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CodeWiseProfileAcl {
 [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool ConvertStringSecurityDescriptorToSecurityDescriptor(string text,uint revision,out IntPtr descriptor,out uint size);
 [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetSecurityDescriptorDacl(IntPtr descriptor,out bool present,out IntPtr dacl,out bool defaulted);
 [DllImport("advapi32.dll",CharSet=CharSet.Unicode)] static extern uint SetNamedSecurityInfo(string name,int type,uint information,IntPtr owner,IntPtr group,IntPtr dacl,IntPtr sacl);
 [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr memory);
 public static void Set(string path,string sddl) {
  IntPtr descriptor=IntPtr.Zero;
  try {
   uint size; if(!ConvertStringSecurityDescriptorToSecurityDescriptor(sddl,1,out descriptor,out size)) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
   bool present,inherited; IntPtr dacl; if(!GetSecurityDescriptorDacl(descriptor,out present,out dacl,out inherited)||!present) throw new Exception("DACL missing");
   uint result=SetNamedSecurityInfo(path,1,0x80000004,IntPtr.Zero,IntPtr.Zero,dacl,IntPtr.Zero); if(result!=0) throw new System.ComponentModel.Win32Exception((int)result);
  } finally {if(descriptor!=IntPtr.Zero)LocalFree(descriptor);}
 }
}
'@
function Set-PrivateRunnerAcl([string]$Path, [switch]$Directory) {
    $sddl = if ($Directory) { 'D:P(A;OICI;FA;;;' + $owner + ')(A;OICI;FA;;;SY)' } else { 'D:P(A;;FR;;;' + $owner + ')(A;;FA;;;SY)' }
    [CodeWiseProfileAcl]::Set($Path, $sddl)
    $acl = Get-Acl -LiteralPath $Path
    $rules = @($acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]))
    if (-not $acl.AreAccessRulesProtected -or $rules.Count -ne 2 -or @($rules | Where-Object { $_.IdentityReference.Value -notin @($owner,'S-1-5-18') -or $_.IsInherited -or $_.AccessControlType -ne 'Allow' }).Count) {
        throw 'Private runner credential permissions could not be verified.'
    }
}
$dataPath = [IO.Path]::GetFullPath($DataDirectory)
$credentialPath = Join-Path $dataPath 'credentials/runner'
$tokenPath = Join-Path $credentialPath 'token'
$configPath = Join-Path $dataPath 'runner.json'
$temporaryToken = Join-Path $credentialPath ('token-' + [Guid]::NewGuid().ToString('N') + '.tmp')
$temporaryConfig = Join-Path $dataPath ('runner-' + [Guid]::NewGuid().ToString('N') + '.tmp')
try {
    if (-not (Test-Path -LiteralPath $tokenPath)) {
        # Fixed reviewed source; filesystem-only transfer. Never print token bytes.
        $tokenSource = '\\wsl.localhost\CodeWise2Runner\var\lib\codewise2-runner\token'
        if (-not (Test-Path -LiteralPath $tokenSource)) { throw 'Existing runner credential cannot be reached. No files were replaced.' }
        New-Item -ItemType Directory -Path $credentialPath -Force | Out-Null
        Set-PrivateRunnerAcl $credentialPath -Directory
        Copy-Item -LiteralPath $tokenSource -Destination $temporaryToken
        Set-PrivateRunnerAcl $temporaryToken
        [IO.File]::Move($temporaryToken, $tokenPath, $false)
    }
    if (-not (Test-Path -LiteralPath $configPath)) {
        @{schemaVersion=1;endpoint='http://127.0.0.1:2358'} | ConvertTo-Json | Set-Content -LiteralPath $temporaryConfig -Encoding UTF8
        [IO.File]::Move($temporaryConfig, $configPath, $false)
    }
    Write-Host 'Recovered missing runner profile files from the existing installation. Learning data preserved.'
} finally {
    foreach ($temporary in @($temporaryToken,$temporaryConfig)) { if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary } }
}
