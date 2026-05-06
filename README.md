# WoW Stat Solver

魔兽世界绿字最优分配求解器 | WoW Secondary Stat Optimization Solver

---

## 简介

WoW Stat Solver 使用贪心算法和 SimC 拟合数据，求解魔兽世界 DPS 职业在给定绿字预算下的最优属性分配（爆击、急速、精通、全能）。

## 特性

- **贪心算法**：基于等边际收益原理，迭代求解全局最优解
- **SimC 集成**：直接导入 SimulationCraft `dps_plot` 数据，自动分段多项式拟合（线性 R² >= 0.99 或二次）
- **递减机制**：完整实现暴雪官方的 DR 阈值（30%/40%/50%/60%/80% 档位，效率 100%/90%/80%/70%/60%/50%）
- **成长轨迹**：扫描预算 0 至 5000，显示各阶段最优策略（单修/双修/混合）
- **可视化**：四张交互式 Chart.js 图表（分配数值、面板百分比、总收益、边际收益 Delta）
- **隐私保护**：纯客户端运行，无服务器通信

## 快速开始

### 本地版本（离线）

```
1. 浏览器打开 LocalVersion/index.html
2. 导入 SimC dps_plot 数据或手动配置区间
3. 调整总预算滑块获取最优分配
4. 点击"成长模拟"查看全装等区间策略
```

### 在线版本（CDN）

将 `OnlineVersion/` 部署到任意静态文件服务器，依赖从公共 CDN 加载。

## 项目结构

```
.
├── LocalVersion/          # 自包含离线版本
│   ├── index.html
│   ├── js/
│   │   ├── config.js      # 状态管理、I18N、配置导入导出
│   │   ├── utils.js       # DR 机制、收益计算、面板转换
│   │   ├── solver.js      # 贪心算法、SimC 拟合、轨迹生成
│   │   ├── charts.js      # Chart.js 封装
│   │   └── main.js        # 事件绑定、UI 渲染、模态框管理
│   └── css/
│       └── vendor/        # 字体、图标
├── OnlineVersion/         # CDN 依赖版本
│   ├── index.html
│   └── js/                # 与 LocalVersion 相同
├── examples/              # 示例配置（冰法/鸟德/湮灭）
├── docs/                  # 用户手册（PDF）
└── README.md
```

## 核心模块

| 模块 | 行数 | 职责 |
|------|------|------|
| `config.js` | 365 | 静态常量、全局状态 (`state`)、导入导出 |
| `utils.js` | 308 | 多项式求值、DR 应用、面板百分比转换 |
| `solver.js` | 653 | 贪心分配、SimC 解析、轨迹生成 |
| `charts.js` | 472 | 图表初始化、更新、图例自定义 |
| `main.js` | 1518 | 事件绑定、卡片渲染、模态框管理 |

## 依赖

| 库 | 用途 | 许可证 |
|----|------|--------|
| Tailwind CSS | 原子化样式 | MIT |
| Chart.js | 环形图/折线图 | MIT |
| KaTeX | 数学公式渲染 | MIT |
| marked.js | Markdown 解析 | MIT |
| Google Fonts | Inter, JetBrains Mono | SIL OFL |
| Font Awesome | 图标 | CC BY 4.0 |

## 配置格式

导出的配置文件使用键值对格式：

```
version: 1.7.0
timestamp: 2026-03-15 14:30:00
#comments: 可选的 Markdown 注释
c_base: 0
c_intervals: 7000|0,0.00022,1.0;14000|0.00018,1.0;...
h_base: 0
h_intervals: ...
```

## 数学模型

总伤害的乘法模型：

```
D = D₀ × C(c) × H(h) × M(m) × V(v)
```

最优性条件（等边际收益）：

```
∂C/(C·∂c) = ∂H/(H·∂h) = ∂M/(M·∂m) = ∂V/(V·∂v)
```

贪心算法在相对收益递减前提下收敛到全局最优。完整推导见 `docs/`。

## 示例

`examples/` 目录提供预配置的职业示例：

- `冰法/` - 冰霜法师
- `鸟德/` - 平衡德鲁伊
- `湮灭/` - 湮灭唤魔师

每个目录包含示例配置文件和 SimC 字符串。

## 文档

用户手册（含理论体系，和操作指南）：`docs/基于SimulationCraft的魔兽世界DPS绿字连续模型分析与求解方法.pdf`

## 局限性

1. **装备离散性**：求解连续预算，未考虑装备槽的离散性
2. **生存属性**：全能生存端收益未建模（可使用锁定功能手动覆盖）
3. **坦克/治疗**：承伤/治疗需要窗口期分析，本方法不适用
4. **团队增益**：增辉龙 rdps 需要团队模拟环境
5. **SimC 依赖**：拟合质量依赖 SimC 数据准确性；R² >= 0.99 阈值过滤噪声但无法检测系统偏差

## 许可证

MIT License. 详见 [LICENSE](LICENSE) 文件。

## 第三方声明

本项目使用以下开源库：

