import json,sys

{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    result=Solution().solve(input["capital"],input["profits"],input["initial"],input["k"])
    print(json.dumps(result,separators=(",",":"),allow_nan=False))
