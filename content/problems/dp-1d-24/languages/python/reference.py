class Solution:
    def solve(self, values):
        if not values:
            return 0
        up = down = 1
        for i in range(1, len(values)):
            if values[i] > values[i-1]:
                up = down+1
            elif values[i] < values[i-1]:
                down = up+1
        return max(up, down)
