class Solution:
    def solve(self, digits):
        out=[]
        path=[]
        def visit(at):
            if len(path)==4:
                if at==len(digits):
                    out.append(".".join(path))
                return
            slots=4-len(path)
            remaining=len(digits)-at
            if remaining<slots or remaining>3*slots:
                return
            for width in range(1,4):
                if at+width>len(digits):
                    break
                part=digits[at:at+width]
                if width>1 and part[0]=="0":
                    break
                if int(part)>255:
                    continue
                path.append(part)
                visit(at+width)
                path.pop()
        visit(0)
        return sorted(out)
