// Pure bounded JSON input contracts; no learner execution or runtime controls.
export function validTreeEncoding(values,maxNodes){
  if(!Number.isInteger(maxNodes)||maxNodes<0||maxNodes>100000||!Array.isArray(values)||values.length>200001)return false;
  let slots=1,nodes=0;
  for(const value of values){if(slots===0){if(value!==null)return false;continue;}slots--;if(value!==null){if(!Number.isSafeInteger(value)||++nodes>maxNodes)return false;slots+=2;}}
  return true;
}
export function identityTreeInput(data,maxNodes,targetCount){
  return !!data&&typeof data==='object'&&validTreeEncoding(data.values,maxNodes)&&Number.isInteger(targetCount)&&targetCount>=0&&targetCount<=16&&Array.isArray(data.targetIndices)&&data.targetIndices.length===targetCount&&data.targetIndices.every(i=>Number.isInteger(i)&&i>=0&&i<data.values.length&&data.values[i]!==null);
}
export function strictBst(values) {
  if (!Array.isArray(values) || values.length > 200001) return false;
  if (!values.length || values[0] === null) return values.every(v => v === null);
  const queue = [[values[0], -Infinity, Infinity]];
  let cursor = 1;
  for (let i = 0; i < queue.length; i++) {
    const [value, lower, upper] = queue[i];
    if (!Number.isSafeInteger(value) || value <= lower || value >= upper) return false;
    for (const left of [true, false]) {
      if (cursor >= values.length) break;
      const child = values[cursor++];
      if (child !== null) queue.push([child, left ? lower : value, left ? value : upper]);
    }
  }
  return values.slice(cursor).every(v => v === null);
}

export function compatibleTraversals(preorder, inorder, maxNodes) {
  if (!Number.isInteger(maxNodes) || maxNodes < 0 || maxNodes > 100000 ||
      !Array.isArray(preorder) || !Array.isArray(inorder) ||
      preorder.length !== inorder.length || preorder.length > maxNodes ||
      preorder.some(v => !Number.isSafeInteger(v)) || inorder.some(v => !Number.isSafeInteger(v))) return false;
  const positions = new Map(inorder.map((v, i) => [v, i]));
  if (positions.size !== inorder.length || new Set(preorder).size !== preorder.length || preorder.some(v => !positions.has(v))) return false;
  const pending = [[0, inorder.length]];
  let consumed = 0;
  while (pending.length) {
    const [begin, end] = pending.pop();
    if (begin === end) continue;
    const pivot = positions.get(preorder[consumed++]);
    if (pivot === undefined || pivot < begin || pivot >= end) return false;
    pending.push([pivot + 1, end], [begin, pivot]);
  }
  return consumed === preorder.length;
}
