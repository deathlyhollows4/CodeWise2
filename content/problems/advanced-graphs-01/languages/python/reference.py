class Solution:
    def solve(self, n, edges):
        if n < 2:
            return 0
        parent = list(range(n))
        def find(u):
            while parent[u] != u:
                parent[u] = parent[parent[u]]
                u = parent[u]
            return u
        total, joined = 0, 0
        for u,v,cost in sorted(edges,key=lambda e:e[2]):
            a,b = find(u),find(v)
            if a != b:
                parent[a] = b
                total += cost
                joined += 1
                if joined == n-1:
                    return total
        return -1
