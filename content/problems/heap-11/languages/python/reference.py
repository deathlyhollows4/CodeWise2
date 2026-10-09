import heapq
class Solution:
    def solve(self, capital, profits, initial, k):
        projects=sorted(zip(capital,profits))
        available=[]
        wealth,j=initial,0
        for _ in range(k):
            while j<len(projects) and projects[j][0]<=wealth:
                heapq.heappush(available,-projects[j][1])
                j+=1
            if not available: break
            wealth-=heapq.heappop(available)
        return wealth
