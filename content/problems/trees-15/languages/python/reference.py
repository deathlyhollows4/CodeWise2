class Solution:
    def solve(self, root):
        if root is None:
            return 0
        order=[root]
        for node in order:
            if node.left is not None:
                order.append(node.left)
            if node.right is not None:
                order.append(node.right)
        ids={}
        types={}
        counts={}
        result=0
        for node in reversed(order):
            a=0 if node.left is None else ids[node.left]
            b=0 if node.right is None else ids[node.right]
            key=(node.val,a,b)
            if key not in types:
                types[key]=len(types)+1
            ident=types[key]
            ids[node]=ident
            counts[ident]=counts.get(ident,0)+1
            if counts[ident]==2:
                result+=1
        return result
