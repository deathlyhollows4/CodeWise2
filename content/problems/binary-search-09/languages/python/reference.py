class Solution:
    def solve(self, g, t):
        if not g or not g[0]:
            return False
        row, column = 0, len(g[0])-1
        while row < len(g) and column >= 0:
            if g[row][column] == t:
                return True
            if g[row][column] > t:
                column -= 1
            else:
                row += 1
        return False