| 库 | 许可证 | 版权 |
|----|--------|------|
| Chart.js | MIT | Copyright (c) Chart.js Contributors |
| KaTeX | MIT | Copyright (c) Khan Academy |
| marked.js | MIT | Copyright (c) MarkedJS Contributors |
| Tailwind CSS | MIT | Copyright (c) Tailwind Labs Inc. |
| Font Awesome | CC BY 4.0 | Font Awesome by Fonticons Inc. |
| Google Fonts (Inter, JetBrains Mono) | SIL OFL | Copyright (c) Google Inc. |

---

## Overview

WoW Stat Solver calculates optimal secondary stat distributions (Critical Strike, Haste, Mastery, Versatility) for DPS specs using a greedy algorithm with segmented polynomial fitting of SimC data.

## Features

- **Greedy Algorithm**: Iteratively allocates stat points to the highest marginal gain, converging to global optimum under diminishing returns
- **SimC Integration**: Import `dps_plot` data from SimulationCraft with automatic piecewise fitting (linear R² >= 0.99 or quadratic)
- **Diminishing Returns**: Full implementation of Blizzard's DR tiers (30%/40%/50%/60%/80% thresholds with 100%/90%/80%/70%/60%/50% efficiency)
- **Growth Trajectory**: Scan budgets from 0 to 5000 rating, displaying optimal strategies per phase (single-stat/dual-stat/hybrid)
- **Visualization**: Four interactive Chart.js charts (rating allocation, panel percentages, total yield, marginal gain delta)
- **Privacy**: Runs entirely client-side, no server communication

## Quick Start

### Local Version (Offline)

```
1. Open LocalVersion/index.html in browser
2. Import SimC dps_plot data or manually configure intervals
3. Adjust total budget slider for optimal distribution
4. Click "Trajectory" for growth simulation across item levels
```

### Online Version (CDN)

Host `OnlineVersion/` on any static file server. Dependencies load from public CDNs.

## Core Modules

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `config.js` | 365 | Static constants, global state (`state`), import/export |
| `utils.js` | 308 | Polynomial evaluation, DR application, panel conversion |
| `solver.js` | 653 | Greedy allocation, SimC parsing, trajectory generation |
| `charts.js` | 472 | Chart initialization, updates, legend customization |
| `main.js` | 1518 | Event binding, UI rendering, modal management |

## Dependencies

| Library | Purpose | License |
|---------|---------|---------|
| Tailwind CSS | Utility-first styling | MIT |
| Chart.js | Doughnut/line charts | MIT |
| KaTeX | Math formula rendering | MIT |
| marked.js | Markdown parsing | MIT |
| Google Fonts | Inter, JetBrains Mono | SIL OFL |
| Font Awesome | Icons | CC BY 4.0 |

## Configuration Format

Exported configs use key-value pairs:

```
version: 1.7.0
timestamp: 2026-03-15 14:30:00
#comments: Optional notes in Markdown
c_base: 0
c_intervals: 7000|0,0.00022,1.0;14000|0.00018,1.0;...
h_base: 0
h_intervals: ...
```

## Mathematical Model

Total damage as multiplicative model:

```
D = D₀ × C(c) × H(h) × M(m) × V(v)
```

Optimality condition (equal marginal gains):

```
∂C/(C·∂c) = ∂H/(H·∂h) = ∂M/(M·∂m) = ∂V/(V·∂v)
```

Greedy algorithm converges under diminishing relative returns. See `docs/` for full derivation.

## Examples

Check `examples/` for pre-configured specs:

- `冰法/` - Frost Mage
- `鸟德/` - Balance Druid
- `湮灭/` - Devastation Evoker

Each directory contains sample config files with SimC strings.

## Documentation

User manual with theoretical foundation and usage guide: `docs/基于SimulationCraft的魔兽世界DPS绿字连续模型分析与求解方法.pdf`

## Limitations

1. **Gear Discreteness**: Solves continuous budget, not discrete gear slots
2. **Survival Stats**: Vengeance DPS survival value not modeled (use lock feature for manual override)
3. **Tank/Healer**: T/HPS modeling requires windowed analysis, not supported
4. **Team Buffs**: Evoker rdps requires team simulation environment
5. **SimC Dependency**: Fit quality depends on SimC accuracy; R² >= 0.99 threshold filters noise but not systematic bias

## License

MIT License. See [LICENSE](LICENSE) file.

## Third-Party Notices

This project includes the following open-source libraries:

| Library | License | Copyright |
|---------|---------|-----------|
| Chart.js | MIT | Copyright (c) Chart.js Contributors |
| KaTeX | MIT | Copyright (c) Khan Academy |
| marked.js | MIT | Copyright (c) MarkedJS Contributors |
| Tailwind CSS | MIT | Copyright (c) Tailwind Labs Inc. |
| Font Awesome | CC BY 4.0 | Font Awesome by Fonticons Inc. |
| Google Fonts (Inter, JetBrains Mono) | SIL OFL | Copyright (c) Google Inc. |
