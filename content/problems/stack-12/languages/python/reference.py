class Solution:
    def solve(self, text):
        frames=[]
        current=""
        number=0
        pending=False
        for character in text:
            if "0"<=character<="9":
                if not pending and character=="0":
                    return "INVALID"
                number=number*10+int(character);pending=True
                if number>10000:
                    return "INVALID"
            elif character=="[":
                if not pending or number<1:
                    return "INVALID"
                frames.append((current,number))
                current="";number=0;pending=False
            elif character=="]":
                if pending or not frames:
                    return "INVALID"
                prefix,count=frames.pop()
                if len(prefix)+len(current)*count>10000:
                    return "INVALID"
                current=prefix+current*count
            elif "a"<=character<="z":
                if pending:
                    return "INVALID"
                current+=character
                if len(current)>10000:
                    return "INVALID"
            else:
                return "INVALID"
        return "INVALID" if pending or frames else current
