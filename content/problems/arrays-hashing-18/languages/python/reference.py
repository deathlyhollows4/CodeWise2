class Solution:
    def solve(self, a, b):
        counts={}
        for label,count in a+b:
            counts[label]=counts.get(label,0)+count
        return [[label,counts[label]] for label in sorted(counts)]
