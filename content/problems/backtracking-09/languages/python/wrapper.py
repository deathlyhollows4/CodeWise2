import json,sys

{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    result=Solution().solve(input["allowed"],input["fixed"])
    print(json.dumps(result,separators=(",",":"),allow_nan=False))
