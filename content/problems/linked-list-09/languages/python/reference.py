class Solution:
    def solve(self, data, k):
        node=data.heads[0]
        if node is None:
            return None
        rank=0
        for size in range(2,len(data.nodes)+1):
            rank=(rank+k)%size
        for _ in range(rank):
            node=node.next
        return node
