from fractions import Fraction
class Solution:
    def solve(self, aNum, aDen, bNum, bDen, operation):
        a,b=Fraction(aNum,aDen),Fraction(bNum,bDen)
        if operation=="+": result=a+b
        elif operation=="-": result=a-b
        elif operation=="*": result=a*b
        else: result=a/b
        return [result.numerator,result.denominator]
