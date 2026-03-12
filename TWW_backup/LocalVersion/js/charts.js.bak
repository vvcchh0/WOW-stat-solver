/**
 * charts.js
 * 负责所有图表的初始化、数据更新及成长轨迹渲染。
 * 
 * 使用 Chart.js 库进行数据可视化，支持环形图和折线图。
 */

const ChartManager = {
  
  /**
   * @property {Object} instances - 存储所有图表实例，用于销毁旧实例防止内存泄漏
   */
  instances: {
    distChart: null,        // 理论最优分配环形图
    customDistChart: null,  // 用户自定义对比环形图
    trajChart: null,        // 绿字分配随预算增长的路径图
    percentTrajChart: null, // 各属性百分比随预算增长的轨迹图
    yieldTrajChart: null,   // 总得分随预算增长的曲线图
    deltaTrajChart: null,   // 边际收益变化图
    simPreviewChart: null,  // SimC 拟合效果预览图
  },

  /**
   * 生成环形图的自定义图例标签
   * 
   * @param {any} chart - Chart.js 实例
   * @returns {any[]} 包含文本、颜色等信息的图例项数组
   */
  generateLegendLabels(chart) {
    return chart.data.labels.map((/** @type {string} */ label, /** @type {number} */ i) => {
      const val = chart.data.datasets[0].data[i];
      const valStr =
        // @ts-ignore
        state.displayMode === "total"
          ? `${val.toFixed(1)}%`
          : Math.round(val).toLocaleString();
      return {
        text: `${label}: ${valStr}`,
        fillStyle: chart.data.datasets[0].backgroundColor[i],
        fontColor: "#cbd5e1",
        index: i,
        lineWidth: 0,
      };
    });
  },

  /**
   * 更新主界面的两个对比环形图
   * 根据 state.displayMode 自动切换显示分配数值或最终面板百分比
   */
  updateCharts() {
    // @ts-ignore
    const labels = Object.values(STAT_CONFIG).map((c) =>
      // @ts-ignore
      state.lang === "zh" ? c.name_zh : c.name_en,
    );
    // @ts-ignore
    const colors = Object.values(STAT_CONFIG).map((c) => c.color);
    
    let dataOpt = [], dataCust = [];

    // @ts-ignore
    if (state.displayMode === "gain") {
      // 显示分配的绿字数值
      dataOpt = [
        // @ts-ignore
        state.optResults.c, state.optResults.h, state.optResults.m, state.optResults.v
      ];
      dataCust = [
        // @ts-ignore
        state.customValues.c, state.customValues.h, state.customValues.m, state.customValues.v
      ];
    } else {
      // 显示转换后的面板百分比
      // @ts-ignore
      dataOpt = ["c", "h", "m", "v"].map((k) => Utils.getPanelPercent(k, state.optResults[k]));
      // @ts-ignore
      dataCust = ["c", "h", "m", "v"].map((k) => Utils.getPanelPercent(k, state.customValues[k]));
    }
    
    // 渲染或更新理论最优图表
    if (!this.instances.distChart) {
      const ctx = /** @type {HTMLCanvasElement} */ (document.getElementById("distChart")).getContext("2d");
      // @ts-ignore - Chart global is loaded via CDN script
      this.instances.distChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{ data: dataOpt, backgroundColor: colors, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "#94a3b8",
                font: { size: 10, family: "Inter" },
                boxWidth: 10,
                // @ts-ignore
                generateLabels: this.generateLegendLabels,
              },
            },
            tooltip: {
              callbacks: {
                // @ts-ignore
                label: (ctx) => state.displayMode === "total" ? ` ${ctx.raw.toFixed(2)}%` : ` ${Math.round(ctx.raw)}`,
              },
            },
          },
        },
      });
    } else {
      // @ts-ignore
      this.instances.distChart.data.datasets[0].data = dataOpt;
      // @ts-ignore
      this.instances.distChart.data.labels = labels;
      // @ts-ignore
      this.instances.distChart.update();
    }

    // 渲染或更新自定义对比图表
    if (!this.instances.customDistChart) {
      const ctx2 = /** @type {HTMLCanvasElement} */ (document.getElementById("customDistChart")).getContext("2d");
      // @ts-ignore
      this.instances.customDistChart = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{ data: dataCust, backgroundColor: colors, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "70%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                // @ts-ignore
                label: (ctx) => state.displayMode === "total" ? ` ${ctx.raw.toFixed(2)}%` : ` ${Math.round(ctx.raw)}`,
              },
            },
          },
        },
      });
    } else {
      // @ts-ignore
      this.instances.customDistChart.data.datasets[0].data = dataCust;
      // @ts-ignore
      this.instances.customDistChart.update();
    }
  },

  /**
   * 渲染面板百分比随预算增长的轨迹图
   * 
   * @param {Array<number>} labels - 横轴预算数据
   * @param {Object} data - 各属性百分比数据点
   */
  renderPercentTrajChart(labels, data) {
    const ctx = /** @type {HTMLCanvasElement} */ (document.getElementById("percentTrajChart")).getContext("2d");
    // @ts-ignore
    if (this.instances.percentTrajChart) this.instances.percentTrajChart.destroy();
    
    // @ts-ignore
    this.instances.percentTrajChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        // @ts-ignore
        datasets: ["c", "h", "m", "v"].map(k => ({
          // @ts-ignore
          label: (state.lang === 'zh' ? STAT_CONFIG[k].name_zh : STAT_CONFIG[k].name_en) + " %",
          // @ts-ignore
          data: data[k].map(v => v.toFixed(2)),
          // @ts-ignore
          borderColor: STAT_CONFIG[k].color,
          pointRadius: 2,
          tension: 0.1
        }))
      },
      options: this.getCommonLineOptions(true)
    });
  },

  /**
   * 渲染绿字分配数值随预算增长的轨迹图
   * 
   * @param {Array<number>} labels - 横轴预算数据
   * @param {Object} data - 各属性分配值数据点
   */
  renderTrajectoryChart(labels, data) {
    const ctx = /** @type {HTMLCanvasElement} */ (document.getElementById("trajChart")).getContext("2d");
    // @ts-ignore
    if (this.instances.trajChart) this.instances.trajChart.destroy();
    
    // @ts-ignore
    this.instances.trajChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        // @ts-ignore
        datasets: ["c", "h", "m", "v"].map(k => ({
          // @ts-ignore
          label: state.lang === 'zh' ? STAT_CONFIG[k].name_zh : STAT_CONFIG[k].name_en,
          // @ts-ignore
          data: data[k],
          // @ts-ignore
          borderColor: STAT_CONFIG[k].color,
          pointRadius: 2,
          tension: 0.1
        }))
      },
      options: this.getCommonLineOptions(true),
    });
  },

  /**
   * 渲染总收益（Score）得分随预算增长的轨迹图
   * 
   * @param {Array<number>} labels - 横轴预算数据
   * @param {Array<number>} scores - 总收益得分数据点
   */
  renderYieldTrajChart(labels, scores) {
    const ctx = /** @type {HTMLCanvasElement} */ (document.getElementById("yieldTrajChart")).getContext("2d");
    // @ts-ignore
    if (this.instances.yieldTrajChart) this.instances.yieldTrajChart.destroy();
    
    // @ts-ignore
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, "rgba(251,191,36,0.5)");
    grad.addColorStop(1, "rgba(251,191,36,0)");
    
    // @ts-ignore
    this.instances.yieldTrajChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            // @ts-ignore
            label: I18N[state.lang].chart_yield_traj || "Max Yield Multiplier",
            data: scores,
            borderColor: "#fbbf24",
            backgroundColor: grad,
            fill: true,
            pointRadius: 2,
            tension: 0.2
          },
        ],
      },
      options: this.getCommonLineOptions(false)
    });
  },

  /**
   * 渲染边际收益（Delta Score）随预算增长的变化图
   *
   * @param {Array<number>} labels - 横轴预算数据
   * @param {Object|Array<number>} scoresOrData - 如果是旧版调用则为 scores 数组，如果是新版则为包含 smoothScores 的对象
   * 
   * 注：延拓修正实现后，smoothScores 已弃用，scores 本身已足够平滑（因为最优分配已使用延拓修正）
   */
  renderDeltaTrajChart(labels, scoresOrData) {
    const ctx = /** @type {HTMLCanvasElement} */ (document.getElementById("deltaTrajChart")).getContext("2d");
    // @ts-ignore
    if (this.instances.deltaTrajChart) this.instances.deltaTrajChart.destroy();

    // 兼容逻辑：优先使用 smoothScores (现已弃用，等于 scores)，否则使用原始 scores
    // @ts-ignore
    const srcScores = (scoresOrData.smoothScores) ? scoresOrData.smoothScores : scoresOrData;

    const dData = [];
    for (let i = 1; i < srcScores.length; i++) {
      let val = srcScores[i] - srcScores[i - 1];
      // 注：由于延拓修正已在算法层面修正断点跳变，Delta 数据理论上应平滑
      // 但保留负值剔除作为保险（处理可能的数值误差）
      if (val < 0) val = 0;
      dData.push(val);
    }
    
    // @ts-ignore
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, "rgba(34,211,238,0.5)");
    grad.addColorStop(1, "rgba(34,211,238,0)");
    
    /** @type {any} */
    const options = this.getCommonLineOptions(false);
    options.plugins.tooltip.callbacks = {
      /** @param {any} context */
      label: (context) => {
        let label = context.dataset.label || '';
        if (label) {
            label += ': ';
        }
        if (context.parsed.y !== null) {
            label += context.parsed.y.toFixed(4);
        }
        return label;
      }
    };

    // @ts-ignore
    this.instances.deltaTrajChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels.slice(1),
        datasets: [
          {
            // @ts-ignore
            label: I18N[state.lang].chart_delta_traj || "Marginal Gain (Delta)",
            data: dData,
            borderColor: "#22d3ee",
            backgroundColor: grad,
            fill: true,
            pointRadius: 2,
            tension: 0.2
          },
        ],
      },
      options: options
    });
  },

  /**
   * 更新 SimC 拟合效果预览图
   * 将原始点阵数据与拟合出的分段函数进行对比渲染
   */
  updateSimPreviewChart() {
    const k = /** @type {HTMLSelectElement} */ (document.getElementById("previewStatSelect")).value;
    // @ts-ignore
    if (!k || !Solver.simImportTempData) return;
    
    // @ts-ignore
    const data = Solver.simImportTempData[k];
    const ctx = /** @type {HTMLCanvasElement} */ (document.getElementById("simPreviewChart")).getContext("2d");
    // @ts-ignore
    if (this.instances.simPreviewChart) this.instances.simPreviewChart.destroy();
    
    // @ts-ignore
    const t = I18N[state.lang];
    /** @type {any[]} */
    const datasets = [
      {
        label: t.sim_import_title || "SimC Raw Data",
        // @ts-ignore
        data: data.points,
        type: "scatter",
        backgroundColor: "#475569",
        pointRadius: 1,
      },
    ];

    // 绘制拟合后的分段曲线
    // @ts-ignore
    data.intervals.forEach((inv, i) => {
      // @ts-ignore
      const start = i === 0 ? 0 : data.intervals[i - 1].limit;
      // @ts-ignore
      const end = Math.min(inv.limit, data.points[data.points.length - 1].x);
      const seg = [];
      for (let x = start; x <= end; x += (end - start) / 15) {
        seg.push({
          x,
          // @ts-ignore
          y: Utils.evalPoly(x, inv.a2, inv.a1, inv.a0) * data.points[0].y,
        });
      }
      
      const op = 1 - i * 0.25;
      datasets.push({
        label: `${t.sim_table_int || "Interval"} ${i + 1} (${inv.type})`,
        data: seg,
        type: "line",
        borderColor: `rgba(${k === "c" ? 239 : k === "h" ? 34 : k === "m" ? 168 : 59}, ${k === "c" ? 68 : k === "h" ? 197 : k === "m" ? 85 : 130}, ${k === "c" ? 68 : k === "h" ? 94 : k === "m" ? 247 : 246}, ${op})`,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1
      });
    });

    // @ts-ignore
    this.instances.simPreviewChart = new Chart(ctx, {
      data: { datasets },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94a3b8", font: { size: 10 } } }
        },
        scales: {
          x: { grid: { color: "#1e293b" }, ticks: { color: "#64748b" } },
          y: { grid: { color: "#1e293b" }, ticks: { color: "#64748b" } }
        }
      },
    });

    // 同步更新侧边表格中的拟合方程显示
    const tb = /** @type {HTMLElement} */ (document.getElementById("simFitTable"));
    tb.innerHTML = "";
    // @ts-ignore
    data.intervals.forEach((inv, i) => {
      // @ts-ignore
      const start = i === 0 ? 0 : data.intervals[i - 1].limit + 1;
      const end = inv.limit;
      const range = `[${start}, ${end}]`;

      const eq =
        inv.type === "Lin"
          ? `y=${inv.a1.toExponential(2)}x+${inv.a0.toFixed(3)}`
          : `y=${inv.a2.toExponential(1)}x²+...`;
      
      tb.innerHTML += `
        <tr class="border-b border-slate-800">
          <td class="p-1 text-[10px] text-gray-500 font-mono">${range}</td>
          <td class="p-1 text-[10px] text-gray-400 font-mono">${eq}</td>
          <td class="p-1 text-[10px] text-indigo-400 font-mono">${inv.r2.toFixed(3)}</td>
        </tr>`;
    });
  },

  /**
   * 内部辅助方法：获取通用的折线图配置项
   * 
   * @param {boolean} [showLegend=true] - 是否显示图例
   * @returns {Object} Chart.js 配置对象
   */
  getCommonLineOptions(showLegend = true) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: showLegend,
          labels: {
            color: "#cbd5e1",
            font: { size: 10 }
          }
        },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          titleColor: "#94a3b8",
          bodyColor: "#cbd5e1",
          borderColor: "#334155",
          borderWidth: 1,
          padding: 10,
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 }
        }
      },
      scales: {
        x: {
          grid: { color: "#1e293b" },
          ticks: { color: "#94a3b8", font: { size: 10 } }
        },
        y: {
          grid: { color: "#1e293b" },
          ticks: { color: "#94a3b8", font: { size: 10 } }
        },
      },
    };
  }
};
