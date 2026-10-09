import heapq
class Solution:
    def solve(self, feeds):
        if any(not feed for feed in feeds):
            return []
        queue = [(feed[0], i, 0) for i, feed in enumerate(feeds)]
        heapq.heapify(queue)
        maximum = max(feed[0] for feed in feeds)
        best = None
        while True:
            minimum, source, index = heapq.heappop(queue)
            if best is None or (maximum - minimum, minimum) < (best[1] - best[0], best[0]):
                best = [minimum, maximum]
            if index + 1 == len(feeds[source]):
                break
            value = feeds[source][index + 1]
            maximum = max(maximum, value)
            heapq.heappush(queue, (value, source, index + 1))
        return best
