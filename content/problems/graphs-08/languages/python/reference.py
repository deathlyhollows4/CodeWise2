class Solution:
    def solve(self, n, edges):
        adjacency, degree = [[] for _ in range(n)], [0]*n
        for u,v in edges:
            adjacency[u].append(v)
            degree[v] += 1
        queue = [v for v in range(n) if degree[v] == 0]
        for u in queue:
            for v in adjacency[u]:
                degree[v] -= 1
                if degree[v] == 0:
                    queue.append(v)
        return queue if len(queue) == n else []
