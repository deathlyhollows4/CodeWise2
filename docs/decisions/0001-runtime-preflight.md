# ADR 0001: Preserve the mandatory worker and runner boundaries

Date: 2026-10-08. Status: accepted coordination decision; implementation blocked.

The authoritative specification requires actual gpt-6.1-sol workers at medium effort with Fast off. The native runtime exposes model/effort controls but only advertises priority service, without a tier selector. The current global default does not establish effective child settings. Therefore no compliant worker-pool claim, model substitution, sequential coordinator implementation, or configuration-only verification is permitted.

When Standard-capable workers become available, use three concurrent workers plus the coordinator to respect the detected four-agent limit. Rotate ownership into content and independent QA after foundational tasks; preserve reusable workers and assign integration to a worker.

No project agent config was written as a purported fix. CLI 0.162.0-alpha.2 help and official docs were inspected, but no runtime-loaded custom role was verified. Any future configuration must be supported by the installed client's parser, must respect protected paths and approval controls, and must be followed by actual worker-setting evidence.

The inspected machine is Windows ARM64 with Node 24.19.0. No Docker/Podman installation was detected and WSL reports not installed. Runner selection remains undecided pending a compliant worker's architecture/security feasibility work. Do not install privileged infrastructure without required approval, and never execute learner code on the host as fallback.

No product scope, topic quotas, tests, publication gates, or acceptance criteria are reduced. No old CodeWise implementation is assumed to exist in this different workspace. No live DeepSeek call is made during preflight.

Official sources inspected:

- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents): explicit model/effort, config layering, reusable subagents.
- [Configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference): agent defaults and service_tier.
- [Codex speed](https://learn.chatgpt.com/docs/agent-configuration/speed): Standard/Fast availability depends on runtime/access.
- [Fast mode](https://developers.openai.com/api/docs/guides/fast-mode): priority and fast select Fast mode.

These sources explain settings; they do not prove actual worker execution in this chat. The live tool contract is recorded separately in the agent registry.
