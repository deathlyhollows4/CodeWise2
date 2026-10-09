class Solution:
    def solve(self, target, startFuel, stations):
        import heapq
        reach = startFuel
        index = count = 0
        available = []
        while reach < target:
            while index < len(stations) and stations[index][0] <= reach:
                heapq.heappush(available, -stations[index][1])
                index += 1
            if not available:
                return -1
            reach -= heapq.heappop(available)
            count += 1
        return count
