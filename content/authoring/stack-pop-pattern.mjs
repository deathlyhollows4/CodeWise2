// Independent certificate for stack permutations after ranking original pushes.
// A 312 witness (earlier high, current low, later middle) leaves the middle
// above the low when the low is requested. Conversely a blocked pop implies
// exactly that witness via the earlier pop that caused the blocker to be pushed.
export function independentPopPermutation({ pushes, pops }) {
  if (
    pushes.length !== pops.length ||
    new Set(pushes).size !== pushes.length ||
    new Set(pops).size !== pops.length
  )
    return false;
  const ranks = new Map(pushes.map((value, index) => [value, index]));
  if (pops.some((value) => !ranks.has(value))) return false;
  const order = pops.map((value) => ranks.get(value));
  let high = -1;
  for (let j = 0; j < order.length; j++) {
    for (let k = j + 1; k < order.length; k++)
      if (high > order[k] && order[k] > order[j]) return false;
    high = Math.max(high, order[j]);
  }
  return true;
}
