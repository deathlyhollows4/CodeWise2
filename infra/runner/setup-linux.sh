#!/usr/bin/env bash
# Privileged, explicit setup inside ONLY CodeWise2Runner. Never runs automatically.
set -euo pipefail
[[ ${EUID} -eq 0 ]] || { printf 'Run as root in dedicated CodeWise2Runner distro.\n'; exit 1; }
[[ ${WSL_DISTRO_NAME:-} == CodeWise2Runner ]] || { printf 'Refusing setup outside explicitly named CodeWise2Runner distro. Preserve WSL_DISTRO_NAME across sudo only after verifying it.\n'; exit 1; }
[[ -f /etc/wsl.conf ]] || { printf 'Apply supplied wsl.conf, terminate/relaunch distro first.\n'; exit 1; }
python3 - <<'PY'
import configparser
c=configparser.ConfigParser();c.read('/etc/wsl.conf')
assert c.getboolean('automount','enabled') is False
assert c.getboolean('automount','mountFsTab') is False
assert c.getboolean('interop','enabled') is False
assert c.getboolean('interop','appendWindowsPath') is False
assert c.getboolean('boot','systemd') is True
PY
# WSL always mounts public GPU driver files as a read-only 9p submount under /usr.
# This is not a host drive; the sandbox uses /usr:norec so it does not inherit it.
while read -r target fs options; do
  if [[ $fs == 9p && $target == /usr/lib/wsl/drivers && $options == ro,* ]]; then continue; fi
  printf 'Unexpected host filesystem mount: %s (%s). Refusing setup.\n' "$target" "$fs"; exit 1
done < <(findmnt -rn -t drvfs,9p -o TARGET,FSTYPE,OPTIONS)
[[ $(stat -fc %T /sys/fs/cgroup) == cgroup2fs ]] || { printf 'cgroup v2 required.\n'; exit 1; }
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends build-essential git pkg-config libcap-dev libseccomp-dev libsystemd-dev python3 openjdk-21-jdk-headless ca-certificates nlohmann-json3-dev libgoogle-gson-java
install -d -m 700 /opt/codewise2-runner /var/lib/codewise2-runner
install -d -m 755 /opt/codewise2-runner/devices
for spec in 'null 1 3' 'zero 1 5' 'random 1 8' 'urandom 1 9'; do
  read -r name major minor <<< "$spec"
  [[ -e /opt/codewise2-runner/devices/$name ]] || mknod -m 666 "/opt/codewise2-runner/devices/$name" c "$major" "$minor"
done
if [[ ! -d /opt/codewise2-runner/isolate/.git ]]; then git clone https://github.com/ioi/isolate.git /opt/codewise2-runner/isolate; fi
cd /opt/codewise2-runner/isolate
git checkout --detach 8f185bb37f3f23e29b33b0c7727c91c13429abe3
[[ $(git rev-parse HEAD) == 8f185bb37f3f23e29b33b0c7727c91c13429abe3 ]] || exit 1
[[ -z $(git status --porcelain --untracked-files=no) ]] || { printf 'Isolate source has local tracked edits; refusing build.\n'; exit 1; }
make isolate isolate-cg-keeper default.cf systemd/isolate.service
id isolate >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin isolate
grep -q '^isolate:' /etc/subuid || printf 'isolate:600000:1000\n' >> /etc/subuid
grep -q '^isolate:' /etc/subgid || printf 'isolate:600000:1000\n' >> /etc/subgid
make install
chmod 0755 /usr/local/bin/isolate # Controller runs root; do not expose setuid to other users.
systemctl daemon-reload
systemctl enable --now isolate.service
cg_root=$(/usr/local/bin/isolate --cg --print-cg-root)
[[ -f $cg_root/memory.swap.max ]] || { printf 'Per-sandbox swap accounting control missing; refusing runner readiness. No global WSL settings changed.\n'; exit 1; }
# Hard total storage cap, independent of learner-controlled file counts.
install -d -m 700 /var/local/lib/isolate
mountpoint -q /var/local/lib/isolate || mount -t tmpfs -o size=128m,nr_inodes=8192,mode=0700,nodev,nosuid tmpfs /var/local/lib/isolate
if [[ ! -f /var/lib/codewise2-runner/token ]]; then python3 -c 'import secrets; print(secrets.token_hex(32))' > /var/lib/codewise2-runner/token; fi
chmod 600 /var/lib/codewise2-runner/token
if [[ ! -f /var/lib/codewise2-runner/verification-token ]]; then python3 -c 'import secrets; print(secrets.token_hex(32))' > /var/lib/codewise2-runner/verification-token; fi
chmod 600 /var/lib/codewise2-runner/verification-token
printf 'Isolate installed. Copy reviewed broker.py into /opt/codewise2-runner; install service; run canaries before use.\n'
