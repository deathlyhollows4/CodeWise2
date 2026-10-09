import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const rows = [];
const add = (
  clause,
  requirement,
  status,
  evidence,
  coverage,
  remaining = "None for the stated bounded scope.",
) => rows.push({ clause, requirement, status, evidence, coverage, remaining });
const matrix = [
  "frontend-final-catalogue/report.json",
  "frontend-final-catalogue-command.json",
  "frontend-final-catalogue/contact-sheets.json",
];
const controls = [
  "frontend-final-controls/report.json",
  "frontend-final-controls-finalize.txt",
];
const renderer = [
  "frontend-final-ui-journeys/report.json",
  "frontend-final-ui-journeys/renderer-recapture-report.json",
  "frontend-final-ui-journeys.txt",
  "frontend-final-renderer-recapture.txt",
];
const topics = [
  "frontend-final-topic-entry/report.json",
  "frontend-final-topic-entry-browser.txt",
];
const provider = [
  "frontend-final-provider/report.json",
  "frontend-final-provider-finalize.txt",
  "frontend-final-provider-lifecycle.json",
  "frontend-final-provider/export-recheck-report.json",
  "frontend-r54-export-recheck-command.txt",
];
const liveReading = ["frontend-live-scroll/report.json", "frontend-live-scroll-browser.txt", "frontend-live-lesson-final-build.txt"];
const native = ["frontend-final-native/report.json", "frontend-final-native/before-restart-seven-journal.json", "frontend-final-native-final-two-command.txt", "frontend-final-native-restart-lifecycle.json", "frontend-native-terminal/report.json", "frontend-native-terminal-command.txt"];
add(
  "11.1",
  "Original professional identity and cohesive surfaces",
  "verified",
  matrix,
  "All11 screen bodies at4widths/both themes; coordinator accepted contact sheets and full originals. Source design decisions in docs/design.md.",
);
add(
  "11.2",
  "Tokens, licensed/local typography, readable lesson/code dimensions",
  "verified",
  matrix,
  "Separate theme tokens/system font fallbacks/local math fonts, comfortable prose/code widths; no external runtime request in95capture matrix. Notices separately exported exactly.",
);
add(
  "11.3",
  "Desktop hierarchy, sidebar/topbar, resizable coding panes",
  "verified-bounded",
  matrix.concat(controls),
  "Actual workspace/desktop captures and prior keyboard splitter journeys. Current header/search targeted8theme-width checks.",
  "Final ten-job published browser report and zero-job saved-history recapture verify terminal result surfaces; R56 corrected topic-count projection is separately source-bound.",
);
add(
  "11.4",
  "390/768/1366/1920 responsive behavior and bounded scrolling",
  "verified",
  matrix.concat(renderer),
  "88screen cells plus7long/cold views; no document horizontal overflow. Long tables/code scroll inside their containers. Stable mobile resize recapture preserved original transition image.",
);
add(
  "11.5",
  "Keyboard labels/focus, splitters/dialogs/dropdowns/command search/roadmap",
  "verified-bounded",
  controls.concat(["frontend-visual/final/report.json"]),
  "Actual CtrlK combobox/listbox arrows/Enter, forward/reverse Tab, single Escape and opener restore; empty/error/retry. Two real palette issues repaired with failures archived. Earlier splitters/dialog/roadmap list keyboard evidence retained.",
  "Hardware screen-reader testing is outside observed scope; this is not a fabricated pass.",
);
add(
  "11.5.states",
  "Loading/empty/error/unavailable/reconnect/success states",
  "verified-bounded",
  matrix.concat(controls, provider),
  "Unavailable runner/no key/zero progress, search retry and finite exposed-teacher consolidation shown honestly; partial statuses retain full content. Header snapshots distinguished from settled Home captures.",
  "Actual provider restart observer failed at helper return after successful restart; separate same-ID recovery qualifies bounded persistence.",
);
add(
  "11.6",
  "Run, inspect and refine actual pages with realistic long content",
  "verified",
  matrix.concat(renderer),
  "95actualcaptures plus current controls/Sources/long adversarial views; coordinator and worker inspected contact sheets/full originals. No mockup treated as a running app.",
);
add(
  "12.1",
  "Reusable safe lesson rendering, full text preserved, language code copy",
  "verified-bounded",
  renderer.concat(liveReading, [
    "frontend-r28/report.json",
    "frontend-r43-preview/report.json",
  ]),
  "Shared renderer for live/saved/reading; AST plain search previews; persisted31,067-byte hostile fixture,55-line incomplete fence and29,250-byte complete-copy checked.",
  "Live-provider content quality/entitlement is not established by local fixtures.",
);
add(
  "12.2",
  "Semantic full lesson sections and restrained short hints",
  "verified-renderer-not-model-quality",
  [
    "frontend-final-catalogue/full-partial-report.json",
    "frontend-final-catalogue/report.json",
  ],
  "Saved structured examples/trace/code/complexity/section navigation render readably; fixture hints are explicitly not real teaching-quality evidence.",
  "A real user-key response remains optional/live-unverified; do not infer semantic model quality from controlled output.",
);
add(
  "12.3",
  "Math/prose/table details, section nav, reading/follow behavior",
  "verified-bounded",
  renderer.concat(liveReading, [
    "frontend-visual/final/report.json",
    "frontend-r28/report.json",
  ]),
  "Safe math trust=false, long table/code containment and saved section search. R55 actual same-generation drawer/saved-tab append proves 1px upward pause, unchanged viewport, visible sticky new-text jump, OS reduced motion and complete terminal text; old completed lessons have no misleading follow controls.",
  "Current provider flow gives qualified restart proof; original exact pre-restart hashes were not journaled, not reconstructed as observed.",
);
add(
  "12.4",
  "Untrusted Markdown/HTML/URLs/images/styles and pathological text",
  "verified",
  renderer.concat(["frontend-renderer-tests.txt"]),
  "Actual imported hostile script/image/event-handler/encoded-link/untrusted-math sentinel remains unexecuted; no external requests.100table rows/long token/incomplete fence preserved;250001-character record UI preview rejected400 unchanged.",
);
add(
  "12.5",
  "Versioned strict presentation document and truthful verification",
  "verified-bounded",
  ["frontend-final-ui-journeys/report.json", "frontend-r43/report.json"],
  "Immutable version/detail/export DTOs and saved not-run metadata; renderer never evaluates model JSON/code. Schema/API execution-provenance tests remain backend evidence, not a renderer self-verification claim.",
);
for (const [name, capability] of [
  ["Welcome/onboarding", "language/beginner/readiness/optional assessment"],
  [
    "Home",
    "next rationale/current focus/reviews/recent lessons/honest progress",
  ],
  ["Roadmap", "18topics/connected view/list/progress/selection"],
  [
    "Problem library",
    "topic/skill/step/completion/assistance/bookmark/language filters",
  ],
  [
    "Lesson reading view",
    "full saved body/context/versions/copy/bookmark/export",
  ],
  ["Learning Library", "all outputs/paging/fulltext/filters/pins/notes/return"],
  ["Progress", "independent/assisted/skill+language evidence/review/activity"],
  ["Settings", "key/model/appearance/editor/learning/usage/data/diagnostics"],
])
  add(
    "13." + name,
    name + " — " + capability,
    "verified-bounded",
    matrix.concat([
      "frontend-r43/report.json",
      "frontend-r45/report.json",
      "frontend-assessment/report.json",
    ]),
    "Actual required screen/currentresponsive body plus focused API2 paging,14functional flows,Learning persistence, real6-question conservative assessment. No artificial learner history inserted in normal profiles.",
    "Real accepted/wrong-result/profile proficiency flows are covered separately by the reserved published native journey.",
  );
