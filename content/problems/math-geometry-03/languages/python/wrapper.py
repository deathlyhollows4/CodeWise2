import json,sys

{{USER_CODE}}
for line in sys.stdin:
    input=json.loads(line)
    result=Solution().solve(input["value"],input["exponent"],input["modulus"])
    print(json.dumps(result,separators=(",",":"),allow_nan=False))
