class Solution:
    def solve(self, text):
        out=[]
        for character in text:
            if out and out[-1]==character:
                out.pop()
            else:
                out.append(character)
        return "".join(out)
