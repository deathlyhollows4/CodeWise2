class Solution:
    def solve(self, allowed):
        n=len(allowed)
        out=[]
        used=[False]*n
        path=[]
        def visit():
            position=len(path)
            if position==n:
                out.append(list(path))
                return
            for item in range(n):
                if not used[item] and allowed[position][item]==1:
                    used[item]=True
                    path.append(item)
                    visit()
                    path.pop()
                    used[item]=False
        visit()
        return out
