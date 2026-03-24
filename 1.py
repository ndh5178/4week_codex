from collections import deque

class Solution(object):
    def numIslands(self, grid):
        """
        :type grid: List[List[str]]
        :rtype: int
        """
        queue=deque()
        count=0
        for i in range(len(grid)):
            for j in range(len(grid[i])):
                if grid[i][j]=="1":
                    queue.append((i,j))
                    grid[i][j]="0"
                    count+=1
                    while queue:
                        x,y=queue.popleft()
                        if y + 1 < len(grid[i]) and grid[x][y + 1] == "1":
                            queue.append((x, y + 1, count + 1))
                            grid[x][y + 1]="0"
                        if x + 1 < len(grid) and grid[x + 1][y] == "1":
                            queue.append((x + 1, y, count + 1))
                            grid[x + 1][y]="0"
                        if y - 1 > -1 and grid[x][y - 1] == "1":
                            queue.append((x, y - 1, count + 1))
                            grid[x][y - 1]="0"
                        if x - 1 > -1 and grid[x - 1][y] == "1":
                            queue.append((x - 1, y, count + 1))
                            grid[x - 1][y]="0"
