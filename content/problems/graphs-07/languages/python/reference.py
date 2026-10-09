class Solution:
    def solve(self, n, edges):
        adjacency = [[] for _ in range(n)]
        for u,v in edges:
            adjacency[u].append(v)
            adjacency[v].append(u)
        color = [-1]*n
        for start in range(n):
            if color[start] >= 0:
                continue
            color[start], queue = 0, [start]
            for u in queue:
                for v in adjacency[u]:
                    if color[v] < 0:
                        color[v] = color[u]^1
                        queue.append(v)
                    elif color[v] == color[u]:
                        return False
        return True
