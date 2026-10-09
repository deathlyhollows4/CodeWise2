Implement CoverageSet with an initially empty set of handle-owned ranges on [0,1000). Every endpoint is an integer, so a unit cell [x,x+1) is either covered or uncovered.

put(handle,start,end) stores [start,end) for that handle. If the handle already exists, replace its old range atomically. remove(handle) removes that handle if it exists; removing an absent handle does nothing. covered() returns the total covered length, counting overlap only once.

Zero-length ranges are allowed and contribute no coverage. Removing one of several overlapping owners must preserve cells still covered by another owner. Your class receives ordinary typed arguments; the trusted wrapper constructs it once and dispatches the listed methods. The test representation records null for constructor, put and remove, and an integer for each covered query.
