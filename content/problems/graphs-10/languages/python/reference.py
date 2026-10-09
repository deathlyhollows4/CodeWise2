class Solution:
    def solve(self, n, edges):
        if not edges:
            return []
        adjacency, degree, index = [[] for _ in range(n)], [0]*n, [0]*n
        for edge_id, (u,v) in enumerate(edges):
            adjacency[u].append(edge_id)
            degree[u] += 1
            degree[v] -= 1
        plus = [v for v in range(n) if degree[v] == 1]
        minus = [v for v in range(n) if degree[v] == -1]
        if any(abs(d) > 1 for d in degree) or not ((len(plus) == len(minus) == 0) or (len(plus) == len(minus) == 1)):
            return [-1]
        start = plus[0] if plus else edges[0][0]
        vertices, entering, out = [start], [-1], []
        while vertices:
            u = vertices[-1]
            if index[u] < len(adjacency[u]):
                edge_id = adjacency[u][index[u]]
                index[u] += 1
                vertices.append(edges[edge_id][1])
                entering.append(edge_id)
            else:
                vertices.pop()
                edge_id = entering.pop()
                if edge_id >= 0:
                    out.append(edge_id)
        return out[::-1] if len(out) == len(edges) else [-1]
