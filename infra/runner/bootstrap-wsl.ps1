param([switch]$Install,[switch]$Resume,[string]$DataDirectory)
$ErrorActionPreference='Stop'
if($PSVersionTable.PSVersion.Major -lt 7){throw 'Use PowerShell7 (pwsh) for the reviewed atomic overwrite operation. No installation attempted.'}
$distro='CodeWise2Runner'
$workspace=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$evidence=Join-Path $workspace 'docs/release-evidence'
New-Item -ItemType Directory -Path $evidence -Force | Out-Null
$resultPath=Join-Path $evidence 'runner-bootstrap-result.json'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CodeWiseRunnerAcl {
 [DllImport("advapi32.dll",CharSet=CharSet.Unicode,SetLastError=true)] static extern bool ConvertStringSecurityDescriptorToSecurityDescriptor(string text,uint revision,out IntPtr descriptor,out uint size);
 [DllImport("advapi32.dll",SetLastError=true)] static extern bool GetSecurityDescriptorDacl(IntPtr descriptor,out bool present,out IntPtr dacl,out bool defaulted);
 [DllImport("advapi32.dll",CharSet=CharSet.Unicode)] static extern uint SetNamedSecurityInfo(string name,int type,uint information,IntPtr owner,IntPtr group,IntPtr dacl,IntPtr sacl);
 [DllImport("kernel32.dll")] static extern IntPtr LocalFree(IntPtr memory);
 public static void SetDacl(string path,string sddl) {
  IntPtr sd=IntPtr.Zero;
  try {uint size;if(!ConvertStringSecurityDescriptorToSecurityDescriptor(sddl,1,out sd,out size))throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
   bool present,defaulted;IntPtr dacl;if(!GetSecurityDescriptorDacl(sd,out present,out dacl,out defaulted)||!present)throw new Exception("DACL missing");
   uint result=SetNamedSecurityInfo(path,1,0x80000004,IntPtr.Zero,IntPtr.Zero,dacl,IntPtr.Zero);if(result!=0)throw new System.ComponentModel.Win32Exception((int)result);
  } finally {if(sd!=IntPtr.Zero)LocalFree(sd);}
 }
}
'@
function PrivateAcl([string]$Path,[switch]$Directory){
 $owner=[Security.Principal.WindowsIdentity]::GetCurrent().User
 # Set ONLY the protected DACL through Win32. PowerShell Set-Acl attempted SACL
 # persistence and required SeSecurityPrivilege; no owner/group/SACL change is needed.
 $sddl=if($Directory){'D:P(A;OICI;FA;;;'+$owner.Value+')(A;OICI;FA;;;SY)'}else{'D:P(A;;FR;;;'+$owner.Value+')(A;;FA;;;SY)'}
 [CodeWiseRunnerAcl]::SetDacl($Path,$sddl)
 $actual=Get-Acl -LiteralPath $Path
 $rules=@($actual.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier]))
 $ids=@($rules|ForEach-Object {$_.IdentityReference.Value}|Sort-Object -Unique)
 if(-not $actual.AreAccessRulesProtected -or $rules.Count -ne 2 -or $ids.Count -ne 2 -or $ids -notcontains $owner.Value -or $ids -notcontains 'S-1-5-18' -or @($rules|Where-Object {$_.AccessControlType -ne [Security.AccessControl.AccessControlType]::Allow -or $_.IsInherited}).Count -ne 0){throw 'Runner private ACL principal allowlist verification failed'}
}
function WslText([string[]]$Arguments){$out=(& wsl.exe @Arguments 2>&1 | Out-String).Replace("`0",'');$code=$LASTEXITCODE;return @{text=$out;exitCode=$code}}
function Linux([string]$Command){& wsl.exe --distribution $distro --user root --cd /root --exec /bin/bash -c ('set -euo pipefail; '+$Command);if($LASTEXITCODE -ne 0){throw ('Dedicated distro command failed, exit '+$LASTEXITCODE)}}
function Transfer([string]$Source,[string]$Destination){
 if($Destination -notmatch '^/(etc/wsl\.conf|opt/codewise2-runner/[a-zA-Z0-9._-]+|etc/systemd/system/[a-zA-Z0-9._-]+)$'){throw 'Unapproved transfer destination'}
 $linuxText=[IO.File]::ReadAllText($Source).Replace("`r`n","`n").Replace("`r","`n")
 $payload=[Convert]::ToBase64String([Text.UTF8Encoding]::new($false).GetBytes($linuxText))
 # Fixed reviewed destination and stdin transfer. No drive mount, shell interpolation from learner input, or token in stdout.
 $payload | & wsl.exe --distribution $distro --user root --cd /root --exec /bin/sh -c ('umask 077; tr -d ''\r\n'' | base64 -d > '+$Destination)
 if($LASTEXITCODE -ne 0){throw 'Reviewed file transfer failed'}
}
$version=WslText -Arguments @('--version');$help=WslText -Arguments @('--help');$names=WslText -Arguments @('--list','--quiet')
if($version.exitCode -ne 0 -or $help.text -notmatch '--name'){throw 'Installed WSL named-distro support not verified. Inspect host WSL outside stale sandbox first.'}
$exists=$names.text -match '(?m)^\s*CodeWise2Runner\s*$'
if(-not $Install){Write-Host $version.text;Write-Host 'Inspection only. Requested scope: named Ubuntu24.04 distro, its Linuxroot compiler/isolate/controller packages, disabledhost automount/interop, private runner credential transfer, bounded canary verification. No Windows reboot.';Write-Host ('Existing dedicated distro: '+$exists);exit 0}
if($exists){
 if(-not $Resume){throw 'CodeWise2Runner already exists. No changes made. Inspect verified bootstrap ownership then retry with Resume within the approved setup scope.'}
 $prior=if(Test-Path -LiteralPath $resultPath){Get-Content -Raw -LiteralPath $resultPath|ConvertFrom-Json}else{$null}
 $currentOwner=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
 if(-not $prior -or $prior.distro -ne $distro -or $prior.distroCreatedByBootstrap -ne $true -or $prior.workspace -ne $workspace -or $prior.ownerSid -ne $currentOwner){throw 'Unknown preexisting distro: no verified ownership evidence. Refusing setup.'}
}
if([string]::IsNullOrWhiteSpace($DataDirectory)){$DataDirectory=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'CodeWise2'}
$dataPath=[IO.Path]::GetFullPath($DataDirectory)
$result=@{schemaVersion=1;startedAt=(Get-Date).ToUniversalTime().ToString('o');distro=$distro;scope='dedicated Ubuntu24.04 isolated runner setup';status='running';noWindowsReboot=$true;workspace=$workspace;ownerSid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value;distroCreatedByBootstrap=$exists}
$result|ConvertTo-Json|Set-Content -LiteralPath $resultPath
$transcriptPath=Join-Path $evidence ('runner-bootstrap-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'.txt')
$transcribing=$false
try{
 Start-Transcript -LiteralPath $transcriptPath -Force|Out-Null;$transcribing=$true
 if(-not $exists){
  Write-Host 'Installing only Ubuntu-24.04 as CodeWise2Runner; no automatic launch.'
  & wsl.exe --install --distribution Ubuntu-24.04 --name CodeWise2Runner --no-launch --version 2
  if($LASTEXITCODE -ne 0){throw ('Dedicated distro installation returned '+$LASTEXITCODE+'. No other distro requested.')}
  $result.distroCreatedByBootstrap=$true;$result|ConvertTo-Json|Set-Content -LiteralPath $resultPath
 }
 $names=WslText -Arguments @('--list','--quiet');if($names.text -notmatch '(?m)^\s*CodeWise2Runner\s*$'){throw 'Dedicated distro name not verified after installation'}
 Transfer (Join-Path $PSScriptRoot 'wsl.conf') '/etc/wsl.conf'
 # Apply config before any compilation or learner execution. Do not terminate other distros.
 & wsl.exe --terminate CodeWise2Runner;if($LASTEXITCODE -ne 0){throw 'Dedicated distro termination failed'}
 Linux 'test "$WSL_DISTRO_NAME" = CodeWise2Runner; mkdir -p /opt/codewise2-runner; chmod 700 /opt/codewise2-runner'
 foreach($file in @('setup-linux.sh','broker.py','verify-canaries.py')){Transfer (Join-Path $PSScriptRoot $file) ('/opt/codewise2-runner/'+$file)}
 foreach($file in @('codewise2-runner.service','var-local-lib-isolate.mount')){Transfer (Join-Path $PSScriptRoot $file) ('/etc/systemd/system/'+$file)}
 Write-Host 'Building pinned isolate and installing Linux toolchains in dedicated distro.'
 Linux 'test "$WSL_DISTRO_NAME" = CodeWise2Runner; bash /opt/codewise2-runner/setup-linux.sh'
 Linux 'chmod 644 /opt/codewise2-runner/broker.py /opt/codewise2-runner/verify-canaries.py /etc/systemd/system/codewise2-runner.service /etc/systemd/system/var-local-lib-isolate.mount; systemctl daemon-reload; systemctl enable --now var-local-lib-isolate.mount codewise2-runner.service; systemctl restart codewise2-runner.service; systemctl is-active --quiet codewise2-runner.service'
 Write-Host 'Running harmless actual isolation canaries; any failure leaves readiness closed.'
 Linux 'python3 /opt/codewise2-runner/verify-canaries.py'
 # Credential transfer is filesystem-only. Never read/print token through a command or transcript.
 $credentialPath=Join-Path $dataPath 'credentials/runner'
 New-Item -ItemType Directory -Path $credentialPath -Force|Out-Null
 PrivateAcl -Path $credentialPath -Directory
 $tokenSource='\\wsl.localhost\CodeWise2Runner\var\lib\codewise2-runner\token'
 $temporaryToken=Join-Path $credentialPath ('token-'+[Guid]::NewGuid().ToString('N')+'.tmp')
 Copy-Item -LiteralPath $tokenSource -Destination $temporaryToken
 PrivateAcl -Path $temporaryToken
 # File move is atomic on this same NTFS directory; directory owner can replace an old read-only token.
 [IO.File]::Move($temporaryToken,(Join-Path $credentialPath 'token'),$true)
 PrivateAcl -Path (Join-Path $credentialPath 'token')
 @{schemaVersion=1;endpoint='http://127.0.0.1:2358'}|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $dataPath 'runner.json')
 Copy-Item -LiteralPath '\\wsl.localhost\CodeWise2Runner\var\lib\codewise2-runner\canary-attestation.json' -Destination (Join-Path $evidence 'runner-canary-attestation.json') -Force
 $result.status='setup-and-canaries-passed; Windows adapter integration still requires verification'
 Write-Host 'Runner setup completed. Private token was transferred without printing it. Verify backend loopback readiness and full references next.'
}catch{$result.status='failed';$result.error=$_.Exception.Message;Write-Host $result.error;throw}
finally{if($transcribing){Stop-Transcript|Out-Null};$result.completedAt=(Get-Date).ToUniversalTime().ToString('o');$result.transcript=$transcriptPath;$result|ConvertTo-Json -Depth 4|Set-Content -LiteralPath $resultPath}
