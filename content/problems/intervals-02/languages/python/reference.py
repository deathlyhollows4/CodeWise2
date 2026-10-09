class Solution:
    def solve(self, left, right):
        result = []
        i = j = 0
        while i < len(left) and j < len(right):
            start = max(left[i][0], right[j][0])
            end = min(left[i][1], right[j][1])
            if start <= end:
                result.append([start, end])
            if left[i][1] < right[j][1]:
                i += 1
            else:
                j += 1
        return result
