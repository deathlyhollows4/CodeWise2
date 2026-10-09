class Solution:
    def solve(self, values, stock, target):
        out=[]
        path=[]
        def visit(at,total):
            if at==len(values):
                if total==target:
                    out.append(list(path))
                return
            for count in range(stock[at]+1):
                next_total=total+count*values[at]
                if next_total>target:
                    break
                path.append(count)
                visit(at+1,next_total)
                path.pop()
        visit(0,0)
        return out
