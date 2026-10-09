# Exact owned source repairs ready for backend integration

This packet hands off ten existing IDs independently of the separate new Tries03 replacement. All commands below passed source-only checks; no private packs, registry, receipts or native jobs were changed here. Respect every active exact native freeze before materialization.

| ID | Source module and SHA256 | New suite SHA256 | Metadata changes |
|---|---|---|---|
| dp-2d-09 | content/authoring/dp2d-fourth.mjs / c5385ee2e193b3e769b46b63301b91584499f184d695f39a02415e3e0138cc73 | 42b99a4c03b53082e24de458a6a8a89d8d7ac8b3a445b0198f026c5425652e9e (unchanged) | checkpointIds, nextIds |
| dp-2d-10 | content/authoring/dp2d-fourth.mjs / c5385ee2e193b3e769b46b63301b91584499f184d695f39a02415e3e0138cc73 | 9b94fc6021a8bde110e68873af8880f9a84f5de578fa51aac0d732897ae1f9b5 (unchanged) | checkpointIds, nextIds |
| dp-2d-11 | content/authoring/dp2d-fourth.mjs / c5385ee2e193b3e769b46b63301b91584499f184d695f39a02415e3e0138cc73 | 25dbf3ebf0879ca143793bf26dd3a2e759fc119734c17382e2064977e609d06c (unchanged) | step, checkpointIds |
| graphs-08 | content/authoring/graphs-thread-third.mjs / c24522078ac8782ab44fed9dc0e652881b6d16f530a65cc7467612266db45824 | d2fe3f67e84c42658149f0282d9e0b87094f645064ebce79335d559ae9302d54 (changed) | none |
| graphs-09 | content/authoring/graphs-thread-third.mjs / c24522078ac8782ab44fed9dc0e652881b6d16f530a65cc7467612266db45824 | f086b16f6d4fcf427a2de2a489d24d4659ab01f25ae72fee7c0320e3eb05f9a4 (changed) | none |
| graphs-10 | content/authoring/graphs-thread-fourth.mjs / 3dda9e5bd3f103a5c579f28c1004d4ed477b84accf0ced5a6e5738d6a8b6da80 | d66467f7d31cd0dc672573f8a7ec2ddfe88e77da9bed9aa0923d7a3d560470d8 (changed) | none |
| graphs-11 | content/authoring/graphs-thread-fourth.mjs / 3dda9e5bd3f103a5c579f28c1004d4ed477b84accf0ced5a6e5738d6a8b6da80 | 7d6c55508a3d8cd089f1a6b0ca2c54be56409ea1e9b2cbaca297d8016a4a9cc1 (changed) | checkpointIds, nextIds |
| graphs-12 | content/authoring/graphs-thread-fifth.mjs / c8cafa06e4a1c8b801e0e384ea50627d6b03e1117be4884ad477d253425d9c39 | 5c5165bc418f2a281f1d7b9ae862613d1a95b3641a71c835ad11d595c6810f60 (changed) | checkpointIds, nextIds |
| graphs-13 | content/authoring/graphs-thread-fifth.mjs / c8cafa06e4a1c8b801e0e384ea50627d6b03e1117be4884ad477d253425d9c39 | ca06eac037ffc700898a61c3831dfa00e301ab480cf26c5651b5be0f04431ee0 (unchanged) | step, checkpointIds |
| advanced-graphs-06 | content/authoring/advanced-thread-third.mjs / 11777f3559d2c517a461a2a5ad32957a675840be4444674dd0beaf7de7594ae0 | c39c693b3633f69d2900621340d54604b0d19e1c17eb0b2f219bf96014984ce7 (changed) | none |

Exact arrays, prerequisites, counts and current materialized hashes are in owned-source-repairs-ready.json. DP09/10/11 now have reciprocal advanced step5 peers; Graph11/12/13 advanced step6 peers. Bit13 and SCC12 teachers remain mandatory; obsolete final next links are removed.

Graphs08..12 have exactly60 non-visible structural identities; Advanced06 exactly60 terminal-colored geometries. DP suites remain unchanged. Algorithms, statements, typed APIs, references/starters and safeguards remain unchanged by this packet. Source helpers: graphs-thread-edge-semantic.mjs and advanced-thread-game-semantic.mjs.

Reconciled reports:
- docs/release-evidence/dp2d-thread/fourth.json: passed-source-only; command node content/authoring/dp2d-audit.mjs fourth
- docs/release-evidence/dp2d-thread/all.json: passed-source-only; command node content/authoring/dp2d-audit.mjs all
- docs/release-evidence/graphs-thread/third.json: passed-source-only; command node content/authoring/graphs-thread-audit.mjs third
- docs/release-evidence/graphs-thread/fourth.json: passed-source-only; command node content/authoring/graphs-thread-audit.mjs fourth
- docs/release-evidence/graphs-thread/fifth.json: passed-source-only; command node content/authoring/graphs-thread-audit.mjs fifth
- docs/release-evidence/graphs-thread/all.json: passed-source-only; command node content/authoring/graphs-thread-audit.mjs all
- docs/release-evidence/graphs-thread/pack-preflight.json: passed-source-pack-structure; command node content/authoring/graphs-thread-pack-preflight.mjs
- docs/release-evidence/advanced-thread/third.json: passed-source-only; command node content/authoring/advanced-thread-audit.mjs third
- docs/release-evidence/advanced-thread/all.json: passed-source-only; command node content/authoring/advanced-thread-audit.mjs all
- docs/release-evidence/advanced-thread/pack-preflight.json: passed-source-pack-structure; command node content/authoring/advanced-thread-pack-preflight.mjs

Backend owns integration/invalidation; coordinator must bind actual new independent records and judge runs exact native gates. Old execution evidence cannot migrate. No publication claim.

Separate Tries03 version2 source is ready at docs/handoffs/tries-replacement-thread.md. Its original20-file board archive is verified at docs/release-evidence/tries-replacement-thread/archive-board-original/archive-manifest.json.
