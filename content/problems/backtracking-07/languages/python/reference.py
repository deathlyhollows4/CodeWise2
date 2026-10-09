class Solution:
    def solve(self, clues):
        grid=[list(row) for row in clues]
        rows=[0]*4
        cols=[0]*4
        boxes=[0]*4
        out=[]
        for r in range(4):
            for c in range(4):
                v=grid[r][c]
                if not v:
                    continue
                bit=1<<v
                b=2*(r//2)+c//2
                if (rows[r]|cols[c]|boxes[b])&bit:
                    return []
                rows[r]|=bit
                cols[c]|=bit
                boxes[b]|=bit
        def visit(at):
            if at==16:
                out.append(["".join(map(str,row)) for row in grid])
                return
            r,c=divmod(at,4)
            b=2*(r//2)+c//2
            if grid[r][c]:
                visit(at+1)
                return
            for v in range(1,5):
                bit=1<<v
                if (rows[r]|cols[c]|boxes[b])&bit:
                    continue
                grid[r][c]=v
                rows[r]|=bit
                cols[c]|=bit
                boxes[b]|=bit
                visit(at+1)
                rows[r]^=bit
                cols[c]^=bit
                boxes[b]^=bit
                grid[r][c]=0
        visit(0)
        return out
