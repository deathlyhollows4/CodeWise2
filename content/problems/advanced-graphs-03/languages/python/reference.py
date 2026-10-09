class Solution:
    def solve(self, n, edges):
        if not n:
            return -1
        if n == 1:
            return 0
        parent = list(range(n))
        def find(u):
            while parent[u] != u:
                parent[u] = parent[parent[u]]
                u = parent[u]
            return u
        for u,v,risk in sorted(edges,key=lambda e:e[2]):
            parent[find(u)] = find(v)
            if find(0) == find(n-1):
                return risk
        return -1
