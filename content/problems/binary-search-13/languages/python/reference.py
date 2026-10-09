class Solution:
    def solve(self, a, b):
        if len(a) > len(b):
            a, b = b, a
        total, half = len(a)+len(b), (len(a)+len(b)+1)//2
        lo, hi = 0, len(a)
        while lo <= hi:
            i = lo+(hi-lo)//2
            j = half-i
            x = a[i-1] if i else -float("inf")
            y = a[i] if i < len(a) else float("inf")
            u = b[j-1] if j else -float("inf")
            v = b[j] if j < len(b) else float("inf")
            if x <= v and u <= y:
                return 2*max(x,u) if total%2 else max(x,u)+min(y,v)
            if x > v:
                hi = i-1
            else:
                lo = i+1
        raise ValueError("Invalid sorted input")
