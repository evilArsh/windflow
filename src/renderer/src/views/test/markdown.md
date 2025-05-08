# 以下是 JavaScript 实现的快速排序算法，包含详细注释和示例：

测试段落

1. 1段落
2. 2段落
   1. 3-1段落
   2. 3-2段落

   3. ```javascript
      function quickSort(arr) {
        if (arr.length <= 1) {
          return arr;
        }
      }
      ```

## 快速排序实现

```javascript
function quickSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }
}
const nums = [3, 6, 8, 10, 1, 2, 1];
console.log(quickSort(nums));
```

## 关键点解析

1. **分治思想**：
   - 选择一个基准值（pivot）将数组分成两个子数组
   - 左边所有元素 ≤ pivot，右边所有元素 ≥ pivot

2. **时间复杂度**：
   - 平均：O(n log n)
   - 最差（已排序数组且选错pivot时）：O(n²)

## 原地排序版本（节省空间）

```javascript
function quickSortInPlace(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return;
  const pivotIndex = partition(arr, left, right);
  quickSortInPlace(arr, left, pivotIndex - 1);
  quickSortInPlace(arr, pivotIndex + 1, right);
  return arr;
}
```

## 对比其他排序

| 算法     | 时间复杂度（平均） | 是否稳定 | 空间复杂度 |
| -------- | ------------------ | -------- | ---------- |
| 快速排序 | O(n log n)         | 不稳定   | O(log n)   |
| 归并排序 | O(n log n)         | 稳定     | O(n)       |
| 冒泡排序 | O(n²)              | 稳定     | O(1)       |

快速排序是实际应用中最快的排序算法之一，V8引擎的 `Array.prototype.sort()` 就使用了快速排序的变体

end
