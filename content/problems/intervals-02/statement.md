left and right each describe covered times using sorted closed ranges. Within one calendar, the ranges neither overlap nor touch. Return every range covered by both calendars, in increasing order. Both endpoints are included, so contact at one time produces a point range [time, time].

An empty calendar makes the shared coverage empty. Inputs are already sorted by start time; preserve the endpoint values. Each returned range must represent common coverage, rather than the union of the calendars.
