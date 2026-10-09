import heapq
class Solution:
    def solve(self, values):
        lower,upper,out=[],[],[]
        for value in values:
            if not lower or value<=-lower[0]: heapq.heappush(lower,-value)
            else: heapq.heappush(upper,value)
            if len(lower)>len(upper)+1: heapq.heappush(upper,-heapq.heappop(lower))
            if len(upper)>len(lower): heapq.heappush(lower,-heapq.heappop(upper))
            out.append(-lower[0]+upper[0] if len(lower)==len(upper) else -2*lower[0])
        return out
