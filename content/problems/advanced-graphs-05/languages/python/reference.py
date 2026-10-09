class Solution:
    def solve(self, n, edges, required):
        adjacency = [[] for _ in range(n)]
        for u,v,capacity,cost in edges:
            forward = [v,len(adjacency[v]),capacity,cost]
            reverse = [u,len(adjacency[u]),0,-cost]
            adjacency[u].append(forward)
            adjacency[v].append(reverse)
        sent,total = 0,0
        while sent < required:
            distance,previous,index = [float("inf")]*n,[-1]*n,[0]*n
            distance[0] = 0
            for _ in range(n-1):
                changed = False
                for u in range(n):
                    if distance[u] == float("inf"):
                        continue
                    for edge_id,e in enumerate(adjacency[u]):
                        v,_,capacity,cost = e
                        if capacity > 0 and distance[u]+cost < distance[v]:
                            distance[v] = distance[u]+cost
                            previous[v],index[v] = u,edge_id
                            changed = True
                if not changed:
                    break
            if distance[-1] == float("inf"):
                return -1
            amount,v = required-sent,n-1
            while v != 0:
                amount = min(amount,adjacency[previous[v]][index[v]][2])
                v = previous[v]
            v = n-1
            while v != 0:
                e = adjacency[previous[v]][index[v]]
                e[2] -= amount
                adjacency[v][e[1]][2] += amount
                v = previous[v]
            sent += amount
            total += amount*distance[-1]
        return total
