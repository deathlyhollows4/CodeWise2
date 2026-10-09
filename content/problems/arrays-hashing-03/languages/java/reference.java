class Solution { public long solve(int[] values) { java.util.HashSet<Integer> seen = new java.util.HashSet<>(); for (int i=0;i<values.length;i++) if (!seen.add(values[i])) return i; return -1; } }
