```json
{
  "pnpm": {
    "overrides": {
      "decode-named-character-reference": "file:./path/to/your-implementation"
    }
  }
}
```

根据你的依赖树， 被多个 markdown 处理相关的包使用。要让所有依赖使用你指定的实现，有几种方法：

## 方法一：使用 pnpm 的 overrides（推荐）

在 `package.json` 中添加 `pnpm.overrides`：

```json
{
  "pnpm": {
    "overrides": {
      "decode-named-character-reference": "file:./path/to/your-implementation"
    }
  }
}
```

# JavaScript快速排序动画实现

我将创建一个直观的快速排序算法可视化工具，展示算法每一步的执行过程。

## 设计思路

1. 创建随机数组并可视化显示
2. 实现快速排序算法，并在关键步骤添加动画效果
3. 添加控制面板控制动画速度、暂停/继续等功能
4. 高亮显示当前比较的元素、基准元素和已排序部分

下面是完整的实现代码：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>快速排序算法动画演示</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e6e6e6;
            min-height: 100vh;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .container {
            max-width: 1200px;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        header {
            text-align: center;
            margin-bottom: 30px;
            width: 100%;
        }

        h1 {
            font-size: 2.8rem;
            margin-bottom: 10px;
            background: linear-gradient(90deg, #00dbde, #fc00ff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .subtitle {
            font-size: 1.2rem;
            color: #a0a0c0;
            margin-bottom: 20px;
        }

        .content {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 30px;
            width: 100%;
            margin-bottom: 30px;
        }

        .visualization {
            flex: 1;
            min-width: 300px;
            max-width: 800px;
            background: rgba(30, 30, 46, 0.8);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .array-container {
            height: 400px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding: 20px;
            border-radius: 10px;
            background: rgba(20, 20, 35, 0.7);
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
        }

        .array-bar {
            margin: 0 2px;
            background: #4cc9f0;
            border-radius: 3px 3px 0 0;
            transition: all 0.3s ease;
            position: relative;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            padding-top: 5px;
        }

        .controls {
            flex: 0 0 300px;
            background: rgba(30, 30, 46, 0.8);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .control-group {
            margin-bottom: 25px;
        }

        h2 {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #72efdd;
            border-bottom: 2px solid #4361ee;
            padding-bottom: 8px;
        }

        .slider-container {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #b8b8d0;
        }

        input[type="range"] {
            width: 100%;
            height: 8px;
            -webkit-appearance: none;
            background: #2d2d44;
            border-radius: 4px;
            outline: none;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4361ee;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(67, 97, 238, 0.5);
        }

        .buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 25px;
        }

        button {
            flex: 1;
            min-width: 120px;
            padding: 14px 20px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .primary-btn {
            background: linear-gradient(90deg, #4361ee, #3a0ca3);
            color: white;
        }

        .primary-btn:hover {
            background: linear-gradient(90deg, #3a56d4, #2f0a8a);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(67, 97, 238, 0.4);
        }

        .secondary-btn {
            background: rgba(67, 97, 238, 0.2);
            color: #72efdd;
            border: 1px solid #4361ee;
        }

        .secondary-btn:hover {
            background: rgba(67, 97, 238, 0.3);
            transform: translateY(-2px);
        }

        .info-panel {
            background: rgba(20, 20, 35, 0.7);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }

        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .info-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .legend {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 15px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 3px;
        }

        .algorithm-explanation {
            max-width: 800px;
            background: rgba(30, 30, 46, 0.8);
            border-radius: 15px;
            padding: 25px;
            margin-top: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .step {
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .pivot {
            background-color: #f72585 !important;
        }

        .comparing {
            background-color: #ff9e00 !important;
        }

        .sorted {
            background-color: #4ade80 !important;
        }

        .less-than-pivot {
            background-color: #3a86ff !important;
        }

        .greater-than-pivot {
            background-color: #ff006e !important;
        }

        .current-array {
            background-color: rgba(255, 255, 255, 0.1) !important;
        }

        .current-step {
            font-size: 1.1rem;
            font-weight: bold;
            color: #72efdd;
            margin-bottom: 10px;
            min-height: 24px;
        }

        @media (max-width: 768px) {
            .content {
                flex-direction: column;
            }

            .visualization, .controls {
                max-width: 100%;
            }

            h1 {
                font-size: 2.2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>快速排序算法动画演示</h1>
            <p class="subtitle">可视化展示快速排序算法的分治过程，观察每一步如何选取基准元素并分区</p>
        </header>

        <div class="content">
            <div class="visualization">
                <h2>排序过程可视化</h2>
                <div class="current-step">点击"开始排序"按钮启动动画</div>
                <div class="array-container" id="arrayContainer"></div>

                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #f72585;"></div>
                        <span>基准元素 (Pivot)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #ff9e00;"></div>
                        <span>正在比较的元素</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #3a86ff;"></div>
                        <span>小于基准的元素</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #ff006e;"></div>
                        <span>大于基准的元素</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background-color: #4ade80;"></div>
                        <span>已排序的元素</span>
                    </div>
                </div>
            </div>

            <div class="controls">
                <h2>控制面板</h2>

                <div class="control-group">
                    <div class="slider-container">
                        <label for="arraySize">数组大小: <span id="arraySizeValue">15</span></label>
                        <input type="range" id="arraySize" min="5" max="30" value="15">
                    </div>

                    <div class="slider-container">
                        <label for="speed">动画速度: <span id="speedValue">中速</span></label>
                        <input type="range" id="speed" min="1" max="5" value="3">
                    </div>
                </div>

                <div class="buttons">
                    <button id="startBtn" class="primary-btn">
                        <span>开始排序</span>
                    </button>
                    <button id="pauseBtn" class="secondary-btn" disabled>
                        <span>暂停</span>
                    </button>
                    <button id="resetBtn" class="secondary-btn">
                        <span>重置数组</span>
                    </button>
                </div>

                <div class="info-panel">
                    <h2>排序信息</h2>
                    <div class="info-item">
                        <span>比较次数:</span>
                        <span id="comparisons">0</span>
                    </div>
                    <div class="info-item">
                        <span>交换次数:</span>
                        <span id="swaps">0</span>
                    </div>
                    <div class="info-item">
                        <span>递归深度:</span>
                        <span id="depth">0</span>
                    </div>
                    <div class="info-item">
                        <span>当前状态:</span>
                        <span id="status">等待开始</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="algorithm-explanation">
            <h2>快速排序算法原理</h2>
            <div class="step">1. <strong>选择基准元素</strong>：从数组中选择一个元素作为基准（pivot）</div>
            <div class="step">2. <strong>分区操作</strong>：重新排列数组，所有比基准值小的元素放在基准前面，比基准值大的元素放在基准后面</div>
            <div class="step">3. <strong>递归排序</strong>：递归地将小于基准值的子数组和大于基准值的子数组排序</div>
            <div class="step">4. <strong>合并结果</strong>：当子数组长度为1或0时，递归结束，此时整个数组已经排序完成</div>
            <div class="step"><strong>时间复杂度</strong>：平均情况 O(n log n)，最坏情况 O(n²)</div>
        </div>
    </div>

    <script>
        // 全局变量
        let array = [];
        let animationSpeed = 300;
        let isSorting = false;
        let isPaused = false;
        let animationQueue = [];
        let comparisons = 0;
        let swaps = 0;
        let maxDepth = 0;
        let currentDepth = 0;

        // DOM元素
        const arrayContainer = document.getElementById('arrayContainer');
        const arraySizeSlider = document.getElementById('arraySize');
        const arraySizeValue = document.getElementById('arraySizeValue');
        const speedSlider = document.getElementById('speed');
        const speedValue = document.getElementById('speedValue');
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const comparisonsElement = document.getElementById('comparisons');
        const swapsElement = document.getElementById('swaps');
        const depthElement = document.getElementById('depth');
        const statusElement = document.getElementById('status');
        const currentStepElement = document.querySelector('.current-step');

        // 初始化
        function init() {
            generateArray();
            renderArray();
            setupEventListeners();
            updateInfo();
        }

        // 生成随机数组
        function generateArray() {
            const size = parseInt(arraySizeSlider.value);
            array = [];
            for (let i = 0; i < size; i++) {
                array.push(Math.floor(Math.random() * 95) + 5); // 5-100之间的随机数
            }
        }

        // 渲染数组到DOM
        function renderArray(highlightIndices = {}, currentSubarray = null) {
            arrayContainer.innerHTML = '';
            const containerWidth = arrayContainer.clientWidth;
            const containerHeight = arrayContainer.clientHeight;
            const barWidth = Math.max(10, (containerWidth / array.length) - 4);

            for (let i = 0; i < array.length; i++) {
                const bar = document.createElement('div');
                bar.className = 'array-bar';
                bar.style.height = `${(array[i] / 100) * (containerHeight - 40)}px`;
                bar.style.width = `${barWidth}px`;
                bar.textContent = array[i];

                // 应用高亮
                if (highlightIndices.pivot === i) {
                    bar.classList.add('pivot');
                } else if (highlightIndices.comparing === i) {
                    bar.classList.add('comparing');
                } else if (highlightIndices.sorted && highlightIndices.sorted.includes(i)) {
                    bar.classList.add('sorted');
                } else if (highlightIndices.lessThanPivot && highlightIndices.lessThanPivot.includes(i)) {
                    bar.classList.add('less-than-pivot');
                } else if (highlightIndices.greaterThanPivot && highlightIndices.greaterThanPivot.includes(i)) {
                    bar.classList.add('greater-than-pivot');
                }

                // 标记当前子数组
                if (currentSubarray && i >= currentSubarray.start && i <= currentSubarray.end) {
                    bar.style.boxShadow = 'inset 0 0 0 2px rgba(255, 255, 255, 0.3)';
                }

                arrayContainer.appendChild(bar);
            }
        }

        // 设置事件监听器
        function setupEventListeners() {
            arraySizeSlider.addEventListener('input', function() {
                arraySizeValue.textContent = this.value;
                if (!isSorting) {
                    resetSort();
                }
            });

            speedSlider.addEventListener('input', function() {
                const speedMap = {
                    1: {text: '极慢', value: 800},
                    2: {text: '慢速', value: 500},
                    3: {text: '中速', value: 300},
                    4: {text: '快速', value: 150},
                    5: {text: '极快', value: 50}
                };
                const speed = speedMap[this.value];
                speedValue.textContent = speed.text;
                animationSpeed = speed.value;
            });

            startBtn.addEventListener('click', startSorting);
            pauseBtn.addEventListener('click', togglePause);
            resetBtn.addEventListener('click', resetSort);
        }

        // 开始排序
        function startSorting() {
            if (isSorting) return;

            isSorting = true;
            isPaused = false;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            arraySizeSlider.disabled = true;
            statusElement.textContent = '排序中...';

            // 重置计数
            comparisons = 0;
            swaps = 0;
            maxDepth = 0;
            currentDepth = 0;
            animationQueue = [];

            // 执行快速排序并收集动画步骤
            const arrayCopy = [...array];
            quickSort(arrayCopy, 0, arrayCopy.length - 1, 0);

            // 添加最终排序完成的步骤
            animationQueue.push({
                action: 'sorted',
                array: [...
```
