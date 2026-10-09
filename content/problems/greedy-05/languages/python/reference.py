class Solution:
    def solve(self, digits, k):
        stack = []
        for digit in digits:
            while k and stack and stack[-1] > digit:
                stack.pop()
                k -= 1
            stack.append(digit)
        if k:
            del stack[-k:]
        return "".join(map(str, stack)).lstrip("0") or "0"
