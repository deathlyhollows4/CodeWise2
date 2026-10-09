class Solution:
    def solve(self, text):
        expected=[]
        pairs={"(":")","[":"]","{":"}"}
        for character in text:
            if character in pairs:
                expected.append(pairs[character])
            elif not expected or expected.pop()!=character:
                return False
        return not expected
