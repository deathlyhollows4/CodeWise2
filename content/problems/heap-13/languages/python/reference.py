import heapq
class Solution:
    def solve(self, values):
        normalized=[2*v if v%2 else v for v in values]
        minimum=min(normalized)
        heap=[-v for v in normalized]
        heapq.heapify(heap)
        best=float("inf")
        while True:
            maximum=-heapq.heappop(heap)
            best=min(best,maximum-minimum)
            if maximum%2: break
            half=maximum//2
            minimum=min(minimum,half)
            heapq.heappush(heap,-half)
        return best
