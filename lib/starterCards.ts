import type { Flashcard } from "../types/flashcard";
import { createNewSchedulerCard } from "./fsrs";

export async function createStarterCards(): Promise<Flashcard[]> {
    const defaultFSRSCards = await Promise.all([
        createNewSchedulerCard(),
        createNewSchedulerCard(),
        createNewSchedulerCard(),
        createNewSchedulerCard(),
        createNewSchedulerCard(),
        createNewSchedulerCard()
    ]);

    const starterData = [
        {
            id: "starter-1",
            title: "1. Two Sum",
            difficulty: "Easy" as const,
            tags: ["Array", "Hash Table", "Blind 75"],
            url: "https://leetcode.com/problems/two-sum/",
            question: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution, and you may not use the same element twice.",
            answer: `Use a Hash Map to store each number's complement (target - num) and its index as you iterate.

1. Initialize an empty hash map (val -> index).
2. For each element num at index i:
   - Check if num exists in map. If yes, return [map[num], i].
   - Otherwise, store target - num in map with index i.
3. Guarantees finding the pair in a single pass.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            codeSnippet: `function twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(nums[i])) {
            return [seen.get(nums[i])!, i];
        }
        seen.set(complement, i);
    }
    return [];
}`,
            createdAt: Date.now() - 86400000
        },
        {
            id: "starter-2",
            title: "121. Best Time to Buy and Sell Stock",
            difficulty: "Easy" as const,
            tags: ["Array", "Dynamic Programming", "Two Pointers"],
            url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
            question: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit.",
            answer: `Maintain two variables: minPrice (lowest price seen so far) and maxProfit (highest profit found).

1. Initialize minPrice = Infinity, maxProfit = 0.
2. For each price in prices:
   - If price < minPrice, update minPrice = price.
   - Else, calculate potential profit (price - minPrice) and update maxProfit = max(maxProfit, potential profit).
3. Return maxProfit.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            codeSnippet: `function maxProfit(prices: number[]): number {
    let minPrice = Infinity;
    let maxProfit = 0;
    for (const price of prices) {
        if (price < minPrice) {
            minPrice = price;
        } else if (price - minPrice > maxProfit) {
            maxProfit = price - minPrice;
        }
    }
    return maxProfit;
}`,
            createdAt: Date.now() - 86400000
        },
        {
            id: "starter-3",
            title: "20. Valid Parentheses",
            difficulty: "Easy" as const,
            tags: ["Stack", "String"],
            url: "https://leetcode.com/problems/valid-parentheses/",
            question: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.",
            answer: `Use a Stack to match opening brackets with expected closing brackets.

1. Create a map of matching pairs: ')' -> '(', '}' -> '{', ']' -> '['.
2. Iterate through each character in s:
   - If it is a closing bracket, pop the top of the stack and check if it matches the required opening bracket. If not, return false.
   - If it is an opening bracket, push it onto the stack.
3. At the end, return true only if the stack is completely empty.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(n)",
            codeSnippet: `function isValid(s: string): boolean {
    const stack: string[] = [];
    const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (char in pairs) {
            if (stack.pop() !== pairs[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}`,
            createdAt: Date.now() - 86400000
        },
        {
            id: "starter-4",
            title: "53. Maximum Subarray (Kadane's)",
            difficulty: "Medium" as const,
            tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
            url: "https://leetcode.com/problems/maximum-subarray/",
            question: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
            answer: `Kadane's Algorithm: at each position i, decide whether to add nums[i] to the current running subarray sum or start a fresh subarray at nums[i].

1. currentSum = nums[0], maxSum = nums[0].
2. For i from 1 to nums.length - 1:
   - currentSum = max(nums[i], currentSum + nums[i])
   - maxSum = max(maxSum, currentSum)
3. Return maxSum.`,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            codeSnippet: `function maxSubArray(nums: number[]): number {
    let currentSum = nums[0];
    let maxSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}`,
            createdAt: Date.now() - 86400000
        },
        {
            id: "starter-5",
            title: "15. 3Sum",
            difficulty: "Medium" as const,
            tags: ["Array", "Two Pointers", "Sorting"],
            url: "https://leetcode.com/problems/3sum/",
            question: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.",
            answer: `Sort the array, fix one element, and use Two Pointers to find the remaining pair.

1. Sort nums in ascending order.
2. Iterate i from 0 to n-3. Skip duplicates (nums[i] === nums[i-1]).
3. If nums[i] > 0, break early because all remaining elements are positive.
4. Set left = i + 1, right = n - 1.
5. While left < right:
   - sum = nums[i] + nums[left] + nums[right]
   - If sum === 0: push triplet, increment left and decrement right while skipping duplicates.
   - If sum < 0: left++
   - If sum > 0: right--`,
            timeComplexity: "O(n^2)",
            spaceComplexity: "O(1) extra space (excluding output)",
            codeSnippet: `function threeSum(nums: number[]): number[][] {
    nums.sort((a, b) => a - b);
    const res: number[][] = [];
    for (let i = 0; i < nums.length - 2; i++) {
        if (nums[i] > 0) break;
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        let l = i + 1, r = nums.length - 1;
        while (l < r) {
            const sum = nums[i] + nums[l] + nums[r];
            if (sum === 0) {
                res.push([nums[i], nums[l], nums[r]]);
                while (l < r && nums[l] === nums[l + 1]) l++;
                while (l < r && nums[r] === nums[r - 1]) r--;
                l++; r--;
            } else if (sum < 0) {
                l++;
            } else {
                r--;
            }
        }
    }
    return res;
}`,
            createdAt: Date.now() - 86400000
        },
        {
            id: "starter-6",
            title: "200. Number of Islands",
            difficulty: "Medium" as const,
            tags: ["Graph", "BFS", "DFS", "Matrix"],
            url: "https://leetcode.com/problems/number-of-islands/",
            question: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
            answer: `Traverse each cell. Whenever an unvisited land cell '1' is encountered, increment the island count and sink the entire connected island using DFS/BFS (changing '1's to '0's or marking visited).

1. Initialize count = 0.
2. For each row r and col c in grid:
   - If grid[r][c] === '1':
     - count++
     - dfs(r, c) to sink all connected 4-directional land cells.
3. In dfs(r, c):
   - Base case: out of bounds or grid[r][c] !== '1' -> return.
   - Set grid[r][c] = '0'.
   - Recurse in 4 directions: (r+1,c), (r-1,c), (r,c+1), (r,c-1).`,
            timeComplexity: "O(m * n)",
            spaceComplexity: "O(m * n) recursion stack worst case",
            codeSnippet: `function numIslands(grid: string[][]): number {
    let count = 0;
    const m = grid.length, n = grid[0].length;
    function dfs(r: number, c: number) {
        if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== '1') return;
        grid[r][c] = '0'; // sink cell
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    }
    for (let r = 0; r < m; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c] === '1') {
                count++;
                dfs(r, c);
            }
        }
    }
    return count;
}`,
            createdAt: Date.now() - 86400000
        }
    ];

    return starterData.map((data, index) => ({
        ...data,
        fsrs: defaultFSRSCards[index]
    }));
}
