class Solution:
    def solve(self, symbolsA, countsA, symbolsB, countsB):
        i=j=0
        a=countsA[0] if countsA else 0
        b=countsB[0] if countsB else 0
        while i<len(symbolsA) and j<len(symbolsB):
            if symbolsA[i]!=symbolsB[j]:
                return False
            step=min(a,b)
            a-=step;b-=step
            if a==0:
                i+=1;a=countsA[i] if i<len(countsA) else 0
            if b==0:
                j+=1;b=countsB[j] if j<len(countsB) else 0
        return i==len(symbolsA) and j==len(symbolsB)
