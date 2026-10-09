Each row [start, end, weight] contributes weight at every real position x with start <= x < end. Return the greatest total weight at any real position. Contributions from overlapping rows add, including repeated identical rows. Weights may be negative. Positions outside all intervals have total zero, so the answer is never negative.

A zero-length interval contributes nothing. At a shared endpoint, intervals ending there are already inactive while intervals starting there are active. Handle all changes at that coordinate together; a temporary partial event sum is not a real covered weight.
