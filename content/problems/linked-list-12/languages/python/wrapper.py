import json,sys

{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    result=Solution().solve(input["capacity"],input["commands"],input["keys"],input["values"])
    print(json.dumps(result,separators=(",",":"),allow_nan=False))
