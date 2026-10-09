class Solution:
    def solve(self, values, target):
        a=sorted(values)
        out=[]
        for i in range(len(a)-2):
            if i and a[i]==a[i-1]:
                continue
            left,right=i+1,len(a)-1
            while left<right:
                total=a[i]+a[left]+a[right]
                if total<target:
                    left+=1
                elif total>target:
                    right-=1
                else:
                    out.append([a[i],a[left],a[right]])
                    x,y=a[left],a[right]
                    while left<right and a[left]==x:
                        left+=1
                    while left<right and a[right]==y:
                        right-=1
        return out
