class CoverageSet:
    def __init__(self):
        self.ranges = {}
        self.counts = [0] * 1000
        self.total = 0
    def _adjust(self, start, end, delta):
        for x in range(start, end):
            if delta > 0:
                if self.counts[x] == 0:
                    self.total += 1
                self.counts[x] += 1
            else:
                self.counts[x] -= 1
                if self.counts[x] == 0:
                    self.total -= 1
    def put(self, handle, start, end):
        self.remove(handle)
        self.ranges[handle] = (start, end)
        self._adjust(start, end, 1)
    def remove(self, handle):
        old = self.ranges.pop(handle, None)
        if old is not None:
            self._adjust(old[0], old[1], -1)
    def covered(self):
        return self.total
