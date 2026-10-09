import heapq
class Solution:
    def solve(self, costs, k, candidates):
        left, right = [], []
        a, b = 0, len(costs) - 1
        for _ in range(candidates):
            if a > b:
                break
            heapq.heappush(left, (costs[a], a))
            a += 1
        for _ in range(candidates):
            if a > b:
                break
            heapq.heappush(right, (costs[b], b))
            b -= 1
        total = 0
        for _ in range(k):
            from_left = not right or bool(left) and left[0] <= right[0]
            total += heapq.heappop(left if from_left else right)[0]
            if a <= b:
                if from_left:
                    heapq.heappush(left, (costs[a], a))
                    a += 1
                else:
                    heapq.heappush(right, (costs[b], b))
                    b -= 1
        return total
