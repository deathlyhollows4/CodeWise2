class Solution:
    def solve(self, values):
        out=[0]*len(values)
        left,right=0,len(values)-1
        for write in range(len(values)-1,-1,-1):
            a,b=values[left]**2,values[right]**2
            if a>b:
                out[write]=a; left+=1
            else:
                out[write]=b; right-=1
        return out
