class Solution:
    def solve(self, next):
        n = len(next)
        degree, length, distance = [0]*n, [0]*n, [0]*n
        for v in next:
            degree[v] += 1
        order = [u for u in range(n) if degree[u] == 0]
        for u in order:
            degree[next[u]] -= 1
            if degree[next[u]] == 0:
                order.append(next[u])
        for u in range(n):
            if degree[u] and not length[u]:
                cycle, v = [u], next[u]
                while v != u:
                    cycle.append(v)
                    v = next[v]
                for v in cycle:
                    length[v] = len(cycle)
        for u in reversed(order):
            length[u] = length[next[u]]
            distance[u] = distance[next[u]]+1
        return [[length[u], distance[u]] for u in range(n)]
