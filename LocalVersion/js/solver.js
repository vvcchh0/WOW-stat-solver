/**
 * solver.js
 * 负责核心优化算法（贪婪算法）以及 SimC 模拟数据的分段拟合处理。
 * 
 * 主要功能：
 * 1. 贪婪算法寻找最优绿字分配。
 * 2. SimC 导出的 dps_plot 文本解析与多项式拟合。
 * 3. 属性配置的导入与导出。
 */

/**
 * @namespace Solver
 * 包含核心分配算法及数据处理逻辑
 */
const Solver = {
  /**
   * @property {Object.<string, {intervals: Interval[], points: {x:number, y:number}[]}>|null} simImportTempData - 暂存 SimC 导入并解析拟合后的中间数据
   */
  simImportTempData: null, 

  /**
   * 核心分配算法：贪婪算法 (Greedy Algorithm)
   * 在给定的预算下，通过多轮迭代，每轮寻找边际收益最高的属性进行步进分配，从而逼近全局最优解。
   * 
   * @param {number} targetBudget - 需要分配的总绿字预算
   * @returns {{c: number, h: number, m: number, v: number, score?: number}} 包含四项属性 (c, h, m, v) 分配数值的理论最优解
   */
  solveOptimalDistribution(targetBudget) {
    let available = targetBudget;
    /** @type {{c: number, h: number, m: number, v: number}} */
    let results = { c: 0, h: 0, m: 0, v: 0 };
    /** @type {string[]} */
    let unlocked = [];

    // 1. 处理锁定属性：锁定属性优先占用预算
    ["c", "h", "m", "v"].forEach((k) => {
      // @ts-ignore
      if (state.stats[k].locked) {
        // @ts-ignore
        results[k] = state.stats[k].lockVal;
        // @ts-ignore
        available -= state.stats[k].lockVal;
      } else {
        unlocked.push(k);
      }
    });

    // 2. 迭代分配逻辑：采用不同步长进行贪婪搜索（从粗到细以提高性能）
    const stepSizes = [100, 25, 5];
    if (available > 0 && unlocked.length > 0) {
      stepSizes.forEach((step) => {
        while (available >= step) {
          /** @type {string|null} */
          let bestStat = null;
          let maxGain = -1;
          
          unlocked.forEach((k) => {
            // @ts-ignore
            const curR = results[k];
            // 计算当前属性在增加 step 步长后的边际收益率 (nextMultiplier / currentMultiplier)
            // @ts-ignore
            const curM = Utils.getMultiplier(k, curR) || 0.00001;
            // @ts-ignore
            const nextM = Utils.getMultiplier(k, curR + step);
            const gain = nextM / curM;
            
            if (gain > maxGain) {
              maxGain = gain;
              bestStat = k;
            }
          });

          if (bestStat) {
            // @ts-ignore
            results[bestStat] += step;
            available -= step;
          } else {
            break;
          }
        }
      });

      // 3. 处理剩余不足最小步长的余量
      if (available > 0) {
        /** @type {string|null} */
        let bestStat = null;
        let maxGain = -1;
        unlocked.forEach((k) => {
          // @ts-ignore
          const m = Utils.getMultiplier(k, results[k] + available) / (Utils.getMultiplier(k, results[k]) || 0.00001);
          if (m > maxGain) {
            maxGain = m;
            bestStat = k;
          }
        });
        if (bestStat) {
            // @ts-ignore
            results[bestStat] += available;
        }
      }
    }
    return results;
  },

  /**
   * 执行全局优化计算，并将结果同步到全局状态 state 中
   * 常在预算改变或属性配置变动后调用
   */
  runSolver() {
    // @ts-ignore
    state.optResults = this.solveOptimalDistribution(state.budget);
    // @ts-ignore
    state.optResults.score = Utils.calculateTotalScore(state.optResults);
  },

  /**
   * 生成不同预算下的成长轨迹数据
   * 用于绘制绿字分配随总预算增长的演变图表
   * 
   * @returns {{labels: number[], d: {c: number[], h: number[], m: number[], v: number[], scores: number[], pcts: {c: number[], h: number[], m: number[], v: number[]}}}}
   */
  generateTrajectory() {
    const minB = 5000,
      maxB = 60000,
      step = 2000,
      labels = [],
      d = {
        c: /** @type {number[]} */ ([]),
        h: /** @type {number[]} */ ([]),
        m: /** @type {number[]} */ ([]),
        v: /** @type {number[]} */ ([]),
        scores: /** @type {number[]} */ ([]),
        pcts: { 
            c: /** @type {number[]} */ ([]), 
            h: /** @type {number[]} */ ([]), 
            m: /** @type {number[]} */ ([]), 
            v: /** @type {number[]} */ ([]) 
        },
      };
    
    for (let b = minB; b <= maxB; b += step) {
      const res = this.solveOptimalDistribution(b);
      labels.push(b);
      d.c.push(res.c);
      d.h.push(res.h);
      d.m.push(res.m);
      d.v.push(res.v);
      // @ts-ignore
      d.pcts.c.push(Utils.getPanelPercent("c", res.c));
      // @ts-ignore
      d.pcts.h.push(Utils.getPanelPercent("h", res.h));
      // @ts-ignore
      d.pcts.m.push(Utils.getPanelPercent("m", res.m));
      // @ts-ignore
      d.pcts.v.push(Utils.getPanelPercent("v", res.v));
      // @ts-ignore
      d.scores.push(Utils.calculateTotalScore(res));
    }
    return { labels, d };
  },

  /**
   * 解析 SimC 导出的文本数据，并针对魔兽世界的边际收益衰减(DR)分段点进行多项式拟合
   * 
   * @param {string} text - SimC 导出的 dps_plot 原始文本内容
   */
  processSimData(text) {
    // 0. 从 UI 获取当前基准值，用于计算正确的 DR 临界点
    ["c", "h", "m", "v"].forEach(
      // @ts-ignore
      (k) => (state.stats[k].statBase = parseInt(/** @type {HTMLInputElement} */ (document.getElementById(`sim_base_${k}`)).value) || 0)
    );

    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    
    /** @type {{c: {x:number, y:number}[], h: {x:number, y:number}[], m: {x:number, y:number}[], v: {x:number, y:number}[]}} */
    let statPoints = { c: [], h: [], m: [], v: [] };
    
    /** @type {string|null} */
    let currentStat = null;

    // 1. 提取点阵数据 (解析 rating 和对应的收益 y 值)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].toLowerCase();
      if (l.includes("crit_rating")) currentStat = "c";
      else if (l.includes("haste_rating")) currentStat = "h";
      else if (l.includes("mastery_rating")) currentStat = "m";
      else if (l.includes("versatility_rating")) currentStat = "v";

      const m = lines[i].match(/-?[\d,.]+(?:e[+-]?\d+)?/gi);
      if (currentStat && m && m.length >= 2) {
        const x = parseFloat(m[0].replace(/,/g, "")), 
              y = parseFloat(m[1].replace(/,/g, ""));
        // @ts-ignore
        if (!isNaN(x) && !isNaN(y)) statPoints[currentStat].push({ x, y });
      }
    }

    // @ts-ignore - Explicitly casting empty object to satisfy the complex type definition
    this.simImportTempData = {};

    // 2. 针对每个属性执行分段拟合
    ["c", "h", "m", "v"].forEach((k) => {
      // @ts-ignore
      const pts = statPoints[k];
      if (!pts || pts.length < 5) return;
      pts.sort((/** @type {{x:number}} */ a, /** @type {{x:number}} */ b) => a.x - b.x);
      
      const D0 = pts[0].y; // 以第一个点作为基准收益 1.0
      // @ts-ignore
      const base = state.stats[k].statBase;
      // @ts-ignore
      const dr = STAT_CONFIG[k];
      const step = pts[1].x - pts[0].x;

      // 根据 DR 阈值计算数据分段的索引位置
      /** @param {number} lim */
      const calcCap = (lim) => {
        const r = lim - base;
        return r <= 0 ? 0 : Math.round(r / step) * step;
      };

      const caps = [...new Set([
        calcCap(dr.base_limit),
        calcCap(dr.base_limit + dr.step_limit),
        calcCap(dr.base_limit + dr.step_limit * 2),
        pts[pts.length - 1].x
      ])].filter((v) => v > 0).sort((a, b) => a - b);

      /** @type {Interval[]} */
      const intervals = [];
      caps.forEach((cap, idx) => {
        const prev = idx === 0 ? -1 : caps[idx - 1];
        const slice = pts.filter((/** @type {{x:number}} */ p) => p.x > prev && p.x <= cap);
        
        if (slice.length > 3) {
          const n = slice.length;
          let sx = 0, sy = 0, sxy = 0, sxx = 0;
          slice.forEach((/** @type {{x:number, y:number}} */ p) => {
            const r = p.y / D0;
            sx += p.x;
            sy += r;
            sxy += p.x * r;
            sxx += p.x * p.x;
          });

          // A. 尝试线性回归
          const a1 = (n * sxy - sx * sy) / (n * sxx - sx * sx),
                a0 = (sy - a1 * sx) / n;
          
          const my = sy / n;
          let ssres = 0, sstot = 0;
          slice.forEach((/** @type {{x:number, y:number}} */ p) => {
            const r = p.y / D0;
            ssres += Math.pow(r - (a1 * p.x + a0), 2);
            sstot += Math.pow(r - my, 2);
          });
          const r2_lin = 1 - ssres / sstot;

          // 若线性拟合优度 R² 足够高，则使用线性模型
          if (r2_lin >= 0.999) {
            intervals.push({
              limit: cap,
              a2: 0,
              a1: Number(a1.toPrecision(4)),
              a0: Number(a0.toPrecision(4)),
              r2: r2_lin,
              type: "Lin",
            });
          } else {
            // B. 否则执行二阶多项式拟合 (通过克莱姆法则/矩阵消元求解正规方程组)
            let s1 = n, s2 = sx, s3 = sxx, s4 = 0, s5 = 0, y1 = sy, y2 = sxy, y3 = 0;
            slice.forEach((/** @type {{x:number, y:number}} */ p) => {
              const x = p.x, x2 = x * x, r = p.y / D0;
              s4 += x2 * x; s5 += x2 * x2; y3 += x2 * r;
            });
            const m = [
              [s1, s2, s3, y1],
              [s2, s3, s4, y2],
              [s3, s4, s5, y3],
            ];
            // 高斯消元
            for (let i = 0; i < 3; i++) {
              let p = m[i][i];
              for (let j = i + 1; j < 3; j++) {
                let f = m[j][i] / p;
                for (let k = i; k < 4; k++) m[j][k] -= f * m[i][k];
              }
            }
            const q2 = m[2][3] / m[2][2],
                  q1 = (m[1][3] - m[1][2] * q2) / m[1][1],
                  q0 = (m[0][3] - m[0][2] * q2 - m[0][1] * q1) / m[0][0];
            
            let ssres_quad = 0;
            slice.forEach((/** @type {{x:number, y:number}} */ p) => {
              const x = p.x, r = p.y / D0;
              const r_pred = q2 * x * x + q1 * x + q0;
              ssres_quad += Math.pow(r - r_pred, 2);
            });
            const r2_quad = 1 - ssres_quad / sstot;

            intervals.push({
              limit: cap,
              a2: Number(q2.toPrecision(4)),
              a1: Number(q1.toPrecision(4)),
              a0: Number(q0.toPrecision(4)),
              r2: r2_quad,
              type: "Quad",
            });
          }
        }
      });
      // @ts-ignore
      this.simImportTempData[k] = { intervals, points: pts };
    });
  },
};

