class Solution:
    def solve(self, moves, targets):
        n = len(targets)
        reverse,degree,state = [[] for _ in range(n)],[0]*n,[0]*n
        for u in range(n):
            if not targets[u]:
                for v in range(n):
                    if moves[u][v]:
                        degree[u] += 1
                        reverse[v].append(u)
        queue = []
        for u in range(n):
            if targets[u] or degree[u] == 0:
                state[u] = 2
                queue.append(u)
        for v in queue:
            for u in reverse[v]:
                if state[u] == 0:
                    if state[v] == 2:
                        state[u] = 1
                        queue.append(u)
                    else:
                        degree[u] -= 1
                        if degree[u] == 0:
                            state[u] = 2
                            queue.append(u)
        return ["WIN" if s == 1 else "LOSE" if s == 2 else "DRAW" for s in state]
