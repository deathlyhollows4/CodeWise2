import json,sys

{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    result=Solution().solve(input["blocked"],input["lo"],input["hi"],input["duration"])
    print(json.dumps(result,separators=(",",":"),allow_nan=False))
