import heapq
class Solution:
    def solve(self, points, k):
        heap=[]
        for x,y in points:
            heapq.heappush(heap,(-(x*x+y*y),-x,-y))
            if len(heap)>k: heapq.heappop(heap)
        return sorted(([-x,-y] for _,x,y in heap),key=lambda p:(p[0]*p[0]+p[1]*p[1],p[0],p[1]))
