class Solution:
    def solve(self, n, edges):
        if not n:
            return []
        distance = [float("inf")]*n
        distance[0] = 0
        for _ in range(n-1):
            changed = False
            for u,v,cost in edges:
                if distance[u] != float("inf") and distance[u]+cost < distance[v]:
                    distance[v] = distance[u]+cost
                    changed = True
            if not changed:
                break
        adjacency, bad, queue = [[] for _ in range(n)], [False]*n, []
        for u,v,cost in edges:
            adjacency[u].append(v)
            if distance[u] != float("inf") and distance[u]+cost < distance[v] and not bad[v]:
                bad[v] = True
                queue.append(v)
        for u in queue:
            for v in adjacency[u]:
                if not bad[v]:
                    bad[v] = True
                    queue.append(v)
        return ["UNBOUNDED" if bad[v] else "UNREACHABLE" if distance[v] == float("inf") else str(distance[v]) for v in range(n)]
