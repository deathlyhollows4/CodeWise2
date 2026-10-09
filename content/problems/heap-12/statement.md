Choose one position from left and one position from right. Every pair of positions is a separate candidate, even when readings are equal. Rank candidates by their reading sum, from smallest to largest. Break equal sums by the left index, then the right index, both ascending. Return the first k candidates as [leftIndex, rightIndex] rows.

If fewer than k candidates exist, return all of them. An empty input array or k = 0 gives an empty result. Both input arrays are already sorted in nondecreasing order. Return original zero-based indices; do not reorder the inputs.

The intended frontier method avoids creating all left.length * right.length candidates before selecting the leading ones.
