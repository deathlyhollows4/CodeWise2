## Choose operand boundaries and operators

Use every input digit exactly once, in its original order, to build a nonempty expression. Between adjacent digits, either concatenate them into one decimal operand or insert one of `+`, `-`, and `*`. Operands are nonnegative canonical decimal integers: "0" is allowed, but "00" and "05" are not. No unary signs, parentheses, division, or extra characters are allowed.

Return every expression whose value equals `target`, sorted lexicographically as strings. Multiplication has its usual precedence over addition and subtraction; for example, `1+2*3` equals 7. Distinct expression strings remain distinct answers. An empty digit string has no expression, even for target zero.

### Native interface

`solve(digits, target)` receives a native digit string and a wide signed target, returning a string array. Calculate safely with wide integers. This is an expression search task; you do not receive prewritten expressions to evaluate, and you must not use an external evaluator.
