为了优化代码结构并提高可维护性，我已根据你提供的文件架构，将 `<script>` 标签中的所有逻辑进行了模块化拆分。

以下是归类整理后的方案：

---

### 1. `js/config.js`

**职责**：存放静态配置、多语言文本和属性的基础常数。

* **I18N**: 多语言字典对象。
* **STAT_CONFIG**: 包含属性颜色、图标、默认转化率和导出名称的常量。
* **DEF_A2 / DEF_A1 / DEF_A0**: 二次项/一次项/常量的默认值。
* **state**: 全局状态机初始对象。

---

### 2. `js/utils.js`

**职责**：纯数学计算、格式化工具以及与业务逻辑解耦的辅助函数。

* **evalPoly(x, a2, a1, a0)**: 多项式求值。
* **getActiveInterval(statKey, x)**: 确定当前数值落在哪个分段区间。
* **getMultiplier(statKey, x)**: 计算特定属性在特定数值下的收益倍率。
* **getDRTiers(statKey)**: 获取包含精通缩放逻辑的递减阈值表。
* **ratingToPercent(rating, statKey)**: 处理魔兽世界官方的衰减（DR）机制转换逻辑 (Rating -> %)。
* **percentToRating(percent, statKey)**: 逆向计算逻辑 (% -> Rating)。
* **getPanelPercent(statKey, rating)**: 获取面板最终显示的百分比。
* **getPanelRating(statKey, panelPercent)**: 逆向计算面板对应的总 Rating。
* **calculateTotalScore(results)**: 计算所有属性乘积后的总评分。

---

### 3. `js/solver.js`

**职责**：核心算法逻辑、数据模拟以及 SimC 原始数据的解析拟合。

* **solveOptimalDistribution(targetBudget)**: 核心贪心算法实现，用于寻找最优分配。
* **runSolver()**: 调用算法并触发 UI 更新。
* **generateTrajectory()**: 循环执行算法以生成不同预算下的成长轨迹数据。
* **handleSimFileSelect(input)**: 解析 SimC 导出的 CSV/TXT 数据。
* **ConfigManager (Object)**: 包含 `export`, `import`, `parse` 等配置文件处理逻辑。
* **拟合逻辑相关**: 内部包含的线性回归（R²）和二阶多项式拟合计算。

---

### 4. `js/charts.js`

**职责**：所有 Chart.js 实例的初始化、销毁与重绘逻辑。

* **updateCharts()**: 更新主页面的两个环形图。
* **generateLegendLabels(chart)**: 自定义图表图例显示格式。
* **renderPercentTrajChart(...)**: 渲染百分比成长曲线图。
* **renderTrajectoryChart(...)**: 渲染数值分配路线图。
* **renderYieldTrajChart(...)**: 渲染总收益增长图。
* **renderDeltaTrajChart(...)**: 渲染边际收益变化图。
* **updateSimPreviewChart()**: SimC 导入时的预览拟合效果图。

---

### 5. `js/main.js`

**职责**：DOM 事件监听、UI 渲染控制、模态框交互及应用初始化。

* **initStats(useDefaults)**: 应用启动入口。
* **toggleLanguage() / updateLanguageUI()**: 语言切换及 DOM 文本刷新。
* **renderCards() / renderStatCard(key)**: 动态生成属性配置卡片的 HTML 结构。
* **renderCustomInputs()**: 渲染右侧手动对比区域的输入框。
* **setMode(mode)**: 切换“分配值/最终百分比”显示模式。
* **updateUI() / updateComparison()**: 将计算结果同步到页面 DOM 元素上。
* **模态框管理函数**:
* `openSimImportModal` / `closeSimImportModal`
* `openTrajectoryModal` / `closeTrajectoryModal`
* `openBaseModal` / `closeBaseModal`


* **syncOptimal()**: 将最优解同步至自定义对比区。
* **addInterval / removeInterval / saveBaseSettings**: 修改底层配置并触发重绘。

---

### 建议的文件加载顺序

在 `index.html` 底部，请务必按照以下顺序引入，以确保依赖关系正确：

```html
<script src="js/config.js"></script>
<script src="js/utils.js"></script>

<script src="js/solver.js"></script>
<script src="js/charts.js"></script>

<script src="js/main.js"></script>

```

**下一步建议：** 你需要我为你提取其中某一个文件的具体代码实现吗？（例如将核心的 `solver.js` 提取出来）