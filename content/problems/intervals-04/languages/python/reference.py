class Solution:
    def solve(self, intervals):
        keys = sorted(set(end for start, end in intervals))
        rank = {value: i + 1 for i, value in enumerate(keys)}
        tree = [0] * (len(keys) + 1)
        order = sorted(range(len(intervals)), key=lambda i: (intervals[i][0], -intervals[i][1]))
        result = [0] * len(intervals)
        seen = i = 0
        while i < len(order):
            j = i + 1
            pair = intervals[order[i]]
            while j < len(order) and intervals[order[j]] == pair:
                j += 1
            k = rank[pair[1]] - 1
            smaller = 0
            while k > 0:
                smaller += tree[k]
                k -= k & -k
            count = seen - smaller + j - i - 1
            for x in range(i, j):
                result[order[x]] = count
            k = rank[pair[1]]
            while k < len(tree):
                tree[k] += j - i
                k += k & -k
            seen += j - i
            i = j
        return result
