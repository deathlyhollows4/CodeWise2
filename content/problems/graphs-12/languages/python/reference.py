class Solution:
    def solve(self, n, edges):
        adjacency, reverse = [[] for _ in range(n)], [[] for _ in range(n)]
        for u,v in edges:
            adjacency[u].append(v)
            reverse[v].append(u)
        seen, finish = set(), []
        def first(u):
            seen.add(u)
            for v in adjacency[u]:
                if v not in seen:
                    first(v)
            finish.append(u)
        for u in range(n):
            if u not in seen:
                first(u)
        seen.clear()
        groups = []
        def second(u, group):
            seen.add(u)
            group.append(u)
            for v in reverse[u]:
                if v not in seen:
                    second(v,group)
        for u in reversed(finish):
            if u not in seen:
                group = []
                second(u,group)
                groups.append(sorted(group))
        return sorted(groups)
