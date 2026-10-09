import heapq
class Solution:
    def solve(self, values, k):
        heap=[]
        for value in values:
            heapq.heappush(heap,value)
            if len(heap)>k: heapq.heappop(heap)
        return sorted(heap,reverse=True)
