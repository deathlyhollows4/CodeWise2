# Runner lifetime observation and bounded development recovery

2026-10-08. A fresh25-pass canary attestation included kernel core_pattern=core, but a later live inspection again returned the WSL crash-collector pipe. The runner owner observed different Linux boot IDs and near-zero uptime across these inspections. Historical canary success is therefore not current readiness; normal reference execution remains held until live identity and policy agree.

Microsoft documents that systemd services do not keep a WSL instance alive: [Systemd support in WSL](https://devblogs.microsoft.com/commandline/systemd-support-is-now-available-in-wsl/). This supports the observed shutdown/restart explanation; exact local boot evidence must accompany the final readiness report.

Reviewed development measure: start-runner-lifetime.ps1 hash14235AAB152FE968ED0EEDFDB532DA13C22282634DD222731AF59CC9558208AF starts one hidden host WSL client running sleep only inside the verified-owned CodeWise2Runner distribution. It records PID/workspace/SID and an8hour maximum, refuses an unexpected existing process, and changes no policy or Windows settings. Stable boot identity must be verified before an explicit application of the already-authorized reversible kernel policy and new canaries.

The keepalive/startup path must never reapply the kernel policy automatically. Expiry or VM restart must produce unavailable readiness. Final operation documentation and guarded shutdown must address lifetime, process creation identity and cleanup; this bounded development anchor alone does not close the release operation gate.
