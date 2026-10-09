class Solution:
    def solve(self, values, k):
        from collections import deque
        q=deque()
        out=[]
        for i,value in enumerate(values):
            while q and q[0]<=i-k:
                q.popleft()
            while q and values[q[-1]]<=value:
                q.pop()
            q.append(i)
            if i>=k-1:
                out.append(values[q[0]])
        return out
