# Project Status & Development Log

**Last Updated:** 2026-03-12
**Project:** WoW Stat Solver - 绿字最优分配求解器
**Current Version:** v1.5.0-MID
**Contributor:** Qwen Code

---

## 📁 项目结构

```
WOW stat solver/
├── index.html              # 入口页面
├── README.md               # 项目说明
├── principle.md            # 算法原理文档
├── ProjectStatus_byQwen.md # 本文件 - 开发状态日志
├── ProjectLogic.txt        # 完整代码逻辑分析（技术细节）
│
├── LocalVersion/           # 离线版本 - 零依赖
│   ├── index.html
│   ├── changelog.md
│   └── js/
│       ├── config.js       # 配置与状态定义
│       ├── utils.js        # 数学核心（多项式/DR/收益计算）
│       ├── solver.js       # 优化算法（贪婪算法/SimC 拟合）
│       ├── charts.js       # 图表可视化
│       └── main.js         # DOM 交互入口
│
└── OnlineVersion/          # 在线版本 - CDN 依赖
    ├── index.html
    ├── changelog.md
    └── js/                 # 与 LocalVersion 逻辑同步
```

---

## 🎯 核心算法原理

### 数学模型
```
总伤害：D = D₀ × C × H × M × V
最优条件：∂C/(C∂c) = ∂H/(H∂h) = ∂M/(M∂m) = ∂V/(V∂v)
```

### 贪婪算法
- **步长序列**: `[100, 1]`（从粗到细）
- **预算保留**: 非最后一步要求 `available >= step × 2`，确保精度
- **相对增益**: `gain = nextM / curM`

### 延拓修正（Extension）
**目的**: 修正 SimC 分段拟合在断点处的跳变

**公式**:
```
gain = (nextM / curM) × (pM1 / pM2)

其中:
  pM1 = 断点前区间在 limit 处的 multiplier
  pM2 = 断点后区间在 limit 处的 multiplier
```

### smoothScores 累积修正
**目的**: 消除 Delta 图的断点尖峰

**原理**: 利用差分的齐次性 Δ(k·f) = k·Δ(f)

**实现**:
```javascript
// 累积应用所有已跨越断点的修正因子
breakpoints[k].forEach((bp) => {
  if (val > bp.limit) {
    smoothTotal *= bp.factor;  // factor = pM1/pM2
  }
});
```

---

## 📝 开发日志

### [2026-03-12] SimC 导入格式验证

#### 问题背景
用户经常用 Excel 打开并保存 SimC 导出的 CSV 文件，导致：
1. **行尾空列**：Excel 用空列补齐每行
2. **空格丢失**：原始格式 `", "` 变为 `","`，导致千位分隔符解析错误

#### 解决方案
**格式检测**：
- `hasTrailingCommas`：检测行尾连续逗号
- `hasNoSpacesAfterCommas`：检测逗号后是否缺少空格

**用户提示**：弹出警告并提供建议
- 使用原始 SimC 导出的 CSV 文件
- 或选择 CSV UTF-8 格式并移除千位分隔符

#### 文件修改
| 文件 | 修改内容 |
|-----|---------|
| `solver.js` | 添加 Excel 格式检测逻辑 |
| `changelog.md` | 更新 v1.5.0-MID 发布说明 |

---

### [2026-02-28] 断点跳变本质修正

#### 问题背景
SimC 分段拟合在断点处不连续，导致：
1. 贪婪算法的 gain 计算在跨越断点时出现跳变
2. Delta 图（边际收益）出现尖峰

#### 解决方案

**1. 延拓修正（算法层）**
- 新增 `utils.js` 三个函数：
  - `getBreakpoints(statKey)` - 获取断点列表
  - `checkBreakpointCrossing(statKey, curX, nextX)` - 检测断点跨越
  - `getGainWithExtension(statKey, curX, nextX)` - 延拓增益计算
- 修改 `solver.js` 的 `solveOptimalDistribution`，使用延拓增益

**2. smoothScores 累积修正（可视化层）**
- 修复 `generateTrajectory` 的修正逻辑
- 从"仅修正跨越点"改为"累积修正所有已跨越点"
- 数学原理：Δ(k·f) = k·Δ(f)

#### 配置格式确认
- template.txt 中的 `RANGEMAX` 是**相对值**
- 实际断点位置 = `RANGEMAX + STAT BASE RATING`

