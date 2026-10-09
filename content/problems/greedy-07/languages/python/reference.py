class Solution:
    def solve(self, text):
        last = {c:i for i,c in enumerate(text)}
        used = set()
        stack = []
        for i,c in enumerate(text):
            if c in used:
                continue
            while stack and stack[-1] > c and last[stack[-1]] > i:
                used.remove(stack.pop())
            stack.append(c)
            used.add(c)
        return "".join(stack)
