import heapq
class Solution:
    def solve(self, commands, ids, priorities):
        heap,active,out=[],{},[]
        for stamp,(command,handle,priority) in enumerate(zip(commands,ids,priorities)):
            if command=="add":
                if handle not in active:
                    active[handle]=stamp
                    heapq.heappush(heap,(-priority,stamp,handle))
            elif command=="cancel": active.pop(handle,None)
            else:
                while heap and active.get(heap[0][2])!=heap[0][1]: heapq.heappop(heap)
                if not heap: out.append(-1)
                else:
                    _,_,chosen=heapq.heappop(heap)
                    del active[chosen]
                    out.append(chosen)
        return out
