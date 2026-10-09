class Solution:
    def solve(self, allowed, fixed):
        n=len(allowed)
        out=[]
        path=[]
        def visit(row,columns,left,right):
            if row==n:
                out.append(list(path))
                return
            for col in range(n):
                bit=1<<col
                a=1<<(row+col)
                b=1<<(row-col+n-1)
                if not allowed[row][col] or (fixed[row]!=-1 and fixed[row]!=col) or columns&bit or left&a or right&b:
                    continue
                path.append(col)
                visit(row+1,columns|bit,left|a,right|b)
                path.pop()
        visit(0,0,0,0)
        return out
