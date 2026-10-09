import heapq
class Solution:
    def solve(self, values, k):
        counts={}
        for value in values:
            counts[value]=counts.get(value,0)+1
        heap=[]
        for value,count in counts.items():
            heapq.heappush(heap,(count,-value))
            if len(heap)>k: heapq.heappop(heap)
        return [-value for count,value in sorted(heap,reverse=True)]
