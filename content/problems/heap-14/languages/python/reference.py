import heapq
class Solution:
    def solve(self, weights, durations):
        free = [(weight, i) for i, weight in enumerate(weights)]
        heapq.heapify(free)
        busy = []
        result = []
        time = 0
        for job, duration in enumerate(durations):
            time = max(time, job)
            while busy and busy[0][0] <= time:
                _, server = heapq.heappop(busy)
                heapq.heappush(free, (weights[server], server))
            if not free:
                time = busy[0][0]
                while busy and busy[0][0] <= time:
                    _, server = heapq.heappop(busy)
                    heapq.heappush(free, (weights[server], server))
            _, server = heapq.heappop(free)
            result.append(server)
            heapq.heappush(busy, (time + duration, server))
        return result