add(
  "13.Topic detail",
  "Skills/prerequisites/quota/list/suggested next challenge",
  "verified",
  topics.concat(matrix),
  "All18 truly zero-exposure/evidence topics return real eligible first challenge or qualified prerequisite teacher. Explicit selection/reload preserves original step1 topic intent. Exposed teacher history case is separate legitimate consolidation.",
  "Breadcrumb label is in the current R55 build; earlier topic captures remain historical until a targeted final recapture.",
);
add(
  "13.Sources & Licenses",
  "Actual asset provenance/notices/attribution",
  "verified",
  ["frontend-final-catalogue/actual-sources-report.json"].concat(controls),
  "243actualasset tables matched disk; original/adapted MIT/pinned revision/modifications shown. Complete notice export matched installed JSON. Current independent passed and original author pending notes separated; both internal identity fields absent.",
);
add(
  "13.1",
  "Editor/starters/revisioned autosave/flush/Run/Submit/custom/results/history",
  "verified-bounded",
  [
    "frontend-final-ui-journeys/report.json",
    "frontend-visual/final/report.json",
    "frontend-assessment/report.json",
    "frontend-live-scroll/report.json",
  ],
  "Actual3starters, real edited draft flush/backup association, multitab API conflicts and language-delay isolation. Real assessment immutable Python submissions verified; fixture result states/privacy are not fake execution.",
  "Final ten published native jobs prove three-language wrong/accepted, compiler correction, exact drafts, same-profile restart and doubleclick. Historical harness failures are preserved; no graded job was replayed.",
);
add(
  "13.2",
  "Truthful independent/assisted skill/language/review evidence",
  "verified-bounded",
  matrix.concat(topics, native),
  "Empty progress honest; counts vshelp separated; supporting IDs/language evidence rendered, due/future reviews distinct.18-entry requests do not create knowledge/evidence/jobs.",
  "Actual final independent2/assisted2, conceptual advancement plus language demonstrations, hint/same-step and cross-language exposure are verified. R56 corrected Topic HTTP and actual desktop/mobile badges equal the same progress counts; no evidence changed.",
);
add(
  "14.1",
  "Password/show-hide/save/test/model/replace/remove/readback-safe",
  "verified-controlled-provider",
  provider,
  "Actual localhost UI with explicitly fake values: offline save/unreachable, clear/mask/reload, verified listing, invalid unsaved candidate preserves old version, replacement/model selection, removal. Never claims live DeepSeek.",
);
add(
  "14.2",
  "Typed connectivity errors, separate tutor test, offline save/live replacement",
  "verified-controlled-provider-and-repaired-export",
  provider,
  "Normal202queued Settings tutor response preserved/reused, controlled provider confirms app behavior only; savedkey replaced without restart.",
  "R54 missing-usage defect preserved and repaired; direct export-recheck report proves actual UI200/download, same four IDs/content/status/associations, usage null, no extra inference/jobs.",
);
add(
  "14.3.UI",
  "Minimize secret exposure, no readback/URL/storage/bundle/archive/log claims",
  "verified-read-and-backup-boundary",
  provider,
  "Only explicitly fake credentials, cleared fields/masks; bootstrap/settings read endpoints exclude full values, no external provider. Secret storage/CSRF is separately actual backend/DPAPI evidence.",
  "Direct R54 export recheck verifies repaired secret-free generated-history backup; original blocked export remains archived as historical failure.",
);
add(
  "14.4",
  "All seven Settings sections and durable controls",
  "verified-bounded",
  ["frontend-r45/report.json", "frontend-final-ui-journeys/report.json"].concat(
    matrix,
  ),
  "Theme/system/reducedmotion,editor preferences,focus/review/hint depth,usage caveats/caps,actual backup controls/restore,strong confirms,readable diagnostics.",
  "Direct R54 export recheck closes generated-history backup defect; controlled credentials remain qualified as fixture-only.",
);
const journeys = [
  [
    "fresh install/243published/no key/no fake progress",
    "verified-install-and-publication-separately",
    ["clean-install-proof.json", "frontend-final-topic-entry/report.json"],
    "Fresh allowlisted install and current243publication are separate actual evidence; finalintegrated production lifecycle still coordinator-owned.",
  ],
  [
    "all3languages accepted and incorrect",
    "verified-real-native-browser",
    native.concat(["real-runner-normal-api-slice.json", "frontend-assessment/report.json"]),
    "Ten normal published native browser jobs cover wrong/accepted Python, Java and C++ plus compile-error correction. Exact graded identities/counts/source and historical blocked-EOL request are retained; no native job replay.",
  ],
  [
    "independent next step survives restart",
    "verified-real-native-browser",
    native,
    "Actual Home preserves the chosen Greedy step1 goal; actual Arrays Topic Suggest shows and opens earned step2 before/after owned process restart. Same seven jobs, drafts and evidence survive; a new default focus does not erase pending intent.",
  ],
  [
    "hint-assisted same-step checkpoint",
    "verified-real-native-controlled-hint",
    native,
    "Existing local controlled hint was viewed; real Arrays03 Python acceptance records assistance and returns unseen Arrays04 at the same step. Selector recovery did not regenerate the hint.",
  ],
  [
    "compiler typo correction not conceptual failure",
    "verified-real-native-browser",
    native,
    "Actual C++ compiler typo executes no cases and adds no conceptual failure/mastery/assistance; corrected exact source accepts all cases.",
  ],
  [
    "full solution exposure across languages",
    "verified-real-native-controlled-solution",
    native,
    "Java controlled full solution is saved/viewed for Arrays04; its real C++ acceptance is assisted. Durable exposure is distinct from accepted aided evidence; no live model quality claim.",
  ],
  [
    "localhost key lifecycle/no read secret",
    "verified-controlled-provider",
    provider,
    "Actual fake-key UI lifecycle complete; realkey/vendor entitlement intentionally unverified.",
  ],
  [
    "stream save/refresh/restart/reopen",
    "verified-bounded",
    provider.concat(["frontend-r28/report.json"]),
    "Actual controlled provider/SQLite/SSE; successfulowned restart/same IDs/callcount; exact original pre-restart hashes notjournaled, qualifier retained.",
  ],
  [
    "cancel/interrupted saved partial",
    "verified-bounded",
    provider,
    "Actual canceled/interrupted statuses/nonemptydurable prefixes/same-ID reopen; no new provider work in recovery.",
  ],
  [
    "reconnect/doubleclick no duplicate work/mastery",
    "verified",
    native.concat(["frontend-r28/report.json"]),
    "Actual expiredcursor authoritative snapshot +chunks equal SQLite; actual browser doubleclick creates one immutable job and one accepted evidence entry, ten total jobs.",
  ],
  [
    "library search/bookmarks/full export",
    "verified",
    ["frontend-r43/report.json", "frontend-final-ui-journeys/report.json"],
    "Actual83record paging/deeptail/code search and complete MD/JSON;31khostilebody exportscomplete; bookmarks are independent of saving.",
  ],
  [
    "backup associations/secrets",
    "verified-baseline-and-repaired-generated-history",
    ["frontend-final-ui-journeys/report.json", "large-backup-roundtrip.json", "frontend-final-provider/export-recheck-report.json"],
    "Actual3.493MBUIroundtrip/71lessons +draft/notes/pins; backend13.598MBcase separate. R54 repaired same four generated records export200/download preserves content/status/associations and excludes secrets without new inference.",
  ],
  [
    "live/saved themes",
    "verified-controlled-provider",
    provider.concat(matrix),
    "Currentstreamedsaved dark/light exact rendered text and95screenmatrix inspected.",
  ],
  [
    "malicious/oversized outputs contained",
    "verified",
    renderer,
    "Actual persisted adversarial browser +oversizedUIimport400unchanged; backend provider bounds separate.",
  ],
  [
    "hidden/reference/credentials absent public frontend/API",
    "verified-qualified-independent-boundary-audit",
    controls.concat(["public-private-current243-audit.json", "public-private-final-client-assets.json", "coordinator-r56-source-diff-review.json"]),
    "Independent actual243 regular HTTP DTO allowlist/private-asset boundary and final66-file client scan passed; observed final browser asset hashes match. Prior HTTP proof is reused with its explicit source-binding qualifier; reviewed R56 changes only the topic-count predicate. Requested solution references and learner code remain distinct authorized channels.",
  ],
  [
    "runner network/file/resource canaries",
    "coordinator-runtime-proof-separate",
    [],
    "Actual25canaries/current729reference receipts are runner evidence, not frontend claimed verification.",
  ],
];
journeys.forEach(([name, status, evidence, coverage], index) =>
  add(
    "18.2." + (index + 1),
    name,
    status,
    evidence,
    coverage,
    status.includes("pending")
      ? "Specific finaljourney listed; no fabricated pass."
      : "Scope limits stated in coverage.",
  ),
);
const root = "docs/release-evidence/";
const files = [...new Set(rows.flatMap((r) => r.evidence))].filter((p) =>
  existsSync(root + p),
);
const manifest = Object.fromEntries(
  files.map((p) => [
    p,
    createHash("sha256")
      .update(readFileSync(root + p))
      .digest("hex"),
  ]),
);
const report = {
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  scope:
    "Frontend-owned clause/evidence mapping; not shared acceptance-matrix approval. User300→243 and futurehidden60 amendments retained separately; originalspec unchanged.",
  sourceFiles: [
    "apps/web/src/App.tsx",
    "apps/web/src/CommandSearch.tsx",
    "apps/web/src/TopicSuggestion.tsx",
    "packages/lesson-renderer/src/index.tsx",
  ],
  evidenceHashes: manifest,
  rows,
};
writeFileSync(
  root + "frontend-requirement-evidence.json",
  JSON.stringify(report, null, 2),
);
writeFileSync(
  root + "frontend-requirement-evidence.md",
  `# Frontend clause and evidence map\n\nUpdated ${report.updatedAt}. ${report.scope}\n\nEvery status is scoped; controlled-provider proof is not live entitlement, preview screenshots are not publication, and model text never establishes execution. Real failures/harness recovery are preserved.\n\n| Clause | Requirement | Status | Evidence and coverage | Remaining action |\n|---|---|---|---|---|\n` +
    rows
      .map(
        (r) =>
          `| ${r.clause} | ${r.requirement} | ${r.status} | ${r.evidence.map((p) => "[" + p + "](" + p + ")").join(", ")} — ${r.coverage} | ${r.remaining} |`,
      )
      .join("\n") +
    "\n",
);
console.log(
  JSON.stringify(
    {
      clauses: rows.length,
      hashedEvidence: files.length,
      status: "mapping-written-not-release-approval",
    },
    null,
    2,
  ),
);
