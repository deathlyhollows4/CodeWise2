class Solution:
    def solve(self, n, edges):
        reverse, degree = [[] for _ in range(n)], [0]*n
        for u,v in edges:
            reverse[v].append(u)
            degree[u] += 1
        queue = [v for v in range(n) if degree[v] == 0]
        for v in queue:
            for u in reverse[v]:
                degree[u] -= 1
                if degree[u] == 0:
                    queue.append(u)
        return sorted(queue)
