# ADR 0002: Resume real workers using user-authorized default speed

Date: 2026-10-08. Supersedes the speed blocker in ADR 0001.

The user explicitly instructed the coordinator to continue with the default speed option and complete the full specification. Spawn three actual workers through collaboration.spawn_agent with model gpt-6.1-sol and reasoning_effort medium, fork_turns none. Omit speed because the tool exposes no speed argument. This is the runtime default, not a verified Standard/Fast-off claim.

The child rollout session_meta records link all three workers to this parent. Their actual turn_context records confirm gpt-6.1-sol and medium. Record only these selected fields in release evidence; do not copy full conversations or secrets. The service_tier field is absent/null, so its effective value remains unverified. Native list_agents independently confirmed all workers running.

No product scope changes. All 300 questions, three languages, full validation, isolated execution, complete interface and durable AI library requirements remain mandatory. Missing runner prerequisites block real execution/publication only, while the worker pool implements independent functionality.
