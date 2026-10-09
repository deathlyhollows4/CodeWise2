import heapq
class Solution:
    def solve(self, weights):
        heap=[-v for v in weights]
        heapq.heapify(heap)
        while len(heap)>1:
            a,b=-heapq.heappop(heap),-heapq.heappop(heap)
            if a!=b: heapq.heappush(heap,-(a-b))
        return -heap[0] if heap else 0
