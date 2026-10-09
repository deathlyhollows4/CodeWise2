class Solution:
    def solve(self, text):
        frames=[]
        closes={"(":")","[":"]","{":"}"}
        weights={"(":1,"[":2,"{":3}
        total=0
        for character in text:
            if character in closes:
                frames.append([character,0])
            else:
                if not frames:
                    return -1
                opening,inside=frames.pop()
                if closes[opening]!=character:
                    return -1
                value=weights[opening] if inside==0 else 2*inside
                if frames:
                    frames[-1][1]+=value
                else:
                    total+=value
        return total if not frames else -1
