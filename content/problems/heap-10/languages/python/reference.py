import heapq
class Solution:
    def solve(self, buildings):
        buildings = sorted(buildings)
        coordinates = sorted({x for left, right, height in buildings for x in (left, right)})
        active = []
        index = previous = 0
        result = []
        for x in coordinates:
            while index < len(buildings) and buildings[index][0] <= x:
                left, right, height = buildings[index]
                heapq.heappush(active, (-height, right))
                index += 1
            while active and active[0][1] <= x:
                heapq.heappop(active)
            height = -active[0][0] if active else 0
            if height != previous:
                result.append([x, height])
                previous = height
        return result
