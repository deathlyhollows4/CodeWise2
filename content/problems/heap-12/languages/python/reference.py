import heapq
class Solution:
    def solve(self, left, right, k):
        queue = [(left[i] + right[0], i, 0) for i in range(min(k, len(left)))] if right else []
        heapq.heapify(queue)
        result = []
        while queue and len(result) < k:
            _, i, j = heapq.heappop(queue)
            result.append([i, j])
            if j + 1 < len(right):
                heapq.heappush(queue, (left[i] + right[j + 1], i, j + 1))
        return result
