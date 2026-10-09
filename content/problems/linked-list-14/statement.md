## Replay the visits

Start at homepage with no other history. A visit moves to the supplied page and discards every page forward of the old current position. Back and forward move by at most the supplied number of steps, stopping at the available boundary. Return the current page after each command. Repeated page names still represent separate visits.

## Typed function

`solve(homepage,commands,pages,steps)` receives ordinary typed arrays of equal length. A visit uses pages[i] and ignores steps[i]. Back/forward use steps[i] and ignore pages[i]. Commands are exactly visit, back, and forward. Page names are opaque lowercase labels, not network destinations; no browsing or parsing is needed. Each call starts with fresh history.

## Edge cases

Zero steps leave the current page unchanged. A large step count stops at the oldest/latest available page. Visiting after back must not retain a discarded forward branch. An empty command history returns an empty array. Aim for constant-time linking on visit and work proportional to the links actually traversed on navigation.
