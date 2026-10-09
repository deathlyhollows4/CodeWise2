class Solution:
    def solve(self, value):
        def step(n):
            return sum(int(d)**2 for d in str(n))
        seen=set()
        while value!=1 and value not in seen:
            seen.add(value)
            value=step(value)
        return value==1
