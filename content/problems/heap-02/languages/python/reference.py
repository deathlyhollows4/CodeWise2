import heapq
class Solution:
    def solve(self, initial, arrivals, k):
        heap=[]
        for value in initial:
            heapq.heappush(heap,value)
            if len(heap)>k: heapq.heappop(heap)
        out=[]
        for value in arrivals:
            heapq.heappush(heap,value)
            if len(heap)>k: heapq.heappop(heap)
            out.append(heap[0])
        return out
