// Authored metadata repairs. Prerequisite remediation is explicit; no skill is invented.
export const learningOverrides={
 'arrays-hashing-01':{checkpointIds:['arrays-hashing-02'],nextIds:['arrays-hashing-03']},
 'arrays-hashing-02':{checkpointIds:['arrays-hashing-01'],nextIds:['arrays-hashing-03']},
 'arrays-hashing-03':{checkpointIds:['arrays-hashing-04'],nextIds:['arrays-hashing-05'],remedialIds:['arrays-hashing-01']},
 'arrays-hashing-04':{checkpointIds:['arrays-hashing-03'],nextIds:['arrays-hashing-05'],remedialIds:['arrays-hashing-03']},
 'arrays-hashing-05':{checkpointIds:['arrays-hashing-06'],nextIds:['arrays-hashing-07'],remedialIds:['arrays-hashing-03']},
 'arrays-hashing-06':{checkpointIds:['arrays-hashing-05'],nextIds:['arrays-hashing-07'],remedialIds:['arrays-hashing-03']},
 'arrays-hashing-07':{checkpointIds:['arrays-hashing-08'],nextIds:['arrays-hashing-09'],remedialIds:['arrays-hashing-01','arrays-hashing-04']},
 'arrays-hashing-08':{checkpointIds:['arrays-hashing-07'],nextIds:['arrays-hashing-09'],remedialIds:['arrays-hashing-01','arrays-hashing-04']},
 'arrays-hashing-09':{checkpointIds:['arrays-hashing-10'],nextIds:['arrays-hashing-11'],remedialIds:['arrays-hashing-01']},
 'arrays-hashing-10':{checkpointIds:['arrays-hashing-09'],nextIds:['arrays-hashing-11'],remedialIds:['arrays-hashing-09']},
 'arrays-hashing-11':{checkpointIds:['arrays-hashing-13'],nextIds:['arrays-hashing-16'],remedialIds:['arrays-hashing-03']},
 'arrays-hashing-12':{checkpointIds:['arrays-hashing-11'],nextIds:['arrays-hashing-16'],remedialIds:['arrays-hashing-09','arrays-hashing-03']},
 'arrays-hashing-13':{prerequisites:['arrays.traversal'],checkpointIds:['arrays-hashing-11'],nextIds:['arrays-hashing-16'],remedialIds:['arrays-hashing-03']},
 'arrays-hashing-14':{checkpointIds:['arrays-hashing-16'],nextIds:['arrays-hashing-17'],remedialIds:['arrays-hashing-04','arrays-hashing-09']},
 'arrays-hashing-15':{checkpointIds:['arrays-hashing-16'],nextIds:['arrays-hashing-17'],remedialIds:['arrays-hashing-09']},
 'arrays-hashing-16':{checkpointIds:['arrays-hashing-14'],nextIds:['arrays-hashing-17'],remedialIds:['arrays-hashing-04']},
 'arrays-hashing-17':{checkpointIds:['arrays-hashing-18'],nextIds:[],remedialIds:['arrays-hashing-04']},
 'arrays-hashing-18':{checkpointIds:['arrays-hashing-17'],nextIds:[],remedialIds:['arrays-hashing-17']}
};
// R21: explicit prerequisite bridges and comparable task families. These are
// author proposals until the independent curriculum audit/review completes.
Object.assign(learningOverrides,{
 'arrays-hashing-11':{prerequisites:['arrays.traversal','hashing.membership'],checkpointIds:['arrays-hashing-13'],nextIds:['arrays-hashing-16'],remedialIds:['arrays-hashing-01','arrays-hashing-03','arrays-hashing-09']},
 'arrays-hashing-12':{prerequisites:['arrays.traversal','prefix.accumulation','numbers.signed-accumulation'],checkpointIds:['arrays-hashing-13'],nextIds:['arrays-hashing-16'],remedialIds:['arrays-hashing-01','arrays-hashing-03','arrays-hashing-09']},
 'arrays-hashing-13':{prerequisites:['arrays.traversal'],checkpointIds:['arrays-hashing-15'],nextIds:['arrays-hashing-16'],remedialIds:['arrays-hashing-01','arrays-hashing-03','arrays-hashing-09']},
 'arrays-hashing-14':{prerequisites:['arrays.traversal','prefix.accumulation','hashing.counts','numbers.signed-accumulation'],checkpointIds:['arrays-hashing-16'],nextIds:['arrays-hashing-17'],remedialIds:['arrays-hashing-01','arrays-hashing-03','arrays-hashing-04','arrays-hashing-09']},
 'arrays-hashing-15':{step:6,prerequisites:['arrays.traversal'],checkpointIds:['arrays-hashing-13'],nextIds:['arrays-hashing-16'],remedialIds:['arrays-hashing-01','arrays-hashing-03','arrays-hashing-09']},
 'arrays-hashing-16':{prerequisites:['arrays.traversal','prefix.accumulation','hashing.membership','numbers.signed-accumulation'],checkpointIds:['arrays-hashing-14'],nextIds:['arrays-hashing-17'],remedialIds:['arrays-hashing-01','arrays-hashing-03','arrays-hashing-04','arrays-hashing-09']},
 'bit-manipulation-01':{nextIds:['bit-manipulation-03']},
 'bit-manipulation-02':{nextIds:['bit-manipulation-04']},
 'bit-manipulation-03':{checkpointIds:['bit-manipulation-10','bit-manipulation-11'],nextIds:['bit-manipulation-05'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-04':{checkpointIds:['bit-manipulation-08'],nextIds:['bit-manipulation-05'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-05':{prerequisites:['bits.unsigned32','arrays.traversal'],nextIds:['bit-manipulation-07'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-06':{prerequisites:['bits.unsigned32','arrays.traversal'],nextIds:['bit-manipulation-12'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-07':{checkpointIds:['bit-manipulation-09','bit-manipulation-12'],nextIds:['bit-manipulation-13'],prerequisites:['bits.unsigned32','arrays.traversal'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02','arrays-hashing-03']},
 'bit-manipulation-08':{checkpointIds:['bit-manipulation-04'],nextIds:['bit-manipulation-06'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-09':{checkpointIds:['bit-manipulation-07','bit-manipulation-12'],nextIds:['bit-manipulation-14'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02','arrays-hashing-03']},
 'bit-manipulation-10':{prerequisites:['bits.unsigned32','arrays.traversal'],checkpointIds:['bit-manipulation-03'],nextIds:['bit-manipulation-05'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-11':{step:2,checkpointIds:['bit-manipulation-03'],nextIds:['bit-manipulation-06'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-12':{step:4,prerequisites:['bits.unsigned32','arrays.traversal','hashing.membership'],checkpointIds:['bit-manipulation-07','bit-manipulation-09'],nextIds:['bit-manipulation-13'],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02','arrays-hashing-03']},
 'bit-manipulation-13':{step:5,prerequisites:['bits.unsigned32','arrays.traversal'],checkpointIds:['bit-manipulation-14'],nextIds:[],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'bit-manipulation-14':{step:5,prerequisites:['bits.unsigned32','arrays.traversal'],checkpointIds:['bit-manipulation-13'],nextIds:[],remedialIds:['bit-manipulation-01','arrays-hashing-01','arrays-hashing-02']},
 'math-geometry-01':{skillIds:['numbers.decimal-extraction','numbers.checked-boundaries','numbers.wide-intermediates','numbers.remainder-operation'],checkpointIds:['math-geometry-02','math-geometry-09'],nextIds:['math-geometry-03'],remedialIds:['math-geometry-02','math-geometry-09']},
 'math-geometry-02':{skillIds:['numbers.remainder-reduction','numbers.divisibility','numbers.remainder-operation'],checkpointIds:['math-geometry-01','math-geometry-09'],nextIds:['math-geometry-03'],remedialIds:['math-geometry-01']},
 'math-geometry-03':{prerequisites:['numbers.remainder-operation'],skillIds:['numbers.modular-normalization','numbers.exponent-decomposition','numbers.wide-intermediates'],checkpointIds:['math-geometry-04'],nextIds:['math-geometry-15','math-geometry-05'],remedialIds:['math-geometry-01','math-geometry-02','math-geometry-04','math-geometry-09']},
 'math-geometry-04':{prerequisites:['numbers.remainder-operation'],skillIds:['numbers.composite-marking','numbers.prime-range','numbers.divisibility'],checkpointIds:['math-geometry-03'],nextIds:['math-geometry-06'],remedialIds:['math-geometry-01','math-geometry-02']},
 'math-geometry-05':{checkpointIds:['math-geometry-06'],nextIds:['math-geometry-07'],remedialIds:['math-geometry-01','math-geometry-02','math-geometry-04','arrays-hashing-01','arrays-hashing-02']},
 'math-geometry-06':{checkpointIds:['math-geometry-05'],nextIds:['math-geometry-08'],remedialIds:['math-geometry-01','math-geometry-02','math-geometry-04','arrays-hashing-01','arrays-hashing-02']},
 'math-geometry-07':{checkpointIds:['math-geometry-08'],nextIds:['math-geometry-14'],remedialIds:['arrays-hashing-01','arrays-hashing-02','math-geometry-01','math-geometry-09','math-geometry-16','two-pointers-04']},
 'math-geometry-08':{checkpointIds:['math-geometry-07'],nextIds:['math-geometry-13'],remedialIds:['arrays-hashing-01','arrays-hashing-02','math-geometry-01','math-geometry-09','math-geometry-16','math-geometry-10','two-pointers-04']},
 'math-geometry-09':{skillIds:['geometry.coordinate-difference','numbers.wide-products','numbers.wide-intermediates'],checkpointIds:['math-geometry-01','math-geometry-02'],nextIds:['math-geometry-10'],remedialIds:['math-geometry-01','math-geometry-16']},
 'math-geometry-10':{prerequisites:['numbers.wide-intermediates','geometry.coordinate-difference'],skillIds:['geometry.cross-product-collinearity','geometry.coordinate-difference'],checkpointIds:['math-geometry-16'],nextIds:['math-geometry-11'],remedialIds:['math-geometry-01','math-geometry-09','math-geometry-16']},
 'math-geometry-11':{prerequisites:['geometry.cross-product-collinearity','numbers.wide-intermediates','geometry.coordinate-difference'],checkpointIds:['math-geometry-15'],nextIds:['math-geometry-12'],remedialIds:['math-geometry-01','math-geometry-02','math-geometry-04','math-geometry-09','math-geometry-16','math-geometry-10','arrays-hashing-01','arrays-hashing-02']},
 'math-geometry-12':{prerequisites:['geometry.cross-product-collinearity','geometry.orientation','geometry.closed-segment-bounds','numbers.wide-intermediates','geometry.coordinate-difference','arrays.traversal'],skillIds:['geometry.ray-crossings','geometry.boundary-membership','geometry.orientation','geometry.closed-segment-bounds','arrays.traversal'],checkpointIds:['math-geometry-08'],nextIds:['math-geometry-13'],remedialIds:['math-geometry-01','math-geometry-09','math-geometry-16','math-geometry-10','math-geometry-11','arrays-hashing-01','arrays-hashing-02','two-pointers-04']},
 'math-geometry-13':{prerequisites:['geometry.cross-product-collinearity','numbers.wide-intermediates','geometry.coordinate-difference','arrays.traversal','sorted.order'],checkpointIds:['math-geometry-14'],nextIds:[],remedialIds:['math-geometry-01','math-geometry-09','math-geometry-16','math-geometry-10','arrays-hashing-01','arrays-hashing-02','two-pointers-04']},
 'math-geometry-14':{step:5,prerequisites:['numbers.wide-intermediates','geometry.coordinate-difference','arrays.traversal','sorted.order'],checkpointIds:['math-geometry-13'],nextIds:[],remedialIds:['math-geometry-01','math-geometry-09','math-geometry-16','math-geometry-10','arrays-hashing-01','arrays-hashing-02','two-pointers-04']},
 'math-geometry-15':{prerequisites:['numbers.divisibility','numbers.wide-intermediates'],checkpointIds:['math-geometry-11'],nextIds:['math-geometry-12'],remedialIds:['math-geometry-01','math-geometry-02','math-geometry-04','math-geometry-09','math-geometry-16','math-geometry-10','math-geometry-11','arrays-hashing-01','arrays-hashing-02']},
 'math-geometry-16':{prerequisites:[],skillIds:['geometry.normal-projection','geometry.reflection-midpoint','geometry.coordinate-difference'],checkpointIds:['math-geometry-10'],nextIds:['math-geometry-11'],remedialIds:['math-geometry-01','math-geometry-09','math-geometry-10']}
});

// Explicit authored one-step tree routes once their targets exist.
Object.assign(learningOverrides,{'trees-03':{nextIds:['trees-05']},'trees-04':{nextIds:['trees-06']}});

// Authored heap step2 routes and the frequency teacher for median-path cooldown practice.
Object.assign(learningOverrides,{'heap-02':{nextIds:['heap-05','heap-07']},'heap-04':{nextIds:['heap-05','heap-07']},'heap-05':{nextIds:['heap-08']},'heap-07':{nextIds:['heap-08'],remedialIds:['arrays-hashing-01','heap-01','heap-02','heap-05']}});

// Reviewed first-entry foundational routes: practise a linked independent array teacher before returning to the chosen path.
for (const [id, baseline] of Object.entries({
  'two-pointers-01': [], 'two-pointers-02': [], 'sliding-window-01': [],
  'stack-01': ['stack-02','stack-01'], 'stack-02': [], 'stack-03': ['stack-02','stack-01'],
})) {
  learningOverrides[id] = {...(learningOverrides[id] ?? {}), remedialIds: [...new Set([...baseline, ...(learningOverrides[id]?.remedialIds ?? []), 'arrays-hashing-01'])]};
}

// Decision0005: the reduced three-question Trie pool forms a calibrated introductory peer group.
for (const [id, peers] of Object.entries({'tries-01':['tries-02','tries-03'],'tries-02':['tries-01','tries-03']})) {
  learningOverrides[id] = {...(learningOverrides[id] ?? {}), checkpointIds: peers, nextIds: []};
}
