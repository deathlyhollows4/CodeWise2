// Controlled child process for ownership tests only: no provider, runner or learner execution.
import { ProfileOwner } from "../apps/server/src/profile-owner.ts";
import { Store } from "../apps/server/src/store.ts";
import { randomUUID } from "node:crypto";
let owner, store;
process.on("message", (message) => {
  if (message === "start") {
    try {
      owner = ProfileOwner.acquire(process.argv[2]);
      let jobId = null;
      if (process.argv[3] === "store") {
        store = new Store(process.argv[2], owner);
        jobId = randomUUID();
        store.insert("jobs", {
          id: jobId,
          idempotencyKey: randomUUID(),
          problemId: "controlled-owner-fixture",
          status: "running",
          code: "Fixture only; no execution",
          createdAt: new Date().toISOString(),
        });
      }
      process.send?.({
        event: "acquired",
        pid: process.pid,
        instanceId: owner.instanceId,
        jobId,
      });
    } catch (error) {
      process.send?.({
        event: "rejected",
        code: error.code,
        message: error.message,
      });
      process.exit(2);
    }
  } else if (message === "release") {
    store?.close();
    owner?.release();
    process.exit(0);
  } else if (message === "crash") {
    process.exit(9);
  }
});
process.send?.({ event: "ready", pid: process.pid });
