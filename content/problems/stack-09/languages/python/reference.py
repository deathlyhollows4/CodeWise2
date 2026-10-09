class Solution:
    def solve(self, values):
        out=[]
        for value in values:
            if value==0:
                continue
            alive=True
            while alive and value<0 and out and out[-1]>0:
                old=out[-1]
                if old<-value:
                    out.pop()
                elif old==-value:
                    out.pop();alive=False
                else:
                    alive=False
            if alive:
                out.append(value)
        return out
