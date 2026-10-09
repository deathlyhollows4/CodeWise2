class Solution:
    def solve(self, n, edges):
        from collections import deque
        ways = [0]*n
        if not n:
            return ways
        adjacency = [[] for _ in range(n)]
        for u, v in edges:
            adjacency[u].append(v)
        distance = [-1]*n
        distance[0], ways[0] = 0, 1
        queue = deque([0])
        while queue:
            u = queue.popleft()
            for v in adjacency[u]:
                if distance[v] < 0:
                    distance[v] = distance[u]+1
                    queue.append(v)
                if distance[v] == distance[u]+1:
                    ways[v] = (ways[v]+ways[u])%1000000007
        return ways
