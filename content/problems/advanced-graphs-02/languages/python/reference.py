class Solution:
    def solve(self, n, edges):
        parent, size, offset = list(range(n)), [1]*n, [0]*n
        def find(u):
            if parent[u] != u:
                old = parent[u]
                parent[u] = find(old)
                offset[u] += offset[old]
            return parent[u]
        for u,v,delta in edges:
            a,b = find(u),find(v)
            pu,pv = offset[u],offset[v]
            if a == b:
                if pv-pu != delta:
                    return False
            else:
                bridge = delta+pu-pv
                if size[a] >= size[b]:
                    parent[b],offset[b] = a,bridge
                    size[a] += size[b]
                else:
                    parent[a],offset[a] = b,-bridge
                    size[b] += size[a]
        return True
