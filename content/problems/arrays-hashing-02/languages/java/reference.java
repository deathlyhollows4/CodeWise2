class Solution { public long solve(int[] values) { long result = values[0]; for (int value : values) result = Math.max(result, value); return result; } }
