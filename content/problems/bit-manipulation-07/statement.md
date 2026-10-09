For every pair of positions i < j, compute values[i] XOR values[j]. Return the sum of all those XOR values. A pair is counted once, and a position is never paired with itself. Equal values at different positions remain separate participants.

An empty or one-position input has total zero. Values use at most 20 bits, but the sum over many pairs can greatly exceed signed 32-bit range. The required result is a sum across all pairs, not the largest XOR pair.
