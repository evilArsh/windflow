以下是 JavaScript 实现的快速排序（Quick Sort）算法，包含详细注释和示例：

### 快速排序实现
```javascript
function quickSort(arr) {
  // 基线条件：数组长度小于等于1时直接返回
  if (arr.length <= 1) {
    return arr;
  }

  // 选择基准值（pivot），通常取中间元素
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr[pivotIndex];

  // 分区操作
  const left = [];
  const right = [];
  
  for (let i = 0; i < arr.length; i++) {
    // 跳过基准元素
    if (i === pivotIndex) continue;
    
    // 小于基准的放左边，大于等于的放右边
    arr[i] < pivot ? left.push(arr[i]) : right.push(arr[i]);
  }

  // 递归排序左右子数组，并合并结果
  return [...quickSort(left), pivot, ...quickSort(right)];
}

// 示例用法
const nums = [3, 6, 8, 10, 1, 2, 1];
console.log(quickSort(nums)); // 输出: [1, 1, 2, 3, 6, 8, 10]
```

### 关键点解析
1. **分治思想**：
   - 选择一个基准值（pivot）将数组分成两个子数组
   - 左边所有元素 ≤ pivot，右边所有元素 ≥ pivot

2. **时间复杂度**：
   - 平均：O(n log n)
   - 最差（已排序数组且选错pivot时）：O(n²)

3. **优化方向**：
   ```javascript
   // 优化pivot选择（三数取中法）
   const mid = Math.floor(arr.length / 2);
   const pivot = [arr[0], arr[mid], arr[arr.length - 1]]
     .sort((a, b) => a - b)[1];
   ```

### 原地排序版本（节省空间）
```javascript
function quickSortInPlace(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return;

  const pivotIndex = partition(arr, left, right);
  quickSortInPlace(arr, left, pivotIndex - 1);
  quickSortInPlace(arr, pivotIndex + 1, right);
  return arr;
}

function partition(arr, left, right) {
  const pivot = arr[right];
  let i = left;
  
  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }
  
  [arr[i], arr[right]] = [arr[right], arr[i]];
  return i;
}
```

### 对比其他排序
| 算法       | 时间复杂度（平均） | 是否稳定 | 空间复杂度 |
|------------|------------------|----------|-----------|
| 快速排序   | O(n log n)       | 不稳定   | O(log n)  |
| 归并排序   | O(n log n)       | 稳定     | O(n)      |
| 冒泡排序   | O(n²)            | 稳定     | O(1)      |

快速排序是实际应用中最快的排序算法之一，V8引擎的 `Array.prototype.sort()` 就使用了快速排序的变体（当数组长度 > 10时）。