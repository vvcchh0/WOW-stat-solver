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
   * @param {number} a2 - 二次项系数
   * @param {number} a1 - 一次项系数
   * @param {number} a0 - 常数项
   * @returns {number}
   */
  evalPoly(x, a2, a1, a0) {
    return a2 * x * x + a1 * x + a0;
  },

  /**
   * [逻辑寻址] 根据当前绿字数值，确定其落在哪一个拟合区间
   * 采用 O(n) 线性扫描，寻找第一个 limit 大于 x 的区间
   * @param {string} statKey
   * @param {number} x
   * @returns {Interval|null}
   */
  getActiveInterval(statKey, x) {
    // @ts-ignore
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
   * @param {string} statKey
   * @param {number} x
   * @returns {number}
   */
  getMultiplier(statKey, x) {
    const interval = this.getActiveInterval(statKey, x);
    if (!interval) return 1.0;
    return this.evalPoly(x, interval.a2, interval.a1, interval.a0);
  },

  /**
   * [DR 阈值获取] 获取指定属性的递减阈值 (百分比) 及对应效率
   * 包含精通的特殊缩放逻辑 (按爆击转化比/精通转化比放大)
   * 
   * Tiers (Raw %):
   * 0-30%: 1.0
   * 30-40%: 0.9
   * 40-50%: 0.8
   * 50-60%: 0.7
   * 60-80%: 0.6
   * >80%: 0.5
   * @param {string} statKey
   * @returns {{limit: number, eff: number}[]}
   */
  getDRTiers(statKey) {
    // @ts-ignore
    const critConv = state.stats.c.conv || 700;
    // @ts-ignore
    const myConv = state.stats[statKey].conv || 700;
    
    // 精通缩放系数
    let scale = 1.0;
    if (statKey === 'm') {
      scale = critConv / myConv;
    }

    // 定义原始百分比阈值 (不含 0 起点)
    // 结构: [UpperLimit(%), Efficiency]
    return [
      { limit: 30 * scale, eff: 1.0 },
      { limit: 40 * scale, eff: 0.9 },
      { limit: 50 * scale, eff: 0.8 },
      { limit: 60 * scale, eff: 0.7 },
      { limit: 80 * scale, eff: 0.6 },
      { limit: Infinity, eff: 0.0 }
    ];
  },

  /**
   * [核心机制] 实现魔兽世界官方的“收益递减 (DR)”算法
   * 将原始绿字按阶梯扣减
   * @param {number} rating - 原始绿字等级
   * @param {string} statKey - 属性 Key (c, h, m, v)
   * @returns {number} 转化后的有效百分比
   */
  ratingToPercent(rating, statKey) {
    // @ts-ignore
    const conversion = state.stats[statKey].conv || 700;
    const rawPct = rating / conversion;
    const tiers = this.getDRTiers(statKey);
    
    let eff = 0;
    let processedRaw = 0; // 已处理的 Raw Percent

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const tierStart = i === 0 ? 0 : tiers[i-1].limit;
      const tierWidth = tier.limit - tierStart;
      
      // 当前这一层能容纳多少 raw
      const remainingRaw = Math.max(0, rawPct - processedRaw);
      const chunk = Math.min(remainingRaw, tierWidth);
      
      eff += chunk * tier.eff;
      processedRaw += chunk;
      
      if (rawPct <= tier.limit) break;
    }
    
    return eff;
  },

  /**
   * [核心机制逆运算] 从转化后的百分比反推需要的 Raw Rating
   * @param {number} percent - 期望的转化后有效百分比 (不含面板基础%)
   * @param {string} statKey
   * @returns {number}
   */
  percentToRating(percent, statKey) {
    // @ts-ignore
    const conversion = state.stats[statKey].conv || 700;
    const tiers = this.getDRTiers(statKey);
    
    let remEff = percent;
    let rawPct = 0;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (tier.eff === 0) break; // 之后的效率为 0，无法反推

      const tierStart = i === 0 ? 0 : tiers[i-1].limit;
      const tierRawWidth = tier.limit - tierStart;
      const tierEffCapacity = tierRawWidth * tier.eff; // 这一层能提供的最大有效百分比

      const chunkEff = Math.min(remEff, tierEffCapacity);
      const chunkRaw = chunkEff / tier.eff; // 反推需要的 Raw
      
      rawPct += chunkRaw;
      remEff -= chunkEff;

      if (remEff <= 0.000001) break;
    }
    
    // 如果还有剩余 eff (溢出 200% 或进入 0 效率区)，则无法通过正常手段获得
    // 这里简单返回当前计算值
    return rawPct * conversion;
  },

  /**
   * [UI 表现] 计算面板最终显示的百分比
   * 注意：statBase (模拟起点) 不消耗预算，但会推挤 DR 区间
   * @param {string} statKey
   * @param {number} rating
   * @returns {number}
   */
  getPanelPercent(statKey, rating) {
    // @ts-ignore
    const s = state.stats[statKey];
    const totalR = rating + s.statBase; 
    
    return s.basePct + this.ratingToPercent(totalR, statKey);
  },

  /**
   * [逆向运算] 根据面板百分比反推需要的总 Rating (含 Base)
   * @param {string} statKey
   * @param {number} panelPercent
   * @returns {number}
   */
  getPanelRating(statKey, panelPercent) {
    // @ts-ignore
    const s = state.stats[statKey];
    const effectivePct = Math.max(0, panelPercent - s.basePct);
    return this.percentToRating(effectivePct, statKey);
  },

  /**
   * [全局评估] 计算全属性组合后的总收益 (Multiplicative Gain)
   * Solver 优化的终极目标就是最大化此函数返回值
   * @param {{c: number, h: number, m: number, v: number}} results
   * @returns {number}
   */
  calculateTotalScore(results) {
    let total = 1.0;
    ["c", "h", "m", "v"].forEach((k) => {
      // @ts-ignore
      total *= this.getMultiplier(k, results[k]);
    });
    return total;
  },

  /**
   * 数字格式化工具
   * @param {number} num
   * @returns {string}
   */
  formatNumber(num) {
    return Math.round(num).toLocaleString();
  },

  /**
   * [断点查询] 获取某属性的所有断点（区间边界）
   * @param {string} statKey
   * @returns {{limit: number, prevInterval: Interval|null, nextInterval: Interval|null}[]}
   */
  getBreakpoints(statKey) {
    // @ts-ignore
    const intervals = state.stats[statKey].intervals;
    if (!intervals || intervals.length < 2) return [];

    const sorted = [...intervals].sort((a, b) => a.limit - b.limit);
    const breakpoints = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      breakpoints.push({
        limit: sorted[i].limit,
        prevInterval: sorted[i],      // 断点前的区间
        nextInterval: sorted[i + 1]   // 断点后的区间
      });
    }

    return breakpoints;
  },

  /**
   * [断点检查] 检查从 curX 到 nextX 是否跨越断点，并返回跨越的断点信息
   * @param {string} statKey
   * @param {number} curX
   * @param {number} nextX
   * @returns {{limit: number, pM1: number, pM2: number} | null}
   *          pM1 = 断点前区间在 limit 处的 multiplier
   *          pM2 = 断点后区间在 limit 处的 multiplier
   */
  checkBreakpointCrossing(statKey, curX, nextX) {
    if (curX >= nextX) return null;  // 只检查递增方向

    const breakpoints = this.getBreakpoints(statKey);
    
    for (const bp of breakpoints) {
      // 检查是否跨越此断点：curX <= limit < nextX
      if (curX <= bp.limit && bp.limit < nextX) {
        const pM1 = this.evalPoly(bp.limit, bp.prevInterval.a2, bp.prevInterval.a1, bp.prevInterval.a0);
        const pM2 = this.evalPoly(bp.limit, bp.nextInterval.a2, bp.nextInterval.a1, bp.nextInterval.a0);
        return {
          limit: bp.limit,
          pM1: pM1,
          pM2: pM2
        };
      }
    }

    return null;
  },

  /**
   * [延拓增益计算] 计算考虑断点延拓的相对增益
   * 当从 curX 到 nextX 跨越断点 p 时：
   *   gain = (nextM / pM2) × (pM1 / curM)
   *        = (nextM / curM) × (pM1 / pM2)
   * 其中 pM1/pM2 是延拓修正因子，用于"缝合"断点处的跳变
   *
   * @param {string} statKey
   * @param {number} curX - 当前值
   * @param {number} nextX - 下一步值
   * @returns {number} 延拓后的相对增益
   */
  getGainWithExtension(statKey, curX, nextX) {
    const curM = this.getMultiplier(statKey, curX);
    const nextM = this.getMultiplier(statKey, nextX);

    if (curM === 0) return nextM > 0 ? Infinity : 1;

    // 检查是否跨越断点
    const crossing = this.checkBreakpointCrossing(statKey, curX, nextX);
    
    if (crossing && crossing.pM2 !== 0) {
      // 跨越断点：应用延拓修正
      // gain = (nextM / pM2) × (pM1 / curM)
      const rawGain = nextM / curM;
      const extensionFactor = crossing.pM1 / crossing.pM2;
      return rawGain * extensionFactor;
    }

    // 未跨越断点：使用原始增益
    return nextM / curM;
  },
};