/**
 * @namespace ConfigManager
 * 负责属性配置文件的导入与导出逻辑
 */
const ConfigManager = {
  /**
   * 将当前所有属性配置（区间、转化比、基础值）导出为自定义 .txt 格式文件
   */
  export() {
    let out = "";
    ["c", "h", "m", "v"].forEach((k) => {
      // @ts-ignore
      const s = state.stats[k];
      // @ts-ignore
      out += `${STAT_CONFIG[k].export_name}:\n{\nSPEC BASE = ${s.basePct}\nRATING/1% = ${s.conv}\nSTAT BASE RATING = ${s.statBase}\n`;
      s.intervals.forEach(
        (/** @type {Interval} */ inv, /** @type {number} */ i) =>
          (out += `INTERVAL${i + 1}\n{\nRANGEMAX = ${inv.limit}\na2 = ${inv.a2}\na1 = ${inv.a1}\na0 = ${inv.a0}\n}\n`)
      );
      out += `}\n\n`;
    });
    const blob = new Blob([out], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WoW_Stat_Config_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  },

  /**
   * 处理文件上传控件的文件导入
   * @param {HTMLInputElement} inp - 文件输入 DOM 元素
   */
  import(inp) {
    // 修复：inp.files 可能为 null
    if (!inp || !inp.files || !inp.files[0]) return;
    const f = inp.files[0];
    const r = new FileReader();
    r.onload = (e) => {
      if (e.target) {
        ConfigManager.parse(/** @type {string} */ (e.target.result));
        inp.value = "";
      }
    };
    r.readAsText(f);
  },

  /**
   * 解析配置文件内容并实时更新全局 state
   * @param {string} txt - 导出的配置文件文本内容
   */
  parse(txt) {
    try {
      const lines = txt.split("\n").map((l) => l.trim()).filter((l) => l);
      
      /** @type {string|null} */
      let curStat = null;
      
      /** @type {any|null} */
      let curInt = null;
      
      // @ts-ignore
      const newStats = JSON.parse(JSON.stringify(state.stats));
      ["c", "h", "m", "v"].forEach((k) => (newStats[k].intervals = []));

      lines.forEach((l) => {
        if (l.startsWith("Critical")) curStat = "c";
        else if (l.startsWith("Haste")) curStat = "h";
        else if (l.startsWith("Mastery")) curStat = "m";
        else if (l.startsWith("Versatility")) curStat = "v";
        else if (curStat) {
          if (l.startsWith("SPEC"))
            newStats[curStat].basePct = parseFloat(l.split("=")[1]);
          else if (l.startsWith("RATING"))
            newStats[curStat].conv = parseFloat(l.split("=")[1]);
          else if (l.startsWith("STAT"))
            newStats[curStat].statBase = parseFloat(l.split("=")[1]);
          else if (l.startsWith("INTERVAL")) curInt = {};
          else if (l === "}" && curInt) {
            curInt.id = Date.now() + Math.random();
            newStats[curStat].intervals.push(curInt);
            curInt = null;
          } else if (curInt) {
            const p = l.split("=");
            if (p.length === 2) {
              const k = p[0].trim(),
                v = parseFloat(p[1]);
              if (k === "RANGEMAX") curInt.limit = v;
              else if (k === "a2") curInt.a2 = v;
              else if (k === "a1") curInt.a1 = v;
              else if (k === "a0") curInt.a0 = v;
            }
          }
        }
      });
      // @ts-ignore
      state.stats = newStats;
      // @ts-ignore
      initStats(false);
    } catch (e) {
      console.error("Config Parsing Error:", e);
      alert("Import Error: Failed to parse configuration file.");
    }
  },
};
