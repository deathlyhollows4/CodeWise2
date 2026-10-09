class Solution:
    def solve(self, pattern):
        out=[]
        path=[]
        def visit(at,balance):
            if at==len(pattern):
                if balance==0:
                    out.append("".join(path))
                return
            if balance<0 or balance>len(pattern)-at:
                return
            for char in "()":
                if pattern[at]=="?" or pattern[at]==char:
                    path.append(char)
                    visit(at+1,balance+(1 if char=="(" else -1))
                    path.pop()
        visit(0,0)
        return out
