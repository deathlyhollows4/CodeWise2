class Solution:
    def solve(self, values, limit):
        from collections import deque
        hi=deque()
        lo=deque()
        left=best=0
        for right,value in enumerate(values):
            while hi and values[hi[-1]]<=value:
                hi.pop()
            while lo and values[lo[-1]]>=value:
                lo.pop()
            hi.append(right);lo.append(right)
            while values[hi[0]]-values[lo[0]]>limit:
                left+=1
                if hi[0]<left:
                    hi.popleft()
                if lo[0]<left:
                    lo.popleft()
            best=max(best,right-left+1)
        return best
