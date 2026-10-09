class Solution:
    def solve(self, n, edges):
        adjacency = [[] for _ in range(n)]
        for u, v in edges:
            adjacency[u].append(v)
            adjacency[v].append(u)
        seen = set()
        count = 0
        for start in range(n):
            if start in seen:
                continue
            count += 1
            queue = [start]
            seen.add(start)
            for u in queue:
                for v in adjacency[u]:
                    if v not in seen:
                        seen.add(v)
                        queue.append(v)
        return count
