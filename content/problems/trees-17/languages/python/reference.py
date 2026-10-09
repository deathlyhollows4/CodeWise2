class Solution:
    def solve(self, data):
        parent={data.root:None}
        queue=[data.root]
        for node in queue:
            if node.left is not None:
                parent[node.left]=node
                queue.append(node.left)
            if node.right is not None:
                parent[node.right]=node
                queue.append(node.right)
        ancestors=set()
        node=data.targets[0]
        while node is not None:
            ancestors.add(node)
            node=parent[node]
        node=data.targets[1]
        while node is not None:
            if node in ancestors:
                return node
            node=parent[node]
        return None
