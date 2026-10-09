class Solution:
    def solve(self, values, target):
        left,right,count=0,len(values)-1,0
        while left<right:
            total=values[left]+values[right]
            if total<target:
                left+=1
            elif total>target:
                right-=1
            elif values[left]==values[right]:
                n=right-left+1
                count+=n*(n-1)//2
                break
            else:
                a,b=values[left],values[right]
                na=nb=0
                while left<=right and values[left]==a:
                    left+=1;na+=1
                while right>=left and values[right]==b:
                    right-=1;nb+=1
                count+=na*nb
        return count
