import {readFile,writeFile} from 'node:fs/promises';
import {sha256} from '../packages/judge-adapter/src/content.mjs';
const coverage=JSON.parse(await readFile('docs/release-evidence/native-whole-current-coverage.json','utf8')),identities=new Map(coverage.rows.map(r=>[r.id,r.contentIdentity]));
// Explicit author assessment by actual objective/invariant. This is a review draft,
// not automatic approval or an inference that a topic implies one algorithm.
const groups={
 'arrays-hashing':[
 ['linear-scan','arithmetic'],['linear-scan','running-extremum'],['linear-scan','hash-map'],['hash-map','sorting'],['hash-map','linear-scan'],['hash-map','arithmetic'],['hash-map','two-pointers'],['hash-map','canonical-key'],['prefix-sum'],['prefix-product'],['hash-map','run-boundary'],['prefix-sum'],['candidate-cancellation'],['prefix-sum','hash-map'],['prefix-extremum','linear-scan'],['prefix-sum','hash-map'],['matrix-transform','original-state-flags'],['hash-map','sorting']],
 'two-pointers':[
 ['two-pointers'],['two-pointers'],['read-write-compaction'],['two-pointers','sorted-merge'],['two-pointers'],['two-pointers','equal-run-counting'],['sorting','two-pointers'],['two-pointers','greedy'],['sliding-window'],['two-pointers','run-boundary']],
 'sliding-window':[
 ['sliding-window','rolling-aggregate'],['sliding-window','hash-map'],['sliding-window'],['sliding-window','hash-map'],['sliding-window'],['sliding-window','hash-map'],['sliding-window','hash-map'],['sliding-window','monotonic-deque'],['sliding-window','count-valid-endings'],['sliding-window','hash-map'],['sliding-window','hash-map'],['sliding-window','monotonic-deque']],
 stack:[['stack'],['stack','stateful-history'],['stack'],['monotonic-stack'],['monotonic-stack','circular-scan'],['monotonic-stack'],['stack','arithmetic'],['stack','schedule-simulation'],['stack','collision-simulation'],['stack','nested-aggregation'],['monotonic-stack','contribution-counting'],['stack','nested-aggregation']],
 'binary-search':[
 ['binary-search'],['binary-search'],['binary-search'],['binary-search','rank-counting'],['answer-space-search','arithmetic'],['binary-search','rotated-order'],['binary-search','rotated-order'],['binary-search','slope-invariant'],['two-pointers','matrix-frontier'],['answer-space-search','arithmetic'],['answer-space-search','greedy'],['answer-space-search','greedy'],['binary-search','partition-balance'],['answer-space-search','rank-counting']],
 'linked-list':[
 ['linked-rewiring','linear-scan'],['linked-rewiring','linear-scan'],['two-pointers','original-identity'],['two-pointers','cycle-detection','original-identity'],['two-pointers','original-identity'],['arithmetic','linked-rewiring'],['identity-map','breadth-first-search'],['linked-rewiring'],['combinatorial-recurrence','original-identity'],['linked-rewiring','two-pointers'],['divide-and-conquer','sorted-merge','original-identity'],['hash-map','linked-rewiring','stateful-history'],['linked-rewiring','stable-partition'],['stateful-history','cursor-navigation'],['sorted-merge','original-identity','alias-awareness'],['linked-rewiring','run-boundary'],['linked-rewiring','stateful-history','original-identity'],['linked-rewiring','arithmetic'],['linked-rewiring'],['prefix-sum','hash-map','linked-rewiring'],['linked-rewiring','balanced-partition'],['depth-first-search','linked-rewiring','original-identity']],
 trees:[
 ['depth-first-search'],['depth-first-search','arithmetic'],['depth-first-search','depth-tracking'],['depth-first-search','stack'],['postorder','subtree-summary'],['depth-first-search','boundary-contour'],['breadth-first-search'],['depth-first-search','matrix-transform'],['paired-structure-comparison'],['breadth-first-search','gap-invariant'],['depth-first-search','branch-aggregate'],['tree-state-dp'],['postorder','subtree-summary'],['postorder','two-arm-join'],['postorder','hash-map','canonical-key'],['depth-first-search','branch-aggregate'],['identity-map','ancestor-chain','original-identity'],['tree-rotation'],['binary-search-tree-route','linked-rewiring'],['binary-search-tree-route','successor-splice'],['depth-first-search','ancestor-bounds'],['inorder-traversal','original-identity'],['binary-search-tree-route','range-pruning'],['divide-and-conquer','traversal-partition'],['graph-validation'],['prefix-sum','hash-map','depth-first-search'],['depth-first-search','parity-propagation'],['postorder','two-arm-join','branch-aggregate'],['tree-state-dp'],['postorder','rerooting']],
 heap:[
 ['heap','bounded-frontier'],['heap','bounded-frontier'],['heap','multistream-frontier','cover-optimization'],['heap','dynamic-eligibility'],['heap','hash-map'],['heap','multiset-simulation'],['heap','partition-balance'],['heap','event-sweep','cooldown-simulation'],['heap','lazy-invalidation','stateful-history'],['heap','event-sweep','max-envelope'],['heap','greedy','dynamic-eligibility'],['heap','multistream-frontier'],['heap','parity-reachability'],['heap','event-sweep','fifo-dispatch']],
 backtracking:[
 ['backtracking','prefix-pruning'],['backtracking','cardinality-pruning'],['backtracking','segment-grammar'],['backtracking','constraint-state'],['backtracking','bounded-multiplicity'],['backtracking','prefix-pruning'],['backtracking','constraint-state'],['backtracking','precedence-state'],['backtracking','constraint-state'],['backtracking','schedule-simulation']],
 tries:[['trie','prefix-navigation'],['trie','backtracking'],['trie','contribution-counting']],
 graphs:[
 ['breadth-first-search','identity-map'],['breadth-first-search','contribution-counting'],['depth-first-search','component-labeling'],['depth-first-search','component-labeling','canonical-key'],['component-labeling','deduplicated-neighbor-union'],['breadth-first-search','multi-source-frontier'],['breadth-first-search','two-coloring'],['topological-order'],['topological-order','reverse-frontier'],['euler-trail','stack'],['depth-first-search','lowlink'],['depth-first-search','strong-components'],['topological-order','cycle-basin-propagation']],
 'advanced-graphs':[
 ['sorting','disjoint-set','greedy'],['disjoint-set','weighted-potential'],['shortest-path','minimax-path'],['bellman-ford','negative-cycle-propagation'],['residual-network','shortest-path'],['retrograde-analysis','reverse-frontier']],
 'dp-1d':[
 ['dynamic-programming','counting-recurrence'],['dynamic-programming','last-choice-state'],['dynamic-programming','take-or-skip'],['dynamic-programming','boundary-split'],['dynamic-programming','segment-grammar'],['dynamic-programming','unbounded-choice'],['dynamic-programming','unbounded-choice','counting-recurrence'],['dynamic-programming','bounded-selection'],['dynamic-programming','ordered-segmentation'],['dynamic-programming','counting-recurrence'],['binary-search','tail-frontier'],['dynamic-programming','optimal-count-ties'],['dynamic-programming','restart-or-extend'],['dynamic-programming','signed-extrema'],['dynamic-programming','ordered-segmentation'],['dynamic-programming','skip-or-cover'],['dynamic-programming','interval-state'],['dynamic-programming','ordered-segmentation','interval-state'],['dynamic-programming','partial-frontier-state'],['dynamic-programming','variable-reach-transition'],['dynamic-programming','temporal-action-state'],['combinatorial-recurrence'],['dynamic-programming','binary-search','compatible-predecessor'],['dynamic-programming','sign-state']],
 'dp-2d':[
 ['dynamic-programming','grid-state'],['dynamic-programming','grid-state'],['dynamic-programming','two-prefix-state'],['dynamic-programming','two-prefix-state'],['dynamic-programming','two-prefix-state','counting-recurrence'],['dynamic-programming','two-prefix-state'],['dynamic-programming','bounded-selection'],['dynamic-programming','two-prefix-state','pattern-consumption'],['dynamic-programming','interval-state'],['dynamic-programming','paired-position-state'],['bitmask-dp','last-vertex-state']],
 greedy:[
 ['greedy','reachable-frontier'],['greedy','prefix-reset'],['greedy','bidirectional-constraints'],['greedy','sorting','slot-allocation'],['greedy','monotonic-stack'],['greedy','heap'],['greedy','monotonic-stack','future-feasibility'],['greedy','sorted-merge']],
 intervals:[
 ['sorting','event-sweep'],['two-pointers','event-sweep'],['sorting','gap-invariant'],['sorting','coordinate-compression','fenwick-tree'],['event-sweep','prefix-sum'],['coverage-counter','stateful-history']],
 'math-geometry':[
 ['arithmetic','digit-extraction'],['number-theory','euclidean-reduction'],['number-theory','exponent-decomposition'],['number-theory','sieve'],['arithmetic','cycle-detection'],['number-theory','prime-valuation'],['matrix-transform'],['boundary-contour'],['geometry','arithmetic'],['geometry','cross-product'],['geometry','cross-product','closed-boundaries'],['geometry','ray-crossing','closed-boundaries'],['geometry','sorting','monotonic-stack'],['geometry','event-sweep'],['arithmetic','euclidean-reduction'],['geometry','arithmetic']],
 'bit-manipulation':[
 ['bitwise','lowest-bit-removal'],['bitwise','inclusive-mask'],['bitwise','fixed-width-transform'],['bitwise','prefix-cycle'],['bitwise','cancellation-invariant'],['bitwise','partition-mask'],['bitwise','contribution-counting'],['bitwise','common-prefix'],['bitwise','carry-boundary'],['bitwise','stateful-history'],['bitwise','fixed-width-transform'],['bitwise','greedy-prefix-feasibility'],['bitmask-dp','assignment-state'],['bitmask-dp','cover-state']]
};
const secondary={
 'arrays-hashing-07':['two-pointers'],'arrays-hashing-17':['math-geometry'],'arrays-hashing-18':['two-pointers'],
 'two-pointers-07':['arrays-hashing'],'two-pointers-09':['sliding-window'],
 'sliding-window-02':['arrays-hashing'],'sliding-window-04':['arrays-hashing'],'sliding-window-06':['arrays-hashing'],'sliding-window-07':['arrays-hashing'],'sliding-window-08':['stack'],'sliding-window-10':['arrays-hashing'],'sliding-window-11':['arrays-hashing'],'sliding-window-12':['stack'],
 'stack-07':['math-geometry'],'stack-11':['arrays-hashing'],
 'binary-search-05':['math-geometry'],'binary-search-09':['two-pointers'],'binary-search-10':['math-geometry'],'binary-search-11':['greedy'],'binary-search-12':['greedy'],'binary-search-14':['math-geometry'],
 'linked-list-03':['two-pointers'],'linked-list-04':['two-pointers'],'linked-list-05':['two-pointers'],'linked-list-06':['math-geometry'],'linked-list-07':['arrays-hashing','graphs'],'linked-list-09':['math-geometry'],'linked-list-10':['two-pointers'],'linked-list-12':['arrays-hashing'],'linked-list-20':['arrays-hashing'],'linked-list-22':['stack'],
 'trees-04':['stack'],'trees-12':['dp-2d'],'trees-15':['arrays-hashing'],'trees-17':['arrays-hashing'],'trees-24':['arrays-hashing'],'trees-25':['graphs'],'trees-26':['arrays-hashing'],'trees-29':['dp-2d'],'trees-30':['dp-1d'],
 'heap-05':['arrays-hashing'],'heap-08':['greedy'],'heap-10':['math-geometry','intervals'],'heap-11':['greedy'],'heap-13':['math-geometry'],
 'backtracking-06':['stack'],'backtracking-08':['math-geometry'],'backtracking-09':['math-geometry'],'backtracking-10':['intervals'],
 'tries-02':['backtracking'],'graphs-04':['arrays-hashing'],'graphs-05':['arrays-hashing'],
 'advanced-graphs-01':['greedy'],'advanced-graphs-02':['math-geometry'],'advanced-graphs-03':['heap'],'advanced-graphs-04':['graphs'],'advanced-graphs-05':['graphs'],'advanced-graphs-06':['graphs'],
 'dp-1d-11':['binary-search'],'dp-1d-19':['math-geometry'],'dp-1d-22':['math-geometry'],'dp-1d-23':['intervals','binary-search'],'dp-2d-11':['graphs','bit-manipulation'],
 'greedy-04':['intervals'],'greedy-05':['stack'],'greedy-06':['heap'],'greedy-07':['stack'],
 'intervals-02':['two-pointers'],'intervals-04':['arrays-hashing'],'intervals-05':['arrays-hashing'],
 'math-geometry-05':['arrays-hashing'],'math-geometry-13':['stack'],'math-geometry-14':['intervals'],
 'bit-manipulation-07':['math-geometry'],'bit-manipulation-13':['dp-2d'],'bit-manipulation-14':['dp-1d']
};
// Actual-reference reconciliation: these differ from a generic topic stereotype.
groups['arrays-hashing'][2]=['linear-scan','hash-set'];
groups['arrays-hashing'][5]=['arithmetic','linear-scan'];
groups['arrays-hashing'][6]=['hash-map','linear-scan'];
groups['arrays-hashing'][7]=['hash-map','sorting','canonical-key'];
groups['arrays-hashing'][10]=['hash-set','run-boundary'];
groups['arrays-hashing'][14]=['sorting','linear-scan'];
groups['sliding-window'][6]=['sliding-window','frequency-counting'];
groups['linked-list'][5]=['arithmetic','linked-construction','carry-boundary'];
groups.stack[7]=['stack','operation-simulation'];
groups.trees[7]=['depth-first-search','tree-mirror'];
groups.trees[2]=['breadth-first-search','depth-tracking'];
groups.trees[11]=['postorder','greedy','coverage-state'];
groups.trees[12]=['bottom-up','subtree-summary'];
groups.trees[13]=['bottom-up','two-arm-join'];
groups.trees[14]=['bottom-up','hash-map','canonical-key'];
groups.trees[27]=['bottom-up','two-arm-join','branch-aggregate'];
groups.trees[23]=['stack','traversal-partition'];
groups.trees[24]=['breadth-first-search','graph-validation'];
groups.trees[29]=['breadth-first-search','subtree-summary','rerooting'];
groups.heap[7]=['hash-map','cooldown-lower-bound','greedy'];
groups['advanced-graphs'][2]=['sorting','disjoint-set','minimax-path'];
groups.graphs[2]=['breadth-first-search','component-labeling'];
groups.graphs[3]=['breadth-first-search','component-labeling','canonical-key'];
groups.graphs[4]=['breadth-first-search','component-labeling','deduplicated-neighbor-union'];
groups.graphs[8]=['reverse-topological-elimination','terminal-elimination'];
groups.graphs[12]=['indegree-peeling','cycle-basin-propagation'];
groups['dp-1d'][18]=['dynamic-programming','counting-recurrence'];
groups.intervals[0]=['sorting','sorted-merge'];
groups.intervals[1]=['two-pointers'];
delete secondary['arrays-hashing-07'];delete secondary['arrays-hashing-17'];delete secondary['arrays-hashing-18'];delete secondary['stack-11'];
secondary['trees-12']=['greedy'];secondary['trees-29']=['dp-1d'];secondary['advanced-graphs-03']=['graphs'];secondary['bit-manipulation-13']=['dp-1d'];
secondary['trees-24']=['stack'];
const catalogue=JSON.parse(await readFile('content/catalogue.json','utf8')),records=[],evidence=[];
const preciseRationales={
 'linked-list-06':'All three references append a fresh reversed-decimal result chain through a dummy head, propagate the base-ten carry, then trim redundant high-order zero nodes to a canonical single zero when necessary. The label describes result construction and carry handling, not mutation of either input chain.',
 'graphs-09':'All three references start at zero-outdegree terminals and decrement predecessor outdegrees in the reverse graph. Only vertices eliminated into the terminal-safe region are returned; cycles and their unsafe predecessors remain. This is reverse-topological terminal elimination, not a topological ordering of the entire possibly cyclic input.',
 'graphs-13':'All three references peel zero-indegree vertices, identify the remaining directed cycles, then traverse the removed order backward to propagate each cycle length and approach depth. The cyclic graph is not assigned a full topological order.'
};
for(const {id}of catalogue.problems){const manifest=JSON.parse(await readFile(`content/problems/${id}/problem.json`,'utf8')),slot=Number(id.slice(id.lastIndexOf('-')+1))-1,approachTags=groups[manifest.primaryTopic]?.[slot],secondaryTopics=secondary[id]??[];if(!approachTags?.length||!identities.has(id))throw Error(id+': missing explicit classification');if(secondaryTopics.includes(manifest.primaryTopic))throw Error('Redundant primary as secondary');const rationale=`${manifest.objective} The classified approach is ${approachTags.join(', ')}; ${secondaryTopics.length?'secondary topics identify the additional algorithmic concepts '+secondaryTopics.join(', '):'the objective is classified within its primary topic; generic array storage or arithmetic alone is not treated as an additional curriculum topic'}.`;
 records.push({problemId:id,contentIdentity:identities.get(id),secondaryTopics,approachTags,rationale:preciseRationales[id]??rationale});const referenceHashes={};for(const language of ['java','cpp','python'])referenceHashes[language]=sha256(await readFile(`content/problems/${id}/${manifest.languageFiles[language].reference}`));evidence.push({problemId:id,title:manifest.title,objective:manifest.objective,primaryTopic:manifest.primaryTopic,testedSkills:manifest.skillIds,authorRationale:manifest.rationale,referenceHashes});}
const draft={schemaVersion:1,status:'draft-independent-review-required',approachVocabulary:[...new Set(Object.values(groups).flat(2))].sort(),records};if(records.length!==243||new Set(records.map(r=>r.problemId)).size!==243)throw Error('Exact243 mapping required');await writeFile('docs/release-evidence/learning-tags-proposed-243.json',JSON.stringify(draft,null,2)+'\n');await writeFile('docs/release-evidence/learning-tags-source-evidence-243.json',JSON.stringify({kind:'actual-objective-reference-bound-classification-draft',generatedAt:new Date().toISOString(),author:'judge/content mapping author; not independent approval',rows:evidence},null,2)+'\n');console.log(JSON.stringify({records:records.length,vocabulary:draft.approachVocabulary.length,secondaryClassifications:records.filter(r=>r.secondaryTopics.length).length,status:draft.status}));
