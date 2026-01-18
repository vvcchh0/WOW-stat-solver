/**
 * @file utils.js
 * @description 
 * [数学核心模块]
 * 包含所有与游戏机制相关的数学公式：
 * 1. 拟合收益计算 (多项式)
 * 2. 面板百分比换算 (含递减衰减 DR)
 * 3. 总分评估逻辑
 */

const Utils = {
  /**
   * [底层原子操作] 计算分段函数中某一段的多项式值
   * 公式: f(x) = a2*x^2 + a1*x + a0
   * @param {number} x - 用户分配的绿字数值
   */
  evalPoly(x, a2, a1, a0) {
    return a2 * x * x + a1 * x + a0;
  },

  /**
   * [逻辑寻址] 根据当前绿字数值，确定其落在哪一个拟合区间
   * 采用 O(n) 线性扫描，寻找第一个 limit 大于 x 的区间
   */
  getActiveInterval(statKey, x) {
    const intervals = state.stats[statKey].intervals;
    if (!intervals || intervals.length === 0) return null;

    for (let i = 0; i < intervals.length; i++) {
      if (x <= intervals[i].limit) return intervals[i];
    }
    return intervals[intervals.length - 1]; // 溢出上限时取最后一段
  },

  /**
   * [收益计算] 计算特定属性在分配 x 点数值时的即时倍率
   * 该值直接用于 Solver 贪心算法的权重比较
   */
  getMultiplier(statKey, x) {
    const interval = this.getActiveInterval(statKey, x);
    if (!interval) return 1.0;
    return this.evalPoly(x, interval.a2, interval.a1, interval.a0);
  },

  /**
   * [核心机制] 实现魔兽世界官方的“收益递减 (DR)”算法
   * 将原始绿字按阶梯扣减：
   * 0-30%: 100% 转化
   * 30-39%: 90% 转化
   * 39-47%: 80% 转化
   * ...以此类推
   */
  ratingToPercent(rating, conversion, baseLimit, stepLimit) {
    let rawPct = rating / conversion;
    let eff = 0; 
    let rem = rawPct;

    // 阶段 0: 100% 转化区间 (基础上限)
    let baseLimitPct = baseLimit / conversion;
    let stepPct = stepLimit / conversion;

    let chunk = Math.min(rem, baseLimitPct);
    eff += chunk;
    rem -= chunk;
    if (rem <= 0) return eff;

    // 阶段 1-4: 每增加 stepLimit 等级，转化率依次下降 10%
    for (let i = 1; i <= 4; i++) {
      chunk = Math.min(rem, stepPct);
      eff += chunk * (1 - i * 0.1);
      rem -= chunk;
      if (rem <= 0) return eff;
    }

    // 阶段 5: 最终保底转化率 (50%)
    eff += rem * 0.5;
    return eff;
  },

  /**
   * [UI 表现] 计算面板最终显示的百分比
   * 注意：statBase (模拟起点) 不消耗预算，但会推挤 DR 区间
   */
  getPanelPercent(statKey, rating) {
    const s = state.stats[statKey];
    const totalR = rating + s.statBase; 
    const config = STAT_CONFIG[statKey];

    return (
      s.basePct +
      this.ratingToPercent(totalR, s.conv, config.base_limit, config.step_limit)
    );
  },

  /**
   * [全局评估] 计算全属性组合后的总收益 (Multiplicative Gain)
   * Solver 优化的终极目标就是最大化此函数返回值
   */
  calculateTotalScore(results) {
    let total = 1.0;
    ["c", "h", "m", "v"].forEach((k) => {
      total *= this.getMultiplier(k, results[k]);
    });
    return total;
  },

  /**
   * 数字格式化工具
   */
  formatNumber(num) {
    return Math.round(num).toLocaleString();
  },
};