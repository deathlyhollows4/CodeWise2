class Solution:
    def solve(self, parents):
        n=len(parents)
        if not n:
            return False
        children=[[] for _ in parents]
        root=None
        for i,parent in enumerate(parents):
            if parent==-1:
                if root is not None:
                    return False
                root=i
            else:
                if parent<0 or parent>=n or parent==i:
                    return False
                children[parent].append(i)
                if len(children[parent])>2:
                    return False
        if root is None:
            return False
        seen=set()
        queue=[root]
        for node in queue:
            if node in seen:
                return False
            seen.add(node)
            queue.extend(children[node])
        return len(seen)==n
