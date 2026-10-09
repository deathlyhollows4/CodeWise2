class Solution:
    def solve(self, release, duration, deadline):
        n=len(release)
        out=[]
        used=[False]*n
        path=[]
        def visit(time):
            if len(path)==n:
                out.append(list(path))
                return
            for task in range(n):
                if used[task]:
                    continue
                finish=max(time,release[task])+duration[task]
                if finish>deadline[task]:
                    continue
                used[task]=True
                path.append(task)
                visit(finish)
                path.pop()
                used[task]=False
        visit(0)
        return out
