class Solution:
    def solve(self, values):
        if len(values) < 2:
            return 0
        far = boundary = count = 0
        for i in range(len(values)-1):
            far = max(far, i+values[i])
            if i == boundary:
                if far <= i:
                    return -1
                count += 1
                boundary = far
                if boundary >= len(values)-1:
                    return count
        return -1
