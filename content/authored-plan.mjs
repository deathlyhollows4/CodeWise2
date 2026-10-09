// Generated authored metadata; all publication reviews remain separate.
export const authoredPlan=[
  {
    "id": "arrays-hashing-01",
    "title": "Running total",
    "primaryTopic": "arrays-hashing",
    "objective": "Accumulate signed values without losing negatives or overflowing a 32-bit result.",
    "step": 1,
    "skillIds": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "prerequisites": [],
    "approach": "Accumulate signed values without losing negatives or overflowing a 32-bit result.",
    "commonErrors": [
      "skip-first",
      "absolute-values",
      "32-bit-overflow"
    ],
    "checkpointIds": [
      "arrays-hashing-02"
    ],
    "remedialIds": [],
    "nextIds": [
      "arrays-hashing-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-02",
    "title": "Maximum signed reading",
    "primaryTopic": "arrays-hashing",
    "objective": "Maintain a running maximum initialized from valid input rather than zero.",
    "step": 1,
    "skillIds": [
      "arrays.traversal",
      "numbers.running-extremum"
    ],
    "prerequisites": [],
    "approach": "Maintain a running maximum initialized from valid input rather than zero.",
    "commonErrors": [
      "zero-initialization",
      "minimum-instead",
      "last-only"
    ],
    "checkpointIds": [
      "arrays-hashing-01"
    ],
    "remedialIds": [],
    "nextIds": [
      "arrays-hashing-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-03",
    "title": "First repeated position",
    "primaryTopic": "arrays-hashing",
    "objective": "Use membership state to find the first position whose value was already seen.",
    "step": 2,
    "skillIds": [
      "arrays.traversal",
      "hashing.membership",
      "arrays.index-semantics"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Use membership state to find the first position whose value was already seen.",
    "commonErrors": [
      "first-occurrence",
      "adjacent-only",
      "sorted-repeat"
    ],
    "checkpointIds": [
      "arrays-hashing-04"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "arrays-hashing-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "advanced-graphs-01",
    "title": "Least cost of a connected network",
    "primaryTopic": "advanced-graphs",
    "objective": "Minimize the total weight of a connected undirected spanning network, rejecting disconnected inputs.",
    "step": 1,
    "skillIds": [
      "graphs.disjoint-set-state",
      "graphs.cut-safe-edge",
      "graphs.minimum-spanning-cost"
    ],
    "prerequisites": [
      "graphs.component-partition"
    ],
    "approach": "A component partition can accept a cheapest edge that joins two different components; cycles cannot improve a nonnegative spanning network.",
    "commonErrors": [
      "sum-cheapest-n-minus-one-without-cycle-test",
      "narrow-signed32-total"
    ],
    "checkpointIds": [
      "advanced-graphs-02"
    ],
    "remedialIds": [
      "graphs-03"
    ],
    "nextIds": [
      "advanced-graphs-03",
      "advanced-graphs-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "advanced-graphs-02",
    "title": "Can all weighted differences hold?",
    "primaryTopic": "advanced-graphs",
    "objective": "Decide whether one integer potential assignment satisfies every directed difference equation, preserving signed offsets across component joins.",
    "step": 1,
    "skillIds": [
      "graphs.disjoint-set-state",
      "graphs.relative-potential-offset"
    ],
    "prerequisites": [
      "graphs.disjoint-set-state"
    ],
    "approach": "A component join now carries a relative offset. Closing a cycle must agree with offsets already implied inside that component.",
    "commonErrors": [
      "ignore-difference-sign",
      "wrap-component-potentials-to-signed32"
    ],
    "checkpointIds": [
      "advanced-graphs-01"
    ],
    "remedialIds": [
      "advanced-graphs-01"
    ],
    "nextIds": [
      "advanced-graphs-03",
      "advanced-graphs-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "advanced-graphs-03",
    "title": "Smallest worst edge risk",
    "primaryTopic": "advanced-graphs",
    "objective": "Minimize the greatest individual edge risk on an undirected route from vertex 0 to vertex n - 1, rather than its sum or hop count.",
    "step": 2,
    "skillIds": [
      "graphs.minimax-route-risk",
      "graphs.threshold-connectivity"
    ],
    "prerequisites": [
      "graphs.layered-distance"
    ],
    "approach": "A risk threshold permits a route exactly when its allowed edges connect the two endpoints; one high-risk edge dominates a route score.",
    "commonErrors": [
      "minimize-total-additive-cost",
      "consider-only-direct-offers"
    ],
    "checkpointIds": [
      "advanced-graphs-04"
    ],
    "remedialIds": [
      "graphs-02",
      "advanced-graphs-01"
    ],
    "nextIds": [
      "advanced-graphs-05",
      "advanced-graphs-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "advanced-graphs-04",
    "title": "Signed distances and negative-cycle impact",
    "primaryTopic": "advanced-graphs",
    "objective": "Classify each directed vertex as finitely cheapest, unreachable or unbounded below through a reachable negative cycle and downstream edges.",
    "step": 2,
    "skillIds": [
      "graphs.negative-edge-relaxation",
      "graphs.reachable-negative-cycle-impact"
    ],
    "prerequisites": [
      "graphs.layered-distance"
    ],
    "approach": "Repeated edge relaxation handles signed costs; only vertices downstream from a source-reachable negative cycle have unbounded cost.",
    "commonErrors": [
      "omit-negative-cycle-impact",
      "discard-negative-costs"
    ],
    "checkpointIds": [
      "advanced-graphs-03"
    ],
    "remedialIds": [
      "graphs-02",
      "graphs-08",
      "graphs-09"
    ],
    "nextIds": [
      "advanced-graphs-05",
      "advanced-graphs-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "advanced-graphs-05",
    "title": "Least cost for exact flow units",
    "primaryTopic": "advanced-graphs",
    "objective": "Send exactly the required integral units at minimum original-edge cost, using residual reverse edges to revise earlier route choices.",
    "step": 3,
    "skillIds": [
      "graphs.residual-capacity-cost",
      "graphs.reverse-flow-cancellation"
    ],
    "prerequisites": [
      "graphs.negative-edge-relaxation",
      "graphs.directed-cycle-consequences"
    ],
    "approach": "A cheapest first route can block the best final routing. Reverse residual edges cancel earlier units at the negative of their original cost.",
    "commonErrors": [
      "never-cancel-prior-flow",
      "reverse-edge-cost-positive",
      "send-only-one-required-unit"
    ],
    "checkpointIds": [
      "advanced-graphs-06"
    ],
    "remedialIds": [
      "advanced-graphs-04",
      "graphs-08"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "advanced-graphs-06",
    "title": "Winning, losing and drawn target games",
    "primaryTopic": "advanced-graphs",
    "objective": "Classify every position in an alternating-turn directed game as a forced win, forced loss or optimal draw, including cycles and terminal targets.",
    "step": 3,
    "skillIds": [
      "graphs.alternating-game-attractor",
      "graphs.cyclic-draw-region"
    ],
    "prerequisites": [
      "graphs.directed-cycle-consequences"
    ],
    "approach": "A losing successor makes a position winning; all winning successors make it losing. Positions not resolved by that alternating frontier are draws.",
    "commonErrors": [
      "targets-are-winning-for-player-to-move",
      "all-unresolved-cycles-are-losses"
    ],
    "checkpointIds": [
      "advanced-graphs-05"
    ],
    "remedialIds": [
      "graphs-08",
      "graphs-09",
      "advanced-graphs-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "heap-03",
    "title": "The narrowest range covering every feed",
    "primaryTopic": "heap",
    "objective": "Find the smallest-width closed timestamp range containing an event from every independently sorted feed.",
    "step": 3,
    "skillIds": [
      "heap.minimum-cover-frontier",
      "heap.tracked-maximum"
    ],
    "prerequisites": [
      "heap.bounded-frontier",
      "sorted.order"
    ],
    "approach": "Keep one current event per feed. Advance the feed containing the earliest event, while tracking the latest current event; this is a coverage optimization, not merely a merged sequence.",
    "commonErrors": [
      "first-events-only",
      "latest-left-tie",
      "ignore-last-feed"
    ],
    "checkpointIds": [
      "heap-05",
      "heap-07"
    ],
    "remedialIds": [
      "heap-01",
      "two-pointers-04",
      "heap-02"
    ],
    "nextIds": [
      "heap-08",
      "heap-09",
      "heap-10",
      "heap-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-10",
    "title": "The visible height envelope",
    "primaryTopic": "heap",
    "objective": "Compute canonical skyline change points from half-open building spans using an expiring maximum frontier.",
    "step": 4,
    "skillIds": [
      "heap.expiring-max-frontier",
      "geometry.skyline-envelope"
    ],
    "prerequisites": [
      "heap.max-extraction",
      "sorted.order"
    ],
    "approach": "The visible height is the greatest active building height. A max-heap keeps buried buildings available while expired leaders are removed at endpoint events.",
    "commonErrors": [
      "sum-instead-max",
      "closed-endpoints",
      "emit-redundant-events"
    ],
    "checkpointIds": [
      "heap-08",
      "heap-09",
      "heap-12"
    ],
    "remedialIds": [
      "heap-06",
      "two-pointers-04",
      "heap-05",
      "arrays-hashing-04",
      "arrays-hashing-03",
      "heap-01",
      "heap-08"
    ],
    "nextIds": [
      "heap-11",
      "heap-13",
      "heap-14"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-14",
    "title": "Assign queued tasks to weighted servers",
    "primaryTopic": "heap",
    "objective": "Assign FIFO arrivals to free weighted servers while advancing a separate completion-time frontier.",
    "step": 5,
    "skillIds": [
      "heap.dual-resource-frontiers",
      "scheduling.fifo-time-jump"
    ],
    "prerequisites": [
      "heap.release-frontier",
      "arrays.index-semantics"
    ],
    "approach": "One heap chooses among free servers by weight and original index; another releases busy servers by completion time. Jump time only when every server is busy, preserving the waiting queue order.",
    "commonErrors": [
      "narrow-completion-time",
      "reverse-index-ties",
      "reuse-busy-best-weight"
    ],
    "checkpointIds": [
      "heap-11",
      "heap-13"
    ],
    "remedialIds": [
      "heap-08",
      "arrays-hashing-03",
      "arrays-hashing-04",
      "heap-05",
      "heap-06",
      "two-pointers-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "graphs-01",
    "title": "Native neighbor lists to a count matrix",
    "primaryTopic": "graphs",
    "objective": "Convert a rooted native graph to a directed adjacency-count matrix using identity-based breadth-first discovery.",
    "step": 1,
    "skillIds": [
      "graphs.identity-discovery",
      "graphs.adjacency-multiplicity"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Visit native neighbor links and assign an index when a node identity first appears. Values are not identities.",
    "commonErrors": [
      "boolean-edges",
      "identify-nodes-by-value"
    ],
    "checkpointIds": [
      "graphs-03"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "graphs-02",
      "graphs-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-02",
    "title": "Counts of shortest directed routes",
    "primaryTopic": "graphs",
    "objective": "Count the minimum-hop directed edge routes from vertex zero to every vertex, adding only equal-next-layer contributions.",
    "step": 2,
    "skillIds": [
      "graphs.layered-distance",
      "graphs.shortest-route-count"
    ],
    "prerequisites": [
      "graphs.identity-discovery"
    ],
    "approach": "Breadth-first layers identify shortest distance; now combine counts from every predecessor on the previous layer.",
    "commonErrors": [
      "reachability-only",
      "drop-parallel-edges"
    ],
    "checkpointIds": [
      "graphs-04"
    ],
    "remedialIds": [
      "graphs-01"
    ],
    "nextIds": [
      "graphs-05",
      "graphs-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-03",
    "title": "Count all undirected components",
    "primaryTopic": "graphs",
    "objective": "Partition every undirected vertex into one connected component, including isolated vertices.",
    "step": 1,
    "skillIds": [
      "graphs.identity-discovery",
      "graphs.component-partition"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A traversal covers one component. Restart at each vertex that has not yet been reached.",
    "commonErrors": [
      "ignore-isolated-vertices",
      "assume-acyclic-n-minus-edges"
    ],
    "checkpointIds": [
      "graphs-01"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "graphs-02",
      "graphs-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-04",
    "title": "Different island shapes under translation",
    "primaryTopic": "graphs",
    "objective": "Count distinct orthogonally connected land shapes after removing translation, while preserving rotations and reflections as different shapes.",
    "step": 2,
    "skillIds": [
      "graphs.component-partition",
      "graphs.grid-four-neighbors",
      "graphs.translation-shape"
    ],
    "prerequisites": [
      "graphs.identity-discovery"
    ],
    "approach": "A component traversal now collects relative coordinates, so identical translated islands share one signature.",
    "commonErrors": [
      "count-islands-not-shapes",
      "identify-shapes-by-area"
    ],
    "checkpointIds": [
      "graphs-02"
    ],
    "remedialIds": [
      "graphs-01",
      "graphs-03"
    ],
    "nextIds": [
      "graphs-05",
      "graphs-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-05",
    "title": "Largest land component after one flip",
    "primaryTopic": "graphs",
    "objective": "Maximize island area after at most one water-to-land flip without counting a neighboring component more than once.",
    "step": 3,
    "skillIds": [
      "graphs.grid-four-neighbors",
      "graphs.component-merge-dedup"
    ],
    "prerequisites": [
      "graphs.grid-four-neighbors"
    ],
    "approach": "A flip can join several previously labelled components; unique neighbor component IDs prevent double counting.",
    "commonErrors": [
      "count-neighbor-component-more-than-once",
      "ignore-possible-flip",
      "allow-all-water-to-flip"
    ],
    "checkpointIds": [
      "graphs-06"
    ],
    "remedialIds": [
      "graphs-03",
      "graphs-04"
    ],
    "nextIds": [
      "graphs-07",
      "graphs-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-06",
    "title": "Nearest-source distances around walls",
    "primaryTopic": "graphs",
    "objective": "Compute each open cell distance to the closest source through orthogonal non-wall moves, seeding every source at once.",
    "step": 3,
    "skillIds": [
      "graphs.grid-four-neighbors",
      "graphs.layered-distance",
      "graphs.multi-source-frontier"
    ],
    "prerequisites": [
      "graphs.grid-four-neighbors"
    ],
    "approach": "Initialize one distance frontier with every source so the first visit is the nearest-source distance.",
    "commonErrors": [
      "ignore-walls-Manhattan",
      "seed-only-first-source"
    ],
    "checkpointIds": [
      "graphs-05"
    ],
    "remedialIds": [
      "graphs-02",
      "graphs-04"
    ],
    "nextIds": [
      "graphs-07",
      "graphs-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-07",
    "title": "Can all edges cross two colors?",
    "primaryTopic": "graphs",
    "objective": "Decide whether an undirected graph admits two colors with opposite colors on every edge, checking all components.",
    "step": 4,
    "skillIds": [
      "graphs.two-color-invariant",
      "graphs.component-partition"
    ],
    "prerequisites": [
      "graphs.identity-discovery"
    ],
    "approach": "Propagate opposite colors through each traversal and reject a conflicting edge, including an odd cycle or self-loop.",
    "commonErrors": [
      "check-only-component-zero",
      "reject-every-cycle"
    ],
    "checkpointIds": [
      "graphs-08"
    ],
    "remedialIds": [
      "graphs-01",
      "graphs-03"
    ],
    "nextIds": [
      "graphs-09",
      "graphs-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-08",
    "title": "Order every dependency or report a cycle",
    "primaryTopic": "graphs",
    "objective": "Produce any complete topological order of a directed dependency graph, or an empty impossibility result for a directed cycle.",
    "step": 4,
    "skillIds": [
      "graphs.dependency-order",
      "graphs.directed-cycle-consequences"
    ],
    "prerequisites": [
      "graphs.identity-discovery"
    ],
    "approach": "A zero-indegree frontier identifies tasks with no remaining prerequisite; a cycle prevents completing all vertices.",
    "commonErrors": [
      "return-vertex-index-order",
      "return-empty-for-every-graph"
    ],
    "checkpointIds": [
      "graphs-07"
    ],
    "remedialIds": [
      "graphs-01",
      "graphs-03"
    ],
    "nextIds": [
      "graphs-09",
      "graphs-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-09",
    "title": "Vertices whose every route terminates",
    "primaryTopic": "graphs",
    "objective": "Find vertices from which every possible directed walk must eventually stop at a terminal vertex.",
    "step": 5,
    "skillIds": [
      "graphs.reverse-terminal-frontier",
      "graphs.eventual-safety"
    ],
    "prerequisites": [
      "graphs.directed-cycle-consequences"
    ],
    "approach": "Work backward from terminal vertices; a predecessor becomes safe only after every outgoing choice is safe.",
    "commonErrors": [
      "terminals-only",
      "ignore-self-loops"
    ],
    "checkpointIds": [
      "graphs-10"
    ],
    "remedialIds": [
      "graphs-08"
    ],
    "nextIds": [
      "graphs-11",
      "graphs-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-10",
    "title": "One directed trail using every original edge",
    "primaryTopic": "graphs",
    "objective": "Construct a directed Euler trail using every original edge occurrence exactly once, or certify impossibility.",
    "step": 5,
    "skillIds": [
      "graphs.original-edge-trail",
      "graphs.directed-degree-balance"
    ],
    "prerequisites": [
      "graphs.directed-cycle-consequences"
    ],
    "approach": "Track edge identities through cycles and use degree balance to choose a possible start. Parallel edges remain different work items.",
    "commonErrors": [
      "return-input-edge-order",
      "always-claim-impossible"
    ],
    "checkpointIds": [
      "graphs-09"
    ],
    "remedialIds": [
      "graphs-01",
      "graphs-08"
    ],
    "nextIds": [
      "graphs-11",
      "graphs-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "graphs-11",
    "title": "Original edge IDs that split components",
    "primaryTopic": "graphs",
    "objective": "Identify undirected original edges whose removal increases the graph component count, using alternate-route information.",
    "step": 6,
    "skillIds": [
      "graphs.lowlink-return-state",
      "graphs.bridge-edge-cut"
    ],
    "prerequisites": [
      "graphs.component-partition"
    ],
    "approach": "An edge is essential only when its child region cannot reach an earlier vertex by another edge.",
    "commonErrors": [
      "every-edge-is-a-bridge",
      "only-leaf-incident-edges"
    ],
    "checkpointIds": [
      "graphs-12",
      "graphs-13"
    ],
    "remedialIds": [
      "graphs-03",
      "graphs-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "graphs-12",
    "title": "Groups with mutual directed reachability",
    "primaryTopic": "graphs",
    "objective": "Partition every directed vertex into maximal mutually reachable groups, distinguishing one-way reachability from strong connectivity.",
    "step": 6,
    "skillIds": [
      "graphs.strong-components",
      "graphs.finish-order-reversal"
    ],
    "prerequisites": [
      "graphs.component-partition"
    ],
    "approach": "A completed traversal order and reversed edges separate mutually reachable regions even when one-way edges connect them.",
    "commonErrors": [
      "ignore-edge-directions",
      "omit-singleton-components"
    ],
    "checkpointIds": [
      "graphs-11",
      "graphs-13"
    ],
    "remedialIds": [
      "graphs-03",
      "graphs-08",
      "graphs-09"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "graphs-13",
    "title": "Cycle length and depth for every successor vertex",
    "primaryTopic": "graphs",
    "objective": "Compute each functional-graph vertex cycle length and distance to its eventual cycle in one global linear traversal.",
    "step": 6,
    "skillIds": [
      "graphs.functional-cycle-basin",
      "graphs.reverse-elimination-propagation"
    ],
    "prerequisites": [
      "graphs.strong-components"
    ],
    "approach": "One outgoing edge per vertex permits peeling all tails, labeling the remaining cycles, and propagating each basin result backward. This finite path ends here.",
    "commonErrors": [
      "give-all-vertices-distance-zero",
      "assume-one-global-cycle-length"
    ],
    "checkpointIds": [
      "graphs-11",
      "graphs-12"
    ],
    "remedialIds": [
      "graphs-09",
      "graphs-12"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "intervals-05",
    "title": "The greatest combined coverage weight",
    "primaryTopic": "intervals",
    "objective": "Find the maximum signed weight simultaneously active on half-open intervals using grouped endpoint events.",
    "step": 2,
    "skillIds": [
      "intervals.grouped-event-sum",
      "prefix.accumulation"
    ],
    "prerequisites": [
      "numbers.signed-accumulation",
      "intervals.sorted-union"
    ],
    "approach": "Starts add weight and ends remove it. Apply every event at the same coordinate together before measuring the next active range, especially when weights are negative.",
    "commonErrors": [
      "narrow-running-total",
      "ignore-negative-weights",
      "count-closed-contact"
    ],
    "checkpointIds": [
      "intervals-03"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "intervals-01",
      "two-pointers-04",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "intervals-04",
      "intervals-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "intervals-06",
    "title": "Maintain coverage by interval handle",
    "primaryTopic": "intervals",
    "objective": "Maintain half-open interval union length under handle-owned insertion, replacement and removal operations.",
    "step": 3,
    "skillIds": [
      "intervals.dynamic-union-counts",
      "stateful.handle-replacement"
    ],
    "prerequisites": [
      "arrays.traversal",
      "hashing.membership",
      "intervals.endpoint-contact"
    ],
    "approach": "Each active handle owns one range. Cell coverage counts distinguish removing one owner from removing the last owner, while replacement first releases the old range.",
    "commonErrors": [
      "sum-active-lengths",
      "keep-old-replacement",
      "forget-remove-coverage"
    ],
    "checkpointIds": [
      "intervals-04"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-03",
      "intervals-01",
      "arrays-hashing-09",
      "two-pointers-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "intervals-04",
    "title": "How many ranges contain each record?",
    "primaryTopic": "intervals",
    "objective": "Count other enclosing intervals for every original record while handling equal endpoints and duplicate records.",
    "step": 3,
    "skillIds": [
      "intervals.two-coordinate-dominance",
      "prefix.rank-counts"
    ],
    "prerequisites": [
      "arrays.traversal",
      "sorted.order",
      "prefix.accumulation"
    ],
    "approach": "After sorting starts, only the opposite endpoint remains to rank. Process identical records together so they contain one another without counting themselves. Rank compression replaces each distinct endpoint with its sorted position; a Fenwick tree stores running counts of these ranks and answers prefix-count queries efficiently.",
    "commonErrors": [
      "include-self",
      "strict-containment-only",
      "discard-record-multiplicity"
    ],
    "checkpointIds": [
      "intervals-06"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "two-pointers-04",
      "arrays-hashing-09"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "intervals-02",
    "title": "Shared coverage of two calendars",
    "primaryTopic": "intervals",
    "objective": "Compute all closed real-line ranges covered by two individually disjoint sorted calendars.",
    "step": 1,
    "skillIds": [
      "intervals.paired-endpoint-sweep",
      "intervals.endpoint-contact"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Compare the two current ranges. Once the earlier endpoint is passed, that range cannot contribute to any later intersection.",
    "commonErrors": [
      "discard-point-intersections",
      "advance-both-every-time",
      "use-outer-endpoints"
    ],
    "checkpointIds": [
      "intervals-01"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "intervals-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "intervals-03",
    "title": "The earliest free appointment",
    "primaryTopic": "intervals",
    "objective": "Find the earliest fixed-duration free interval inside a bounded half-open scheduling window.",
    "step": 2,
    "skillIds": [
      "intervals.free-gap-frontier",
      "scheduling.fixed-duration"
    ],
    "prerequisites": [
      "intervals.sorted-union"
    ],
    "approach": "Track the earliest possible appointment start while merging blockers. Only gaps long enough for the entire appointment are useful.",
    "commonErrors": [
      "ignore-duration",
      "start-after-all-blockers",
      "closed-blocker-end"
    ],
    "checkpointIds": [
      "intervals-05"
    ],
    "remedialIds": [
      "intervals-01",
      "arrays-hashing-01",
      "arrays-hashing-09",
      "two-pointers-04"
    ],
    "nextIds": [
      "intervals-04",
      "intervals-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-19",
    "title": "Count domino and tromino coverings",
    "primaryTopic": "dp-1d",
    "objective": "Count complete two-row board coverings while accounting for partial frontier shapes.",
    "step": 6,
    "skillIds": [
      "dp.partial-frontier-state",
      "dp.compressed-geometric-count-recurrence"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "An L-shaped tile leaves a staggered frontier, so counting only fully covered shorter boards misses valid coverings.",
    "commonErrors": [
      "omit-tromino-frontiers",
      "empty-board-has-no-coverings"
    ],
    "checkpointIds": [
      "dp-1d-18",
      "dp-1d-11",
      "dp-1d-12"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-21",
      "dp-1d-23"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-20",
    "title": "Minimum travel pass cost",
    "primaryTopic": "dp-1d",
    "objective": "Minimize the cost of covering required travel dates with passes whose validity is measured in consecutive calendar days.",
    "step": 5,
    "skillIds": [
      "dp.calendar-coverage-cost",
      "dp.variable-reach-transition"
    ],
    "prerequisites": [
      "dp.minimum-cost-recurrence",
      "dp.one-dimensional-state"
    ],
    "approach": "A pass skips a variable number of required dates because validity advances calendar time rather than consuming a fixed count of trips.",
    "commonErrors": [
      "duration-counts-trip-entries",
      "only-one-day-passes"
    ],
    "checkpointIds": [
      "dp-1d-09",
      "dp-1d-16",
      "dp-1d-17"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-18",
      "dp-1d-19",
      "dp-1d-11",
      "dp-1d-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-21",
    "title": "Trading with a full-day cooldown",
    "primaryTopic": "dp-1d",
    "objective": "Optimize complete buy/sell transactions while distinguishing a just-sold state from cash that is allowed to buy.",
    "step": 7,
    "skillIds": [
      "dp.temporal-action-state",
      "dp.cooldown-transition"
    ],
    "prerequisites": [
      "dp.one-dimensional-state",
      "dp.take-or-skip"
    ],
    "approach": "A sale disables buying on the following day, so two cash states with equal profit can have different legal next actions.",
    "commonErrors": [
      "narrow-profit-to-int32",
      "ignore-cooldown",
      "allow-only-one-transaction"
    ],
    "checkpointIds": [
      "dp-1d-23"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-03"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-22",
    "title": "Count derangements",
    "primaryTopic": "dp-1d",
    "objective": "Count permutations in which every labelled item leaves its original position, using the paired-cycle insertion cases.",
    "step": 4,
    "skillIds": [
      "dp.combinatorial-insertion-state",
      "math.forbidden-fixed-point-count"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "Placing the first item introduces two different cases: its destination item either returns to the first position or continues a longer cycle.",
    "commonErrors": [
      "count-all-permutations",
      "empty-permutation-is-invalid"
    ],
    "checkpointIds": [
      "dp-1d-15",
      "dp-1d-24"
    ],
    "remedialIds": [
      "dp-1d-01"
    ],
    "nextIds": [
      "dp-1d-09",
      "dp-1d-16",
      "dp-1d-17",
      "dp-1d-20"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-23",
    "title": "Maximum compatible job reward",
    "primaryTopic": "dp-1d",
    "objective": "Choose a maximum-reward nonoverlapping schedule by combining a job with the best compatible predecessor prefix.",
    "step": 7,
    "skillIds": [
      "dp.weighted-compatible-predecessor",
      "binary-search.compatible-end-bound"
    ],
    "prerequisites": [
      "dp.one-dimensional-state",
      "dp.take-or-skip",
      "binary-search.halving"
    ],
    "approach": "Jobs can overlap arbitrary earlier jobs, so take-or-skip decisions need a searched compatible end boundary rather than the immediately preceding job.",
    "commonErrors": [
      "only-largest-single-job",
      "narrow-total-to-int32"
    ],
    "checkpointIds": [
      "dp-1d-21"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-03",
      "binary-search-01",
      "binary-search-02"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-24",
    "title": "Longest wiggle subsequence",
    "primaryTopic": "dp-1d",
    "objective": "Maximize an indexed subsequence whose nonzero consecutive differences alternate sign.",
    "step": 4,
    "skillIds": [
      "dp.last-difference-sign-state",
      "dp.opposite-direction-extension"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "The next extension depends on whether the previous difference rose or fell, not on a globally increasing value frontier.",
    "commonErrors": [
      "count-every-nonzero-difference",
      "force-first-difference-positive"
    ],
    "checkpointIds": [
      "dp-1d-15",
      "dp-1d-22"
    ],
    "remedialIds": [
      "dp-1d-01"
    ],
    "nextIds": [
      "dp-1d-09",
      "dp-1d-16",
      "dp-1d-17",
      "dp-1d-20"
    ],
    "status": "authored-draft"
  },
  {
    "id": "greedy-01",
    "title": "Minimum forward jumps",
    "primaryTopic": "greedy",
    "objective": "Minimize forward jumps by committing only after scanning the complete reachable frontier.",
    "step": 1,
    "skillIds": [
      "greedy.safe-prefix-commitment",
      "greedy.reachable-layer-boundary"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "All positions reached with the same number of jumps form a range; inspect the full range before deciding the next committed boundary.",
    "commonErrors": [
      "return-reachability-only",
      "require-every-adjacent-step"
    ],
    "checkpointIds": [
      "greedy-02"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "greedy-03",
      "greedy-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "greedy-02",
    "title": "Smallest feasible circular fuel start",
    "primaryTopic": "greedy",
    "objective": "Discard an entire failed prefix when selecting the smallest start that can complete a circular route.",
    "step": 1,
    "skillIds": [
      "greedy.safe-prefix-commitment",
      "greedy.failed-prefix-reset",
      "numbers.signed-accumulation"
    ],
    "prerequisites": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "approach": "If a candidate runs out of fuel at a station, every start inside that failed segment is also impossible; keep a separate total to check global feasibility.",
    "commonErrors": [
      "total-nonnegative-means-start-zero",
      "narrow-global-balance-to-int32"
    ],
    "checkpointIds": [
      "greedy-01"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "greedy-03",
      "greedy-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "greedy-03",
    "title": "Minimum candy total",
    "primaryTopic": "greedy",
    "objective": "Meet both neighboring rating inequalities with the minimum global candy total.",
    "step": 2,
    "skillIds": [
      "greedy.bidirectional-local-constraints",
      "greedy.minimum-feasible-allocation"
    ],
    "prerequisites": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "approach": "A left-to-right allocation can satisfy only one neighbor direction; combine both directional lower bounds without increasing equal-rating plateaus.",
    "commonErrors": [
      "left-neighbor-only",
      "narrow-total-to-int32"
    ],
    "checkpointIds": [
      "greedy-04"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "greedy-05",
      "greedy-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "greedy-04",
    "title": "Maximum deadline job reward",
    "primaryTopic": "greedy",
    "objective": "Choose and place unit-time jobs to maximize reward while preserving earlier deadline capacity.",
    "step": 2,
    "skillIds": [
      "greedy.profit-exchange-order",
      "greedy.latest-free-slot"
    ],
    "prerequisites": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "approach": "Consider larger rewards first and place each chosen job as late as possible; wasting an early slot can block a job with a tighter deadline.",
    "commonErrors": [
      "sum-all-rewards",
      "narrow-total-to-int32"
    ],
    "checkpointIds": [
      "greedy-03"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "greedy-05",
      "greedy-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "greedy-05",
    "title": "Smallest number after digit removal",
    "primaryTopic": "greedy",
    "objective": "Delete an exact number of indexed digits while preserving order and minimizing the resulting numerical value.",
    "step": 3,
    "skillIds": [
      "greedy.lexicographic-prefix-improvement",
      "stack.monotone-digit-frontier"
    ],
    "prerequisites": [
      "arrays.traversal",
      "stack.push-pop-history"
    ],
    "approach": "A smaller later digit can improve the earliest differing position while the deletion budget permits removing a larger prefix digit.",
    "commonErrors": [
      "always-delete-from-tail",
      "skip-canonical-zero-formatting"
    ],
    "checkpointIds": [
      "greedy-08"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "stack-02"
    ],
    "nextIds": [
      "greedy-06",
      "greedy-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "greedy-08",
    "title": "Minimum pair-merge cost",
    "primaryTopic": "greedy",
    "objective": "Minimize repeated merge costs by repeatedly combining the two lightest available components.",
    "step": 3,
    "skillIds": [
      "greedy.two-smallest-exchange",
      "greedy.sorted-merge-queues"
    ],
    "prerequisites": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "approach": "Each component contributes its weight once for every merge above it; keeping heavier weights closer to the root minimizes total repeated contribution.",
    "commonErrors": [
      "report-only-final-weight",
      "merge-largest-first"
    ],
    "checkpointIds": [
      "greedy-05"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "stack-02"
    ],
    "nextIds": [
      "greedy-06",
      "greedy-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "greedy-06",
    "title": "Minimum refueling stops",
    "primaryTopic": "greedy",
    "objective": "Minimize refueling stops by selecting the largest refill among already reachable stations only when reach must increase.",
    "step": 4,
    "skillIds": [
      "greedy.maximum-passed-option",
      "greedy.deferred-refueling-choice"
    ],
    "prerequisites": [
      "arrays.traversal",
      "heap.max-extraction"
    ],
    "approach": "When the current range cannot reach the goal, taking the largest available passed refill dominates a smaller refill for the same extra stop.",
    "commonErrors": [
      "fuel-every-passed-station",
      "ignore-station-reachability"
    ],
    "checkpointIds": [
      "greedy-07"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "heap-06",
      "greedy-05",
      "stack-02"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "greedy-07",
    "title": "Smallest unique-letter subsequence",
    "primaryTopic": "greedy",
    "objective": "Select one occurrence of each required letter while preserving order and minimizing lexicographic text.",
    "step": 4,
    "skillIds": [
      "greedy.future-occurrence-feasibility",
      "greedy.unique-letter-commitment"
    ],
    "prerequisites": [
      "greedy.lexicographic-prefix-improvement",
      "stack.push-pop-history"
    ],
    "approach": "A larger prefix letter may be removed only if it appears again later; uniqueness and future availability constrain each improvement.",
    "commonErrors": [
      "sort-distinct-letters-without-subsequence-check",
      "always-keep-first-occurrence"
    ],
    "checkpointIds": [
      "greedy-06"
    ],
    "remedialIds": [
      "greedy-05",
      "stack-02",
      "arrays-hashing-01",
      "heap-06"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "heap-09",
    "title": "Extract tasks after handle cancellations",
    "primaryTopic": "heap",
    "objective": "Process stable-priority task extraction with cancellation and safe reuse of inactive handles.",
    "step": 4,
    "skillIds": [
      "heap.stale-entry-versioning",
      "heap.stable-priority-order"
    ],
    "prerequisites": [
      "heap.max-extraction",
      "hashing.membership"
    ],
    "approach": "Cancelled heap entries may remain physically present. An active handle and its successful-add generation determine whether an entry is still current.",
    "commonErrors": [
      "cancel-is-noop",
      "handle-without-generation"
    ],
    "checkpointIds": [
      "heap-08"
    ],
    "remedialIds": [
      "heap-06",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "heap-11",
      "heap-13"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-12",
    "title": "The first pairs in sum order",
    "primaryTopic": "heap",
    "objective": "Enumerate the leading Cartesian index pairs by a stable sum ranking without constructing every pair.",
    "step": 4,
    "skillIds": [
      "heap.multistream-frontier",
      "arrays.cartesian-ranking"
    ],
    "prerequisites": [
      "heap.bounded-frontier",
      "sorted.order"
    ],
    "approach": "Each left position defines a sorted row of pair sums. A heap merges the row frontiers, advancing only the row whose next pair was selected.",
    "commonErrors": [
      "reverse-equal-sum-indices",
      "discard-equal-reading-positions",
      "largest-first"
    ],
    "checkpointIds": [
      "heap-09"
    ],
    "remedialIds": [
      "heap-01",
      "two-pointers-04"
    ],
    "nextIds": [
      "heap-11",
      "heap-13"
    ],
    "status": "authored-draft"
  },
  {
    "id": "tries-03",
    "title": "Score dictionary prefix agreement",
    "primaryTopic": "tries",
    "objective": "For each literal query, sum dictionary-occurrence counts over its nonempty prefixes, equivalently summing longest-common-prefix lengths with every dictionary occurrence.",
    "step": 1,
    "skillIds": [
      "tries.prefix-navigation",
      "tries.prefix-count-accumulation",
      "tries.dictionary-multiplicity"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A Trie visit already identifies one prefix. Store how many dictionary occurrences pass through each prefix node and add those counters while following a query.",
    "commonErrors": [
      "deduplicate-dictionary-occurrences",
      "count-only-terminal-prefixes",
      "use-only-last-prefix-count",
      "include-empty-root-count",
      "stop-at-first-terminal",
      "use-boolean-prefix-presence",
      "carry-score-between-queries",
      "sum-substring-instead-of-initial-agreement"
    ],
    "checkpointIds": [
      "tries-01",
      "tries-02"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "tries-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-01",
    "title": "Routes around closed cells",
    "primaryTopic": "dp-2d",
    "objective": "Count monotone grid routes while resetting blocked states and combining two incoming directions.",
    "step": 1,
    "skillIds": [
      "dp.two-coordinate-state",
      "dp.grid-counting"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "You already combine counts for line positions. Track a row and column, and let closed cells contribute zero.",
    "commonErrors": [
      "ignore-closed-cells",
      "count-diagonal-moves"
    ],
    "checkpointIds": [
      "dp-2d-02"
    ],
    "remedialIds": [
      "dp-1d-01"
    ],
    "nextIds": [
      "dp-2d-03",
      "dp-2d-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-02",
    "title": "Least cost of a right-down route",
    "primaryTopic": "dp-2d",
    "objective": "Minimize a monotone grid route using the cheaper incoming state and include both endpoints.",
    "step": 1,
    "skillIds": [
      "dp.two-coordinate-state",
      "dp.grid-minimum-cost"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "Use familiar two-predecessor states to minimize a cost; a grid adds row and column boundaries.",
    "commonErrors": [
      "omit-starting-cost",
      "narrow-signed32-total",
      "local-cheapest-neighbor"
    ],
    "checkpointIds": [
      "dp-2d-01"
    ],
    "remedialIds": [
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-2d-03",
      "dp-2d-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-03",
    "title": "Longest shared ordered subsequence",
    "primaryTopic": "dp-2d",
    "objective": "Maximize a common subsequence length by matching or skipping positions in two prefixes.",
    "step": 2,
    "skillIds": [
      "dp.two-coordinate-state",
      "dp.two-prefix-state",
      "dp.common-subsequence"
    ],
    "prerequisites": [
      "dp.two-coordinate-state"
    ],
    "approach": "Keep two coordinates, now one prefix length per sequence. Matching values adds a diagonal transition.",
    "commonErrors": [
      "multiset-intersection",
      "require-contiguous-match"
    ],
    "checkpointIds": [
      "dp-2d-04"
    ],
    "remedialIds": [
      "dp-2d-01",
      "dp-2d-02"
    ],
    "nextIds": [
      "dp-2d-05",
      "dp-2d-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-04",
    "title": "Fewest single-character edits",
    "primaryTopic": "dp-2d",
    "objective": "Minimize insert, delete and replace operations over a pair of sequence prefixes.",
    "step": 2,
    "skillIds": [
      "dp.two-coordinate-state",
      "dp.two-prefix-state",
      "dp.edit-transitions"
    ],
    "prerequisites": [
      "dp.two-coordinate-state"
    ],
    "approach": "Keep two prefix coordinates and compare three possible final edit operations.",
    "commonErrors": [
      "forbid-replacements",
      "use-length-difference-only"
    ],
    "checkpointIds": [
      "dp-2d-03"
    ],
    "remedialIds": [
      "dp-2d-01",
      "dp-2d-02"
    ],
    "nextIds": [
      "dp-2d-05",
      "dp-2d-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-05",
    "title": "Count indexed target subsequences",
    "primaryTopic": "dp-2d",
    "objective": "Count source index selections that spell one fixed target, preserving order and multiplicity.",
    "step": 3,
    "skillIds": [
      "dp.two-prefix-state",
      "dp.indexed-subsequence-count"
    ],
    "prerequisites": [
      "dp.two-prefix-state"
    ],
    "approach": "Matching and skipping still use prefix states; add counts of distinct index choices instead of taking a maximum.",
    "commonErrors": [
      "collapse-all-spellings-to-one",
      "reuse-one-source-position",
      "empty-target-is-zero"
    ],
    "checkpointIds": [
      "dp-2d-06"
    ],
    "remedialIds": [
      "dp-2d-03",
      "dp-2d-04"
    ],
    "nextIds": [
      "dp-2d-07",
      "dp-2d-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-06",
    "title": "Preserve both orders in a merge",
    "primaryTopic": "dp-2d",
    "objective": "Decide whether each target position can consume the next character of either source while preserving both orders.",
    "step": 3,
    "skillIds": [
      "dp.two-prefix-state",
      "dp.interleave-feasibility"
    ],
    "prerequisites": [
      "dp.two-prefix-state"
    ],
    "approach": "Reuse two prefixes, now treating states as feasible or impossible; a target prefix consumes exactly their total length.",
    "commonErrors": [
      "greedily-prefer-source-a",
      "frequencies-are-enough"
    ],
    "checkpointIds": [
      "dp-2d-05"
    ],
    "remedialIds": [
      "dp-2d-03",
      "dp-2d-04"
    ],
    "nextIds": [
      "dp-2d-07",
      "dp-2d-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-07",
    "title": "Best value with single-use items",
    "primaryTopic": "dp-2d",
    "objective": "Maximize total value under a capacity limit while consuming each indexed item at most once.",
    "step": 4,
    "skillIds": [
      "dp.two-prefix-state",
      "dp.bounded-selection",
      "dp.weighted-capacity-value"
    ],
    "prerequisites": [
      "dp.two-prefix-state"
    ],
    "approach": "One state coordinate is the number of considered items and the other is remaining capacity; values make this different from exact-subset feasibility.",
    "commonErrors": [
      "reuse-items-forward-capacity",
      "discard-zero-weight",
      "narrow-signed32-value"
    ],
    "checkpointIds": [
      "dp-2d-08"
    ],
    "remedialIds": [
      "dp-1d-08",
      "dp-2d-03",
      "dp-2d-04"
    ],
    "nextIds": [
      "dp-2d-09",
      "dp-2d-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-08",
    "title": "Match a whole text with star and question mark",
    "primaryTopic": "dp-2d",
    "objective": "Match the entire text using zero-or-more star consumption and exactly-one question-mark consumption.",
    "step": 4,
    "skillIds": [
      "dp.two-prefix-state",
      "dp.wildcard-consumption"
    ],
    "prerequisites": [
      "dp.two-prefix-state"
    ],
    "approach": "Two prefixes still define the state, but a star can either consume no character or extend the consumed text.",
    "commonErrors": [
      "star-consumes-exactly-one",
      "ignore-whole-text-ending"
    ],
    "checkpointIds": [
      "dp-2d-07"
    ],
    "remedialIds": [
      "dp-2d-03",
      "dp-2d-04"
    ],
    "nextIds": [
      "dp-2d-09",
      "dp-2d-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-09",
    "title": "Least scalar work for a matrix chain",
    "primaryTopic": "dp-2d",
    "objective": "Minimize parenthesization cost without changing matrix order, accounting for the shapes of both subproducts.",
    "step": 5,
    "skillIds": [
      "dp.interval-split-cost",
      "dp.two-coordinate-state"
    ],
    "prerequisites": [
      "dp.two-prefix-state"
    ],
    "approach": "Replace two prefix coordinates by interval endpoints and compare each possible final split.",
    "commonErrors": [
      "always-left-associate",
      "greedily-smallest-immediate-product",
      "narrow-signed32-cost"
    ],
    "checkpointIds": [
      "dp-2d-10",
      "dp-2d-11"
    ],
    "remedialIds": [
      "dp-2d-03",
      "dp-2d-04",
      "dp-2d-07",
      "dp-2d-08"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-10",
    "title": "Two downward collectors share cells",
    "primaryTopic": "dp-2d",
    "objective": "Optimize two simultaneous downward routes with coupled column states and count an occupied shared cell once.",
    "step": 5,
    "skillIds": [
      "dp.two-coordinate-state",
      "dp.paired-position-state",
      "dp.shared-cell-accounting"
    ],
    "prerequisites": [
      "dp.two-coordinate-state",
      "dp.two-prefix-state"
    ],
    "approach": "Keep the current row shared and add the second collector column. Their choices interact when they meet.",
    "commonErrors": [
      "double-count-overlap",
      "never-leave-starting-columns",
      "narrow-signed32-reward"
    ],
    "checkpointIds": [
      "dp-2d-09",
      "dp-2d-11"
    ],
    "remedialIds": [
      "dp-2d-01",
      "dp-2d-02",
      "dp-2d-07",
      "dp-2d-08"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "dp-2d-11",
    "title": "Least directed cycle visiting every stop",
    "primaryTopic": "dp-2d",
    "objective": "Minimize an edge-order-dependent directed Hamiltonian cycle using a visited subset and last vertex.",
    "step": 5,
    "skillIds": [
      "bits.assigned-subset-state",
      "dp.subset-last-vertex-cost"
    ],
    "prerequisites": [
      "bits.assigned-subset-state",
      "dp.two-coordinate-state"
    ],
    "approach": "A subset records visited stops, as in assignment state. Add the last stop because the cost of the next edge depends on it. This is the final step of this finite path.",
    "commonErrors": [
      "omit-return-to-zero",
      "pretend-edges-undirected",
      "narrow-signed32-cycle"
    ],
    "checkpointIds": [
      "dp-2d-09",
      "dp-2d-10"
    ],
    "remedialIds": [
      "bit-manipulation-13",
      "dp-2d-02",
      "dp-2d-07"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "intervals-01",
    "title": "Merge closed coverage ranges",
    "primaryTopic": "intervals",
    "objective": "Represent the union of closed real-line intervals as sorted disjoint coverage ranges.",
    "step": 1,
    "skillIds": [
      "intervals.sorted-union",
      "intervals.endpoint-contact"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Sorting puts the next possible overlap beside the current range. Endpoint contact counts as coverage and extends that range.",
    "commonErrors": [
      "do-not-merge-touching",
      "drop-point-ranges",
      "overwrite-containing-end"
    ],
    "checkpointIds": [
      "intervals-02"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "intervals-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-03",
    "title": "Restore every valid four-part address",
    "primaryTopic": "backtracking",
    "objective": "Enumerate every valid segmentation under both segment grammar and remaining-length constraints.",
    "step": 2,
    "skillIds": [
      "backtracking.branch-restoration",
      "backtracking.segment-grammar",
      "backtracking.remaining-length-pruning"
    ],
    "prerequisites": [
      "backtracking.branch-restoration"
    ],
    "approach": "Choosing segment widths introduces grammar validation and admissible length pruning, rather than simply choosing a subset or arranging existing elements.",
    "commonErrors": [
      "allow-leading-zero-octets",
      "allow-octets-above-255",
      "reverse-answer-order"
    ],
    "checkpointIds": [
      "backtracking-04"
    ],
    "remedialIds": [
      "backtracking-01",
      "backtracking-02"
    ],
    "nextIds": [
      "backtracking-05",
      "backtracking-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-04",
    "title": "Arrange items with position-specific permissions",
    "primaryTopic": "backtracking",
    "objective": "Enumerate complete bijections satisfying position-specific permissions, restoring both the path and used-item state between branches.",
    "step": 2,
    "skillIds": [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "backtracking.position-constraints"
    ],
    "prerequisites": [
      "backtracking.branch-restoration"
    ],
    "approach": "A local permission does not guarantee global feasibility: multiple positions may compete for the same original item. This introduces constrained permutations and all-different state, distinct from signed subset enumeration.",
    "commonErrors": [
      "reuse-permitted-items",
      "transpose-position-item-permissions",
      "reverse-enumeration-order"
    ],
    "checkpointIds": [
      "backtracking-03"
    ],
    "remedialIds": [
      "backtracking-01",
      "backtracking-02"
    ],
    "nextIds": [
      "backtracking-05",
      "backtracking-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-05",
    "title": "Build a target total from limited stock",
    "primaryTopic": "backtracking",
    "objective": "Enumerate bounded multiplicity vectors for a wide target without inventing stock or duplicate orderings.",
    "step": 3,
    "skillIds": [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation",
      "backtracking.bounded-multiplicity",
      "backtracking.positive-target-pruning"
    ],
    "prerequisites": [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation"
    ],
    "approach": "Choices are quantities per distinct denomination, rather than original-position subsets or arbitrary reuse. Positive denominations justify pruning only when a partial total exceeds the target.",
    "commonErrors": [
      "ignore-stock-cap",
      "use-32-bit-target",
      "omit-zero-denomination-counts"
    ],
    "checkpointIds": [
      "backtracking-06"
    ],
    "remedialIds": [
      "backtracking-01",
      "backtracking-02"
    ],
    "nextIds": [
      "backtracking-07",
      "backtracking-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-06",
    "title": "Complete a partially fixed delimiter pattern",
    "primaryTopic": "backtracking",
    "objective": "Enumerate all balanced completions while respecting fixed symbols and pruning irrecoverable prefixes.",
    "step": 3,
    "skillIds": [
      "backtracking.branch-restoration",
      "backtracking.prefix-feasibility",
      "backtracking.remaining-capacity-pruning"
    ],
    "prerequisites": [
      "backtracking.branch-restoration"
    ],
    "approach": "A partially constrained pattern creates meaningful distinct search domains. Prefix feasibility and remaining capacity eliminate branches that cannot be repaired, unlike unconstrained n-only enumeration.",
    "commonErrors": [
      "ignore-fixed-symbols",
      "only-check-final-balance",
      "reverse-answer-order"
    ],
    "checkpointIds": [
      "backtracking-05"
    ],
    "remedialIds": [
      "backtracking-01",
      "backtracking-02"
    ],
    "nextIds": [
      "backtracking-07",
      "backtracking-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-07",
    "title": "Complete a four-by-four constraint grid",
    "primaryTopic": "backtracking",
    "objective": "Enumerate complete grids under intersecting row, column and block constraints while respecting all fixed clues.",
    "step": 4,
    "skillIds": [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "backtracking.multi-constraint-state"
    ],
    "prerequisites": [
      "backtracking.branch-restoration",
      "backtracking.used-item-state"
    ],
    "approach": "Each choice updates several shared constraint scopes. Distinct clue-location masks exercise propagation, ambiguity and contradiction rather than renaming an unconstrained puzzle.",
    "commonErrors": [
      "ignore-two-by-two-blocks",
      "discard-fixed-clues",
      "return-only-first-solution"
    ],
    "checkpointIds": [
      "backtracking-08"
    ],
    "remedialIds": [
      "backtracking-04"
    ],
    "nextIds": [
      "backtracking-09",
      "backtracking-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-08",
    "title": "Insert operators without changing the digits",
    "primaryTopic": "backtracking",
    "objective": "Enumerate operand boundaries and operators while maintaining multiplication precedence and canonical decimal literals.",
    "step": 4,
    "skillIds": [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation",
      "backtracking.operand-boundaries",
      "backtracking.precedence-state"
    ],
    "prerequisites": [
      "backtracking.branch-restoration",
      "numbers.signed-accumulation"
    ],
    "approach": "Search chooses both operand lengths and operations. Remembering the signed last multiplicative term avoids reparsing prefixes or evaluating operators left to right.",
    "commonErrors": [
      "evaluate-multiplication-left-to-right",
      "allow-leading-zero-operands",
      "truncate-target-to-32-bits"
    ],
    "checkpointIds": [
      "backtracking-07"
    ],
    "remedialIds": [
      "backtracking-01",
      "backtracking-02"
    ],
    "nextIds": [
      "backtracking-09",
      "backtracking-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-09",
    "title": "Place queens around blocked and fixed squares",
    "primaryTopic": "backtracking",
    "objective": "Enumerate nonattacking placements with blocked squares and immutable row-specific queen constraints.",
    "step": 5,
    "skillIds": [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "backtracking.multi-constraint-state",
      "backtracking.diagonal-constraints"
    ],
    "prerequisites": [
      "backtracking.branch-restoration",
      "backtracking.used-item-state"
    ],
    "approach": "Diagonal attack scopes and blocked/fixed squares create a substantive constrained-board domain; distinct inputs are not renamed unconstrained n-only queens instances.",
    "commonErrors": [
      "ignore-diagonal-attacks",
      "ignore-fixed-queens",
      "ignore-blocked-squares"
    ],
    "checkpointIds": [
      "backtracking-10"
    ],
    "remedialIds": [
      "backtracking-04",
      "backtracking-07"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-10",
    "title": "Find every feasible order on one resource",
    "primaryTopic": "backtracking",
    "objective": "Enumerate all original-task orders feasible under release times, durations and inclusive deadlines, pruning failed prefixes.",
    "step": 5,
    "skillIds": [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "numbers.signed-accumulation",
      "backtracking.schedule-prefix-pruning"
    ],
    "prerequisites": [
      "backtracking.branch-restoration",
      "backtracking.used-item-state",
      "numbers.signed-accumulation"
    ],
    "approach": "All tasks must execute; this is not selecting maximum reward, optimizing one ordering, or enumerating arbitrary idle times. Release times and nonpreemption make a fixed order’s earliest schedule the correct feasibility certificate.",
    "commonErrors": [
      "ignore-release-times",
      "treat-deadline-as-exclusive",
      "ignore-deadline-failures"
    ],
    "checkpointIds": [
      "backtracking-09"
    ],
    "remedialIds": [
      "backtracking-02",
      "backtracking-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-04",
    "title": "Sorted frequency table",
    "primaryTopic": "arrays-hashing",
    "objective": "Count signed values and return deterministic sorted value/count pairs.",
    "step": 2,
    "skillIds": [
      "arrays.traversal",
      "hashing.counts",
      "ordering.keys"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A set remembers whether a value occurred. A map, which stores a value for each key, now remembers how often it occurred.",
    "commonErrors": [
      "all-counts-one",
      "omit-negatives"
    ],
    "checkpointIds": [
      "arrays-hashing-03"
    ],
    "remedialIds": [
      "arrays-hashing-03"
    ],
    "nextIds": [
      "arrays-hashing-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-05",
    "title": "Keep first appearances",
    "primaryTopic": "arrays-hashing",
    "objective": "Remove duplicate values while preserving first-appearance order.",
    "step": 3,
    "skillIds": [
      "hashing.membership",
      "arrays.stable-output"
    ],
    "prerequisites": [
      "hashing.membership"
    ],
    "approach": "Membership is familiar. Preserve original order while creating a separate output rather than sorting the input.",
    "commonErrors": [
      "sorted-output",
      "unchanged-input"
    ],
    "checkpointIds": [
      "arrays-hashing-06"
    ],
    "remedialIds": [
      "arrays-hashing-03"
    ],
    "nextIds": [
      "arrays-hashing-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-06",
    "title": "One gap in a range",
    "primaryTopic": "arrays-hashing",
    "objective": "Find the one missing label from a complete0..n range with distinct inputs.",
    "step": 3,
    "skillIds": [
      "hashing.membership",
      "numbers.range-invariant"
    ],
    "prerequisites": [
      "arrays.traversal",
      "hashing.membership"
    ],
    "approach": "Membership is familiar; use the known range to account for an absent value.",
    "commonErrors": [
      "never-check-upper",
      "assume-sorted"
    ],
    "checkpointIds": [
      "arrays-hashing-05"
    ],
    "remedialIds": [
      "arrays-hashing-03"
    ],
    "nextIds": [
      "arrays-hashing-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-07",
    "title": "Earliest matching pair",
    "primaryTopic": "arrays-hashing",
    "objective": "Find a target-sum index pair with explicit deterministic tie-breaking.",
    "step": 4,
    "skillIds": [
      "hashing.complement",
      "arrays.lexicographic-indices"
    ],
    "prerequisites": [
      "arrays.traversal",
      "hashing.membership"
    ],
    "approach": "A lookup now matches the value needed to complete a pair, while preserving the earliest indices.",
    "commonErrors": [
      "first-finish",
      "reuse-position"
    ],
    "checkpointIds": [
      "arrays-hashing-08"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-04"
    ],
    "nextIds": [
      "arrays-hashing-09"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-08",
    "title": "Letter rearrangement groups",
    "primaryTopic": "arrays-hashing",
    "objective": "Group words by letter multiplicities while retaining duplicates and deterministic output.",
    "step": 4,
    "skillIds": [
      "hashing.canonical-keys",
      "strings.counts"
    ],
    "prerequisites": [
      "arrays.traversal",
      "hashing.membership"
    ],
    "approach": "Use a whole word’s letter counts as a key rather than one numeric label.",
    "commonErrors": [
      "ignore-counts",
      "remove-duplicates"
    ],
    "checkpointIds": [
      "arrays-hashing-07"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-04"
    ],
    "nextIds": [
      "arrays-hashing-09"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-09",
    "title": "Prefix ledger",
    "primaryTopic": "arrays-hashing",
    "objective": "Return every prefix sum including the empty prefix.",
    "step": 5,
    "skillIds": [
      "prefix.accumulation",
      "arrays.output-boundary"
    ],
    "prerequisites": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "approach": "The running total now becomes an output at every boundary, including the start.",
    "commonErrors": [
      "omit-empty",
      "positive-only"
    ],
    "checkpointIds": [
      "arrays-hashing-10"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "arrays-hashing-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-10",
    "title": "Product without this position",
    "primaryTopic": "arrays-hashing",
    "objective": "Combine prefix and suffix products without dividing or mishandling zeros.",
    "step": 5,
    "skillIds": [
      "prefix.products",
      "suffix.products",
      "numbers.zero-handling"
    ],
    "prerequisites": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "approach": "Prefix information is familiar. Combine what comes before a position with what comes after it.",
    "commonErrors": [
      "include-self",
      "zeros-as-one"
    ],
    "checkpointIds": [
      "arrays-hashing-09"
    ],
    "remedialIds": [
      "arrays-hashing-09"
    ],
    "nextIds": [
      "arrays-hashing-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-11",
    "title": "Consecutive label run",
    "primaryTopic": "arrays-hashing",
    "objective": "Find the longest consecutive-value run while ignoring duplicates and original positions.",
    "step": 6,
    "skillIds": [
      "hashing.run-start",
      "numbers.adjacency"
    ],
    "prerequisites": [
      "arrays.traversal",
      "hashing.membership"
    ],
    "approach": "Use membership to recognize a run start, then count consecutive values only once.",
    "commonErrors": [
      "count-duplicates",
      "original-adjacency"
    ],
    "checkpointIds": [
      "arrays-hashing-13"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-03",
      "arrays-hashing-09"
    ],
    "nextIds": [
      "arrays-hashing-16"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-12",
    "title": "Equal ledger cut",
    "primaryTopic": "arrays-hashing",
    "objective": "Find the earliest boundary splitting signed values into two nonempty equal-sum parts.",
    "step": 6,
    "skillIds": [
      "prefix.partition",
      "numbers.signed-comparison"
    ],
    "prerequisites": [
      "arrays.traversal",
      "prefix.accumulation",
      "numbers.signed-accumulation"
    ],
    "approach": "Prefix totals now test a boundary against the total remaining on its right.",
    "commonErrors": [
      "allow-empty-left",
      "latest-valid"
    ],
    "checkpointIds": [
      "arrays-hashing-13"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-03",
      "arrays-hashing-09"
    ],
    "nextIds": [
      "arrays-hashing-16"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-13",
    "title": "Verified majority label",
    "primaryTopic": "arrays-hashing",
    "objective": "Verify whether a label appears strictly more than half the time.",
    "step": 6,
    "skillIds": [
      "arrays.candidate-cancellation",
      "arrays.majority-verification"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A potential winner is not proof. Count its occurrences before reporting a strict majority.",
    "commonErrors": [
      "accept-half",
      "candidate-without-verification"
    ],
    "checkpointIds": [
      "arrays-hashing-15"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-03",
      "arrays-hashing-09"
    ],
    "nextIds": [
      "arrays-hashing-16"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-14",
    "title": "Count target segments",
    "primaryTopic": "arrays-hashing",
    "objective": "Count nonempty contiguous segments whose signed sum matches a target.",
    "step": 7,
    "skillIds": [
      "prefix.difference",
      "hashing.prefix-multiplicity"
    ],
    "prerequisites": [
      "arrays.traversal",
      "prefix.accumulation",
      "hashing.counts",
      "numbers.signed-accumulation"
    ],
    "approach": "Two prefix totals differ by a segment sum. Count how many earlier prefixes supply the required difference.",
    "commonErrors": [
      "distinct-prefixes-only",
      "32-bit-count",
      "32-bit-prefix"
    ],
    "checkpointIds": [
      "arrays-hashing-16"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-03",
      "arrays-hashing-04",
      "arrays-hashing-09"
    ],
    "nextIds": [
      "arrays-hashing-17"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-15",
    "title": "Repair one sorted span",
    "primaryTopic": "arrays-hashing",
    "objective": "Find the minimum length of one contiguous region whose sorting orders the whole array.",
    "step": 6,
    "skillIds": [
      "arrays.order-invariant",
      "prefix.extrema"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Compare the original order with the required order and identify the smallest region containing every mismatch.",
    "commonErrors": [
      "count-descents",
      "ignore-equal-boundary"
    ],
    "checkpointIds": [
      "arrays-hashing-13"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-03",
      "arrays-hashing-09"
    ],
    "nextIds": [
      "arrays-hashing-16"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-16",
    "title": "Balanced binary span",
    "primaryTopic": "arrays-hashing",
    "objective": "Find the longest contiguous span containing equally many zeros and ones.",
    "step": 7,
    "skillIds": [
      "prefix.balance-transform",
      "hashing.first-prefix-position"
    ],
    "prerequisites": [
      "arrays.traversal",
      "prefix.accumulation",
      "hashing.membership",
      "numbers.signed-accumulation"
    ],
    "approach": "Treat zero as-1 and one as+1; equal prefix balances locate a span with zero total.",
    "commonErrors": [
      "scattered-count",
      "overwrite-earliest"
    ],
    "checkpointIds": [
      "arrays-hashing-14"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-03",
      "arrays-hashing-04",
      "arrays-hashing-09"
    ],
    "nextIds": [
      "arrays-hashing-17"
    ],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-17",
    "title": "Zero propagation grid",
    "primaryTopic": "arrays-hashing",
    "objective": "Zero rows and columns based only on zeros in the original matrix.",
    "step": 8,
    "skillIds": [
      "matrices.original-state",
      "hashing.row-column-flags"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Remember the original zero locations before changing outputs, so newly written zeros cannot spread further.",
    "commonErrors": [
      "cascade-new-zeros",
      "rows-only"
    ],
    "checkpointIds": [
      "arrays-hashing-18"
    ],
    "remedialIds": [
      "arrays-hashing-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "arrays-hashing-18",
    "title": "Merge sparse histograms",
    "primaryTopic": "arrays-hashing",
    "objective": "Merge preaggregated sorted histograms by adding shared-label weights without expanding them.",
    "step": 8,
    "skillIds": [
      "hashing.weighted-counts",
      "sorted.key-merge"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Counts are already aggregated. Merge their keys and add weights instead of replaying every occurrence.",
    "commonErrors": [
      "overwrite-shared",
      "concatenate-only"
    ],
    "checkpointIds": [
      "arrays-hashing-17"
    ],
    "remedialIds": [
      "arrays-hashing-17"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-01",
    "title": "Reverse letter order",
    "primaryTopic": "two-pointers",
    "objective": "Visit the two ends of a sequence and build its reversed order.",
    "step": 1,
    "skillIds": [
      "pointers.opposing",
      "strings.ascii-indexing"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "You already visit an array in order. Now move two positions toward each other.",
    "commonErrors": [
      "sort-instead-of-reverse",
      "omit-final-character"
    ],
    "checkpointIds": [
      "two-pointers-02"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "two-pointers-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-02",
    "title": "Check a letter mirror",
    "primaryTopic": "two-pointers",
    "objective": "Recognize symmetry by comparing opposite character pairs until a mismatch is found.",
    "step": 1,
    "skillIds": [
      "pointers.symmetry-invariant"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Moving inward is familiar. Stop when a mismatched pair proves the answer false.",
    "commonErrors": [
      "case-insensitive-comparison",
      "only-check-outer-pair"
    ],
    "checkpointIds": [
      "two-pointers-01"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "two-pointers-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-03",
    "title": "Move zero readings to the end",
    "primaryTopic": "two-pointers",
    "objective": "Move zeros behind nonzero readings while preserving the original nonzero order and every input entry.",
    "step": 2,
    "skillIds": [
      "pointers.read-write",
      "arrays.stable-partition"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "The pointers now have different jobs: one reads every value, while one marks the next nonzero output position.",
    "commonErrors": [
      "sort-nonzero-portion",
      "discard-zero-entries"
    ],
    "checkpointIds": [
      "two-pointers-04"
    ],
    "remedialIds": [
      "two-pointers-01",
      "two-pointers-04"
    ],
    "nextIds": [
      "two-pointers-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-04",
    "title": "Merge two reading timelines",
    "primaryTopic": "two-pointers",
    "objective": "Advance the cursor pointing to the smaller next value and retain all remaining values.",
    "step": 2,
    "skillIds": [
      "pointers.merge-cursors",
      "sorted.order"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Each cursor now tracks a different sorted input. Only one needs to advance at each step.",
    "commonErrors": [
      "deduplicate-inputs",
      "drop-remainder"
    ],
    "checkpointIds": [
      "two-pointers-03"
    ],
    "remedialIds": [
      "two-pointers-01"
    ],
    "nextIds": [
      "two-pointers-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-05",
    "title": "Keep squared readings sorted",
    "primaryTopic": "two-pointers",
    "objective": "Place the largest remaining square at the end while comparing opposing absolute magnitudes.",
    "step": 3,
    "skillIds": [
      "pointers.compare-absolute-ends",
      "sorted.output-backwards"
    ],
    "prerequisites": [
      "pointers.opposing",
      "sorted.order"
    ],
    "approach": "Negative readings change order when squared; compare both ends rather than trusting the original order.",
    "commonErrors": [
      "keep-input-order",
      "32-bit-multiplication"
    ],
    "checkpointIds": [
      "two-pointers-06"
    ],
    "remedialIds": [
      "two-pointers-01",
      "two-pointers-04",
      "two-pointers-06"
    ],
    "nextIds": [
      "two-pointers-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-06",
    "title": "Count matching position pairs",
    "primaryTopic": "two-pointers",
    "objective": "Count every matching pair of distinct positions, including multiplicities in equal-value runs.",
    "step": 3,
    "skillIds": [
      "pointers.target-sum",
      "pointers.equal-run-products"
    ],
    "prerequisites": [
      "pointers.opposing",
      "sorted.order"
    ],
    "approach": "Finding a matching pair is not enough: duplicate runs can represent many different position pairs.",
    "commonErrors": [
      "count-only-value-pairs",
      "reuse-same-position"
    ],
    "checkpointIds": [
      "two-pointers-05"
    ],
    "remedialIds": [
      "two-pointers-01",
      "two-pointers-04"
    ],
    "nextIds": [
      "two-pointers-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-07",
    "title": "Unique triples for a target",
    "primaryTopic": "two-pointers",
    "objective": "Anchor one value and search opposing pairs while reporting each value triple once.",
    "step": 4,
    "skillIds": [
      "pointers.anchored-pair-search",
      "sorted.duplicate-skips"
    ],
    "prerequisites": [
      "pointers.target-sum",
      "sorted.order"
    ],
    "approach": "A third value adds one outer choice; reuse the familiar pair scan inside that choice.",
    "commonErrors": [
      "erase-repeated-input-values",
      "duplicate-triple-output"
    ],
    "checkpointIds": [
      "two-pointers-08"
    ],
    "remedialIds": [
      "two-pointers-06",
      "two-pointers-04"
    ],
    "nextIds": [
      "two-pointers-09"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-08",
    "title": "Largest wall span",
    "primaryTopic": "two-pointers",
    "objective": "Justify eliminating the shorter boundary while optimizing height times distance.",
    "step": 4,
    "skillIds": [
      "pointers.eliminate-shorter-boundary"
    ],
    "prerequisites": [
      "pointers.opposing"
    ],
    "approach": "Moving a pointer is now a choice that must preserve the possibility of a better answer.",
    "commonErrors": [
      "use-taller-boundary",
      "adjacent-only"
    ],
    "checkpointIds": [
      "two-pointers-07"
    ],
    "remedialIds": [],
    "nextIds": [
      "two-pointers-09"
    ],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-09",
    "title": "Remove a target from the ends",
    "primaryTopic": "two-pointers",
    "objective": "Transform endpoint removal into the longest contiguous middle with a complementary sum.",
    "step": 5,
    "skillIds": [
      "pointers.kept-middle-invariant"
    ],
    "prerequisites": [
      "arrays.traversal",
      "windows.variable-shrink",
      "windows.positive-sum"
    ],
    "approach": "Two moving boundaries describe the portion you keep, letting you minimize removals.",
    "commonErrors": [
      "only-remove-left",
      "overlap-end-removals"
    ],
    "checkpointIds": [
      "two-pointers-10"
    ],
    "remedialIds": [
      "sliding-window-03",
      "sliding-window-01",
      "arrays-hashing-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "two-pointers-10",
    "title": "Compare compressed letter runs",
    "primaryTopic": "two-pointers",
    "objective": "Compare two compressed sequences by consuming the smaller remaining run without expanding large counts.",
    "step": 5,
    "skillIds": [
      "pointers.residual-run-lengths"
    ],
    "prerequisites": [
      "pointers.merge-cursors"
    ],
    "approach": "The cursors can move by a whole shared run length rather than one character at a time.",
    "commonErrors": [
      "compare-only-raw-runs",
      "compare-only-letter-order"
    ],
    "checkpointIds": [
      "two-pointers-09"
    ],
    "remedialIds": [
      "two-pointers-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-01",
    "title": "Best fixed batch total",
    "primaryTopic": "sliding-window",
    "objective": "Update a fixed-length total by removing the old left value and adding the new right value.",
    "step": 1,
    "skillIds": [
      "windows.fixed-boundaries",
      "windows.rolling-sum"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Reuse one total when the window moves, instead of summing every batch from scratch.",
    "commonErrors": [
      "initialize-answer-zero",
      "omit-final-window"
    ],
    "checkpointIds": [
      "sliding-window-02"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "sliding-window-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-02",
    "title": "Most variety in a fixed batch",
    "primaryTopic": "sliding-window",
    "objective": "Maintain distinct-value count while duplicate readings enter and leave a window.",
    "step": 1,
    "skillIds": [
      "windows.frequency-removal",
      "hashing.counts",
      "windows.fixed-boundaries"
    ],
    "prerequisites": [
      "windows.fixed-boundaries",
      "hashing.membership"
    ],
    "approach": "The window boundary is familiar. Keep counts so removing one copy does not remove a value still present.",
    "commonErrors": [
      "count-whole-array",
      "treat-duplicates-as-new"
    ],
    "checkpointIds": [
      "sliding-window-01"
    ],
    "remedialIds": [
      "sliding-window-01",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "sliding-window-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-03",
    "title": "Shortest batch reaching a target",
    "primaryTopic": "sliding-window",
    "objective": "Shrink a valid positive-sum window to find the smallest qualifying batch.",
    "step": 2,
    "skillIds": [
      "windows.variable-shrink",
      "windows.positive-sum"
    ],
    "prerequisites": [
      "windows.fixed-boundaries"
    ],
    "approach": "The window length changes now; positive values make shrinking predictable.",
    "commonErrors": [
      "exact-total-only",
      "only-prefix"
    ],
    "checkpointIds": [
      "sliding-window-09"
    ],
    "remedialIds": [
      "sliding-window-01",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "sliding-window-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-04",
    "title": "Longest unrepeated letter span",
    "primaryTopic": "sliding-window",
    "objective": "Move the left boundary past the last occurrence of a repeated letter.",
    "step": 3,
    "skillIds": [
      "windows.last-occurrence-boundary"
    ],
    "prerequisites": [
      "windows.variable-shrink",
      "hashing.membership"
    ],
    "approach": "A lookup now identifies the boundary that removes a repetition.",
    "commonErrors": [
      "total-distinct-letters",
      "never-shrink"
    ],
    "checkpointIds": [
      "sliding-window-05"
    ],
    "remedialIds": [
      "sliding-window-03",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "sliding-window-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-05",
    "title": "A binary span with limited repairs",
    "primaryTopic": "sliding-window",
    "objective": "Keep the number of zero readings within a repair budget as the window moves.",
    "step": 3,
    "skillIds": [
      "windows.violation-budget"
    ],
    "prerequisites": [
      "windows.variable-shrink"
    ],
    "approach": "Validity now depends on a count rather than a total.",
    "commonErrors": [
      "ignore-budget",
      "exact-budget-only"
    ],
    "checkpointIds": [
      "sliding-window-04"
    ],
    "remedialIds": [],
    "nextIds": [
      "sliding-window-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-06",
    "title": "Shortest letter cover",
    "primaryTopic": "sliding-window",
    "objective": "Track which required letter copies remain missing while shrinking a complete cover.",
    "step": 4,
    "skillIds": [
      "windows.required-multiplicity",
      "windows.minimum-cover",
      "windows.frequency-removal"
    ],
    "prerequisites": [
      "windows.variable-shrink",
      "hashing.counts"
    ],
    "approach": "The window must cover a whole required multiset, not just one numeric budget.",
    "commonErrors": [
      "ignore-required-multiplicity",
      "choose-entire-text"
    ],
    "checkpointIds": [
      "sliding-window-07",
      "sliding-window-10",
      "sliding-window-11"
    ],
    "remedialIds": [
      "sliding-window-02",
      "sliding-window-03"
    ],
    "nextIds": [
      "sliding-window-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-07",
    "title": "Find rearranged pattern starts",
    "primaryTopic": "sliding-window",
    "objective": "Compare a fixed window letter multiset with a pattern and report overlapping matches.",
    "step": 4,
    "skillIds": [
      "windows.fixed-frequency-equality",
      "windows.frequency-removal"
    ],
    "prerequisites": [
      "windows.frequency-removal",
      "hashing.counts"
    ],
    "approach": "Reuse frequency state at each position instead of rebuilding a pattern comparison.",
    "commonErrors": [
      "match-only-exact-order",
      "discard-overlap"
    ],
    "checkpointIds": [
      "sliding-window-06",
      "sliding-window-10",
      "sliding-window-11"
    ],
    "remedialIds": [
      "sliding-window-02",
      "sliding-window-03"
    ],
    "nextIds": [
      "sliding-window-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-08",
    "title": "Maximum for every batch",
    "primaryTopic": "sliding-window",
    "objective": "Retain decreasing candidate maxima and remove expired positions.",
    "step": 5,
    "skillIds": [
      "windows.monotonic-deque",
      "windows.expiring-candidates"
    ],
    "prerequisites": [
      "windows.fixed-boundaries",
      "stack.monotonic-candidates"
    ],
    "approach": "A moving maximum needs more information than a total: old candidates can expire.",
    "commonErrors": [
      "minimum-instead-of-maximum",
      "global-maximum-for-all"
    ],
    "checkpointIds": [
      "sliding-window-12"
    ],
    "remedialIds": [
      "sliding-window-01",
      "stack-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-09",
    "title": "Count batches within a total limit",
    "primaryTopic": "sliding-window",
    "objective": "Count all valid subarrays ending at each right boundary instead of only one optimum.",
    "step": 2,
    "skillIds": [
      "windows.count-valid-endings",
      "windows.positive-sum"
    ],
    "prerequisites": [
      "windows.positive-sum"
    ],
    "approach": "Once a nonnegative window fits the limit, every shorter suffix ending there fits too.",
    "commonErrors": [
      "singletons-only",
      "strict-limit-only"
    ],
    "checkpointIds": [
      "sliding-window-03"
    ],
    "remedialIds": [
      "sliding-window-02",
      "sliding-window-03"
    ],
    "nextIds": [
      "sliding-window-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-10",
    "title": "Longest batch with limited variety",
    "primaryTopic": "sliding-window",
    "objective": "Maintain a frequency map while limiting the number of different values in the current batch.",
    "step": 4,
    "skillIds": [
      "windows.distinct-budget",
      "windows.frequency-removal"
    ],
    "prerequisites": [
      "windows.frequency-removal",
      "windows.variable-shrink"
    ],
    "approach": "A fixed variety count becomes a variable-window validity condition.",
    "commonErrors": [
      "limit-length-instead-of-types",
      "whole-array-if-total-variety-fits"
    ],
    "checkpointIds": [
      "sliding-window-06",
      "sliding-window-07",
      "sliding-window-11"
    ],
    "remedialIds": [
      "sliding-window-02",
      "sliding-window-03"
    ],
    "nextIds": [
      "sliding-window-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-11",
    "title": "Shortest batch reaching enough variety",
    "primaryTopic": "sliding-window",
    "objective": "Shrink every window that contains enough distinct values while preserving multiplicity counts.",
    "step": 4,
    "skillIds": [
      "windows.minimum-distinct-cover",
      "windows.frequency-removal"
    ],
    "prerequisites": [
      "windows.frequency-removal",
      "windows.variable-shrink"
    ],
    "approach": "The same frequency state now helps find a minimum valid window.",
    "commonErrors": [
      "always-return-k",
      "first-qualifying-prefix"
    ],
    "checkpointIds": [
      "sliding-window-06",
      "sliding-window-07",
      "sliding-window-10"
    ],
    "remedialIds": [
      "sliding-window-02",
      "sliding-window-03"
    ],
    "nextIds": [
      "sliding-window-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "sliding-window-12",
    "title": "Longest batch with bounded spread",
    "primaryTopic": "sliding-window",
    "objective": "Maintain both the maximum and minimum while shrinking a spread-constrained window.",
    "step": 5,
    "skillIds": [
      "windows.dual-monotonic-deques",
      "windows.monotonic-deque"
    ],
    "prerequisites": [
      "windows.monotonic-deque"
    ],
    "approach": "Keep two candidate sequences instead of one, so both ends of the value range remain available.",
    "commonErrors": [
      "adjacent-differences-only",
      "strict-spread-boundary"
    ],
    "checkpointIds": [
      "sliding-window-08"
    ],
    "remedialIds": [
      "sliding-window-08"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "stack-01",
    "title": "Match nested delimiters",
    "primaryTopic": "stack",
    "objective": "Use last-in-first-out state to verify delimiter type and nesting order.",
    "step": 1,
    "skillIds": [
      "stack.last-open-first-close",
      "stack.underflow"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A counter can count openings. A stack also remembers which type must close next.",
    "commonErrors": [
      "count-only-ignore-types",
      "ignore-underflow"
    ],
    "checkpointIds": [
      "stack-02",
      "stack-03"
    ],
    "remedialIds": [
      "stack-02",
      "stack-01",
      "arrays-hashing-01"
    ],
    "nextIds": [
      "stack-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-02",
    "title": "Track undoable readings",
    "primaryTopic": "stack",
    "objective": "Apply push and undo commands and report the current top after every event.",
    "step": 1,
    "skillIds": [
      "stack.push-pop-history"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A stack remembers the most recent reading that has not been undone.",
    "commonErrors": [
      "undo-oldest-first",
      "ignore-zero-push"
    ],
    "checkpointIds": [
      "stack-03"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "stack-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-03",
    "title": "Cancel adjacent letter pairs",
    "primaryTopic": "stack",
    "objective": "Keep unresolved letters and allow removals to expose another matching pair.",
    "step": 1,
    "skillIds": [
      "stack.cascading-cancellation"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Removing the top can create a new match with the next arriving letter.",
    "commonErrors": [
      "single-cancellation-pass",
      "case-insensitive-cancellation"
    ],
    "checkpointIds": [
      "stack-02"
    ],
    "remedialIds": [
      "stack-02",
      "stack-01",
      "arrays-hashing-01"
    ],
    "nextIds": [
      "stack-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-04",
    "title": "Wait for a warmer reading",
    "primaryTopic": "stack",
    "objective": "Resolve earlier pending positions when a strictly larger reading appears.",
    "step": 3,
    "skillIds": [
      "stack.monotonic-candidates"
    ],
    "prerequisites": [
      "stack.push-pop-history"
    ],
    "approach": "The stack stores unanswered positions, not just values.",
    "commonErrors": [
      "accept-equal-reading",
      "return-next-index"
    ],
    "checkpointIds": [
      "stack-05"
    ],
    "remedialIds": [
      "stack-02"
    ],
    "nextIds": [
      "stack-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-05",
    "title": "Next greater reading around a ring",
    "primaryTopic": "stack",
    "objective": "Reuse a monotonic candidate stack during a bounded second traversal.",
    "step": 3,
    "skillIds": [
      "stack.circular-scan",
      "stack.monotonic-candidates"
    ],
    "prerequisites": [
      "stack.monotonic-candidates"
    ],
    "approach": "A second pass completes answers near the end without treating the ring as an endless search.",
    "commonErrors": [
      "never-wrap",
      "accept-equality-around-ring"
    ],
    "checkpointIds": [
      "stack-04"
    ],
    "remedialIds": [],
    "nextIds": [
      "stack-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-06",
    "title": "Largest rectangle under readings",
    "primaryTopic": "stack",
    "objective": "Identify how far each bar height can extend before a shorter boundary stops it.",
    "step": 4,
    "skillIds": [
      "stack.rectangle-boundaries"
    ],
    "prerequisites": [
      "stack.monotonic-candidates"
    ],
    "approach": "A popped monotonic candidate now contributes an entire rectangle.",
    "commonErrors": [
      "ignore-shorter-interior-bars",
      "single-bar-only"
    ],
    "checkpointIds": [
      "stack-11"
    ],
    "remedialIds": [
      "stack-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "stack-07",
    "title": "Evaluate a postfix calculation",
    "primaryTopic": "stack",
    "objective": "Pop the right operand before the left operand when evaluating postfix arithmetic.",
    "step": 2,
    "skillIds": [
      "stack.operand-order"
    ],
    "prerequisites": [
      "stack.push-pop-history"
    ],
    "approach": "The stack stores intermediate answers, and subtraction makes operand order visible.",
    "commonErrors": [
      "reverse-subtraction-operands",
      "sum-literal-tokens-only"
    ],
    "checkpointIds": [
      "stack-10"
    ],
    "remedialIds": [
      "stack-02",
      "stack-01"
    ],
    "nextIds": [
      "stack-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-08",
    "title": "Can this pop order happen?",
    "primaryTopic": "stack",
    "objective": "Validate whether pushing unique labels in a fixed order can produce a proposed pop order by interleaving operations.",
    "step": 2,
    "skillIds": [
      "stack.interleaved-schedule-validation"
    ],
    "prerequisites": [
      "stack.push-pop-history"
    ],
    "approach": "The operations are not given explicitly; simulate the next required pop while respecting the fixed push order.",
    "commonErrors": [
      "same-labels-ignore-stack-order",
      "push-everything-before-popping"
    ],
    "checkpointIds": [
      "stack-07",
      "stack-10"
    ],
    "remedialIds": [
      "stack-02",
      "stack-01"
    ],
    "nextIds": [
      "stack-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-09",
    "title": "Resolve opposing moving readings",
    "primaryTopic": "stack",
    "objective": "Resolve a chain of collisions against the latest surviving right-moving object.",
    "step": 3,
    "skillIds": [
      "stack.collision-resolution"
    ],
    "prerequisites": [
      "stack.push-pop-history"
    ],
    "approach": "One new object can remove several earlier candidates before it survives or disappears.",
    "commonErrors": [
      "skip-all-collisions",
      "one-collision-only"
    ],
    "checkpointIds": [
      "stack-12"
    ],
    "remedialIds": [
      "stack-02",
      "stack-01"
    ],
    "nextIds": [
      "stack-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-11",
    "title": "Add every batch minimum",
    "primaryTopic": "stack",
    "objective": "Attribute each subarray minimum to one position using asymmetric handling of equal values.",
    "step": 4,
    "skillIds": [
      "stack.unique-minimum-contributions"
    ],
    "prerequisites": [
      "stack.monotonic-candidates"
    ],
    "approach": "Boundary counts turn one reading into its contribution across many batches.",
    "commonErrors": [
      "omit-singletons",
      "32-bit-result"
    ],
    "checkpointIds": [
      "stack-06"
    ],
    "remedialIds": [
      "stack-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "stack-10",
    "title": "Score nested delimiters",
    "primaryTopic": "stack",
    "objective": "Accumulate values inside stack frames while validating delimiter types.",
    "step": 2,
    "skillIds": [
      "stack.nested-aggregation"
    ],
    "prerequisites": [
      "stack.last-open-first-close"
    ],
    "approach": "Each unfinished pair now remembers an inner score in addition to its closing type.",
    "commonErrors": [
      "erase-delimiter-types",
      "count-empty-pairs-only"
    ],
    "checkpointIds": [
      "stack-07"
    ],
    "remedialIds": [
      "stack-01"
    ],
    "nextIds": [
      "stack-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "stack-12",
    "title": "Decode bounded repeated blocks",
    "primaryTopic": "stack",
    "objective": "Remember the surrounding prefix and repeat count while decoding a nested block safely.",
    "step": 3,
    "skillIds": [
      "stack.prefix-and-repeat-frames"
    ],
    "prerequisites": [
      "stack.nested-aggregation"
    ],
    "approach": "A frame stores both the partial output and what to do when an inner block closes.",
    "commonErrors": [
      "ignore-repeat-counts",
      "strip-structural-text"
    ],
    "checkpointIds": [
      "stack-09"
    ],
    "remedialIds": [
      "stack-10"
    ],
    "nextIds": [
      "stack-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-01",
    "title": "Find a sorted reading",
    "primaryTopic": "binary-search",
    "objective": "Locate an exact value in strictly increasing readings by halving a search range.",
    "step": 1,
    "skillIds": [
      "binary-search.halving",
      "binary-search.exact-membership"
    ],
    "prerequisites": [],
    "approach": "Sorted order lets one comparison remove half the remaining positions.",
    "commonErrors": [
      "miss-final-position",
      "return-insertion-position"
    ],
    "checkpointIds": [
      "binary-search-05"
    ],
    "remedialIds": [],
    "nextIds": [
      "binary-search-02"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-02",
    "title": "First reading at least a threshold",
    "primaryTopic": "binary-search",
    "objective": "Find the first position satisfying a threshold, including duplicates and a missing boundary.",
    "step": 2,
    "skillIds": [
      "binary-search.halving",
      "binary-search.lower-bound",
      "binary-search.duplicates"
    ],
    "prerequisites": [
      "binary-search.halving"
    ],
    "approach": "The search now locates a boundary rather than an exact match.",
    "commonErrors": [
      "strictly-greater",
      "minus-one-if-absent"
    ],
    "checkpointIds": [
      "binary-search-04"
    ],
    "remedialIds": [
      "binary-search-01"
    ],
    "nextIds": [
      "binary-search-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-03",
    "title": "Readings inside a value band",
    "primaryTopic": "binary-search",
    "objective": "Combine lower and upper boundaries to count sorted readings in a closed value interval.",
    "step": 3,
    "skillIds": [
      "binary-search.paired-boundaries",
      "binary-search.inclusive-intervals"
    ],
    "prerequisites": [
      "binary-search.lower-bound"
    ],
    "approach": "Two searches delimit the inclusive band, so no scan through matching readings is needed.",
    "commonErrors": [
      "exclude-upper-endpoint",
      "collapse-duplicates"
    ],
    "checkpointIds": [
      "binary-search-06"
    ],
    "remedialIds": [
      "binary-search-02"
    ],
    "nextIds": [
      "binary-search-07",
      "binary-search-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-01",
    "title": "Count short-step routes",
    "primaryTopic": "dp-1d",
    "objective": "Count ordered one-unit/two-unit routes by combining smaller state counts.",
    "step": 1,
    "skillIds": [
      "dp.one-dimensional-state",
      "dp.counting-recurrence"
    ],
    "prerequisites": [],
    "approach": "Two possible final moves lead to a small recurrence.",
    "commonErrors": [
      "ignore-length-two",
      "shift-count-by-one"
    ],
    "checkpointIds": [
      "dp-1d-02"
    ],
    "remedialIds": [],
    "nextIds": [
      "dp-1d-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-02",
    "title": "Least-cost workstation choices",
    "primaryTopic": "dp-1d",
    "objective": "Minimize daily workstation costs while remembering the previous chosen workstation for switching charges.",
    "step": 1,
    "skillIds": [
      "dp.one-dimensional-state",
      "dp.minimum-cost-recurrence",
      "dp.last-choice-state"
    ],
    "prerequisites": [],
    "approach": "For a prefix ending at a chosen workstation, compare staying with switching from the other workstation; the first day has no switching charge.",
    "commonErrors": [
      "ignore-switch-charges",
      "never-switch-workstation",
      "narrow-total-to-int32"
    ],
    "checkpointIds": [
      "dp-1d-01"
    ],
    "remedialIds": [],
    "nextIds": [
      "dp-1d-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-03",
    "title": "Choose spaced rewards",
    "primaryTopic": "dp-1d",
    "objective": "Choose rewards with no neighboring selections by comparing take and skip decisions.",
    "step": 2,
    "skillIds": [
      "dp.take-or-skip",
      "dp.nonadjacent-selection"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "The next state depends on whether the current reward is selected.",
    "commonErrors": [
      "pick-only-largest",
      "take-fixed-parity"
    ],
    "checkpointIds": [
      "dp-1d-04"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-05",
      "dp-1d-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-04",
    "title": "Spaced rewards around a circle",
    "primaryTopic": "dp-1d",
    "objective": "Maximize nonadjacent rewards when the first and last positions also conflict.",
    "step": 2,
    "skillIds": [
      "dp.take-or-skip",
      "dp.circular-boundary-split"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "The two endpoint choices cannot coexist, so separate the possibilities before using a linear state.",
    "commonErrors": [
      "forget-wraparound-conflict",
      "take-fixed-parity"
    ],
    "checkpointIds": [
      "dp-1d-03"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-05",
      "dp-1d-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-05",
    "title": "Count valid digit decodings",
    "primaryTopic": "dp-1d",
    "objective": "Count valid one-digit and two-digit message splits while rejecting leading-zero and out-of-range tokens.",
    "step": 3,
    "skillIds": [
      "dp.counting-recurrence",
      "strings.zero-sensitive-decoding"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "A valid last token contributes a preceding state; zero cannot form a token alone.",
    "commonErrors": [
      "allow-zero-singletons",
      "allow-every-nonzero-pair"
    ],
    "checkpointIds": [
      "dp-1d-06"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-07",
      "dp-1d-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-06",
    "title": "Fewest coins for an exact total",
    "primaryTopic": "dp-1d",
    "objective": "Minimize the number of reusable positive denominations forming an exact amount, preserving unreachable states.",
    "step": 3,
    "skillIds": [
      "dp.minimum-count-recurrence",
      "dp.unbounded-choice"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "Every denomination can be reused; unreachable smaller totals must not become free predecessors.",
    "commonErrors": [
      "greedy-largest-first",
      "use-each-denomination-once"
    ],
    "checkpointIds": [
      "dp-1d-05"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-07",
      "dp-1d-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-07",
    "title": "Count reusable coin combinations",
    "primaryTopic": "dp-1d",
    "objective": "Count unordered denomination multiplicities rather than ordered sequences or the fewest coins.",
    "step": 4,
    "skillIds": [
      "dp.unbounded-counting",
      "dp.unordered-combinations"
    ],
    "prerequisites": [
      "dp.counting-recurrence",
      "dp.unbounded-choice"
    ],
    "approach": "Process each denomination as a separate counting stage so permutations of the same coin multiset are not counted again.",
    "commonErrors": [
      "count-ordered-sequences",
      "use-each-coin-once"
    ],
    "checkpointIds": [
      "dp-1d-08"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-05",
      "dp-1d-06",
      "dp-1d-08"
    ],
    "nextIds": [
      "dp-1d-09",
      "dp-1d-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-08",
    "title": "Can a subset form the exact total?",
    "primaryTopic": "dp-1d",
    "objective": "Track reachable sums when each indexed item can be chosen at most once, including zero and duplicate-valued items.",
    "step": 4,
    "skillIds": [
      "dp.bounded-selection",
      "dp.reachable-sums"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "Updating totals in the wrong direction can reuse the same physical item during one stage.",
    "commonErrors": [
      "allow-unlimited-item-reuse",
      "require-every-item"
    ],
    "checkpointIds": [
      "dp-1d-07"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02",
      "dp-1d-06"
    ],
    "nextIds": [
      "dp-1d-09",
      "dp-1d-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-09",
    "title": "Minimum line-break raggedness",
    "primaryTopic": "dp-1d",
    "objective": "Choose ordered line boundaries minimizing squared unused width, with a free last line and indivisible words.",
    "step": 5,
    "skillIds": [
      "dp.ordered-segmentation-cost",
      "dp.last-segment-exemption"
    ],
    "prerequisites": [
      "dp.minimum-cost-recurrence"
    ],
    "approach": "The best next line can end at several different words; the cost of its remaining suffix matters more than filling the current line greedily.",
    "commonErrors": [
      "charge-the-last-line",
      "greedily-fill-every-line"
    ],
    "checkpointIds": [
      "dp-1d-10"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02",
      "dp-1d-08"
    ],
    "nextIds": [
      "dp-1d-11",
      "dp-1d-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-04",
    "title": "The kth missing positive label",
    "primaryTopic": "binary-search",
    "objective": "Search a monotone missing-count function in sparse labels instead of enumerating the gaps.",
    "step": 2,
    "skillIds": [
      "binary-search.halving",
      "binary-search.lower-bound",
      "binary-search.missing-rank"
    ],
    "prerequisites": [
      "binary-search.halving"
    ],
    "approach": "Each stored index gives a count of absent labels before it; use that count as the search condition.",
    "commonErrors": [
      "return-first-gap",
      "zero-based-missing-rank"
    ],
    "checkpointIds": [
      "binary-search-02"
    ],
    "remedialIds": [
      "binary-search-01",
      "binary-search-05"
    ],
    "nextIds": [
      "binary-search-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-05",
    "title": "An exact integer square root",
    "primaryTopic": "binary-search",
    "objective": "Find the greatest feasible integer in an implicit ordered domain using safe arithmetic.",
    "step": 1,
    "skillIds": [
      "binary-search.halving",
      "binary-search.implicit-predicate",
      "numbers.safe-comparison"
    ],
    "prerequisites": [],
    "approach": "The candidates are integers rather than stored readings; comparisons still discard half the range.",
    "commonErrors": [
      "round-instead-of-floor",
      "strict-feasibility"
    ],
    "checkpointIds": [
      "binary-search-01"
    ],
    "remedialIds": [],
    "nextIds": [
      "binary-search-02",
      "binary-search-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-06",
    "title": "Minimum after a rotation",
    "primaryTopic": "binary-search",
    "objective": "Locate the split in a rotated strictly increasing sequence using ordered segments.",
    "step": 3,
    "skillIds": [
      "binary-search.halving",
      "binary-search.rotated-order"
    ],
    "prerequisites": [
      "binary-search.halving"
    ],
    "approach": "A rotation breaks the global sorted order while leaving two sorted segments to reason about.",
    "commonErrors": [
      "assume-first-is-smallest",
      "discard-single-candidate"
    ],
    "checkpointIds": [
      "binary-search-03"
    ],
    "remedialIds": [
      "binary-search-01",
      "binary-search-02"
    ],
    "nextIds": [
      "binary-search-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-07",
    "title": "Find a target after rotation",
    "primaryTopic": "binary-search",
    "objective": "Find an exact target by identifying which half of a rotated distinct sequence stays sorted.",
    "step": 4,
    "skillIds": [
      "binary-search.halving",
      "binary-search.rotated-order",
      "binary-search.sorted-half-selection"
    ],
    "prerequisites": [
      "binary-search.halving",
      "binary-search.rotated-order"
    ],
    "approach": "Knowing the rotation boundary is not required; the target decides which sorted half can be discarded.",
    "commonErrors": [
      "treat-as-fully-sorted",
      "exclude-right-endpoint"
    ],
    "checkpointIds": [
      "binary-search-08"
    ],
    "remedialIds": [
      "binary-search-06"
    ],
    "nextIds": [
      "binary-search-09"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-08",
    "title": "Find any strict local peak",
    "primaryTopic": "binary-search",
    "objective": "Return any neighbor-local peak by maintaining an interval guaranteed to contain a peak.",
    "step": 4,
    "skillIds": [
      "binary-search.halving",
      "binary-search.slope-invariant"
    ],
    "prerequisites": [
      "binary-search.halving"
    ],
    "approach": "The list is not globally sorted or unimodal. A slope gives an interval containing some peak, not necessarily the global maximum.",
    "commonErrors": [
      "return-valley",
      "always-left-endpoint"
    ],
    "checkpointIds": [
      "binary-search-07"
    ],
    "remedialIds": [
      "binary-search-01",
      "binary-search-05",
      "binary-search-06"
    ],
    "nextIds": [
      "binary-search-09"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-09",
    "title": "Find a target in a monotone grid",
    "primaryTopic": "binary-search",
    "objective": "Eliminate an entire row or column using a matrix ordered in two directions without assuming row-major total order.",
    "step": 5,
    "skillIds": [
      "binary-search.two-dimensional-elimination",
      "matrix.monotone-frontier"
    ],
    "prerequisites": [
      "binary-search.halving"
    ],
    "approach": "Moving left lowers a candidate; moving down raises it. Each comparison removes one impossible strip.",
    "commonErrors": [
      "binary-search-flattened",
      "check-first-row-only"
    ],
    "checkpointIds": [
      "binary-search-10"
    ],
    "remedialIds": [
      "binary-search-02",
      "binary-search-04"
    ],
    "nextIds": [
      "binary-search-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-10",
    "title": "Minimum rate for separate jobs",
    "primaryTopic": "binary-search",
    "objective": "Find the minimum rate when each separate job consumes a whole number of clock slots and interjob pauses cannot be shared.",
    "step": 5,
    "skillIds": [
      "binary-search.implicit-predicate",
      "binary-search.minimum-feasible",
      "numbers.ceiling-duration"
    ],
    "prerequisites": [
      "binary-search.halving"
    ],
    "approach": "A faster rate can only reduce job durations; ceiling division and mandatory pauses define the feasibility predicate.",
    "commonErrors": [
      "share-leftover-capacity",
      "pause-after-last-job"
    ],
    "checkpointIds": [
      "binary-search-09"
    ],
    "remedialIds": [
      "binary-search-05"
    ],
    "nextIds": [
      "binary-search-11",
      "binary-search-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-11",
    "title": "Minimum load for ordered shipping",
    "primaryTopic": "binary-search",
    "objective": "Find a capacity that partitions ordered indivisible weights into at most a given number of contiguous daily loads.",
    "step": 6,
    "skillIds": [
      "binary-search.minimum-feasible",
      "greedy.contiguous-capacity-partition"
    ],
    "prerequisites": [
      "binary-search.implicit-predicate"
    ],
    "approach": "For a proposed capacity, filling each day as far as possible minimizes the number of days.",
    "commonErrors": [
      "average-weight-only",
      "reorder-before-partition"
    ],
    "checkpointIds": [
      "binary-search-12"
    ],
    "remedialIds": [
      "binary-search-05",
      "binary-search-10"
    ],
    "nextIds": [
      "binary-search-13",
      "binary-search-14"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-12",
    "title": "Maximize the smallest placement gap",
    "primaryTopic": "binary-search",
    "objective": "Choose k distinct positions so the smallest distance between neighboring chosen positions is as large as possible.",
    "step": 6,
    "skillIds": [
      "binary-search.maximum-feasible",
      "greedy.earliest-placement"
    ],
    "prerequisites": [
      "binary-search.implicit-predicate"
    ],
    "approach": "For a proposed gap, always taking the earliest next feasible position leaves the most room for later placements.",
    "commonErrors": [
      "average-endpoint-gap",
      "return-first-gap"
    ],
    "checkpointIds": [
      "binary-search-11"
    ],
    "remedialIds": [
      "binary-search-05",
      "binary-search-10"
    ],
    "nextIds": [
      "binary-search-13",
      "binary-search-14"
    ],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-13",
    "title": "Median across two sorted lists",
    "primaryTopic": "binary-search",
    "objective": "Partition two sorted lists at the combined midpoint while searching only the shorter list.",
    "step": 7,
    "skillIds": [
      "binary-search.partition-balance",
      "binary-search.cross-array-boundaries"
    ],
    "prerequisites": [
      "binary-search.halving",
      "binary-search.lower-bound"
    ],
    "approach": "A correct partition has all left-side values at most every right-side boundary, even when either list is empty.",
    "commonErrors": [
      "discard-half-integer-part",
      "take-median-of-list-medians"
    ],
    "checkpointIds": [
      "binary-search-14"
    ],
    "remedialIds": [
      "binary-search-02",
      "binary-search-04",
      "binary-search-05",
      "binary-search-10"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "binary-search-14",
    "title": "A ranked multiplication-table value",
    "primaryTopic": "binary-search",
    "objective": "Select a ranked product in an implicit multiplication table by counting cells below a candidate value, including duplicates.",
    "step": 7,
    "skillIds": [
      "binary-search.rank-count-predicate",
      "numbers.multiplicity-rank"
    ],
    "prerequisites": [
      "binary-search.implicit-predicate",
      "binary-search.lower-bound"
    ],
    "approach": "The table is too large to construct; each row contributes a bounded count of products at most the proposed value.",
    "commonErrors": [
      "treat-rank-as-value",
      "exclude-equal-products-from-count"
    ],
    "checkpointIds": [
      "binary-search-13"
    ],
    "remedialIds": [
      "binary-search-02",
      "binary-search-04",
      "binary-search-05",
      "binary-search-10"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-01",
    "title": "Count lit bits",
    "primaryTopic": "bit-manipulation",
    "objective": "Count the one bits in a fixed unsigned 32 bit representation.",
    "step": 1,
    "skillIds": [
      "bits.unsigned32",
      "bits.clear-lowest"
    ],
    "prerequisites": [],
    "approach": "A mask is an integer pattern used to select bits. Clearing the lowest one bit counts the active bits without changing the original value.",
    "commonErrors": [
      "ignore-highest-bit",
      "count-zero-as-one"
    ],
    "checkpointIds": [
      "bit-manipulation-02"
    ],
    "remedialIds": [],
    "nextIds": [
      "bit-manipulation-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-02",
    "title": "Decode a packed unsigned field",
    "primaryTopic": "bit-manipulation",
    "objective": "Extract the unsigned value stored in an inclusive range of a 32-bit packed word.",
    "step": 1,
    "skillIds": [
      "bits.unsigned32",
      "bits.inclusive-field-mask"
    ],
    "prerequisites": [],
    "approach": "Shift the selected low bit to position zero, then retain exactly high-low+1 bits. The full 32-bit field needs a wide mask rather than a 32-bit shift count.",
    "commonErrors": [
      "exclude-inclusive-high-bit",
      "full-field-signed-result",
      "forget-low-shift"
    ],
    "checkpointIds": [
      "bit-manipulation-01"
    ],
    "remedialIds": [],
    "nextIds": [
      "bit-manipulation-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-03",
    "title": "Reverse all 32 bits",
    "primaryTopic": "bit-manipulation",
    "objective": "Reverse a complete 32 bit pattern while retaining its leading zeros.",
    "step": 2,
    "skillIds": [
      "bits.fixed-width-reversal",
      "bits.unsigned-shift"
    ],
    "prerequisites": [
      "bits.unsigned32"
    ],
    "approach": "The width is part of the task. Reversing only the written binary digits loses leading zero positions.",
    "commonErrors": [
      "drop-leading-zeros",
      "signed-result"
    ],
    "checkpointIds": [
      "bit-manipulation-10",
      "bit-manipulation-11"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "bit-manipulation-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-04",
    "title": "XOR a complete interval",
    "primaryTopic": "bit-manipulation",
    "objective": "Use the repeating four-value prefix pattern to XOR a whole integer interval.",
    "step": 2,
    "skillIds": [
      "bits.xor-prefix-cycle",
      "bits.range-combination"
    ],
    "prerequisites": [
      "bits.unsigned32"
    ],
    "approach": "XOR removes matching contributions. Two prefix XOR values isolate the requested interval.",
    "commonErrors": [
      "exclude-left",
      "prefix-offset-wrong"
    ],
    "checkpointIds": [
      "bit-manipulation-08"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "bit-manipulation-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-05",
    "title": "One odd-frequency label",
    "primaryTopic": "bit-manipulation",
    "objective": "Cancel paired contributions to identify the one odd-frequency value.",
    "step": 3,
    "skillIds": [
      "bits.xor-cancellation"
    ],
    "prerequisites": [
      "bits.unsigned32",
      "arrays.traversal"
    ],
    "approach": "Equal values cancel under XOR, leaving the contribution whose count is odd.",
    "commonErrors": [
      "or-instead-of-xor",
      "return-last"
    ],
    "checkpointIds": [
      "bit-manipulation-06"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "bit-manipulation-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-06",
    "title": "Two odd-frequency labels",
    "primaryTopic": "bit-manipulation",
    "objective": "Separate two odd-frequency labels with a differing bit before cancellation.",
    "step": 3,
    "skillIds": [
      "bits.xor-partition",
      "bits.lowest-difference-mask"
    ],
    "prerequisites": [
      "bits.unsigned32",
      "arrays.traversal"
    ],
    "approach": "XOR now leaves two contributions mixed together. A bit where the labels differ separates them into two groups.",
    "commonErrors": [
      "combined-only",
      "omit-negative"
    ],
    "checkpointIds": [
      "bit-manipulation-05"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "bit-manipulation-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-07",
    "title": "The total XOR over every position pair",
    "primaryTopic": "bit-manipulation",
    "objective": "Sum XOR values over all unordered pairs of distinct positions through independent bit contributions.",
    "step": 4,
    "skillIds": [
      "bits.pair-contribution",
      "numbers.wide-products"
    ],
    "prerequisites": [
      "bits.unsigned32",
      "arrays.traversal"
    ],
    "approach": "For one bit, only a pair with one set bit and one clear bit contributes. Count those cross-group pairs once, and multiply by that bit's value using a wide integer.",
    "commonErrors": [
      "ordered-pairs-double-count",
      "combined-array-xor",
      "narrow-total"
    ],
    "checkpointIds": [
      "bit-manipulation-09",
      "bit-manipulation-12"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "bit-manipulation-13"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-08",
    "title": "Bits shared by an integer interval",
    "primaryTopic": "bit-manipulation",
    "objective": "Find the bits retained by AND across every integer in an inclusive interval.",
    "step": 2,
    "skillIds": [
      "bits.interval-common-prefix"
    ],
    "prerequisites": [
      "bits.unsigned32"
    ],
    "approach": "Any varying low bit becomes zero somewhere in the interval; only its common high prefix survives.",
    "commonErrors": [
      "endpoints-only",
      "exclusive-upper"
    ],
    "checkpointIds": [
      "bit-manipulation-04"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "bit-manipulation-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-10",
    "title": "Apply a switch-toggle history",
    "primaryTopic": "bit-manipulation",
    "objective": "Apply repeated indexed toggles to a fixed-width switch mask.",
    "step": 2,
    "skillIds": [
      "bits.position-mask",
      "bits.toggle-state"
    ],
    "prerequisites": [
      "bits.unsigned32",
      "arrays.traversal"
    ],
    "approach": "Each index identifies one independent switch; toggling a switch twice restores its prior state.",
    "commonErrors": [
      "set-instead-of-toggle",
      "drop-duplicates"
    ],
    "checkpointIds": [
      "bit-manipulation-03"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "bit-manipulation-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-09",
    "title": "The next word with the same bit population",
    "primaryTopic": "bit-manipulation",
    "objective": "Find the least greater 31 bit word containing the same number of one bits.",
    "step": 4,
    "skillIds": [
      "bits.carry-boundary",
      "bits.population-successor"
    ],
    "prerequisites": [
      "bits.unsigned32"
    ],
    "approach": "Move the lowest movable one bit upward, then pack the remaining low one bits as tightly as possible.",
    "commonErrors": [
      "numeric-successor",
      "forget-domain-limit"
    ],
    "checkpointIds": [
      "bit-manipulation-07",
      "bit-manipulation-12"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "bit-manipulation-14"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-11",
    "title": "A reflected Gray codeword",
    "primaryTopic": "bit-manipulation",
    "objective": "Map a binary ordinal to its reflected Gray codeword with one-bit transitions between consecutive ordinals.",
    "step": 2,
    "skillIds": [
      "bits.adjacent-xor",
      "bits.gray-ordinal"
    ],
    "prerequisites": [
      "bits.unsigned32"
    ],
    "approach": "Compare each ordinal bit with the bit immediately above it; the reflected ordering changes only one code bit between neighboring ordinals.",
    "commonErrors": [
      "return-ordinal",
      "shift-left-instead"
    ],
    "checkpointIds": [
      "bit-manipulation-03"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "bit-manipulation-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-12",
    "title": "Maximum XOR of two positions",
    "primaryTopic": "bit-manipulation",
    "objective": "Find the largest XOR achievable by two distinct array positions.",
    "step": 4,
    "skillIds": [
      "bits.prefix-feasibility",
      "bits.greedy-high-bit"
    ],
    "prerequisites": [
      "bits.unsigned32",
      "arrays.traversal",
      "hashing.membership"
    ],
    "approach": "Try each result bit from high to low and test whether two observed prefixes can realize it.",
    "commonErrors": [
      "largest-value-only",
      "discard-high-bit"
    ],
    "checkpointIds": [
      "bit-manipulation-07",
      "bit-manipulation-09"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "bit-manipulation-13"
    ],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-13",
    "title": "A minimum-cost XOR assignment",
    "primaryTopic": "bit-manipulation",
    "objective": "Find a bijection between two equal-length label arrays minimizing the sum of pairwise XOR costs.",
    "step": 5,
    "skillIds": [
      "bits.assigned-subset-state",
      "dp.bijection-cost"
    ],
    "prerequisites": [
      "bits.unsigned32",
      "arrays.traversal"
    ],
    "approach": "A used-position mask records which right labels are unavailable; its population tells which left label to assign next.",
    "commonErrors": [
      "same-index-only",
      "narrow-total"
    ],
    "checkpointIds": [
      "bit-manipulation-14"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "bit-manipulation-14",
    "title": "The fewest people covering a skill mask",
    "primaryTopic": "bit-manipulation",
    "objective": "Minimize the number of selected people whose combined skill masks contain every required skill.",
    "step": 5,
    "skillIds": [
      "bits.cover-union-state",
      "dp.minimum-cardinality"
    ],
    "prerequisites": [
      "bits.unsigned32",
      "arrays.traversal"
    ],
    "approach": "A covered-skill mask describes what remains achievable; track the least number of people reaching each union.",
    "commonErrors": [
      "count-required-bits",
      "all-people-count"
    ],
    "checkpointIds": [
      "bit-manipulation-13"
    ],
    "remedialIds": [
      "bit-manipulation-01",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-01",
    "title": "Add one value to a sorted native list",
    "primaryTopic": "linked-list",
    "objective": "Return a sorted native linked list with exactly one additional occurrence of the supplied value.",
    "step": 1,
    "skillIds": [
      "list.walk",
      "list.link-splice"
    ],
    "prerequisites": [
      "arrays.traversal",
      "sorted.order"
    ],
    "approach": "A value sequence describes input construction, but the function receives actual node links and must handle changing the head.",
    "commonErrors": [
      "append-without-order",
      "drop-equal-value"
    ],
    "checkpointIds": [
      "linked-list-02"
    ],
    "remedialIds": [
      "two-pointers-04"
    ],
    "nextIds": [
      "linked-list-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-02",
    "title": "Remove every matching node",
    "primaryTopic": "linked-list",
    "objective": "Unlink every matching node, including repeated matches at the head, while preserving the order of remaining values.",
    "step": 1,
    "skillIds": [
      "list.walk",
      "list.unlink"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Deletion changes links rather than an array length; the first retained node may differ from the supplied head.",
    "commonErrors": [
      "remove-first-match-only",
      "keep-head-unconditionally"
    ],
    "checkpointIds": [
      "linked-list-01"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "linked-list-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-03",
    "title": "Return the original kth node from the end",
    "primaryTopic": "linked-list",
    "objective": "Locate a node with a fixed gap between traversal cursors and return its original identity rather than a copy with an equal value.",
    "step": 2,
    "skillIds": [
      "list.fixed-node-gap",
      "list.original-identity"
    ],
    "prerequisites": [
      "list.walk"
    ],
    "approach": "Duplicate values make node identity essential; a fixed cursor gap avoids converting the list back into indexed values.",
    "commonErrors": [
      "off-by-one-gap",
      "equal-value-is-identity"
    ],
    "checkpointIds": [
      "linked-list-04"
    ],
    "remedialIds": [
      "linked-list-02"
    ],
    "nextIds": [
      "linked-list-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-04",
    "title": "Find where the cycle begins",
    "primaryTopic": "linked-list",
    "objective": "Distinguish a cycle meeting point from its entry and return the exact original entry node.",
    "step": 2,
    "skillIds": [
      "list.cycle-meeting",
      "list.cycle-entry",
      "list.original-identity"
    ],
    "prerequisites": [
      "list.walk"
    ],
    "approach": "Two traversal speeds reveal a cycle; resetting one cursor identifies its entry. Equal-valued nodes and permuted storage prevent value/index shortcuts.",
    "commonErrors": [
      "return-meeting-without-reset",
      "first-equal-value-node"
    ],
    "checkpointIds": [
      "linked-list-03"
    ],
    "remedialIds": [
      "linked-list-02"
    ],
    "nextIds": [
      "linked-list-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-05",
    "title": "Find the shared original node",
    "primaryTopic": "linked-list",
    "objective": "Return the first shared original node of two acyclic chains, distinguishing equal values from shared pointer identity.",
    "step": 3,
    "skillIds": [
      "list.shared-tail-identity",
      "list.align-chain-lengths"
    ],
    "prerequisites": [
      "list.walk",
      "list.original-identity"
    ],
    "approach": "Equal values never imply shared nodes. Aligning native chain lengths identifies the first common object in the shared suffix.",
    "commonErrors": [
      "equal-value-as-sharing",
      "last-shared-node"
    ],
    "checkpointIds": [
      "linked-list-06"
    ],
    "remedialIds": [
      "linked-list-03",
      "linked-list-02"
    ],
    "nextIds": [
      "linked-list-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-06",
    "title": "Add two digit chains",
    "primaryTopic": "linked-list",
    "objective": "Add nonnegative integers stored least-significant digit first in native linked lists, propagating carries across unequal chain lengths.",
    "step": 3,
    "skillIds": [
      "list.digit-carry",
      "list.result-chain-building"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice"
    ],
    "approach": "The last carry can extend a result beyond both input lengths; canonical zero must also survive redundant input zero nodes.",
    "commonErrors": [
      "omit-final-carry",
      "ignore-carry-between-digits"
    ],
    "checkpointIds": [
      "linked-list-05"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-02"
    ],
    "nextIds": [
      "linked-list-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-07",
    "title": "Clone linked nodes with random links",
    "primaryTopic": "linked-list",
    "objective": "Allocate an independent clone preserving next/random topology, cycles, duplicate values and sharing without any original-node alias.",
    "step": 4,
    "skillIds": [
      "list.clone-identity-map",
      "list.preserve-random-aliases"
    ],
    "prerequisites": [
      "list.original-identity",
      "list.walk",
      "hashing.membership"
    ],
    "approach": "A mapping from original objects to newly allocated objects preserves cycles and aliases without confusing equal-valued nodes.",
    "commonErrors": [
      "return-original-as-clone",
      "discard-random-links"
    ],
    "checkpointIds": [
      "linked-list-08"
    ],
    "remedialIds": [
      "linked-list-03",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "linked-list-09"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-08",
    "title": "Reverse complete groups and preserve the tail",
    "primaryTopic": "linked-list",
    "objective": "Reverse each complete group of k native linked-list values while preserving an incomplete trailing group in its original order.",
    "step": 4,
    "skillIds": [
      "list.complete-group-boundary",
      "list.group-link-reversal"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice"
    ],
    "approach": "Before reversing links, establish that a complete group exists; otherwise preserve the remaining tail.",
    "commonErrors": [
      "reverse-incomplete-tail",
      "reverse-whole-chain"
    ],
    "checkpointIds": [
      "linked-list-07"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-02"
    ],
    "nextIds": [
      "linked-list-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-09",
    "title": "Return the Josephus survivor node",
    "primaryTopic": "linked-list",
    "objective": "Select the original surviving node in a circular elimination schedule without confusing its value with its identity.",
    "step": 5,
    "skillIds": [
      "list.circular-elimination",
      "list.modular-survivor-rank"
    ],
    "prerequisites": [
      "list.walk",
      "list.original-identity"
    ],
    "approach": "The survivor rank follows a smaller-ring recurrence, but the returned result must still be the original object in the given ring order.",
    "commonErrors": [
      "count-one-too-far",
      "value-as-original-identity"
    ],
    "checkpointIds": [
      "linked-list-10",
      "linked-list-11",
      "linked-list-12"
    ],
    "remedialIds": [
      "linked-list-03",
      "linked-list-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-10",
    "title": "Weave the front and back original nodes",
    "primaryTopic": "linked-list",
    "objective": "Relink original nodes in first,last,second,second-last order without replacing equal-valued nodes or changing their values.",
    "step": 5,
    "skillIds": [
      "list.split-reverse-weave",
      "list.reorder-original-identities"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice"
    ],
    "approach": "Split the chain, reverse its second half, and weave both halves without dropping or replacing the middle node.",
    "commonErrors": [
      "reverse-all-nodes",
      "leave-original-order"
    ],
    "checkpointIds": [
      "linked-list-09",
      "linked-list-11",
      "linked-list-12"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-02"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-11",
    "title": "Stably sort the original nodes",
    "primaryTopic": "linked-list",
    "objective": "Order original nodes by nondecreasing value while preserving the original relative order of equal-valued nodes.",
    "step": 5,
    "skillIds": [
      "list.stable-node-merge",
      "list.divide-chain-sort"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "sorted.order"
    ],
    "approach": "A stable merge must choose the left original node when values are equal; identity-aware tests reveal mistakes invisible in sorted values alone.",
    "commonErrors": [
      "unstable-equal-keys",
      "sort-descending"
    ],
    "checkpointIds": [
      "linked-list-09",
      "linked-list-10",
      "linked-list-12"
    ],
    "remedialIds": [
      "linked-list-01",
      "two-pointers-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-12",
    "title": "Replay an LRU cache history",
    "primaryTopic": "linked-list",
    "objective": "Maintain cache recency across reads, inserts, updates, and evictions, including a zero-capacity cache.",
    "step": 5,
    "skillIds": [
      "list.lru-recency",
      "list.hash-and-link-coordination"
    ],
    "prerequisites": [
      "hashing.membership",
      "list.link-splice"
    ],
    "approach": "Hash lookup finds an entry while a doubly linked recency chain updates or evicts it without scanning the cache.",
    "commonErrors": [
      "get-does-not-refresh",
      "evict-when-updating-existing"
    ],
    "checkpointIds": [
      "linked-list-09",
      "linked-list-10",
      "linked-list-11"
    ],
    "remedialIds": [
      "arrays-hashing-03",
      "linked-list-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-13",
    "title": "Make two stable buckets of original nodes",
    "primaryTopic": "linked-list",
    "objective": "Relink original nodes into less-than-pivot and at-least-pivot buckets while preserving order inside each bucket.",
    "step": 3,
    "skillIds": [
      "list.stable-bucket-relink",
      "list.two-output-tails"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice"
    ],
    "approach": "The tails of two temporary chains let each original node keep its place within its bucket.",
    "commonErrors": [
      "equal-pivot-in-first-bucket",
      "reverse-first-bucket"
    ],
    "checkpointIds": [
      "linked-list-14",
      "linked-list-16",
      "linked-list-06"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-02"
    ],
    "nextIds": [
      "linked-list-15"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-14",
    "title": "Keep a browser history after changing direction",
    "primaryTopic": "linked-list",
    "objective": "Maintain a current history position, clamp back/forward navigation, and discard the forward branch after a new visit.",
    "step": 3,
    "skillIds": [
      "list.cursor-navigation",
      "list.forward-branch-invalidation"
    ],
    "prerequisites": [
      "list.link-splice"
    ],
    "approach": "History navigation preserves previous visits, while a visit after going back deliberately invalidates only the forward branch.",
    "commonErrors": [
      "keep-invalidated-forward-branch",
      "back-always-one-step"
    ],
    "checkpointIds": [
      "linked-list-13",
      "linked-list-16"
    ],
    "remedialIds": [
      "linked-list-01"
    ],
    "nextIds": [
      "linked-list-17"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-15",
    "title": "Merge sorted chains without duplicating their shared tail",
    "primaryTopic": "linked-list",
    "objective": "Merge the disjoint prefixes of sorted native chains stably, then append their shared suffix exactly once.",
    "step": 4,
    "skillIds": [
      "list.alias-aware-stable-merge",
      "list.shared-suffix-once"
    ],
    "prerequisites": [
      "list.shared-tail-identity",
      "list.link-splice",
      "sorted.order"
    ],
    "approach": "A shared suffix is one physical chain, not two copies of equal values. Equal-valued prefixes must be finished before attaching that suffix.",
    "commonErrors": [
      "duplicate-shared-suffix",
      "right-prefix-before-left-ties"
    ],
    "checkpointIds": [
      "linked-list-07",
      "linked-list-08"
    ],
    "remedialIds": [
      "linked-list-05",
      "linked-list-01",
      "two-pointers-04"
    ],
    "nextIds": [
      "linked-list-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-16",
    "title": "Keep only labels that occur once",
    "primaryTopic": "linked-list",
    "objective": "Remove an entire repeated-value run rather than keeping one representative, preserving the identities of uniquely occurring nodes.",
    "step": 3,
    "skillIds": [
      "list.whole-run-deletion",
      "list.retained-tail-linking"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "sorted.order"
    ],
    "approach": "The retained tail must reconnect past every node of a repeated run, including a repeated run at the head or end.",
    "commonErrors": [
      "keep-one-per-run",
      "discard-only-later-duplicates"
    ],
    "checkpointIds": [
      "linked-list-13",
      "linked-list-14"
    ],
    "remedialIds": [
      "linked-list-01",
      "two-pointers-04"
    ],
    "nextIds": [
      "linked-list-15"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-01",
    "title": "Count the nodes in the tree",
    "primaryTopic": "trees",
    "objective": "Visit native child links and count each existing binary-tree node once.",
    "step": 1,
    "skillIds": [
      "trees.child-links",
      "trees.node-visitation"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Missing child positions are not nodes, and duplicate node values do not merge identities.",
    "commonErrors": [
      "count-null-slots",
      "ignore-right-subtrees"
    ],
    "checkpointIds": [
      "trees-02"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "trees-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-02",
    "title": "Total the leaf values",
    "primaryTopic": "trees",
    "objective": "Recognize nodes with neither child and sum only their signed values using a wide accumulator.",
    "step": 1,
    "skillIds": [
      "trees.child-links",
      "trees.leaf-predicate",
      "trees.leaf-value-aggregate"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "An internal node is excluded even if one child is missing; negative leaf values must still contribute.",
    "commonErrors": [
      "sum-all-existing-nodes",
      "drop-negative-leaves"
    ],
    "checkpointIds": [
      "trees-01"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-03",
    "title": "Measure the longest root-to-leaf route",
    "primaryTopic": "trees",
    "objective": "Compute the greatest number of nodes on a root-to-leaf route, handling skewed and sparse trees.",
    "step": 2,
    "skillIds": [
      "trees.depth-tracking",
      "trees.null-baseline"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "Height combines branch depths rather than the total node count; define the empty baseline and singleton convention explicitly.",
    "commonErrors": [
      "count-edges-instead-of-nodes",
      "only-leftward-depth"
    ],
    "checkpointIds": [
      "trees-04"
    ],
    "remedialIds": [
      "trees-01",
      "trees-02"
    ],
    "nextIds": [
      "trees-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-04",
    "title": "Visit root, then left, then right",
    "primaryTopic": "trees",
    "objective": "Produce preorder values from native child links while preserving duplicate visits and left-before-right ordering.",
    "step": 2,
    "skillIds": [
      "trees.preorder-order",
      "trees.explicit-stack-order"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "The displayed input uses breadth-first construction, so returning the input values does not produce the required depth-first order.",
    "commonErrors": [
      "breadth-first-values",
      "postorder-instead"
    ],
    "checkpointIds": [
      "trees-03"
    ],
    "remedialIds": [
      "trees-01",
      "trees-02"
    ],
    "nextIds": [
      "trees-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-01",
    "title": "The largest k readings",
    "primaryTopic": "heap",
    "objective": "Retain the k largest multiset readings and return them in descending order.",
    "step": 1,
    "skillIds": [
      "heap.bounded-frontier",
      "heap.min-cutoff"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A min-heap of retained readings exposes the weakest selection when the next reading arrives.",
    "commonErrors": [
      "smallest-instead",
      "discard-duplicates"
    ],
    "checkpointIds": [
      "heap-06"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "heap-02"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-02",
    "title": "A rank threshold after each arrival",
    "primaryTopic": "heap",
    "objective": "Track the kth-largest multiset reading after each new stream arrival.",
    "step": 2,
    "skillIds": [
      "heap.bounded-frontier",
      "heap.incremental-order-statistic"
    ],
    "prerequisites": [
      "arrays.traversal",
      "heap.bounded-frontier"
    ],
    "approach": "Keep only the k largest readings seen so far; the min-heap root is the current threshold.",
    "commonErrors": [
      "largest-only",
      "initial-threshold-forever"
    ],
    "checkpointIds": [
      "heap-04"
    ],
    "remedialIds": [
      "heap-01",
      "arrays-hashing-01",
      "arrays-hashing-02",
      "math-geometry-01",
      "math-geometry-09"
    ],
    "nextIds": [
      "heap-05",
      "heap-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-04",
    "title": "Hire from two moving candidate windows",
    "primaryTopic": "heap",
    "objective": "Follow deterministic hiring from the first and last remaining candidate windows, revealing a new candidate only from the chosen side.",
    "step": 2,
    "skillIds": [
      "heap.dual-eligible-windows",
      "arrays.original-index-tie"
    ],
    "prerequisites": [
      "arrays.traversal",
      "heap.bounded-frontier"
    ],
    "approach": "The eligible set changes after each hire. Two heaps represent its ends, while inward pointers prevent overlapping windows from counting a worker twice.",
    "commonErrors": [
      "global-cheapest-original-k",
      "reverse-original-index-tie",
      "narrow-paid-total"
    ],
    "checkpointIds": [
      "heap-02"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "heap-01"
    ],
    "nextIds": [
      "heap-05",
      "heap-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-06",
    "title": "Repeatedly subtract the two largest stones",
    "primaryTopic": "heap",
    "objective": "Simulate deterministic largest-pair subtraction until at most one stone remains.",
    "step": 1,
    "skillIds": [
      "heap.max-extraction",
      "heap.multiset-transition"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "After every subtraction, a max-heap makes the next two largest remaining weights available.",
    "commonErrors": [
      "sum-parity-only",
      "subtract-smallest-pairs"
    ],
    "checkpointIds": [
      "heap-01"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-02",
      "math-geometry-01",
      "math-geometry-09"
    ],
    "nextIds": [
      "heap-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-05",
    "title": "Rank the most frequent labels",
    "primaryTopic": "heap",
    "objective": "Select distinct labels by descending occurrence count with ascending numeric tie order.",
    "step": 3,
    "skillIds": [
      "heap.frequency-frontier",
      "hashing.counts"
    ],
    "prerequisites": [
      "arrays.traversal",
      "heap.bounded-frontier"
    ],
    "approach": "Build label counts, then retain the strongest k distinct labels in a bounded heap.",
    "commonErrors": [
      "reverse-tie",
      "ignore-frequencies"
    ],
    "checkpointIds": [
      "heap-07"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "heap-01",
      "heap-02"
    ],
    "nextIds": [
      "heap-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-07",
    "title": "An exact median after each arrival",
    "primaryTopic": "heap",
    "objective": "Maintain the exact median of each growing ordered prefix, returning twice its value.",
    "step": 3,
    "skillIds": [
      "heap.two-partition-balance",
      "heap.median-cut"
    ],
    "prerequisites": [
      "arrays.traversal",
      "heap.bounded-frontier"
    ],
    "approach": "Balance lower and upper heaps so their boundary values determine the median without sorting each prefix.",
    "commonErrors": [
      "lower-middle-only",
      "latest-reading"
    ],
    "checkpointIds": [
      "heap-05"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "heap-01",
      "heap-02",
      "heap-05"
    ],
    "nextIds": [
      "heap-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-08",
    "title": "Finish unit tasks with a label cooldown",
    "primaryTopic": "heap",
    "objective": "Minimize elapsed unit intervals when repeated task labels require a fixed cooldown.",
    "step": 4,
    "skillIds": [
      "heap.release-frontier",
      "scheduling.cooldown-spacing"
    ],
    "prerequisites": [
      "hashing.counts",
      "heap.frequency-frontier"
    ],
    "approach": "The largest label group determines required spacing; other groups can fill its gaps. A release frontier offers a constructive schedule model.",
    "commonErrors": [
      "missing-plus-one-spacing",
      "idle-after-last"
    ],
    "checkpointIds": [
      "heap-09",
      "heap-10",
      "heap-12"
    ],
    "remedialIds": [
      "arrays-hashing-04",
      "heap-05",
      "heap-06",
      "heap-01",
      "arrays-hashing-03",
      "two-pointers-04"
    ],
    "nextIds": [
      "heap-11",
      "heap-13",
      "heap-14"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-11",
    "title": "Grow capital through affordable projects",
    "primaryTopic": "heap",
    "objective": "Maximize final capital after at most k one-use projects whose eligibility changes with earned profit.",
    "step": 5,
    "skillIds": [
      "heap.affordability-frontier",
      "heap.profit-choice"
    ],
    "prerequisites": [
      "heap.frequency-frontier",
      "sorted.order"
    ],
    "approach": "Move newly affordable projects into a max-profit frontier; taking the largest available nonnegative profit cannot shrink later eligibility.",
    "commonErrors": [
      "required-capital-is-spent",
      "never-refresh-eligibility"
    ],
    "checkpointIds": [
      "heap-13",
      "heap-14"
    ],
    "remedialIds": [
      "heap-05",
      "two-pointers-04",
      "heap-06",
      "heap-08",
      "arrays-hashing-03",
      "arrays-hashing-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "trees-22",
    "title": "Return the original node at a sorted rank",
    "primaryTopic": "trees",
    "objective": "Return the original native node at a one-based key rank, or null when that rank does not exist.",
    "step": 3,
    "skillIds": [
      "trees.child-links",
      "trees.inorder-rank",
      "trees.original-target-identity"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "Inorder traversal visits strict-BST keys in increasing order, but the returned object must be the original node rather than an equal-valued replacement.",
    "commonErrors": [
      "treat-k-as-zero-based",
      "return-key-instead-of-original-node-id"
    ],
    "checkpointIds": [
      "trees-19",
      "trees-23"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-20",
      "trees-24"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-23",
    "title": "Total the keys inside an inclusive range",
    "primaryTopic": "trees",
    "objective": "Sum every native key in the inclusive bounds, pruning branches ruled out by strict subtree ordering.",
    "step": 3,
    "skillIds": [
      "trees.child-links",
      "trees.bst-search-route",
      "trees.ordered-range-pruning",
      "numbers.signed-accumulation"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.bst-search-route",
      "numbers.signed-accumulation"
    ],
    "approach": "A key below lo rules out its whole left subtree; a key above hi rules out its whole right subtree. Signed keys still require wide totals and inclusive endpoints.",
    "commonErrors": [
      "exclude-endpoint-keys",
      "signed-int32-range-total"
    ],
    "checkpointIds": [
      "trees-19",
      "trees-22"
    ],
    "remedialIds": [
      "trees-01",
      "trees-19",
      "arrays-hashing-01"
    ],
    "nextIds": [
      "trees-20",
      "trees-26"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-17",
    "title": "Find the lowest common ancestor by object identity",
    "primaryTopic": "trees",
    "objective": "Return the deepest original node that is an ancestor of both native target objects, allowing repeated values and identical targets.",
    "step": 4,
    "skillIds": [
      "trees.child-links",
      "trees.node-visitation",
      "trees.original-query-identity",
      "trees.common-ancestor-chain"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.node-visitation"
    ],
    "approach": "A parent map or subtree membership combines object identities rather than values; a target is its own ancestor.",
    "commonErrors": [
      "locate-targets-by-value-not-identity",
      "always-return-root"
    ],
    "checkpointIds": [
      "trees-14",
      "trees-15",
      "trees-24"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-12",
      "trees-28",
      "trees-29",
      "trees-30"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-22",
    "title": "Flatten every child list before its next sibling",
    "primaryTopic": "linked-list",
    "objective": "Flatten original multilevel native nodes in node/child/next order, clearing child fields and making a valid reciprocal doubly linked chain.",
    "step": 5,
    "skillIds": [
      "list.walk",
      "list.link-splice",
      "list.original-identity",
      "list.multilevel-depthfirst",
      "list.bidirectional-flatten"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "list.original-identity"
    ],
    "approach": "Deferred next siblings resume after an entire child sublist; identity, unchanged values and reciprocal previous links are part of the result, not merely a copied value sequence.",
    "commonErrors": [
      "breadth-first-instead-of-child-first",
      "ignore-all-child-lists",
      "copy-values-instead-of-original-identities"
    ],
    "checkpointIds": [
      "linked-list-09",
      "linked-list-10",
      "linked-list-11",
      "linked-list-12",
      "linked-list-20"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-03"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "tries-01",
    "title": "Replace words with their shortest known root",
    "primaryTopic": "tries",
    "objective": "Replace each word with its shortest dictionary prefix while preserving unmatched words and their order.",
    "step": 1,
    "skillIds": [
      "arrays.traversal",
      "tries.prefix-navigation",
      "tries.shortest-terminal-root"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A terminal prefix wins before deeper branches; dictionary entries inside a word or longer matching prefixes are not valid replacements.",
    "commonErrors": [
      "choose-longest-terminal-root",
      "replace-infix-as-if-prefix"
    ],
    "checkpointIds": [
      "tries-02",
      "tries-03"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "tries-02",
    "title": "Match a dictionary word with one-letter wildcards",
    "primaryTopic": "tries",
    "objective": "Decide whether one whole dictionary word matches a literal-and-one-letter-wildcard pattern.",
    "step": 1,
    "skillIds": [
      "arrays.traversal",
      "tries.prefix-navigation",
      "tries.wildcard-branch-search",
      "tries.exact-terminal-match"
    ],
    "prerequisites": [
      "arrays.traversal",
      "tries.prefix-navigation"
    ],
    "approach": "A wildcard branches to existing child letters; matching a prefix without a terminal node or accepting a different word length is incorrect.",
    "commonErrors": [
      "accept-nonterminal-prefix",
      "treat-question-mark-as-zero-or-many"
    ],
    "checkpointIds": [
      "tries-01",
      "tries-03"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "tries-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-01",
    "title": "Build every fixed-sum digit string",
    "primaryTopic": "backtracking",
    "objective": "Enumerate every fixed-length ordered string from an allowed digit set whose digit sum equals the target.",
    "step": 1,
    "skillIds": [
      "arrays.traversal",
      "backtracking.branch-restoration",
      "backtracking.fixed-depth-choices",
      "backtracking.nonnegative-remainder-pruning"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Each position is an independent reusable choice, while restoring the partial path separates siblings; order and leading zeroes remain significant.",
    "commonErrors": [
      "forbid-leading-zero-strings",
      "forbid-reusing-a-digit",
      "treat-order-as-an-unordered-combination"
    ],
    "checkpointIds": [
      "backtracking-02"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "backtracking-03",
      "backtracking-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "backtracking-02",
    "title": "Choose an exact-size index combination with a signed total",
    "primaryTopic": "backtracking",
    "objective": "Enumerate original-position subsets of exactly k entries having the target signed total, keeping equal-valued positions distinct.",
    "step": 1,
    "skillIds": [
      "arrays.traversal",
      "numbers.signed-accumulation",
      "backtracking.branch-restoration",
      "backtracking.exact-cardinality-combination",
      "backtracking.original-index-choice"
    ],
    "prerequisites": [
      "arrays.traversal",
      "numbers.signed-accumulation"
    ],
    "approach": "Increasing index choices prevent repeated positions/permutations, while signed values make a positive-only overshoot prune invalid.",
    "commonErrors": [
      "positive-only-overshoot-prune",
      "ignore-exact-cardinality",
      "collapse-equal-valued-position-choices"
    ],
    "checkpointIds": [
      "backtracking-01"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "backtracking-03",
      "backtracking-04"
    ],
    "status": "authored-draft"
  },
  {
    "id": "heap-13",
    "title": "Minimize deviation with parity operations",
    "primaryTopic": "heap",
    "objective": "Minimize the range of positive values using parity-dependent doubling and halving operations.",
    "step": 5,
    "skillIds": [
      "heap.monotone-maximum",
      "numbers.parity-reachability"
    ],
    "prerequisites": [
      "heap.max-extraction"
    ],
    "approach": "Normalize each odd value to its largest reachable form, then reduce the current maximum while tracking the minimum. Reachable values are finite despite reversible odd/even operations.",
    "commonErrors": [
      "original-range-only",
      "odd-values-cannot-double"
    ],
    "checkpointIds": [
      "heap-11"
    ],
    "remedialIds": [
      "heap-06"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-17",
    "title": "Count palindromic substrings",
    "primaryTopic": "dp-1d",
    "objective": "Count all indexed contiguous palindromes using mirrored endpoints and their previously solved interior.",
    "step": 5,
    "skillIds": [
      "strings.palindrome-interval-state",
      "dp.rolling-interval-state"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "Matching endpoints form a palindrome only when their interior is also a palindrome; equal text at different positions counts separately.",
    "commonErrors": [
      "count-distinct-text-only",
      "omit-even-palindromes"
    ],
    "checkpointIds": [
      "dp-1d-09",
      "dp-1d-10",
      "dp-1d-16"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-18",
      "dp-1d-11",
      "dp-1d-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-18",
    "title": "Minimum palindrome partition cuts",
    "primaryTopic": "dp-1d",
    "objective": "Partition every character into palindrome pieces while minimizing cuts between consecutive pieces.",
    "step": 6,
    "skillIds": [
      "strings.palindrome-interval-state",
      "dp.minimum-prefix-partition-cost"
    ],
    "prerequisites": [
      "dp.one-dimensional-state",
      "strings.palindrome-interval-state",
      "dp.minimum-cost-recurrence"
    ],
    "approach": "A recognized palindrome can finish a partition of a prefix; minimize the preceding prefix cost rather than choosing the locally longest piece.",
    "commonErrors": [
      "return-piece-count",
      "recognize-only-whole-text"
    ],
    "checkpointIds": [
      "dp-1d-11",
      "dp-1d-12"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02",
      "dp-1d-17",
      "binary-search-01",
      "binary-search-02"
    ],
    "nextIds": [
      "dp-1d-21",
      "dp-1d-23"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-10",
    "title": "Count plus/minus assignments",
    "primaryTopic": "dp-1d",
    "objective": "Count mandatory sign choices for every indexed item, including distinct plus/minus choices on zero.",
    "step": 5,
    "skillIds": [
      "dp.indexed-assignment-count",
      "dp.zero-choice-multiplicity"
    ],
    "prerequisites": [
      "dp.reachable-sums",
      "dp.counting-recurrence"
    ],
    "approach": "Each item must receive one sign, and different indexed sign vectors count even when equal or zero values produce the same numeric terms.",
    "commonErrors": [
      "discard-zero-sign-choices",
      "collapse-equal-indexed-items"
    ],
    "checkpointIds": [
      "dp-1d-09"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02",
      "dp-1d-08"
    ],
    "nextIds": [
      "dp-1d-11",
      "dp-1d-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-11",
    "title": "Longest strict increasing subsequence",
    "primaryTopic": "dp-1d",
    "objective": "Find the length of a strictly increasing indexed subsequence without requiring contiguous positions.",
    "step": 6,
    "skillIds": [
      "dp.sequence-extension",
      "binary-search.tail-frontier"
    ],
    "prerequisites": [
      "dp.one-dimensional-state",
      "binary-search.lower-bound"
    ],
    "approach": "A smaller tail preserves more future extension options; equal values do not increase the length.",
    "commonErrors": [
      "allow-nondecreasing-extension",
      "require-a-contiguous-run"
    ],
    "checkpointIds": [
      "dp-1d-12"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02",
      "binary-search-01",
      "binary-search-02"
    ],
    "nextIds": [
      "dp-1d-21",
      "dp-1d-23"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-12",
    "title": "Count longest increasing subsequences",
    "primaryTopic": "dp-1d",
    "objective": "Count all indexed subsequences tied for the maximum strict increasing length, merging and replacing counts correctly.",
    "step": 6,
    "skillIds": [
      "dp.sequence-extension",
      "dp.optimal-count-ties"
    ],
    "prerequisites": [
      "dp.sequence-extension",
      "dp.counting-recurrence"
    ],
    "approach": "A better predecessor replaces the old count; a tied predecessor adds distinct optimal choices.",
    "commonErrors": [
      "count-only-one-optimum",
      "allow-equal-value-extension"
    ],
    "checkpointIds": [
      "dp-1d-11"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-11",
      "binary-search-01",
      "binary-search-02"
    ],
    "nextIds": [
      "dp-1d-21",
      "dp-1d-23"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-13",
    "title": "Maximum contiguous sum",
    "primaryTopic": "dp-1d",
    "objective": "Maximize a nonempty contiguous segment by deciding whether to restart or extend the ending state.",
    "step": 2,
    "skillIds": [
      "dp.one-dimensional-state",
      "dp.restart-or-extend"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "The ending segment may restart at the current value; a segment must remain nonempty even when every value is negative.",
    "commonErrors": [
      "allow-empty-segment",
      "skip-negative-interior-values"
    ],
    "checkpointIds": [
      "dp-1d-03",
      "dp-1d-04"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-14",
      "dp-1d-05",
      "dp-1d-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-14",
    "title": "Maximum signed contiguous product",
    "primaryTopic": "dp-1d",
    "objective": "Track both ending extrema when maximizing a signed contiguous product; negative values exchange their roles.",
    "step": 3,
    "skillIds": [
      "dp.restart-or-extend",
      "dp.signed-product-extremes"
    ],
    "prerequisites": [
      "dp.one-dimensional-state",
      "dp.restart-or-extend"
    ],
    "approach": "The most negative ending product can become the next maximum after multiplying by a negative value; zeros break the segment.",
    "commonErrors": [
      "carry-only-maximum-ending-product",
      "allow-empty-product-one"
    ],
    "checkpointIds": [
      "dp-1d-05",
      "dp-1d-06"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02",
      "dp-1d-13"
    ],
    "nextIds": [
      "dp-1d-07",
      "dp-1d-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-15",
    "title": "Can the dictionary cover the whole text?",
    "primaryTopic": "dp-1d",
    "objective": "Determine whether consecutive dictionary words cover every character exactly, without greedy boundary choices.",
    "step": 4,
    "skillIds": [
      "dp.text-position-state",
      "strings.word-boundary-reachability"
    ],
    "prerequisites": [
      "dp.one-dimensional-state"
    ],
    "approach": "A reachable character boundary can open several matching next words; every character must belong to one chosen token.",
    "commonErrors": [
      "accept-any-dictionary-substring",
      "greedy-longest-next-token"
    ],
    "checkpointIds": [
      "dp-1d-07",
      "dp-1d-08"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02"
    ],
    "nextIds": [
      "dp-1d-16",
      "dp-1d-09",
      "dp-1d-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "dp-1d-16",
    "title": "Leave the fewest unmatched characters",
    "primaryTopic": "dp-1d",
    "objective": "Minimize uncovered characters using disjoint dictionary substrings and explicit one-character skip transitions.",
    "step": 5,
    "skillIds": [
      "dp.text-position-state",
      "dp.skip-or-cover-cost"
    ],
    "prerequisites": [
      "dp.one-dimensional-state",
      "strings.word-boundary-reachability"
    ],
    "approach": "Full segmentation may be impossible, but a skip transition allows the best partial coverage; count uncovered characters rather than chosen words.",
    "commonErrors": [
      "all-or-nothing-coverage",
      "remove-all-matching-characters-without-contiguity"
    ],
    "checkpointIds": [
      "dp-1d-09",
      "dp-1d-10"
    ],
    "remedialIds": [
      "dp-1d-01",
      "dp-1d-02",
      "dp-1d-15"
    ],
    "nextIds": [
      "dp-1d-11",
      "dp-1d-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-05",
    "title": "Peel away all current leaves each round",
    "primaryTopic": "trees",
    "objective": "Group every original value by the round in which its node becomes a leaf after simultaneous previous removals.",
    "step": 3,
    "skillIds": [
      "trees.subtree-round-dependencies",
      "trees.simultaneous-peeling"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.leaf-predicate",
      "trees.preorder-order"
    ],
    "approach": "A node becomes removable only after both child subtrees are gone; original root depth does not determine its removal round.",
    "commonErrors": [
      "only-original-leaves-by-depth",
      "remove-new-parents-in-same-round"
    ],
    "checkpointIds": [
      "trees-06"
    ],
    "remedialIds": [
      "trees-01",
      "trees-02",
      "trees-04"
    ],
    "nextIds": [
      "trees-14",
      "trees-15"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-06",
    "title": "Trace the tree boundary without repeating leaves",
    "primaryTopic": "trees",
    "objective": "Combine root, left boundary, ordered leaves, and reversed right boundary without repeating any node.",
    "step": 3,
    "skillIds": [
      "trees.boundary-paths",
      "trees.nonduplicated-leaf-contour"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.leaf-predicate",
      "trees.preorder-order"
    ],
    "approach": "Boundary paths exclude leaves because the leaf traversal already contributes them; one-child trees need explicit starting-side rules.",
    "commonErrors": [
      "include-boundary-leaves-twice",
      "right-boundary-top-down"
    ],
    "checkpointIds": [
      "trees-05"
    ],
    "remedialIds": [
      "trees-01",
      "trees-02",
      "trees-04"
    ],
    "nextIds": [
      "trees-14",
      "trees-15"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-07",
    "title": "Keep each breadth-first level together",
    "primaryTopic": "trees",
    "objective": "Return every node value grouped by depth, preserving left-to-right order and capturing each level before adding its children.",
    "step": 2,
    "skillIds": [
      "trees.level-grouping",
      "trees.level-boundary-capture"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.depth-tracking"
    ],
    "approach": "A queue changes size while children are enqueued; capturing the current level size prevents mixing parent and child rows.",
    "commonErrors": [
      "only-leaf-levels",
      "reverse-each-level"
    ],
    "checkpointIds": [
      "trees-08"
    ],
    "remedialIds": [
      "trees-01",
      "trees-03"
    ],
    "nextIds": [
      "trees-05",
      "trees-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-08",
    "title": "Return the mirrored tree",
    "primaryTopic": "trees",
    "objective": "Exchange left and right structure at every node, preserving the corresponding node values and sparse topology.",
    "step": 2,
    "skillIds": [
      "trees.child-exchange",
      "trees.mirrored-topology"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "Mirroring applies throughout every subtree; swapping only the root children leaves deeper structure wrong.",
    "commonErrors": [
      "exchange-root-only",
      "reverse-flat-values"
    ],
    "checkpointIds": [
      "trees-07"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-05",
      "trees-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-09",
    "title": "Compare two arbitrary trees",
    "primaryTopic": "trees",
    "objective": "Compare both node values and corresponding child structure of two independently supplied trees.",
    "step": 2,
    "skillIds": [
      "trees.paired-structure-comparison",
      "trees.value-and-null-equality"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "Equal visit sequences or equal node multisets do not establish corresponding left/right structure.",
    "commonErrors": [
      "compare-nonnull-value-sequence-only",
      "ignore-all-node-values"
    ],
    "checkpointIds": [
      "trees-04",
      "trees-07",
      "trees-08",
      "trees-10"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-05",
      "trees-06",
      "trees-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-10",
    "title": "Check whether the tree fills every earlier position",
    "primaryTopic": "trees",
    "objective": "Check the complete-tree shape rule: full earlier levels and a left-filled final level.",
    "step": 2,
    "skillIds": [
      "trees.breadth-first-gap-invariant",
      "trees.complete-shape"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "After the first missing breadth-first child position, any later existing node proves an incomplete shape.",
    "commonErrors": [
      "only-check-local-right-without-left",
      "all-nonempty-trees-complete"
    ],
    "checkpointIds": [
      "trees-07",
      "trees-08",
      "trees-09"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-05",
      "trees-06",
      "trees-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-11",
    "title": "Find a complete root-to-leaf target total",
    "primaryTopic": "trees",
    "objective": "Test whether one complete root-to-leaf route has the supplied signed total, without accepting internal prefixes or pruning negative values incorrectly.",
    "step": 3,
    "skillIds": [
      "trees.branch-local-sum",
      "trees.leaf-only-target"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.leaf-predicate",
      "numbers.signed-accumulation"
    ],
    "approach": "Each branch needs its own accumulated sum, and a matching internal node is not a completed route.",
    "commonErrors": [
      "accept-internal-prefix",
      "discard-sum-above-target"
    ],
    "checkpointIds": [
      "trees-05",
      "trees-06"
    ],
    "remedialIds": [
      "trees-01",
      "trees-02",
      "arrays-hashing-01"
    ],
    "nextIds": [
      "trees-26"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-12",
    "title": "Cover the tree with as few cameras as possible",
    "primaryTopic": "trees",
    "objective": "Minimize cameras placed on original tree nodes when each camera covers its parent, itself, and immediate children.",
    "step": 5,
    "skillIds": [
      "trees.coverage-state-combination",
      "trees.parent-placement-choice"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.subtree-round-dependencies"
    ],
    "approach": "A child needing coverage forces a placement decision at its parent; the root must be checked separately because it has no parent.",
    "commonErrors": [
      "forget-uncovered-root",
      "place-camera-at-every-leaf"
    ],
    "checkpointIds": [
      "trees-28",
      "trees-29",
      "trees-30"
    ],
    "remedialIds": [
      "trees-01",
      "trees-05"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "trees-13",
    "title": "Check balance at every subtree",
    "primaryTopic": "trees",
    "objective": "Verify that the two child subtree heights differ by at most one at every node.",
    "step": 3,
    "skillIds": [
      "trees.child-links",
      "trees.subtree-height-summary",
      "trees.local-balance-invariant"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.depth-tracking"
    ],
    "approach": "Root balance alone can hide an unbalanced descendant; bottom-up child summaries make every local check explicit.",
    "commonErrors": [
      "check-only-root",
      "require-equal-child-heights"
    ],
    "checkpointIds": [
      "trees-05",
      "trees-06",
      "trees-11",
      "trees-16"
    ],
    "remedialIds": [
      "trees-01",
      "trees-03"
    ],
    "nextIds": [
      "trees-14",
      "trees-15"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-14",
    "title": "Measure the longest path across the tree",
    "primaryTopic": "trees",
    "objective": "Find the largest number of edges on any simple path between two native nodes.",
    "step": 4,
    "skillIds": [
      "trees.child-links",
      "trees.subtree-height-summary",
      "trees.two-arm-path-join"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.subtree-height-summary"
    ],
    "approach": "The longest path may join two child branches below the root; a root-to-leaf height alone is insufficient.",
    "commonErrors": [
      "return-root-height",
      "root-only-two-arm-path"
    ],
    "checkpointIds": [
      "trees-15"
    ],
    "remedialIds": [
      "trees-01",
      "trees-13"
    ],
    "nextIds": [
      "trees-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-15",
    "title": "Count repeated subtree types",
    "primaryTopic": "trees",
    "objective": "Count distinct complete rooted subtree types, including both values and child orientation, that occur at least twice.",
    "step": 4,
    "skillIds": [
      "trees.child-links",
      "trees.structural-interning",
      "hashing.membership",
      "trees.subtree-type-frequency"
    ],
    "prerequisites": [
      "trees.child-links",
      "hashing.membership"
    ],
    "approach": "Interning value/left-type/right-type summaries distinguishes structure from a value multiset and counts each repeated type once.",
    "commonErrors": [
      "count-extra-occurrences-not-types",
      "count-only-repeated-leaf-types"
    ],
    "checkpointIds": [
      "trees-14"
    ],
    "remedialIds": [
      "trees-01",
      "arrays-hashing-03"
    ],
    "nextIds": [
      "trees-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-16",
    "title": "Count nodes that meet their ancestor maximum",
    "primaryTopic": "trees",
    "objective": "Count nodes whose values are at least every value on their own root-to-parent route.",
    "step": 3,
    "skillIds": [
      "trees.child-links",
      "trees.branch-local-maximum",
      "trees.ancestor-value-predicate"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "Each branch carries its own ancestor maximum; comparing only with the immediate parent or rejecting ties is incorrect.",
    "commonErrors": [
      "reject-equal-ancestor-values",
      "compare-only-immediate-parent"
    ],
    "checkpointIds": [
      "trees-05",
      "trees-06",
      "trees-11",
      "trees-13"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-14",
      "trees-15"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-25",
    "title": "Check a proposed binary parent table",
    "primaryTopic": "trees",
    "objective": "Decide whether proposed parent indices describe exactly one nonempty rooted tree with at most two children per node.",
    "step": 3,
    "skillIds": [
      "arrays.traversal",
      "trees.parent-map",
      "trees.rooted-acyclic-connectivity",
      "trees.binary-child-capacity"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "One root and local parent bounds do not exclude a disconnected cycle or an overfull parent.",
    "commonErrors": [
      "ignore-child-capacity",
      "accept-multiple-root-forest",
      "check-only-one-root-and-capacity"
    ],
    "checkpointIds": [
      "trees-13",
      "trees-16",
      "trees-21"
    ],
    "remedialIds": [
      "arrays-hashing-01"
    ],
    "nextIds": [
      "trees-14",
      "trees-15",
      "trees-24"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-26",
    "title": "Count target-total routes starting anywhere",
    "primaryTopic": "trees",
    "objective": "Count every nonempty ancestor-to-descendant route with the target signed sum, including routes beginning below the root and overlapping routes.",
    "step": 4,
    "skillIds": [
      "trees.child-links",
      "numbers.signed-accumulation",
      "trees.branch-prefix-frequency",
      "trees.all-downward-route-count"
    ],
    "prerequisites": [
      "trees.child-links",
      "numbers.signed-accumulation"
    ],
    "approach": "Current-branch prefix frequencies count all start positions; removing a prefix on branch exit prevents sibling leakage.",
    "commonErrors": [
      "leak-prefixes-between-sibling-branches",
      "count-only-root-starts",
      "signed-int32-prefix-accumulator"
    ],
    "checkpointIds": [
      "trees-14",
      "trees-15",
      "trees-24"
    ],
    "remedialIds": [
      "trees-01",
      "arrays-hashing-01",
      "trees-11"
    ],
    "nextIds": [
      "trees-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-27",
    "title": "Clear every bit with subtree toggles",
    "primaryTopic": "trees",
    "objective": "Find the minimum number of conceptual whole-subtree bit toggles that makes every node value zero.",
    "step": 3,
    "skillIds": [
      "trees.child-links",
      "trees.branch-toggle-parity",
      "trees.forced-subtree-flip"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "Once ancestor toggles are fixed, only a toggle rooted at the current node can correct that node without changing an ancestor; carry its parity separately into both branches.",
    "commonErrors": [
      "ignore-inherited-flip-parity",
      "only-one-operation-for-any-nonzero-tree"
    ],
    "checkpointIds": [
      "trees-13",
      "trees-16",
      "trees-21",
      "trees-25"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-14",
      "trees-15",
      "trees-26"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-28",
    "title": "Maximize a signed path total anywhere",
    "primaryTopic": "trees",
    "objective": "Find the maximum signed total of a nonempty simple path between any two nodes, discarding harmful child branches without allowing an empty result.",
    "step": 5,
    "skillIds": [
      "trees.child-links",
      "trees.two-arm-path-join",
      "trees.positive-branch-gain",
      "numbers.signed-accumulation"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.two-arm-path-join",
      "numbers.signed-accumulation"
    ],
    "approach": "A completed path can use two child gains, but the contribution passed upward can use at most one; negative gains must be dropped while an all-negative tree still selects one node.",
    "commonErrors": [
      "allow-empty-path-in-nonempty-tree",
      "force-path-through-root",
      "signed-int32-path-accumulator"
    ],
    "checkpointIds": [
      "trees-12"
    ],
    "remedialIds": [
      "trees-01",
      "trees-14",
      "arrays-hashing-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "trees-29",
    "title": "Choose a maximum-weight nonadjacent node set",
    "primaryTopic": "trees",
    "objective": "Maximize the total value of a selected original-node set containing no parent-child pair; allow the empty selection.",
    "step": 5,
    "skillIds": [
      "trees.child-links",
      "numbers.signed-accumulation",
      "trees.include-exclude-subtree-state",
      "trees.parent-child-selection-conflict"
    ],
    "prerequisites": [
      "trees.child-links",
      "numbers.signed-accumulation"
    ],
    "approach": "Selecting a node forces both children out, while skipping it lets each child subtree choose independently. Signed weights make empty selection a meaningful alternative.",
    "commonErrors": [
      "force-root-selection",
      "ignore-adjacency-select-all-positive",
      "signed-int32-selection-total"
    ],
    "checkpointIds": [
      "trees-12",
      "trees-28",
      "trees-30"
    ],
    "remedialIds": [
      "trees-01",
      "arrays-hashing-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "trees-30",
    "title": "Compute distance totals from every node",
    "primaryTopic": "trees",
    "objective": "Return each native node’s total edge distance to every node, in breadth-first existing-node order.",
    "step": 5,
    "skillIds": [
      "trees.child-links",
      "trees.node-visitation",
      "trees.subtree-size-summary",
      "trees.reroot-distance-transfer"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.node-visitation"
    ],
    "approach": "Moving the distance origin across one edge shortens routes to the child subtree and lengthens all others; subtree sizes transfer totals without repeating BFS for each origin.",
    "commonErrors": [
      "miss-double-subtree-distance-change",
      "copy-root-total-to-every-node"
    ],
    "checkpointIds": [
      "trees-12",
      "trees-28",
      "trees-29"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "trees-18",
    "title": "Rotate the root once",
    "primaryTopic": "trees",
    "objective": "Perform one specified root rotation, preserving the entire inorder value sequence and all unaffected subtree structure.",
    "step": 2,
    "skillIds": [
      "trees.child-links",
      "trees.root-rotation",
      "trees.inorder-preservation"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "The pivot child becomes the new root, while its inner subtree moves between the old and new roots. A rotation is a local topology change, not a search or a whole-tree mirror.",
    "commonErrors": [
      "return-original-topology",
      "discard-pivot-inner-subtree",
      "rotate-in-the-opposite-direction"
    ],
    "checkpointIds": [
      "trees-07",
      "trees-08"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-19",
      "trees-21"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-19",
    "title": "Insert at the search route endpoint",
    "primaryTopic": "trees",
    "objective": "Return the exact tree formed by adding an absent key at its search-route null child, while preserving existing structure.",
    "step": 3,
    "skillIds": [
      "trees.child-links",
      "trees.bst-search-route",
      "trees.bst-leaf-insertion"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "An insertion changes one child link, or the root for an empty tree; rebalancing would produce the wrong specified shape.",
    "commonErrors": [
      "reverse-insertion-direction",
      "ignore-absent-key"
    ],
    "checkpointIds": [
      "trees-23",
      "trees-13",
      "trees-16"
    ],
    "remedialIds": [
      "trees-01",
      "trees-18"
    ],
    "nextIds": [
      "trees-20"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-20",
    "title": "Delete a key with the specified successor rule",
    "primaryTopic": "trees",
    "objective": "Remove one key while preserving the canonical successor-based tree shape, including the successor’s right child.",
    "step": 4,
    "skillIds": [
      "trees.child-links",
      "trees.bst-search-route",
      "trees.bst-successor-splice"
    ],
    "prerequisites": [
      "trees.child-links",
      "trees.bst-search-route"
    ],
    "approach": "Deleting a two-child node replaces its value with the smallest right-subtree key and splices that successor rather than discarding its remaining child.",
    "commonErrors": [
      "use-predecessor-instead-of-successor",
      "drop-whole-matching-subtree"
    ],
    "checkpointIds": [
      "trees-14",
      "trees-15"
    ],
    "remedialIds": [
      "trees-01",
      "trees-19"
    ],
    "nextIds": [
      "trees-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-21",
    "title": "Validate ordering across whole subtrees",
    "primaryTopic": "trees",
    "objective": "Test global strict search-tree ordering on an arbitrary native tree, including descendants and duplicate values.",
    "step": 3,
    "skillIds": [
      "trees.child-links",
      "trees.ancestor-order-bounds",
      "trees.inorder-strict-invariant"
    ],
    "prerequisites": [
      "trees.child-links"
    ],
    "approach": "A child can satisfy its immediate parent comparison while violating an earlier ancestor bound.",
    "commonErrors": [
      "check-immediate-children-only",
      "allow-equal-values"
    ],
    "checkpointIds": [
      "trees-13",
      "trees-16"
    ],
    "remedialIds": [
      "trees-01"
    ],
    "nextIds": [
      "trees-14",
      "trees-15",
      "trees-20"
    ],
    "status": "authored-draft"
  },
  {
    "id": "trees-24",
    "title": "Reconstruct the tree from two traversals",
    "primaryTopic": "trees",
    "objective": "Reconstruct the unique native tree described by compatible distinct-valued preorder and inorder traversals.",
    "step": 4,
    "skillIds": [
      "trees.preorder-order",
      "trees.inorder-partition",
      "trees.traversal-pair-reconstruction"
    ],
    "prerequisites": [
      "trees.preorder-order",
      "trees.child-links"
    ],
    "approach": "Preorder identifies each subtree root, while its inorder position divides the remaining nodes between left and right branches.",
    "commonErrors": [
      "ignore-inorder-build-preorder-right-chain",
      "mirror-the-required-tree"
    ],
    "checkpointIds": [
      "trees-14",
      "trees-15"
    ],
    "remedialIds": [
      "trees-01",
      "trees-04"
    ],
    "nextIds": [
      "trees-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-17",
    "title": "Move identified original nodes through a history",
    "primaryTopic": "linked-list",
    "objective": "Apply cut-and-insert operations addressed by immutable original node indexes, rather than changing current positions or values.",
    "step": 4,
    "skillIds": [
      "list.stable-addressed-node-moves",
      "list.predecessor-maintenance"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "list.original-identity"
    ],
    "approach": "A node keeps its original identifier after moving; detach its current predecessor link before connecting it at the new location.",
    "commonErrors": [
      "interpret-identifiers-as-current-positions",
      "ignore-all-moves"
    ],
    "checkpointIds": [
      "linked-list-18",
      "linked-list-19",
      "linked-list-15"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-03"
    ],
    "nextIds": [
      "linked-list-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-18",
    "title": "Rotate the original chain to the right",
    "primaryTopic": "linked-list",
    "objective": "Move a suffix to the front using a modular cut point while preserving all original node identities and values.",
    "step": 4,
    "skillIds": [
      "list.modular-cut-point",
      "list.close-and-break-ring"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "list.original-identity"
    ],
    "approach": "The rotation count may greatly exceed the length; locate the new tail after reducing it modulo n, and break the temporary ring.",
    "commonErrors": [
      "rotate-left-instead",
      "omit-modulo-reduction"
    ],
    "checkpointIds": [
      "linked-list-17",
      "linked-list-19",
      "linked-list-08"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-03"
    ],
    "nextIds": [
      "linked-list-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-19",
    "title": "Reverse one interval of original nodes",
    "primaryTopic": "linked-list",
    "objective": "Reverse one inclusive interval while preserving the prefix and suffix and returning the correct original head.",
    "step": 4,
    "skillIds": [
      "list.interval-predecessor",
      "list.three-chain-reconnection"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "list.original-identity"
    ],
    "approach": "Track the interval predecessor and its old first node; they become the reconnect points after reversal.",
    "commonErrors": [
      "reverse-entire-list",
      "right-bound-exclusive"
    ],
    "checkpointIds": [
      "linked-list-17",
      "linked-list-18",
      "linked-list-08"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-03"
    ],
    "nextIds": [
      "linked-list-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-20",
    "title": "Remove zero-sum blocks until none remain",
    "primaryTopic": "linked-list",
    "objective": "Return an original-node subsequence obtainable by zero-sum block removal, with no zero-sum consecutive block left.",
    "step": 5,
    "skillIds": [
      "list.prefix-equality-unlinking",
      "list.normalized-survivor-invariant"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "list.original-identity"
    ],
    "approach": "Several legitimate survivor chains can exist. Validate what was removed and the terminal invariant, rather than insisting on one algorithm's witness.",
    "commonErrors": [
      "leave-original-zero-sum-blocks",
      "remove-nonzero-whole-chain",
      "int32-prefix-wrap"
    ],
    "checkpointIds": [
      "linked-list-11",
      "linked-list-09"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-03"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "linked-list-21",
    "title": "Split original nodes into balanced consecutive parts",
    "primaryTopic": "linked-list",
    "objective": "Return k native heads whose disjoint consecutive chains preserve original node order, with earlier parts receiving any remainder.",
    "step": 4,
    "skillIds": [
      "list.balanced-part-boundaries",
      "list.native-head-array"
    ],
    "prerequisites": [
      "list.walk",
      "list.link-splice",
      "list.original-identity"
    ],
    "approach": "Each part boundary must be cut physically; merely recording k starting nodes leaves overlapping chains and violates ownership.",
    "commonErrors": [
      "put-extra-nodes-in-last-parts",
      "overlapping-unsevered-parts"
    ],
    "checkpointIds": [
      "linked-list-17",
      "linked-list-18",
      "linked-list-19"
    ],
    "remedialIds": [
      "linked-list-01",
      "linked-list-03"
    ],
    "nextIds": [
      "linked-list-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-01",
    "title": "Reverse signed decimal digits",
    "primaryTopic": "math-geometry",
    "objective": "Reverse a signed integer’s decimal digits while enforcing a signed 32 bit result.",
    "step": 1,
    "skillIds": [
      "numbers.decimal-extraction",
      "numbers.checked-boundaries",
      "numbers.wide-intermediates",
      "numbers.remainder-operation"
    ],
    "prerequisites": [],
    "approach": "Extract digits in order and check the result boundary before returning it.",
    "commonErrors": [
      "ignore-overflow",
      "discard-sign"
    ],
    "checkpointIds": [
      "math-geometry-02",
      "math-geometry-09"
    ],
    "remedialIds": [
      "math-geometry-02",
      "math-geometry-09"
    ],
    "nextIds": [
      "math-geometry-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-02",
    "title": "Greatest common divisor",
    "primaryTopic": "math-geometry",
    "objective": "Find the largest positive common divisor of two signed integers, with explicit zero conventions.",
    "step": 1,
    "skillIds": [
      "numbers.remainder-reduction",
      "numbers.divisibility",
      "numbers.remainder-operation"
    ],
    "prerequisites": [],
    "approach": "A remainder preserves the common divisors while reducing one operand.",
    "commonErrors": [
      "minimum-operand",
      "signed-answer"
    ],
    "checkpointIds": [
      "math-geometry-01",
      "math-geometry-09"
    ],
    "remedialIds": [
      "math-geometry-01"
    ],
    "nextIds": [
      "math-geometry-03"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-03",
    "title": "A large modular power",
    "primaryTopic": "math-geometry",
    "objective": "Compute a large nonnegative power modulo a positive modulus without constructing the full power.",
    "step": 2,
    "skillIds": [
      "numbers.modular-normalization",
      "numbers.exponent-decomposition",
      "numbers.wide-intermediates"
    ],
    "prerequisites": [
      "numbers.remainder-operation"
    ],
    "approach": "Reduce after multiplication and decompose the exponent to keep work logarithmic.",
    "commonErrors": [
      "zero-exponent-is-zero",
      "remove-negative-sign"
    ],
    "checkpointIds": [
      "math-geometry-04"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-02",
      "math-geometry-04",
      "math-geometry-09"
    ],
    "nextIds": [
      "math-geometry-15",
      "math-geometry-05"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-04",
    "title": "Count primes in a closed band",
    "primaryTopic": "math-geometry",
    "objective": "Count primes in an inclusive integer band using composite marking.",
    "step": 2,
    "skillIds": [
      "numbers.composite-marking",
      "numbers.prime-range",
      "numbers.divisibility"
    ],
    "prerequisites": [
      "numbers.remainder-operation"
    ],
    "approach": "Every composite has a small prime factor; mark its multiples once rather than retesting all divisors.",
    "commonErrors": [
      "exclude-high-end",
      "one-is-prime"
    ],
    "checkpointIds": [
      "math-geometry-03"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-02"
    ],
    "nextIds": [
      "math-geometry-06"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-05",
    "title": "A digit-square orbit",
    "primaryTopic": "math-geometry",
    "objective": "Decide whether repeated decimal digit-square transformation reaches one or enters another cycle.",
    "step": 3,
    "skillIds": [
      "numbers.digit-square-transform",
      "cycles.repeated-state"
    ],
    "prerequisites": [
      "numbers.decimal-extraction"
    ],
    "approach": "The transformed values rapidly enter a small finite range; repeated states identify a cycle.",
    "commonErrors": [
      "digit-sum-not-squares",
      "only-starting-one"
    ],
    "checkpointIds": [
      "math-geometry-06"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-02",
      "math-geometry-04",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "math-geometry-07"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-06",
    "title": "Trailing zeros of a factorial",
    "primaryTopic": "math-geometry",
    "objective": "Count decimal trailing zeros in a huge factorial through the multiplicity of factor five.",
    "step": 3,
    "skillIds": [
      "numbers.prime-factor-valuation"
    ],
    "prerequisites": [
      "numbers.divisibility"
    ],
    "approach": "Each trailing zero requires a factor ten; powers of five contribute additional factors without computing the factorial.",
    "commonErrors": [
      "only-multiples-five",
      "off-by-one-factorial"
    ],
    "checkpointIds": [
      "math-geometry-05"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-02",
      "math-geometry-04",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "math-geometry-08"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-07",
    "title": "A clockwise quarter turn",
    "primaryTopic": "math-geometry",
    "objective": "Rotate a square integer grid by a clockwise quarter turn.",
    "step": 4,
    "skillIds": [
      "geometry.grid-coordinate-rotation"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "A coordinate transform moves each original row-column position into its rotated position.",
    "commonErrors": [
      "counterclockwise",
      "transpose-only"
    ],
    "checkpointIds": [
      "math-geometry-08"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-02",
      "math-geometry-01",
      "math-geometry-09",
      "math-geometry-16",
      "two-pointers-04"
    ],
    "nextIds": [
      "math-geometry-14"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-08",
    "title": "Read a rectangular grid in spiral order",
    "primaryTopic": "math-geometry",
    "objective": "Read every cell exactly once while winding clockwise from the top-left corner inward.",
    "step": 4,
    "skillIds": [
      "geometry.shrinking-boundaries",
      "geometry.grid-walk"
    ],
    "prerequisites": [
      "arrays.traversal"
    ],
    "approach": "Shrink four boundaries after consuming their sides, taking care not to duplicate a final row or column.",
    "commonErrors": [
      "row-major",
      "drop-final-cell"
    ],
    "checkpointIds": [
      "math-geometry-07"
    ],
    "remedialIds": [
      "arrays-hashing-01",
      "arrays-hashing-02",
      "math-geometry-01",
      "math-geometry-09",
      "math-geometry-16",
      "math-geometry-10",
      "two-pointers-04"
    ],
    "nextIds": [
      "math-geometry-13"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-15",
    "title": "Normalize an exact rational operation",
    "primaryTopic": "math-geometry",
    "objective": "Perform one exact arithmetic operation on two rational numbers and return their canonical reduced representation.",
    "step": 3,
    "skillIds": [
      "numbers.rational-normalization",
      "numbers.sign-canonicalization"
    ],
    "prerequisites": [
      "numbers.divisibility",
      "numbers.wide-intermediates"
    ],
    "approach": "Keep integer numerators and denominators, combine them exactly, then reduce by the greatest common divisor and normalize the sign.",
    "commonErrors": [
      "do-not-reduce",
      "discard-sign"
    ],
    "checkpointIds": [
      "math-geometry-11"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-02",
      "math-geometry-04",
      "math-geometry-09",
      "math-geometry-16",
      "math-geometry-10",
      "math-geometry-11",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "math-geometry-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-09",
    "title": "Area from opposite lattice corners",
    "primaryTopic": "math-geometry",
    "objective": "Compute an axis-aligned rectangle area from unordered opposite integer corners.",
    "step": 1,
    "skillIds": [
      "geometry.coordinate-difference",
      "numbers.wide-products",
      "numbers.wide-intermediates"
    ],
    "prerequisites": [],
    "approach": "Coordinate differences give side lengths; use a wide integer product for the area.",
    "commonErrors": [
      "signed-area",
      "narrow-product"
    ],
    "checkpointIds": [
      "math-geometry-01",
      "math-geometry-02"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-16"
    ],
    "nextIds": [
      "math-geometry-10"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-10",
    "title": "Do all points share a line?",
    "primaryTopic": "math-geometry",
    "objective": "Test a complete integer point set for collinearity while tolerating repeated points.",
    "step": 2,
    "skillIds": [
      "geometry.cross-product-collinearity",
      "geometry.coordinate-difference"
    ],
    "prerequisites": [
      "numbers.wide-intermediates",
      "geometry.coordinate-difference"
    ],
    "approach": "Find a real direction before testing cross products; repeated copies of the anchor do not define a direction.",
    "commonErrors": [
      "first-two-only",
      "vertical-only"
    ],
    "checkpointIds": [
      "math-geometry-16"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-09",
      "math-geometry-16"
    ],
    "nextIds": [
      "math-geometry-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-11",
    "title": "Do two closed segments intersect?",
    "primaryTopic": "math-geometry",
    "objective": "Detect proper crossings, shared endpoints, collinear overlap and degenerate intersections between closed integer segments.",
    "step": 3,
    "skillIds": [
      "geometry.orientation",
      "geometry.closed-segment-bounds"
    ],
    "prerequisites": [
      "geometry.cross-product-collinearity",
      "numbers.wide-intermediates",
      "geometry.coordinate-difference"
    ],
    "approach": "Orientation tests locate proper crossings, while bounding checks handle collinear and endpoint cases.",
    "commonErrors": [
      "reject-zero-length-segments",
      "proper-crossings-only",
      "bounding-boxes-only"
    ],
    "checkpointIds": [
      "math-geometry-15"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-02",
      "math-geometry-04",
      "math-geometry-09",
      "math-geometry-16",
      "math-geometry-10",
      "arrays-hashing-01",
      "arrays-hashing-02"
    ],
    "nextIds": [
      "math-geometry-12"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-16",
    "title": "Reflect a point across an integer line",
    "primaryTopic": "math-geometry",
    "objective": "Reflect an integer point across a translated vertical, horizontal or diagonal line exactly.",
    "step": 2,
    "skillIds": [
      "geometry.normal-projection",
      "geometry.reflection-midpoint",
      "geometry.coordinate-difference"
    ],
    "prerequisites": [],
    "approach": "The midpoint of a point and its reflection lies on the mirror line, and their difference points along the line normal.",
    "commonErrors": [
      "ignore-translation",
      "reflect-across-wrong-family"
    ],
    "checkpointIds": [
      "math-geometry-10"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-09",
      "math-geometry-10"
    ],
    "nextIds": [
      "math-geometry-11"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-12",
    "title": "Inside a simple polygon, including its boundary",
    "primaryTopic": "math-geometry",
    "objective": "Classify an integer query point against a simple polygon while including boundary points.",
    "step": 4,
    "skillIds": [
      "geometry.ray-crossings",
      "geometry.boundary-membership",
      "geometry.orientation",
      "geometry.closed-segment-bounds",
      "arrays.traversal"
    ],
    "prerequisites": [
      "geometry.cross-product-collinearity",
      "geometry.orientation",
      "geometry.closed-segment-bounds",
      "numbers.wide-intermediates",
      "geometry.coordinate-difference",
      "arrays.traversal"
    ],
    "approach": "Boundary checks handle exact contacts; crossing parity handles concave interiors without assuming a convex shape.",
    "commonErrors": [
      "axis-only-polygons",
      "exclude-boundary",
      "bounding-box-only"
    ],
    "checkpointIds": [
      "math-geometry-08"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-09",
      "math-geometry-16",
      "math-geometry-10",
      "math-geometry-11",
      "arrays-hashing-01",
      "arrays-hashing-02",
      "two-pointers-04"
    ],
    "nextIds": [
      "math-geometry-13"
    ],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-13",
    "title": "The convex boundary of a point set",
    "primaryTopic": "math-geometry",
    "objective": "Construct the extreme vertices of a point set’s convex hull in a canonical order.",
    "step": 5,
    "skillIds": [
      "geometry.convex-turn-invariant",
      "geometry.canonical-boundary"
    ],
    "prerequisites": [
      "geometry.cross-product-collinearity",
      "numbers.wide-intermediates",
      "geometry.coordinate-difference",
      "arrays.traversal",
      "sorted.order"
    ],
    "approach": "Maintain outward turns while building lower and upper boundary chains, removing duplicate and collinear interior points.",
    "commonErrors": [
      "keep-interior-points",
      "reverse-boundary"
    ],
    "checkpointIds": [
      "math-geometry-14"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-09",
      "math-geometry-16",
      "math-geometry-10",
      "arrays-hashing-01",
      "arrays-hashing-02",
      "two-pointers-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  },
  {
    "id": "math-geometry-14",
    "title": "Area covered by a rectangle union",
    "primaryTopic": "math-geometry",
    "objective": "Compute the total area covered by possibly overlapping axis-aligned integer rectangles without double counting.",
    "step": 5,
    "skillIds": [
      "geometry.coordinate-sweep",
      "intervals.union-length"
    ],
    "prerequisites": [
      "numbers.wide-intermediates",
      "geometry.coordinate-difference",
      "arrays.traversal",
      "sorted.order"
    ],
    "approach": "Partition the x axis at rectangle boundaries, then merge the active y intervals in each strip.",
    "commonErrors": [
      "sum-overlapping-areas",
      "last-rectangle-only"
    ],
    "checkpointIds": [
      "math-geometry-13"
    ],
    "remedialIds": [
      "math-geometry-01",
      "math-geometry-09",
      "math-geometry-16",
      "math-geometry-10",
      "arrays-hashing-01",
      "arrays-hashing-02",
      "two-pointers-04"
    ],
    "nextIds": [],
    "status": "authored-draft"
  }
];
