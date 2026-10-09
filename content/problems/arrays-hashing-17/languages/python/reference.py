class Solution:
    def solve(self, grid):
        rows=set()
        cols=set()
        for i,row in enumerate(grid):
            for j,value in enumerate(row):
                if value==0:
                    rows.add(i)
                    cols.add(j)
        return [[0 if i in rows or j in cols else value for j,value in enumerate(row)] for i,row in enumerate(grid)]