#### 文件修改
| 文件 | 修改内容 |
|-----|---------|
| `utils.js` | 新增 3 个延拓函数 |
| `solver.js` | 延拓 gain 计算 + smoothScores 累积修正 |
| `charts.js` | 更新注释 |
| `ProjectLogic.txt` | 新增第 11 章（延拓修正）和第 11.9 节（smoothScores 演进） |

---

### [2026-01-28] 算法收敛性优化

#### 改进
- **步长简化**: 从 `[100, 25, 5, 1]` 简化为 `[100, 1]`
- **预算保留机制**: 非最后一步要求 `available >= step × 2`
- **Delta 图平滑**: 实现"平行平滑"技术，消除 SimC 断点人工尖峰

#### 修复
- `openTrajectoryModal` 中的 `traj is not defined` 错误

---

### [2026-01-25] DR 机制增强

#### 新增
- **自定义 DR 曲线**: 30-40%@0.9, 40-50%@0.8, 50-60%@0.7, 60-80%@0.6, 80-200%@0.5
- **精通缩放**: 根据精通转化率相对于爆击的比例缩放 DR 阈值
- **逆向计算**: `getPanelRating`, `percentToRating`
- **多语言支持**: 图表标题和策略阶段标签的中文化

---

## 🔧 核心模块职责

| 模块 | 职责 | 核心函数 |
|-----|------|---------|
| **config.js** | 配置与状态定义 | `I18N`, `STAT_CONFIG`, `state` |
| **utils.js** | 数学核心 | `evalPoly`, `getMultiplier`, `ratingToPercent`, `getGainWithExtension` |
| **solver.js** | 优化算法 | `solveOptimalDistribution`, `processSimData`, `generateTrajectory` |
| **charts.js** | 可视化 | `updateCharts`, `renderDeltaTrajChart`, `renderTrajectoryChart` |
| **main.js** | DOM 交互 | `updateUI`, `renderCards`, `setBudget`, `toggleLanguage` |

---

## 📊 数据流

```
用户操作
   ↓
main.js 事件处理 → 修改 state
   ↓
Solver.runSolver()
   ├─ solveOptimalDistribution() [贪婪算法 + 延拓修正]
   │   └─ Utils.getGainWithExtension() [断点修正]
   └─ 更新 state.optResults
   ↓
updateUI()
   ├─ 更新卡片数值/公式
   ├─ ChartManager.updateCharts()
   └─ updateComparison()
```

---

## 🎓 关键概念

### 1. 延拓修正 vs smoothScores 修正

| 特性 | 延拓修正 | smoothScores 修正 |
|-----|---------|-----------------|
| 应用场景 | `solveOptimalDistribution` | `generateTrajectory` |
| 修正对象 | gain 计算 | Delta 图可视化 |
| 修正公式 | `gain × (pM1/pM2)` | `score × (pM1/pM2)` |
| 修正时机 | 实时（每步分配） | 事后（生成轨迹） |
| 修正范围 | 单步增益 | 所有已跨越断点的点（累积） |
| 目的 | 避免断点误导分配 | 消除 Delta 图尖峰 |

### 2. Delta 图平滑的数学原理

**差分的齐次性**:
```
Δ(k·f) = k·Δ(f)

推导:
Delta[i] = Score[i] - Score[i-1]
Delta'[i] = (Score[i]×k) - (Score[i-1]×k)
          = k × (Score[i] - Score[i-1])
          = k × Delta[i]  ← 保持平滑
```

---

## 📋 待办事项

- [ ] 更新 SimC 数据文件至最新版本
- [ ] 特殊饰品/触发效果模拟支持
- [ ] ESM 迁移（低优先级）

---

## 📚 参考文档

| 文档 | 用途 |
|-----|------|
| `principle.md` | 算法原理与数学证明 |
| `ProjectLogic.txt` | 完整代码逻辑分析（技术细节） |
| `ProjectStatus_byQwen.md` | 本文件 - 开发状态摘要 |
| `LocalVersion/changelog.md` | 版本历史 |

---

## 🚀 如何继续开发

1. **阅读本文件**: 了解项目结构和核心算法
2. **查看 ProjectLogic.txt**: 深入了解代码实现细节
3. **验证同步**: 确保新逻辑同时应用于 LocalVersion 和 OnlineVersion
4. **下一步**: 注入新的 SimC 数据文件进行下一版本发布

---

**文档版本**: 2026-02-28  
**维护者**: Qwen Code
