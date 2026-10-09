class Solution:
    def solve(self, graph):
        if graph is None:
            return []
        queue = [graph]
        index = {id(graph): 0}
        for node in queue:
            for neighbor in node.neighbors:
                if id(neighbor) not in index:
                    index[id(neighbor)] = len(queue)
                    queue.append(neighbor)
        out = [[0]*len(queue) for _ in queue]
        for i, node in enumerate(queue):
            for neighbor in node.neighbors:
                out[i][index[id(neighbor)]] += 1
        return out
