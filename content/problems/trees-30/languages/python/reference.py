class Solution:
    def solve(self, root):
        if root is None:
            return []
        nodes=[root]
        index={root:0}
        for node in nodes:
            if node.left is not None:
                index[node.left]=len(nodes)
                nodes.append(node.left)
            if node.right is not None:
                index[node.right]=len(nodes)
                nodes.append(node.right)
        count=len(nodes)
        size=[1]*count
        depth=[0]*count
        answer=[0]*count
        for i,node in enumerate(nodes):
            if node.left is not None:
                depth[index[node.left]]=depth[i]+1
            if node.right is not None:
                depth[index[node.right]]=depth[i]+1
            answer[0]+=depth[i]
        for i in range(count-1,-1,-1):
            node=nodes[i]
            if node.left is not None:
                size[i]+=size[index[node.left]]
            if node.right is not None:
                size[i]+=size[index[node.right]]
        for i,node in enumerate(nodes):
            if node.left is not None:
                j=index[node.left]
                answer[j]=answer[i]+count-2*size[j]
            if node.right is not None:
                j=index[node.right]
                answer[j]=answer[i]+count-2*size[j]
        return answer
