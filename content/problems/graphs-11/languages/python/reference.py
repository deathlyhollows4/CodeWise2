class Solution:
    def solve(self, n, edges):
        adjacency = [[] for _ in range(n)]
        for edge_id,(u,v) in enumerate(edges):
            adjacency[u].append((v,edge_id))
            adjacency[v].append((u,edge_id))
        entered, low, out, clock = [-1]*n, [0]*n, [], 0
        def visit(u, parent_edge):
            nonlocal clock
            entered[u] = low[u] = clock
            clock += 1
            for v,edge_id in adjacency[u]:
                if edge_id == parent_edge:
                    continue
                if entered[v] < 0:
                    visit(v,edge_id)
                    low[u] = min(low[u],low[v])
                    if low[v] > entered[u]:
                        out.append(edge_id)
                else:
                    low[u] = min(low[u],entered[v])
        for u in range(n):
            if entered[u] < 0:
                visit(u,-1)
        return sorted(out)
